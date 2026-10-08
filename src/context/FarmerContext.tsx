'use client';

import React, { createContext, useContext, useState, useEffect, useTransition } from 'react';
import {
  FarmerProfile,
  FarmerProduct,
  Harvest,
  InventoryItem,
  FarmerOrderStatus,
  FarmerNotification,
  DeliveryBatch,
  DeliveryBatchStatus,
  SurplusOffer,
  Sale,
  SalesSummary,
} from '@/types';
import { CURRENT_DEMO_FARMER } from '@/data/farmers';
import { INITIAL_FARMER_PRODUCTS } from '@/data/products';
import { INITIAL_FARMER_ORDERS, FarmerOrder } from '@/data/orders';
import { INITIAL_HARVESTS } from '@/data/harvests';
import { INITIAL_INVENTORY_ITEMS } from '@/data/inventory';
import { INITIAL_FARMER_NOTIFICATIONS } from '@/data/notifications';
import { SALES_SUMMARY } from '@/data/sales';
import { INITIAL_DELIVERY_BATCHES } from '@/data/deliveries';
import { INITIAL_SURPLUS_OFFERS } from '@/data/surplus';

import { useAuth } from '@/context/AuthContext';
import { api, getAuthToken } from '@/lib/api';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface FarmerContextType {
  // Auth
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  register: (farmerData: Partial<FarmerProfile>) => void;
  logout: () => void;

  // Profile
  farmerProfile: FarmerProfile;
  updateProfile: (updated: Partial<FarmerProfile>) => Promise<void> | void;

  // Products
  products: FarmerProduct[];
  addProduct: (newProd: Omit<FarmerProduct, 'id'>) => Promise<FarmerProduct> | FarmerProduct;
  updateProduct: (updated: FarmerProduct) => Promise<void> | void;
  deleteProduct: (id: string) => Promise<void> | void;
  toggleProductStatus: (id: string) => Promise<void> | void;

  // Inventory
  inventory: InventoryItem[];
  updateStock: (productId: string, delta: number, reason: string) => Promise<void> | void;

  // Orders
  orders: FarmerOrder[];
  updateOrderStatus: (orderId: string, nextStatus: FarmerOrderStatus) => void;

  // Harvests
  harvests: Harvest[];
  recordHarvest: (harvestData: Omit<Harvest, 'id' | 'createdAt'>) => Promise<Harvest> | Harvest;

  // Surplus
  surplusOffers: SurplusOffer[];
  createSurplusOffer: (offerData: Omit<SurplusOffer, 'offerId' | 'createdAt'>) => Promise<SurplusOffer> | SurplusOffer;
  claimSurplusOffer: (offerId: string) => Promise<void> | void;
  cancelSurplusOffer: (offerId: string) => Promise<void> | void;

  // Deliveries
  deliveryBatches: DeliveryBatch[];
  createDeliveryBatch: (batchData: Omit<DeliveryBatch, 'batchId' | 'createdAt' | 'timeline'>) => DeliveryBatch;
  updateBatchStatus: (batchId: string, nextStatus: DeliveryBatchStatus) => void;
  autoCreateDeliveryBatches: () => Promise<any>;

  // Notifications
  notifications: FarmerNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadCount: number;

  // Sales
  sales: Sale[];
  salesSummary: SalesSummary;
  refreshSales: () => Promise<void>;

  // Toasts
  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

export const EMPTY_SALES_SUMMARY: SalesSummary = {
  todaySales: 0,
  thisWeekSales: 0,
  thisMonthSales: 0,
  totalEarnings: 0,
  totalRevenue: 0,
  pendingPayout: 0,
  paidOut: 0,
  totalUnitsSold: 0,
  salesCount: 0,
  monthlyTrend: '+0% from last month',
  weeklyTrend: '+0% from last week',
  monthlyRevenue: [],
  topProducts: [],
  recentTransactions: [],
};

const FarmerContext = createContext<FarmerContextType | undefined>(undefined);

export function FarmerProvider({ children }: { children: React.ReactNode }) {
  const [, startTransition] = useTransition();
  const { user, isAuthenticated: isAuth, role, updateUser } = useAuth();

  // Helper to dynamically resolve the authenticated farmer's profile
  const resolveCurrentProfile = (): FarmerProfile => {
    if (typeof window === 'undefined') return CURRENT_DEMO_FARMER;

    if (user && user.role === 'farmer' && user.id) {
      // If demo farmer (Ravi Kumar)
      if (user.id === CURRENT_DEMO_FARMER.id || user.email === CURRENT_DEMO_FARMER.email) {
        return CURRENT_DEMO_FARMER;
      }

      // Construct profile from authenticated AuthUser fields
      return {
        id: user.id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.profilePhoto || user.avatar || '',
        profilePhoto: user.profilePhoto || user.avatar || '',
        farmName: user.farmName || `${user.name} Farm`,
        location: user.location || 'Bengaluru, Karnataka',
        city: 'Bengaluru',
        pincode: '560001',
        hub: 'Bengaluru Central',
        farmingMethod: 'Organic',
        yearsFarming: 3,
        acreage: 4,
        mainCrops: ['Fresh Organic Produce'],
        description: `${user.farmName || user.name + ' Farm'} grows naturally cultivated crops.`,
        coverImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
        gallery: [],
        isVerified: user.verificationStatus === 'Verified',
        verificationStatus: user.verificationStatus || 'Pending',
        documents: {},
        rating: 5.0,
        reviewCount: 0,
        totalProductsCount: 0,
        farmSinceYear: new Date().getFullYear(),
      };
    }

    return CURRENT_DEMO_FARMER;
  };

  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile>(resolveCurrentProfile);

  // For real farmers, initial state must be clean (empty), never fake demo data
  const isDemo = !user || user.id === CURRENT_DEMO_FARMER.id || user.email === CURRENT_DEMO_FARMER.email;
  const [products, setProducts] = useState<FarmerProduct[]>(() => (isDemo ? INITIAL_FARMER_PRODUCTS : []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => (isDemo ? INITIAL_INVENTORY_ITEMS : []));
  const [orders, setOrders] = useState<FarmerOrder[]>(() => (isDemo ? INITIAL_FARMER_ORDERS : []));
  const [harvests, setHarvests] = useState<Harvest[]>(() => (isDemo ? INITIAL_HARVESTS : []));
  const [deliveryBatches, setDeliveryBatches] = useState<DeliveryBatch[]>(() => (isDemo ? INITIAL_DELIVERY_BATCHES : []));
  const [surplusOffers, setSurplusOffers] = useState<SurplusOffer[]>(() => (isDemo ? INITIAL_SURPLUS_OFFERS : []));
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>(EMPTY_SALES_SUMMARY);
  const [notifications, setNotifications] = useState<FarmerNotification[]>(() => (isDemo ? INITIAL_FARMER_NOTIFICATIONS : []));
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Synchronize farmer profile and load scoped data whenever user changes
  useEffect(() => {
    const nextProfile = resolveCurrentProfile();
    setFarmerProfile(nextProfile);

    const scopedId = nextProfile.id;
    const token = getAuthToken();

    // Profile & Notifications: Load from PostgreSQL for authenticated real farmers (Approved, Pending, or Rejected)
    if (token && scopedId !== CURRENT_DEMO_FARMER.id) {
      api.getFarmerProfile(token)
        .then((res) => {
          if (res.success && res.data) {
            setFarmerProfile((prev) => ({
              ...prev,
              ...res.data,
              farmingMethod: res.data.farmingMethodDisplay || prev.farmingMethod,
              farmingMethodDisplay: res.data.farmingMethodDisplay,
              acreage: Number(res.data.acreage) || prev.acreage,
              yearsFarming: Number(res.data.yearsFarming) || prev.yearsFarming,
              description: res.data.description || res.data.farmDescription || prev.description,
            }));
            if (updateUser) {
              updateUser({
                name: res.data.name,
                farmName: res.data.farmName,
                location: res.data.location,
                phone: res.data.phone,
                avatar: res.data.avatar,
                profilePhoto: res.data.avatar,
              });
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch farmer profile from backend:', err);
        });

      api.getFarmerNotifications(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setNotifications(res.data);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch notifications from backend:', err);
          setNotifications([]);
        });
    } else if (scopedId === CURRENT_DEMO_FARMER.id) {
      setNotifications(INITIAL_FARMER_NOTIFICATIONS);
    } else {
      setNotifications([]);
    }

    const isApprovedStatus =
      nextProfile.verificationStatus === 'approved' ||
      nextProfile.verificationStatus === 'Verified' ||
      (nextProfile.isVerified === true);

    if (!isApprovedStatus) {
      // Pending and Rejected farmers are strictly blocked from seeing products, inventory, revenue, or orders
      setProducts([]);
      setInventory([]);
      setOrders([]);
      setHarvests([]);
      setSurplusOffers([]);
      setDeliveryBatches([]);
      setSales([]);
      setSalesSummary(EMPTY_SALES_SUMMARY);
      return;
    }

    // For Demo user without token
    if (scopedId === CURRENT_DEMO_FARMER.id && !token) {
      setProducts(INITIAL_FARMER_PRODUCTS);
      setInventory(INITIAL_INVENTORY_ITEMS);
      setOrders(INITIAL_FARMER_ORDERS);
      setHarvests(INITIAL_HARVESTS);
      setDeliveryBatches(INITIAL_DELIVERY_BATCHES);
      setSurplusOffers(INITIAL_SURPLUS_OFFERS);
      setSalesSummary(SALES_SUMMARY);
      return;
    }

    // For Authenticated Real Farmers: PostgreSQL is the SOLE source of truth
    if (token && scopedId !== CURRENT_DEMO_FARMER.id) {
      // 1. Products
      api.getFarmerProducts(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setProducts(res.data);
          } else {
            setProducts([]);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch products from backend:', err);
          setProducts([]);
        });

      // 2. Inventory
      api.getFarmerInventory(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setInventory(res.data);
          } else {
            setInventory([]);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch inventory from backend:', err);
          setInventory([]);
        });

      // 3. Orders (strictly empty array if count is 0)
      api.getFarmerOrders(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setOrders(res.data);
          } else {
            setOrders([]);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch farmer orders from backend:', err);
          setOrders([]);
        });

      // 4. Harvests
      api.getFarmerHarvests(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setHarvests(res.data);
          } else {
            setHarvests([]);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch harvests from backend:', err);
          setHarvests([]);
        });

      // 5. Delivery Batches
      api.getFarmerDeliveryBatches(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setDeliveryBatches(res.data);
          } else {
            setDeliveryBatches([]);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch delivery batches from backend:', err);
          setDeliveryBatches([]);
        });

      // 6. Surplus
      api.getFarmerSurplus(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setSurplusOffers(res.data);
          } else {
            setSurplusOffers([]);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch surplus offers from backend:', err);
          setSurplusOffers([]);
        });

      // 7. Sales & Sales Summary
      api.getFarmerSales(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setSales(res.data);
          } else {
            setSales([]);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch farmer sales from backend:', err);
          setSales([]);
        });

      api.getFarmerSalesSummary(token)
        .then((res) => {
          if (res.success && res.summary) {
            setSalesSummary(res.summary);
          } else {
            setSalesSummary(EMPTY_SALES_SUMMARY);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch sales summary from backend:', err);
          setSalesSummary(EMPTY_SALES_SUMMARY);
        });
    }
  }, [user?.id, user?.name, user?.farmName]);

  // Toast Helpers
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sales refresh helper
  const refreshSales = async () => {
    const token = getAuthToken();
    if (!token || farmerProfile?.id === CURRENT_DEMO_FARMER.id) return;
    try {
      const [salesRes, summaryRes] = await Promise.all([
        api.getFarmerSales(token),
        api.getFarmerSalesSummary(token),
      ]);
      if (salesRes.success && Array.isArray(salesRes.data)) {
        setSales(salesRes.data);
      }
      if (summaryRes.success && summaryRes.summary) {
        setSalesSummary(summaryRes.summary);
      }
    } catch (e) {
      console.warn('Error refreshing sales from backend:', e);
    }
  };

  // Auth operations
  const login = (email: string, pass: string): boolean => {
    return true;
  };

  const register = (farmerData: Partial<FarmerProfile>) => {};

  const logout = () => {};

  // Profile operations — updates the single source of truth in PostgreSQL
  const updateProfile = async (updated: Partial<FarmerProfile>): Promise<void> => {
    setFarmerProfile((prev) => {
      const next: FarmerProfile = {
        ...prev,
        ...updated,
        avatar: updated.avatar || prev.avatar || prev.profilePhoto || '',
        profilePhoto: updated.profilePhoto || prev.profilePhoto || prev.avatar || '',
      };
      return next;
    });

    // Synchronize with PostgreSQL if authenticated
    const token = getAuthToken();
    const scopedId = farmerProfile.id;
    if (token && scopedId !== CURRENT_DEMO_FARMER.id) {
      try {
        const res = await api.updateFarmerProfile(
          {
            name: updated.name,
            phone: updated.phone,
            avatar: updated.avatar || updated.profilePhoto,
            profilePhoto: updated.profilePhoto || updated.avatar,
            farmName: updated.farmName,
            location: updated.location,
            farmLocation: updated.farmLocation || updated.location,
            city: updated.city,
            state: updated.state,
            pincode: updated.pincode,
            hub: updated.hub,
            farmingMethod: updated.farmingMethod,
            yearsFarming: updated.yearsFarming || updated.yearsOfFarming,
            acreage: updated.acreage,
            mainCrops: updated.mainCrops,
            description: updated.description || updated.farmDescription,
            farmDescription: updated.farmDescription || updated.description,
            coverImage: updated.coverImage,
            gallery: updated.gallery,
          },
          token
        );

        if (res.success && res.data) {
          setFarmerProfile((prev) => ({
            ...prev,
            ...res.data,
            farmingMethod: res.data.farmingMethodDisplay || prev.farmingMethod,
            farmingMethodDisplay: res.data.farmingMethodDisplay,
            acreage: Number(res.data.acreage) || prev.acreage,
            yearsFarming: Number(res.data.yearsFarming) || prev.yearsFarming,
            description: res.data.description || res.data.farmDescription || prev.description,
          }));

          if (updateUser) {
            updateUser({
              name: res.data.name,
              farmName: res.data.farmName,
              location: res.data.location,
              phone: res.data.phone,
              avatar: res.data.avatar,
              profilePhoto: res.data.avatar,
            });
          }
        }
      } catch (err: any) {
        console.warn('Backend profile update error:', err);
        showToast(err.message || 'Failed to update profile on backend', 'error');
        return;
      }
    }

    // Keep AuthContext user in sync
    if (updateUser && updated.name) {
      updateUser({
        name: updated.name,
        farmName: updated.farmName,
        location: updated.location,
        phone: updated.phone,
        avatar: updated.avatar || updated.profilePhoto,
        profilePhoto: updated.profilePhoto || updated.avatar,
      });
    }

    showToast('Farm profile details updated successfully!', 'success');
  };

  // Products operations
  const addProduct = async (newProd: Omit<FarmerProduct, 'id'>): Promise<FarmerProduct> => {
    const token = getAuthToken();
    const scopedId = farmerProfile.id;

    if (token && scopedId !== CURRENT_DEMO_FARMER.id) {
      try {
        const response = await api.createFarmerProduct(
          {
            name: newProd.name,
            category: newProd.category,
            description: newProd.description,
            price: newProd.price,
            unit: newProd.unit,
            unitShort: newProd.unitShort,
            images: newProd.images,
            shelfLifeDays: newProd.shelfLifeDays,
            expectedFreshnessDuration: newProd.expectedFreshnessDuration,
            harvestDate: newProd.harvestDate,
            farmingMethod: newProd.farmingMethod,
            isOrganic: newProd.isOrganic,
            status: newProd.status,
            inStock: newProd.inStock,
            availableQuantity: newProd.availableQuantity,
            lowStockThreshold: newProd.lowStockThreshold,
          },
          token
        );

        if (response.success && response.data) {
          const product = response.data;
          setProducts((prev) => [product, ...prev]);

          api.getFarmerInventory(token).then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setInventory(res.data);
            }
          }).catch(() => {});

          showToast('Product published successfully.', 'success');
          return product;
        } else {
          throw new Error((response as any)?.error || 'Failed to save product to database.');
        }
      } catch (err: any) {
        showToast(err.message || 'Product creation failed on backend.', 'error');
        throw err;
      }
    }

    // Demo farmer fallback only
    const demoProduct: FarmerProduct = {
      ...newProd,
      id: `prod-${farmerProfile.id}-${Date.now()}`,
      farmerId: farmerProfile.id,
      farmerName: farmerProfile.name,
      farmName: farmerProfile.farmName,
      farmLocation: farmerProfile.location,
      rating: 5.0,
      reviewsCount: 0,
    };
    setProducts((prev) => [demoProduct, ...prev]);
    showToast('Product published successfully.', 'success');
    return demoProduct;
  };

  const updateProduct = async (updated: FarmerProduct): Promise<void> => {
    const token = getAuthToken();
    const scopedId = farmerProfile.id;

    if (token && scopedId !== CURRENT_DEMO_FARMER.id && !updated.id.startsWith('prod-demo')) {
      try {
        const res = await api.updateFarmerProduct(
          updated.id,
          {
            name: updated.name,
            category: updated.category,
            description: updated.description,
            price: updated.price,
            unit: updated.unit,
            unitShort: updated.unitShort,
            images: updated.images,
            shelfLifeDays: updated.shelfLifeDays,
            expectedFreshnessDuration: updated.expectedFreshnessDuration,
            harvestDate: updated.harvestDate,
            farmingMethod: updated.farmingMethod,
            isOrganic: updated.isOrganic,
            status: updated.status,
            inStock: updated.inStock,
            availableQuantity: updated.availableQuantity,
            lowStockThreshold: updated.lowStockThreshold,
          },
          token
        );

        if (res.success && res.data) {
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? res.data : p)));
          api.getFarmerInventory(token).then((invRes) => {
            if (invRes.success && Array.isArray(invRes.data)) setInventory(invRes.data);
          }).catch(() => {});
          showToast('Product updated successfully.', 'success');
          return;
        } else {
          throw new Error((res as any)?.error || 'Failed to update product on backend.');
        }
      } catch (err: any) {
        showToast(err.message || 'Product update failed on backend.', 'error');
        throw err;
      }
    }

    // Demo fallback
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setInventory((prev) =>
      prev.map((inv) =>
        inv.productId === updated.id
          ? {
              ...inv,
              productName: updated.name,
              category: updated.category,
              price: updated.price,
              unit: updated.unit,
              unitShort: updated.unitShort,
            }
          : inv
      )
    );
    showToast('Product updated successfully.', 'success');
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const token = getAuthToken();
    const scopedId = farmerProfile.id;

    if (token && scopedId !== CURRENT_DEMO_FARMER.id && !id.startsWith('prod-demo')) {
      try {
        const res = await api.deleteFarmerProduct(id, token);
        if (res.success) {
          setProducts((prev) => prev.filter((p) => p.id !== id));
          setInventory((prev) => prev.filter((inv) => inv.productId !== id));
          showToast('Product deleted from catalog.', 'info');
          return;
        } else {
          throw new Error((res as any)?.error || 'Failed to delete product on backend.');
        }
      } catch (err: any) {
        showToast(err.message || 'Product deletion failed on backend.', 'error');
        throw err;
      }
    }

    // Demo fallback
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setInventory((prev) => prev.filter((inv) => inv.productId !== id));
    showToast('Product deleted from catalog.', 'info');
  };

  const toggleProductStatus = async (id: string): Promise<void> => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;
    const nextStatus = existing.status === 'Active' ? 'Draft' : 'Active';
    const nextInStock = nextStatus === 'Active';

    const token = getAuthToken();
    const scopedId = farmerProfile.id;

    if (token && scopedId !== CURRENT_DEMO_FARMER.id && !id.startsWith('prod-demo')) {
      try {
        const res = await api.updateFarmerProduct(
          id,
          {
            status: nextStatus,
            inStock: nextInStock,
          },
          token
        );
        if (res.success && res.data) {
          setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
          showToast(`Product status updated to ${nextStatus}.`, 'info');
          return;
        } else {
          throw new Error((res as any)?.error || 'Failed to update product status on backend.');
        }
      } catch (err: any) {
        showToast(err.message || 'Status toggle failed on backend.', 'error');
        throw err;
      }
    }

    // Demo fallback
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: nextStatus, inStock: nextInStock } : p
      )
    );
    showToast('Product status updated.', 'info');
  };

  // Inventory operations
  const updateStock = async (
    productId: string,
    delta: number,
    reason: string
  ): Promise<void> => {
    // 1. Optimistic local state update
    setInventory((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const newAvailable = Math.max(0, item.availableQuantity + delta);
        const newCurrent = newAvailable + item.reservedQuantity;
        let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
        if (newAvailable === 0) newStatus = 'Out of Stock';
        else if (newAvailable <= item.threshold) newStatus = 'Low Stock';

        return {
          ...item,
          availableQuantity: newAvailable,
          currentStock: newCurrent,
          status: newStatus,
          lastUpdated: 'Just now',
        };
      })
    );

    // Also update product available quantity & inStock in state
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const newQty = Math.max(0, p.availableQuantity + delta);
        return {
          ...p,
          availableQuantity: newQty,
          inStock: newQty > 0,
          status: newQty === 0 ? 'Out of Stock' : p.status,
        };
      })
    );

    // 2. Synchronize with PostgreSQL if authenticated
    const token = getAuthToken();
    if (
      token &&
      !productId.startsWith('prod-demo') &&
      !productId.startsWith('prod-ravikumar')
    ) {
      try {
        const res = await api.updateFarmerStock(productId, { delta, reason }, token);
        if (res.success && res.data) {
          // Replace with authoritative PostgreSQL record
          setInventory((prev) =>
            prev.map((item) => (item.productId === productId ? res.data : item))
          );
        } else {
          throw new Error((res as any)?.error || 'Failed to update stock in database.');
        }
      } catch (err: any) {
        showToast(err.message || 'Inventory update failed on backend.', 'error');
        // Rollback optimistic update
        api.getFarmerInventory(token).then((r) => {
          if (r.success && Array.isArray(r.data)) setInventory(r.data);
        }).catch(() => {});
        throw err;
      }
    }

    showToast(`Inventory updated successfully (${reason || 'Stock adjustment'}).`, 'success');
  };

  // Order status progression
  const updateOrderStatus = async (orderId: string, nextStatus: FarmerOrderStatus) => {
    // 1. Optimistic local state update
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;

        // Define status order
        const statuses: FarmerOrderStatus[] = [
          'Pending',
          'Confirmed',
          'Preparing',
          'Ready',
          'Completed',
          'Cancelled',
        ];

        const targetIdx = statuses.indexOf(nextStatus);

        const newTimeline = o.timeline.map((step) => {
          let isComp = step.completed;
          let isCurr = false;

          if (step.status === 'placed' || step.status === 'paid') {
            isComp = true;
          } else if (step.status === 'confirmed' && targetIdx >= 1) {
            isComp = true;
          } else if (step.status === 'preparing' && targetIdx >= 2) {
            isComp = true;
          } else if (step.status === 'ready' && targetIdx >= 3) {
            isComp = true;
          } else if (step.status === 'completed' && targetIdx >= 4) {
            isComp = true;
          }

          if (
            (nextStatus === 'Pending' && step.status === 'confirmed') ||
            (nextStatus === 'Confirmed' && step.status === 'confirmed') ||
            (nextStatus === 'Preparing' && step.status === 'preparing') ||
            (nextStatus === 'Ready' && step.status === 'ready') ||
            (nextStatus === 'Completed' && step.status === 'completed')
          ) {
            isCurr = true;
          }

          return {
            ...step,
            completed: isComp,
            current: isCurr,
            timestamp: isCurr ? 'Updated just now' : step.timestamp,
          };
        });

        return {
          ...o,
          status: nextStatus,
          timeline: newTimeline,
        };
      })
    );

    // 2. Synchronize with PostgreSQL if authenticated
    const token = getAuthToken();
    if (token) {
      try {
        const res = await api.updateFarmerOrderStatus(orderId, nextStatus, token);
        if (res.success && res.data) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId || (o as any).rawId === orderId ? res.data : o))
          );
          if (nextStatus === 'Completed') {
            refreshSales();
          }
        } else {
          throw new Error((res as any)?.error || 'Failed to update order status on backend.');
        }
      } catch (err: any) {
        showToast(err.message || 'Order status update failed on backend.', 'error');
        api.getFarmerOrders(token).then((r) => {
          if (r.success && Array.isArray(r.data)) setOrders(r.data);
        }).catch(() => {});
        return;
      }
    }

    showToast(`Order ${orderId} marked as ${nextStatus}.`, 'success');
  };


  // Harvest operations
  const recordHarvest = async (harvestData: Omit<Harvest, 'id' | 'createdAt'>): Promise<Harvest> => {
    const id = `HAR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
    let newHarvest: Harvest = {
      ...harvestData,
      id,
      createdAt: new Date().toISOString(),
    };

    setHarvests((prev) => [newHarvest, ...prev]);

    // If product matches, update or notify
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === harvestData.productId || p.name.toLowerCase().includes(harvestData.productName.toLowerCase())) {
          return {
            ...p,
            availableQuantity: p.availableQuantity + harvestData.availableQuantity,
            inStock: true,
            status: 'Active',
            harvestBatch: harvestData.batchNumber,
            harvestDate: harvestData.harvestDate,
            freshnessScore: harvestData.expectedFreshness,
          };
        }
        return p;
      })
    );

    // Synchronize with PostgreSQL if authenticated
    const token = getAuthToken();
    const scopedId = farmerProfile.id;
    if (token && scopedId !== CURRENT_DEMO_FARMER.id && !scopedId.startsWith('farmer-demo')) {
      try {
        const res = await api.createFarmerHarvest(
          {
            productId: harvestData.productId,
            productName: harvestData.productName,
            quantity: harvestData.quantity,
            availableQuantity: harvestData.availableQuantity,
            unit: harvestData.unit,
            harvestDate: harvestData.harvestDate,
            batchNumber: harvestData.batchNumber,
            farmingMethod: harvestData.farmingMethod || farmerProfile.farmingMethod,
            location: farmerProfile.location,
            expectedShelfLifeDays: harvestData.expectedShelfLife,
            expectedFreshness: harvestData.expectedFreshness,
            notes: harvestData.notes,
          },
          token
        );

        if (res.success && res.data) {
          newHarvest = res.data;
          setHarvests((prev) => prev.map((h) => (h.id === id ? res.data : h)));

          // Refresh inventory & products to sync updated stock from PostgreSQL transaction
          api
            .getFarmerInventory(token)
            .then((r) => {
              if (r.success && Array.isArray(r.data)) setInventory(r.data);
            })
            .catch(() => {});
          api
            .getFarmerProducts(token)
            .then((r) => {
              if (r.success && Array.isArray(r.data)) setProducts(r.data);
            })
            .catch(() => {});
        } else {
          throw new Error((res as any)?.error || 'Failed to record harvest in database.');
        }
      } catch (err: any) {
        showToast(err.message || 'Harvest recording failed on backend.', 'error');
        // Rollback optimistic state
        setHarvests((prev) => prev.filter((h) => h.id !== id));
        throw err;
      }
    }

    showToast(`Harvest ${newHarvest.batchNumber} recorded successfully!`, 'success');
    return newHarvest;
  };

  // Surplus operations
  const createSurplusOffer = async (
    offerData: Omit<SurplusOffer, 'offerId' | 'createdAt'>
  ): Promise<SurplusOffer> => {
    const offerId = `SO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    let newOffer: SurplusOffer = {
      ...offerData,
      offerId,
      createdAt: new Date().toISOString(),
    };
    setSurplusOffers((prev) => [newOffer, ...prev]);

    const token = getAuthToken();
    const scopedId = farmerProfile.id;
    if (token && scopedId !== CURRENT_DEMO_FARMER.id && !scopedId.startsWith('farmer-demo')) {
      try {
        const res = await api.createFarmerSurplus(
          {
            productId: offerData.productId,
            batchId: offerData.batchId,
            availableQuantity: offerData.availableQuantity,
            discountPercent: offerData.discountPercent,
            expiryDate: offerData.expiryDate,
            reason: offerData.reason,
          },
          token
        );
        if (res.success && res.data) {
          newOffer = res.data;
          setSurplusOffers((prev) =>
            prev.map((o) => (o.offerId === offerId ? res.data : o))
          );
        } else {
          throw new Error((res as any)?.error || 'Failed to publish surplus offer in database.');
        }
      } catch (err: any) {
        showToast(err.message || 'Surplus creation failed on backend.', 'error');
        setSurplusOffers((prev) => prev.filter((o) => o.offerId !== offerId));
        throw err;
      }
    }

    showToast(
      `Surplus flash offer published for ${newOffer.productName} (${newOffer.discountPercent}% off)!`,
      'success'
    );
    return newOffer;
  };

  const claimSurplusOffer = async (offerId: string): Promise<void> => {
    setSurplusOffers((prev) =>
      prev.map((o) =>
        o.offerId === offerId || (o as any).id === offerId
          ? { ...o, status: 'Claimed' }
          : o
      )
    );

    const token = getAuthToken();
    const scopedId = farmerProfile.id;
    if (token && scopedId !== CURRENT_DEMO_FARMER.id && !scopedId.startsWith('farmer-demo')) {
      try {
        const res = await api.updateFarmerSurplus(offerId, { status: 'Claimed' }, token);
        if (!res.success) {
          throw new Error((res as any)?.error || 'Failed to claim surplus offer in database.');
        }
      } catch (err: any) {
        showToast(err.message || 'Surplus claim failed on backend.', 'error');
        api.getFarmerSurplus(token).then((r) => {
          if (r.success && Array.isArray(r.data)) setSurplusOffers(r.data);
        }).catch(() => {});
        return;
      }
    }

    showToast(`Surplus offer ${offerId} marked as claimed!`, 'info');
  };

  const cancelSurplusOffer = async (offerId: string): Promise<void> => {
    setSurplusOffers((prev) =>
      prev.map((o) =>
        o.offerId === offerId || (o as any).id === offerId
          ? { ...o, status: 'Cancelled' as any }
          : o
      )
    );

    const token = getAuthToken();
    const scopedId = farmerProfile.id;
    if (token && scopedId !== CURRENT_DEMO_FARMER.id && !scopedId.startsWith('farmer-demo')) {
      try {
        const res = await api.cancelFarmerSurplus(offerId, token);
        if (!res.success) {
          throw new Error((res as any)?.error || 'Failed to cancel surplus offer in database.');
        }
      } catch (err: any) {
        showToast(err.message || 'Surplus cancel failed on backend.', 'error');
        api.getFarmerSurplus(token).then((r) => {
          if (r.success && Array.isArray(r.data)) setSurplusOffers(r.data);
        }).catch(() => {});
        return;
      }
    }

    showToast(`Surplus offer ${offerId} cancelled.`, 'info');
  };

  // Delivery Batch operations
  const createDeliveryBatch = (batchData: Omit<DeliveryBatch, 'batchId' | 'createdAt' | 'timeline'>): DeliveryBatch => {
    const tempBatchId = `DB-${Math.floor(105 + Math.random() * 890)}`;
    const timeline: DeliveryBatch['timeline'] = [
      { status: 'Pending', label: 'Batch Formed', timestamp: 'Just now', completed: true, current: true },
      { status: 'Preparing', label: 'Quality Sorting & Consolidation', timestamp: 'Pending', completed: false, current: false },
      { status: 'Ready', label: 'Ready for Rider Handover', timestamp: 'Pending', completed: false, current: false },
      { status: 'Out for Delivery', label: 'Dispatched to Route', timestamp: 'Pending', completed: false, current: false },
      { status: 'Delivered', label: 'All Customer Deliveries Complete', timestamp: 'Pending', completed: false, current: false },
    ];
    const newBatch: DeliveryBatch = {
      ...batchData,
      batchId: tempBatchId,
      createdAt: new Date().toISOString(),
      timeline,
    };
    setDeliveryBatches((prev) => [newBatch, ...prev]);

    const token = getAuthToken();
    if (token && farmerProfile?.id !== CURRENT_DEMO_FARMER.id) {
      api.createDeliveryBatch({
        hubArea: batchData.area,
        deliverySlot: batchData.deliverySlot,
        riderName: batchData.riderName,
        riderVehicle: batchData.riderVehicle,
        estimatedDistanceKm: batchData.estimatedDistanceKm,
        estimatedDeliveryTime: batchData.estimatedDeliveryTime,
        totalQuantity: parseInt(batchData.totalQuantity, 10) || 5,
        productsSummary: batchData.productsSummary,
        orderIds: batchData.orderIds,
      }, token)
        .then((res) => {
          if (res.success && res.data) {
            setDeliveryBatches((prev) =>
              prev.map((b) => (b.batchId === tempBatchId ? res.data : b))
            );
          } else {
            showToast((res as any)?.error || 'Failed to create batch on backend.', 'error');
            setDeliveryBatches((prev) => prev.filter((b) => b.batchId !== tempBatchId));
          }
        })
        .catch((err) => {
          showToast(err.message || 'Could not persist delivery batch to backend.', 'error');
          setDeliveryBatches((prev) => prev.filter((b) => b.batchId !== tempBatchId));
        });
    }

    showToast(`Delivery batch ${tempBatchId} for ${newBatch.area} generated!`, 'success');
    return newBatch;
  };

  const updateBatchStatus = (batchId: string, nextStatus: DeliveryBatchStatus) => {
    setDeliveryBatches((prev) =>
      prev.map((b) => {
        if (b.batchId !== batchId && (b as any).id !== batchId && (b as any).rawId !== batchId) return b;

        const statuses: DeliveryBatchStatus[] = [
          'Pending',
          'Preparing',
          'Ready',
          'Out for Delivery',
          'Delivered',
        ];
        const targetIdx = statuses.indexOf(nextStatus);

        const newTimeline = b.timeline.map((step) => {
          const stepIdx = statuses.indexOf(step.status);
          const isComp = stepIdx <= targetIdx;
          const isCurr = step.status === nextStatus;
          return {
            ...step,
            completed: isComp,
            current: isCurr,
            timestamp: isCurr ? 'Updated just now' : step.timestamp,
          };
        });

        return {
          ...b,
          status: nextStatus,
          timeline: newTimeline,
        };
      })
    );

    const token = getAuthToken();
    if (token && farmerProfile?.id !== CURRENT_DEMO_FARMER.id) {
      api.updateDeliveryBatchStatus(batchId, nextStatus, token)
        .then((res) => {
          if (res.success && res.data) {
            setDeliveryBatches((prev) =>
              prev.map((b) => (b.batchId === batchId || (b as any).id === batchId ? res.data : b))
            );
            // Refresh orders as well since orders were synchronized!
            api.getFarmerOrders(token).then((ordRes) => {
              if (ordRes.success && Array.isArray(ordRes.data)) {
                setOrders(ordRes.data);
              }
            }).catch(() => {});
            if (nextStatus === 'Delivered') {
              refreshSales();
            }
          } else {
            showToast((res as any)?.error || 'Failed to update batch status on backend.', 'error');
            api.getFarmerDeliveryBatches(token).then((r) => {
              if (r.success && Array.isArray(r.data)) setDeliveryBatches(r.data);
            }).catch(() => {});
          }
        })
        .catch((err) => {
          showToast(err.message || 'Could not update batch status on backend.', 'error');
          api.getFarmerDeliveryBatches(token).then((r) => {
            if (r.success && Array.isArray(r.data)) setDeliveryBatches(r.data);
          }).catch(() => {});
        });
    }

    showToast(`Batch ${batchId} status advanced to ${nextStatus}.`, 'success');
  };

  const autoCreateDeliveryBatches = async () => {
    const token = getAuthToken();
    if (token && farmerProfile?.id !== CURRENT_DEMO_FARMER.id) {
      const res = await api.autoCreateDeliveryBatches(token);
      if (res.success && Array.isArray(res.batches)) {
        setDeliveryBatches((prev) => [...res.batches, ...prev]);
        const ordRes = await api.getFarmerOrders(token);
        if (ordRes.success && Array.isArray(ordRes.data)) {
          setOrders(ordRes.data);
        }
        showToast(`Auto-created ${res.count} delivery batch(es)!`, 'success');
        return res;
      }
    }
  };

  // Notification operations
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    const token = getAuthToken();
    if (token && farmerProfile?.id !== CURRENT_DEMO_FARMER.id && !id.startsWith('f-notif-')) {
      api.markFarmerNotificationRead(id, token).catch((err) => {
        console.warn('Could not sync notification read status with backend:', err);
      });
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');

    const token = getAuthToken();
    if (token && farmerProfile?.id !== CURRENT_DEMO_FARMER.id) {
      api.markAllFarmerNotificationsRead(token).catch((err) => {
        console.warn('Could not sync mark-all-read status with backend:', err);
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <FarmerContext.Provider
      value={{
        isAuthenticated: isAuth && role === 'farmer',
        login,
        register,
        logout,
        farmerProfile,
        updateProfile,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        inventory,
        updateStock,
        orders,
        updateOrderStatus,
        harvests,
        recordHarvest,
        surplusOffers,
        createSurplusOffer,
        claimSurplusOffer,
        cancelSurplusOffer,
        deliveryBatches,
        createDeliveryBatch,
        updateBatchStatus,
        autoCreateDeliveryBatches,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadCount,
        sales,
        salesSummary,
        refreshSales,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </FarmerContext.Provider>
  );
}

export function useFarmer() {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used within a FarmerProvider');
  }
  return context;
}
