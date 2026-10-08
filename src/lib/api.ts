/**
 * Krishi Market API Client
 * Provides strongly-typed frontend integration with the backend PostgreSQL APIs.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const AUTH_TOKEN_KEY = 'krishi_auth_token';
export const ADMIN_TOKEN_KEY = 'krishi_admin_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  tokenOverride?: string
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const token =
    tokenOverride ||
    (path.startsWith('/api/admin')
      ? getAdminToken() || getAuthToken()
      : getAuthToken() || getAdminToken());

  // Debug logging for admin requests
  if (path.startsWith('/api/admin')) {
    console.log(`[API] Admin request to ${path}`, {
      hasToken: !!token,
      tokenSource: tokenOverride ? 'override' : (getAdminToken() ? 'adminToken' : 'authToken'),
      url,
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (fetchError: any) {
    // Network error (e.g., backend not running, CORS issue, etc.)
    console.error('Network request failed:', fetchError);
    const error: any = new Error(
      `Network error: Unable to connect to backend at ${API_BASE_URL}. Please ensure the backend server is running.`
    );
    error.status = 0;
    error.originalError = fetchError;
    throw error;
  }

  let data: any;
  try {
    data = await response.json();
  } catch (jsonError) {
    // Response is not valid JSON
    console.error('Failed to parse response as JSON:', jsonError);
    const error: any = new Error(
      `Invalid response from server. Status: ${response.status}`
    );
    error.status = response.status;
    error.originalError = jsonError;
    throw error;
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `HTTP ${response.status}: Request failed`;
    console.error('API request failed:', errorMsg, data);
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export interface RegisterFarmerPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  profilePhoto?: string;
  farmName: string;
  farmLocation: string;
  city?: string;
  state?: string;
  pincode: string;
  hub?: string;
  farmingMethod?: string;
  yearsFarming?: number;
  mainCrops?: string[] | string;
  farmDescription?: string;
  govtIdFileName?: string;
  govtIdFileUrl?: string;
  ownershipDocFileName?: string;
  ownershipDocFileUrl?: string;
  farmPhotoUrl?: string;
}

export const api = {
  /**
   * Register a new farmer profile in PostgreSQL.
   */
  async registerFarmer(payload: RegisterFarmerPayload) {
    return request<{
      success: boolean;
      message: string;
      data: {
        token: string;
        user: any;
        farmer: any;
        verificationStatus: string;
      };
    }>('/api/auth/farmer/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Authenticate a farmer account.
   */
  async loginFarmer(email: string, password: string) {
    const result = await request<{
      success: boolean;
      message: string;
      data: {
        token: string;
        user: any;
        farmer: any;
        verificationStatus: string;
      };
    }>('/api/auth/farmer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }
    return result;
  },

  /**
   * Authenticate an admin user account.
   */
  async loginAdmin(email: string = 'admin@krishimarket.in', password: string = 'admin123') {
    const result = await request<{
      success: boolean;
      message: string;
      data: {
        token: string;
        user: any;
      };
    }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      setAdminToken(result.data.token);
    }
    return result;
  },

  /**
   * Authenticate a consumer account with PostgreSQL.
   */
  async loginConsumer(email: string, password?: string) {
    const result = await request<{
      success: boolean;
      message: string;
      data: {
        token: string;
        user: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          avatar?: string | null;
          role: string;
        };
      };
    }>('/api/auth/consumer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }
    return result;
  },

  /**
   * Register a new consumer account in PostgreSQL.
   */
  async registerConsumer(payload: { name: string; email: string; phone?: string; password: string }) {
    const result = await request<{
      success: boolean;
      message: string;
      data: {
        token: string;
        user: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          avatar?: string | null;
          role: string;
        };
      };
    }>('/api/auth/consumer/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }
    return result;
  },

  /**
   * Fetch authenticated consumer profile with addresses.
   */
  async getConsumerProfile(token?: string) {
    return request<{
      success: boolean;
      data: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        avatar?: string | null;
        role: string;
        isActive: boolean;
        createdAt: string;
        consumerAddresses: Array<{
          id: string;
          name: string;
          phone: string;
          addressLine: string;
          city: string;
          state: string;
          pincode: string;
          hub: string;
          isDefault: boolean;
        }>;
      };
    }>('/api/consumer/profile', { method: 'GET' }, token);
  },

  async getConsumerReviews(token?: string) {
    return request<{ success: boolean; data: any[] }>('/api/consumer/reviews', { method: 'GET' }, token);
  },

  async getProductReviews(productId: string, token?: string) {
    return request<{ success: boolean; data: any }>('/api/consumer/products/' + encodeURIComponent(productId) + '/reviews', { method: 'GET' }, token);
  },

  async createProductReview(productId: string, payload: { rating: number; comment: string }, token?: string) {
    return request<{ success: boolean; message: string; data: any }>(
      '/api/consumer/products/' + encodeURIComponent(productId) + '/reviews',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    );
  },

  async getConsumerDisputes(token?: string) {
    return request<{ success: boolean; data: any[] }>('/api/consumer/disputes', { method: 'GET' }, token);
  },

  async createDispute(orderId: string, payload: { reason: string; amount: number; description: string }, token?: string) {
    return request<{ success: boolean; message: string; data: any }>(
      '/api/consumer/orders/' + encodeURIComponent(orderId) + '/disputes',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    );
  },

  /**
   * Update authenticated consumer profile.
   */
  async updateConsumerProfile(data: { name?: string; phone?: string; avatar?: string }, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        avatar?: string | null;
        role: string;
        isActive: boolean;
      };
    }>('/api/consumer/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, token);
  },

  /**
   * Fetch authenticated consumer delivery addresses.
   */
  async getConsumerAddresses(token?: string) {
    return request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        phone: string;
        addressLine: string;
        city: string;
        state: string;
        pincode: string;
        hub: string;
        isDefault: boolean;
      }>;
    }>('/api/consumer/addresses', { method: 'GET' }, token);
  },

  /**
   * Add a new delivery address for authenticated consumer.
   */
  async createConsumerAddress(address: {
    name: string;
    phone: string;
    addressLine: string;
    city?: string;
    state?: string;
    pincode: string;
    hub?: string;
    isDefault?: boolean;
  }, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: {
        id: string;
        name: string;
        phone: string;
        addressLine: string;
        city: string;
        state: string;
        pincode: string;
        hub: string;
        isDefault: boolean;
      };
    }>('/api/consumer/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    }, token);
  },

  /**
   * Update an existing delivery address.
   */
  async updateConsumerAddress(id: string, address: {
    name?: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    hub?: string;
    isDefault?: boolean;
  }, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/consumer/addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(address),
    }, token);
  },

  /**
   * Delete an existing delivery address.
   */
  async deleteConsumerAddress(id: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
    }>(`/api/consumer/addresses/${id}`, {
      method: 'DELETE',
    }, token);
  },

  /**
   * Set an address as primary default.
   */
  async setDefaultConsumerAddress(id: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/consumer/addresses/${id}/default`, {
      method: 'PATCH',
    }, token);
  },

  // ==========================================
  // CONSUMER CART & INVENTORY LAYER
  // ==========================================

  /**
   * Fetch live authenticated consumer cart with authoritative database pricing and availability.
   */
  async getConsumerCart(token?: string) {
    return request<{
      success: boolean;
      data: {
        items: any[];
        cartCount: number;
        itemCount: number;
        subtotal: number;
        deliveryFee: number;
        platformFee: number;
        farmerEarnings: number;
        total: number;
        hasUnavailableItems: boolean;
      };
    }>('/api/consumer/cart', { method: 'GET' }, token);
  },

  /**
   * Add a product to the authenticated consumer's cart.
   */
  async addToConsumerCart(productId: string, quantity: number = 1, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/consumer/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }, token);
  },

  /**
   * Update quantity for a product in the consumer's cart.
   */
  async updateConsumerCartItem(productId: string, quantity: number, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/consumer/cart/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }, token);
  },

  /**
   * Remove a product from the consumer's cart.
   */
  async removeConsumerCartItem(productId: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
    }>(`/api/consumer/cart/${productId}`, {
      method: 'DELETE',
    }, token);
  },

  /**
   * Clear all items from the consumer's cart.
   */
  async clearConsumerCart(token?: string) {
    return request<{
      success: boolean;
      message: string;
      count?: number;
    }>('/api/consumer/cart', {
      method: 'DELETE',
    }, token);
  },

  // ==========================================
  // PUBLIC MARKETPLACE & PRODUCT DISCOVERY
  // ==========================================

  /**
   * Public: Browse and search active marketplace products.
   */
  async getPublicProducts(filters: {
    search?: string;
    category?: string;
    farmingMethod?: string;
    isOrganic?: boolean | string;
    minPrice?: number | string;
    maxPrice?: number | string;
    farmerId?: string;
    inStock?: boolean | string;
    sortBy?: string;
    page?: number | string;
    limit?: number | string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all' && v !== 'ALL') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(`/api/products${query}`, { method: 'GET' });
  },

  /**
   * Public: Get full product details by ID.
   */
  async getPublicProductById(productId: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/products/${productId}`, { method: 'GET' });
  },

  /**
   * Public: Browse verified farmers directory.
   */
  async getPublicFarmers(filters: {
    search?: string;
    farmingMethod?: string;
    city?: string;
    hub?: string;
    page?: number | string;
    limit?: number | string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all' && v !== 'ALL') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(`/api/farmers${query}`, { method: 'GET' });
  },

  /**
   * Public: Get farmer public profile by ID with produce catalog.
   */
  async getPublicFarmerById(farmerId: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/farmers/${farmerId}`, { method: 'GET' });
  },

  /**
   * Public: Get QR provenance and harvest batch traceability chain.
   */
  async getPublicTrace(batchId: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/trace/${encodeURIComponent(batchId)}`, { method: 'GET' });
  },

  /**
   * Public: Browse active surplus discount offers from verified farmers.
   */
  async getPublicSurplusOffers(filters: {
    category?: string;
    search?: string;
    minDiscount?: number | string;
    sortBy?: string;
    page?: number | string;
    limit?: number | string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(`/api/surplus${query}`, { method: 'GET' });
  },

  /**
   * Public: Get details of a single active surplus flash offer.
   */
  async getPublicSurplusOfferById(offerId: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/surplus/${encodeURIComponent(offerId)}`, { method: 'GET' });
  },

  /**
   * Retrieve verification status for the currently authenticated farmer.
   */
  async getFarmerStatus(token?: string) {
    return request<{
      success: boolean;
      data: {
        farmerId: string;
        userId: string;
        name: string;
        email: string;
        phone: string;
        avatar?: string;
        farmName: string;
        location: string;
        city: string;
        state: string;
        pincode: string;
        hub: string;
        farmingMethod: string;
        yearsFarming: number;
        mainCrops: string[];
        verificationStatus: string;
        isVerified: boolean;
        rejectionReason?: string | null;
        registeredAt: string;
        approvedAt?: string | null;
        approvedBy?: any;
        documentsCount: number;
        isApproved: boolean;
        isPending: boolean;
        isRejected: boolean;
      };
    }>('/api/farmer/status', { method: 'GET' }, token);
  },

  /**
   * Fetch full farmer profile from PostgreSQL for authenticated farmer.
   */
  async getFarmerProfile(token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>('/api/farmer/profile', { method: 'GET' }, token);
  },

  /**
   * Fetch aggregated live operational dashboard data from PostgreSQL (APPROVED farmers ONLY).
   */
  async getFarmerDashboard(token?: string) {
    return request<{
      success: boolean;
      data: {
        totalProducts: number;
        activeProducts: number;
        pendingOrders: number;
        monthlyRevenue: number;
        monthlyTrend: string;
        salesSummary: any;
        recentOrders: any[];
        inventory: any[];
        allInventory: any[];
        deliveryBatches: any[];
        recentSales: any[];
        profile: any;
        farmerProfile: any;
      };
    }>('/api/farmer/dashboard', { method: 'GET' }, token);
  },

  /**
   * Update farmer profile and personal details in PostgreSQL.
   */
  async updateFarmerProfile(payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/farmer/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Fetch settings and preferences for authenticated farmer.
   */
  async getFarmerSettings(token?: string) {
    return request<{
      success: boolean;
      data: {
        account: {
          name: string;
          email: string;
          phone: string;
        };
        notifications: {
          orderAlerts: boolean;
          smsAlerts: boolean;
          inventoryWarnings: boolean;
          marketingEmail: boolean;
        };
        security: {
          twoFactorAuth: boolean;
        };
        preferences: {
          currency: string;
          payoutSchedule: string;
          autoPauseLowStock: boolean;
        };
        language: string;
      };
    }>('/api/farmer/settings', { method: 'GET' }, token);
  },

  /**
   * Update settings and preferences in PostgreSQL for authenticated farmer.
   */
  async updateFarmerSettings(payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/farmer/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Change password in PostgreSQL for authenticated farmer.
   */
  async changeFarmerPassword(
    payload: { currentPassword: string; newPassword: string },
    token?: string
  ) {
    return request<{
      success: boolean;
      message: string;
    }>('/api/farmer/settings/password', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Retrieve pending farmers list for admin audit.
   */
  async getPendingFarmers(token?: string) {
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>('/api/admin/farmers/pending', { method: 'GET' }, token);
  },

  /**
   * Retrieve all farmers (optionally filtered by status) for admin view.
   */
  async getAllFarmers(status?: string, token?: string) {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>(`/api/admin/farmers${query}`, { method: 'GET' }, token);
  },

  /**
   * Retrieve specific farmer application and submitted documents.
   */
  async getFarmerById(farmerId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/farmers/${farmerId}`, { method: 'GET' }, token);
  },

  /**
   * Admin approves a farmer application.
   */
  async approveFarmer(farmerId: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/farmers/${farmerId}/approve`, {
      method: 'POST',
    }, token);
  },

  /**
   * Admin rejects a farmer application with a reason.
   */
  async rejectFarmer(farmerId: string, reason: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/farmers/${farmerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }, token);
  },

  /**
   * Fetch all products belonging to the authenticated farmer from PostgreSQL.
   */
  async getFarmerProducts(token?: string) {
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>('/api/farmer/products', { method: 'GET' }, token);
  },

  /**
   * Fetch a single product by ID for the authenticated farmer.
   */
  async getFarmerProductById(productId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/farmer/products/${productId}`, { method: 'GET' }, token);
  },

  /**
   * Create a new product in PostgreSQL for the authenticated, approved farmer.
   */
  async createFarmerProduct(payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/farmer/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Update an existing product in PostgreSQL for the owning farmer.
   */
  async updateFarmerProduct(productId: string, payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Delete or archive a product from PostgreSQL.
   */
  async deleteFarmerProduct(productId: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      deleted: boolean;
      deactivated: boolean;
      product?: any;
    }>(`/api/farmer/products/${productId}`, {
      method: 'DELETE',
    }, token);
  },

  /**
   * Fetch all inventory items belonging to the authenticated farmer from PostgreSQL.
   */
  async getFarmerInventory(token?: string) {
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>('/api/farmer/inventory', { method: 'GET' }, token);
  },

  /**
   * Fetch a single inventory record by product ID for the authenticated farmer.
   */
  async getFarmerInventoryByProductId(productId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/farmer/inventory/${productId}`, { method: 'GET' }, token);
  },

  /**
   * Update stock level for a product in PostgreSQL (APPROVED farmers ONLY).
   */
  async updateFarmerStock(
    productId: string,
    payload: { delta?: number; quantity?: number; reason?: string; type?: string; threshold?: number },
    token?: string
  ) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/inventory/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Fetch all harvest batches belonging to the authenticated farmer from PostgreSQL.
   */
  async getFarmerHarvests(token?: string) {
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>('/api/farmer/harvests', { method: 'GET' }, token);
  },

  /**
   * Fetch a single harvest batch by ID or batch number for the authenticated farmer.
   */
  async getFarmerHarvestById(id: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/farmer/harvests/${id}`, { method: 'GET' }, token);
  },

  /**
   * Record a new morning harvest batch in PostgreSQL (APPROVED farmers ONLY).
   */
  async createFarmerHarvest(payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/farmer/harvests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Add a traceability event to a harvest batch in PostgreSQL (APPROVED farmers ONLY).
   */
  async addTraceabilityEvent(batchId: string, payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/harvests/${batchId}/traceability`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Fetch traceability events for a harvest batch from PostgreSQL (APPROVED farmers ONLY).
   */
  async getFarmerHarvestTraceability(batchId: string, token?: string) {
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>(`/api/farmer/harvests/${batchId}/traceability`, { method: 'GET' }, token);
  },

  /**
   * Add a traceability event to a harvest batch in PostgreSQL (APPROVED farmers ONLY).
   */
  async addFarmerHarvestTraceability(batchId: string, payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/harvests/${batchId}/traceability`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Fetch all surplus offers belonging to the authenticated farmer from PostgreSQL.
   */
  async getFarmerSurplus(token?: string) {
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>('/api/farmer/surplus', { method: 'GET' }, token);
  },

  /**
   * Fetch a single surplus offer by ID or offerCode for the authenticated farmer.
   */
  async getFarmerSurplusById(id: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/farmer/surplus/${id}`, { method: 'GET' }, token);
  },

  /**
   * Create a new surplus flash deal in PostgreSQL (APPROVED farmers ONLY).
   */
  async createFarmerSurplus(payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/farmer/surplus', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Update an active surplus offer in PostgreSQL (APPROVED farmers ONLY).
   */
  async updateFarmerSurplus(id: string, payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/surplus/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Cancel an active surplus offer in PostgreSQL (APPROVED farmers ONLY).
   */
  async cancelFarmerSurplus(id: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/surplus/${id}`, {
      method: 'DELETE',
    }, token);
  },

  // ==========================================
  // ORDERS MODULE
  // ==========================================

  /**
   * Place a new consumer order in PostgreSQL.
   */
  async createOrder(payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Fetch authenticated consumer's orders from PostgreSQL with filtering, search & pagination.
   */
  async getConsumerOrders(
    filtersOrToken?: {
      status?: string;
      search?: string;
      page?: number | string;
      limit?: number | string;
    } | string,
    tokenParam?: string
  ) {
    let filters: { status?: string; search?: string; page?: number | string; limit?: number | string } = {};
    let token: string | undefined = tokenParam;

    if (typeof filtersOrToken === 'string') {
      token = filtersOrToken;
    } else if (filtersOrToken && typeof filtersOrToken === 'object') {
      filters = filtersOrToken;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      data: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(`/api/orders${query}`, { method: 'GET' }, token);
  },

  /**
   * Fetch specific consumer order by ID or orderNumber.
   */
  async getConsumerOrderById(orderId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/orders/${orderId}`, { method: 'GET' }, token);
  },

  /**
   * Cancel an eligible order (PLACED or CONFIRMED) and restore inventory.
   */
  async cancelConsumerOrder(orderId: string, reason?: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }, token);
  },

  /**
   * Fetch orders containing products belonging to the authenticated farmer.
   */
  async getFarmerOrders(token?: string) {
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>('/api/farmer/orders', { method: 'GET' }, token);
  },

  /**
   * Fetch a single farmer order by ID or orderNumber.
   */
  async getFarmerOrderById(orderId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/farmer/orders/${orderId}`, { method: 'GET' }, token);
  },

  /**
   * Update farmer order progression status in PostgreSQL.
   */
  async updateFarmerOrderStatus(orderId: string, status: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
  },

  /**
   * Create a new delivery batch in PostgreSQL.
   */
  async createDeliveryBatch(payload: any, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/farmer/deliveries/batches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Assign orders to a delivery batch in PostgreSQL.
   */
  async assignOrdersToBatch(batchId: string, orderIds: string[], token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/deliveries/batches/${batchId}/orders`, {
      method: 'POST',
      body: JSON.stringify({ orderIds }),
    }, token);
  },

  /**
   * Automatically group and batch eligible orders in PostgreSQL.
   */
  async autoCreateDeliveryBatches(token?: string) {
    return request<{
      success: boolean;
      count: number;
      batches: any[];
      message?: string;
    }>('/api/farmer/deliveries/batches/auto-create', {
      method: 'POST',
      body: JSON.stringify({}),
    }, token);
  },

  /**
   * Fetch all delivery batches belonging to the authenticated farmer.
   */
  async getFarmerDeliveryBatches(token?: string) {
    return request<{
      success: boolean;
      count: number;
      data: any[];
      message?: string;
    }>('/api/farmer/deliveries/batches', { method: 'GET' }, token);
  },

  /**
   * Fetch single delivery batch by ID or batchCode.
   */
  async getFarmerDeliveryBatchById(batchId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/farmer/deliveries/batches/${batchId}`, { method: 'GET' }, token);
  },

  /**
   * Update delivery batch status in PostgreSQL.
   */
  async updateDeliveryBatchStatus(batchId: string, status: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/deliveries/batches/${batchId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
  },

  /**
   * Fetch sales records belonging to the authenticated farmer from PostgreSQL.
   */
  async getFarmerSales(token?: string, filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      totalCount: number;
      data: any[];
    }>(`/api/farmer/sales${query}`, { method: 'GET' }, token);
  },

  /**
   * Fetch aggregated sales summary and metrics for the authenticated farmer.
   */
  async getFarmerSalesSummary(token?: string) {
    return request<{
      success: boolean;
      summary: any;
    }>('/api/farmer/sales/summary', { method: 'GET' }, token);
  },

  /**
   * Fetch notifications belonging to the authenticated farmer from PostgreSQL.
   */
  async getFarmerNotifications(token?: string) {
    return request<{
      success: boolean;
      count: number;
      unreadCount: number;
      data: any[];
    }>('/api/farmer/notifications', { method: 'GET' }, token);
  },

  /**
   * Mark a specific notification as read in PostgreSQL.
   */
  async markFarmerNotificationRead(id: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/farmer/notifications/${id}/read`, {
      method: 'PATCH',
    }, token);
  },

  /**
   * Mark all notifications belonging to the authenticated farmer as read in PostgreSQL.
   */
  async markAllFarmerNotificationsRead(token?: string) {
    return request<{
      success: boolean;
      message: string;
      count: number;
    }>('/api/farmer/notifications/mark-all-read', {
      method: 'POST',
    }, token);
  },

  /**
   * Admin: List platform sales and pending payouts with search and filters.
   */
  async getAdminSales(
    arg1?: Record<string, any> | string,
    arg2?: string | Record<string, any>
  ) {
    let filters: Record<string, any> = {};
    let token: string | undefined;

    if (typeof arg1 === 'string') {
      token = arg1;
      if (typeof arg2 === 'object' && arg2 !== null) {
        filters = arg2;
      }
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      filters = arg1;
      if (typeof arg2 === 'string') {
        token = arg2;
      }
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      totalCount: number;
      metrics: any;
      data: any[];
    }>(`/api/admin/sales${query}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Retrieve specific sale record by ID or saleCode with full details.
   */
  async getAdminSaleById(saleId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/sales/${saleId}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Mark a sale as PAID_OUT with payout details.
   */
  async markAdminSalePaid(
    saleId: string,
    payload: { transactionReference?: string; payoutDate?: string } | string = {},
    token?: string
  ) {
    const bodyPayload = typeof payload === 'string'
      ? { transactionReference: payload }
      : payload;

    return request<{
      success: boolean;
      message: string;
      sale: any;
    }>(`/api/admin/sales/${saleId}/payout`, {
      method: 'PATCH',
      body: JSON.stringify(bodyPayload),
    }, token);
  },

  /**
   * Admin: List all products across farmers with search and filters.
   */
  async getAdminProducts(
    filters: {
      search?: string;
      category?: string;
      status?: string;
      farmingMethod?: string;
      organic?: string;
      farmerId?: string;
    } = {},
    token?: string
  ) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>(`/api/admin/products${query}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Fetch a specific product by ID with full relations.
   */
  async getAdminProductById(productId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/products/${productId}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Toggle or update a product's status (ACTIVE, OUT_OF_STOCK, DRAFT, EXPIRED).
   */
  async updateAdminProductStatus(productId: string, status: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/products/${productId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
  },

  /**
   * Admin: List all orders across consumers and farmers with search and filters.
   */
  async getAdminOrders(
    filters: {
      search?: string;
      status?: string;
      paymentStatus?: string;
      farmerId?: string;
      farmerName?: string;
    } = {},
    token?: string
  ) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>(`/api/admin/orders${query}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Fetch a specific order by ID or orderNumber with all relations.
   */
  async getAdminOrderById(orderId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/orders/${orderId}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Update order progression status (e.g. CONFIRMED, HARVESTING, PACKED, DELIVERED, CANCELLED).
   */
  async updateAdminOrderStatus(orderId: string, status: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
  },

  /**
   * Admin: List all delivery batches across platform with search and filters.
   */
  async getAdminDeliveryBatches(
    filters: {
      search?: string;
      status?: string;
      hub?: string;
      slot?: string;
    } = {},
    token?: string
  ) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      data: any[];
    }>(`/api/admin/deliveries/batches${query}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Fetch single delivery batch by ID or batchCode with consolidated orders and timeline.
   */
  async getAdminDeliveryBatchById(batchId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/deliveries/batches/${batchId}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Update delivery batch progression status.
   */
  async updateAdminDeliveryBatchStatus(batchId: string, status: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/deliveries/batches/${batchId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token);
  },

  /**
   * Admin: List disputes across orders with search and status filters.
   */
  async getAdminDisputes(
    filters: {
      search?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {},
    token?: string
  ) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        params.append(k, String(v));
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      data: any[];
      metrics?: {
        totalDisputes: number;
        openCount: number;
        reviewCount: number;
        resolvedCount: number;
        rejectedCount: number;
        totalDisputedAmount: number;
      };
    }>(`/api/admin/disputes${query}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Fetch a specific dispute by ID or disputeNumber with order, customer, and grower context.
   */
  async getAdminDisputeById(disputeId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/disputes/${disputeId}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Update dispute status (e.g. UNDER_REVIEW, RESOLVED, REJECTED) with mandatory resolution notes.
   */
  async updateAdminDisputeStatus(
    disputeId: string,
    payload: {
      status: string;
      resolution?: string;
      resolutionNote?: string;
      notes?: string;
    },
    token?: string
  ) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/disputes/${disputeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Admin: Resolve a dispute with settlement notes.
   */
  async resolveAdminDispute(disputeId: string, resolution: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution }),
    }, token);
  },

  /**
   * Admin: Reject a dispute with explanation reason.
   */
  async rejectAdminDispute(disputeId: string, reason: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/disputes/${disputeId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }, token);
  },

  /**
   * Admin: List platform customer reviews with search, rating filter, and relations.
   */
  async getAdminReviews(
    filters: {
      search?: string;
      rating?: number;
      farmerId?: string;
      productId?: string;
      page?: number;
      limit?: number;
    } = {},
    token?: string
  ) {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.rating) params.set('rating', String(filters.rating));
    if (filters.farmerId) params.set('farmerId', filters.farmerId);
    if (filters.productId) params.set('productId', filters.productId);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      totalCount: number;
      metrics: {
        totalReviews: number;
        averageRating: number;
        fiveStarCount: number;
        verifiedPurchasesCount: number;
      };
      data: any[];
    }>(`/api/admin/reviews${qs}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Fetch platform operational dashboard metrics, trends, and recent records.
   */
  async getAdminDashboard(timeRange?: string, token?: string) {
    const query = timeRange ? `?timeRange=${encodeURIComponent(timeRange)}` : '';
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/dashboard${query}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Fetch platform analytics and time series aggregations.
   */
  async getAdminAnalytics(timeRange?: string, startDate?: string, endDate?: string, token?: string) {
    const params = new URLSearchParams();
    if (timeRange) params.set('timeRange', timeRange);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/analytics${query}`, { method: 'GET' }, token);
  },

  /**
   * Admin: List all platform users with optional search, role, status filtering, and pagination.
   */
  async getAdminUsers(
    filters: {
      search?: string;
      role?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
    token?: string
  ) {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.role && filters.role !== 'ALL') params.set('role', filters.role);
    if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      data: any[];
      users: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/admin/users${qs}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Fetch a specific user by ID with full details and relations.
   */
  async getAdminUserById(userId: string, token?: string) {
    return request<{
      success: boolean;
      data: any;
    }>(`/api/admin/users/${userId}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Update user account active/inactive status.
   */
  async updateAdminUserStatus(userId: string, isActive: boolean, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }, token);
  },

  // ==========================================
  // ADMIN NOTIFICATIONS MODULE
  // ==========================================

  /**
   * Admin: Retrieve notifications strictly for authenticated admin with optional type and status filtering.
   */
  async getAdminNotifications(
    filters: {
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
    token?: string
  ) {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== 'all' && filters.type !== 'ALL') {
      params.set('type', filters.type);
    }
    if (filters.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{
      success: boolean;
      count: number;
      unreadCount: number;
      total: number;
      totalAll?: number;
      pagination: {
        page: number;
        limit: number;
        totalPages: number;
      };
      data: any[];
    }>(`/api/admin/notifications${qs}`, { method: 'GET' }, token);
  },

  /**
   * Admin: Get real-time unread notification count directly from PostgreSQL.
   */
  async getAdminUnreadNotificationCount(token?: string) {
    return request<{
      success: boolean;
      unreadCount: number;
    }>('/api/admin/notifications/unread-count', { method: 'GET' }, token);
  },

  /**
   * Admin: Mark a specific notification as read.
   */
  async markAdminNotificationRead(notificationId: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/admin/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }, token);
  },

  /**
   * Admin: Mark all notifications as read for current admin.
   */
  async markAllAdminNotificationsRead(token?: string) {
    return request<{
      success: boolean;
      message: string;
      count: number;
    }>('/api/admin/notifications/read-all', {
      method: 'PATCH',
    }, token);
  },

  /**
   * Admin: Delete a single notification.
   */
  async deleteAdminNotification(notificationId: string, token?: string) {
    return request<{
      success: boolean;
      message: string;
    }>(`/api/admin/notifications/${notificationId}`, {
      method: 'DELETE',
    }, token);
  },

  /**
   * Admin: Clear all notifications for current admin.
   */
  async clearAllAdminNotifications(token?: string) {
    return request<{
      success: boolean;
      message: string;
      count: number;
    }>('/api/admin/notifications', {
      method: 'DELETE',
    }, token);
  },
};




