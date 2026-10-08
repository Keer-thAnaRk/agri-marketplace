export type UserRole = 'consumer' | 'farmer' | 'admin';

export type VerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Verified';

export function isFarmerApproved(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'approved' || s === 'verified';
}

export function isFarmerPending(status?: string | null): boolean {
  if (!status) return true;
  const s = status.toLowerCase();
  return s === 'pending';
}

export function isFarmerRejected(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'rejected';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  profilePhoto?: string;
  farmId?: string;
  farmName?: string;
  location?: string;
  verificationStatus: VerificationStatus;
  isVerified?: boolean;
  rejectionReason?: string;
  registeredAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ConsumerSignupData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

export interface FarmerSignupData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  profilePhoto?: string;
  farmName: string;
  farmLocation: string;
  city: string;
  state: string;
  pincode: string;
  farmingMethod: FarmingMethod | 'Conventional' | 'Mixed';
  yearsFarming: number;
  mainCrops: string[];
  farmDescription: string;
  govtIdFileName?: string;
  ownershipDocFileName?: string;
  farmPhotoUrl?: string;
}

export type FarmingMethod = 'Organic' | 'Natural (ZBNF)' | 'Hydroponic' | 'Regenerative' | 'Pesticide-Free' | 'Traditional';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'harvesting'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Farmer {
  id: string;
  name: string;
  avatar: string;
  farmName: string;
  location: string;
  hub: string; // e.g. HSR Layout, Sarjapur, Whitefield, etc.
  distanceKm: number;
  farmingMethod: FarmingMethod;
  isVerified: boolean;
  yearsFarming: number;
  acreage: number;
  rating: number;
  reviewCount: number;
  mainCrops: string[];
  coverImage: string;
  story: string;
  soilPractices: string[];
  waterSource: string;
  certifications: string[];
  phone: string;
  joinedDate: string;
}

export interface TraceabilityStep {
  step: 'farm' | 'harvest' | 'pack' | 'dispatch' | 'delivery';
  title: string;
  location: string;
  timestamp: string;
  details: string;
  completed: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  farmLocation: string;
  farmDistanceKm: number;
  price: number; // in INR
  unit: string; // e.g., '1 kg', '500 g', 'bunch', 'dozen'
  unitShort: string; // 'kg', 'g', 'bunch', 'dz'
  images: string[];
  harvestDate: string; // ISO or human readable
  harvestedAgo: string; // e.g. "Harvested 6 hours ago"
  freshnessScore: number; // 0 - 100
  shelfLifeDays: number;
  isOrganic: boolean;
  farmingMethod: FarmingMethod;
  inStock: boolean;
  availableQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  rating: number;
  reviewsCount: number;
  traceability: TraceabilityStep[];
  nutritionHighlights?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  productCount: number;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DeliverySlot {
  id: string;
  name: string;
  timeRange: string;
  description: string;
}

export interface DeliveryAddress {
  id: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  pincode: string;
  hub: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  farmerId: string;
  farmerName: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface OrderTimelineItem {
  status: OrderStatus;
  label: string;
  timestamp: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  deliverySlot: DeliverySlot;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  farmerEarnings: number;
  total: number;
  paymentMethod: 'UPI' | 'Card' | 'Cash on Delivery';
  paymentStatus: 'Paid' | 'Pending';
  estimatedDelivery: string;
  timeline: OrderTimelineItem[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  productId?: string;
  farmerId: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

export interface Dispute {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  farmerName: string;
  productName: string;
  reason: string;
  amount: number;
  date: string;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Rejected';
  description: string;
  resolution?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order_confirmed' | 'order_shipped' | 'delivery_update' | 'farmer_verification' | 'low_inventory' | 'new_order';
  isRead: boolean;
  link?: string;
}

export interface DeliveryLocation {
  id: string;
  name: string;
  area: string;
  city: string;
  pincode: string;
}

// ==========================================
// FARMER MODULE TYPES
// ==========================================

export type FarmerOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Completed'
  | 'Cancelled';

export type ProductStatus = 'Active' | 'Draft' | 'Out of Stock' | 'Expired';

export interface FarmerProduct extends Product {
  status: ProductStatus;
  lowStockThreshold?: number;
  harvestBatch?: string;
  harvestBatchId?: string;
  expectedFreshnessDuration?: string;
  expectedShelfLifeDays?: number;
  isSurplus?: boolean;
  surplusOfferPrice?: number;
  surplusDiscountPercent?: number;
}

export interface TraceabilityEvent {
  eventId: string;
  batchId: string;
  eventType: 'farm' | 'harvest' | 'pack' | 'dispatch' | 'delivery';
  title: string;
  location: string;
  timestamp: string;
  details: string;
  completed: boolean;
  actor?: string;
}

export interface Harvest {
  id: string; // e.g. HAR-20260924-01
  harvestId?: string; // alias for id
  productId: string;
  productName: string;
  productImage?: string;
  farmerId?: string;
  farmId?: string;
  farmName: string;
  batchNumber: string; // e.g. TOM-2409-A
  harvestDate: string; // e.g. 'Sept 24, 2026'
  quantity: number;
  harvestedQuantity?: number; // alias for quantity
  availableQuantity: number;
  unit: string;
  farmingMethod?: FarmingMethod | string;
  expectedShelfLife?: number; // in days, e.g. 6
  expectedFreshness: number; // e.g. 92
  status: 'Available' | 'Low Stock' | 'Sold Out' | 'Surplus' | 'Expired' | 'Depleted';
  qrCodeUrl?: string;
  notes?: string;
  createdAt: string;
  traceabilityEvents?: TraceabilityEvent[];
}

export type FreshnessStatus = 'Fresh' | 'Good' | 'Use Soon' | 'Expired';

export interface FreshnessResult {
  percentage: number;
  status: FreshnessStatus;
  daysRemaining: number;
  hoursAgo: number;
  label: string;
  isApproachingExpiry: boolean;
  isExpired: boolean;
}

export interface SurplusOffer {
  id?: string;
  offerId: string;
  productId: string;
  productName: string;
  productImage: string;
  batchNumber: string;
  batchId?: string;
  availableQuantity: number;
  unit: string;
  originalPrice: number;
  discountPercent: number;
  offerPrice: number;
  expiryDate: string;
  daysRemaining: number;
  freshnessPercentage: number;
  reason: string;
  status: 'Active' | 'Claimed' | 'Expired' | 'Cancelled';
  createdAt: string;
}

export type DeliveryBatchStatus =
  | 'Pending'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface DeliveryBatchTimelineStep {
  status: DeliveryBatchStatus;
  label: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

export interface DeliveryBatch {
  batchId: string; // e.g. DB-102
  area: string; // e.g. 'HSR Layout'
  deliverySlot: string; // e.g. '8:00 AM – 11:00 AM'
  orderIds: string[];
  customerCount: number;
  customerNames: string[];
  farmerNames: string[];
  productsSummary: string;
  totalQuantity: string;
  estimatedDistanceKm: number;
  estimatedDeliveryTime: string;
  status: DeliveryBatchStatus;
  riderName?: string;
  riderVehicle?: string;
  createdAt: string;
  timeline: DeliveryBatchTimelineStep[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  unit: string;
  unitShort: string;
  price: number;
  currentStock: number;
  availableQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  threshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expired';
  lastUpdated: string;
  harvestBatch?: string;
  harvestDate?: string;
  shelfLifeDays?: number;
  freshnessPercentage?: number;
  freshnessStatus?: FreshnessStatus;
  daysRemaining?: number;
}


export interface InventoryLog {
  id: string;
  productId: string;
  type: 'add' | 'remove' | 'adjustment';
  amount: number;
  reason: string;
  timestamp: string;
  newQuantity: number;
}

export type SaleStatusType =
  | 'PENDING_PAYOUT'
  | 'PAID_OUT'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'Completed'
  | 'Pending'
  | 'Refunded';

export interface Sale {
  id: string;
  rawId?: string;
  saleCode?: string;
  orderId: string;
  rawOrderId?: string;
  farmerId?: string;
  farmerName?: string;
  farmName?: string;
  orderItemId?: string;
  date: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  revenue: number;
  status: SaleStatusType | string;
  payoutDate?: string | null;
  transactionReference?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesSummary {
  todaySales: number;
  thisWeekSales: number;
  thisMonthSales: number;
  totalEarnings: number;
  totalRevenue?: number;
  pendingPayout?: number;
  paidOut?: number;
  totalUnitsSold?: number;
  salesCount?: number;
  monthlyTrend: string;
  weeklyTrend: string;
  monthlyRevenue?: { label: string; year?: number; month?: number; revenue: number; orders: number }[];
  topProducts?: { rank: number; name: string; category: string; quantitySold: string; revenue: number; percent: number; orderCount?: number }[];
  recentTransactions?: Sale[];
}

export interface FarmerNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'inventory' | 'review' | 'system' | 'completed';
  isRead: boolean;
  link?: string;
}

export interface FarmerProfile {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  avatar: string;
  profilePhoto?: string;
  farmName: string;
  location: string;
  farmLocation?: string;
  city: string;
  state?: string;
  pincode: string;
  hub: string;
  farmingMethod: FarmingMethod | 'Conventional' | 'Mixed';
  yearsFarming: number;
  yearsOfFarming?: number;
  acreage: number;
  mainCrops: string[];
  description: string;
  farmDescription?: string;
  coverImage: string;
  gallery: string[];
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  registeredAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  verifiedDate?: string;
  documents: {
    governmentId?: string;
    farmOwnership?: string;
    farmPhoto?: string;
  };
  verificationDocuments?: {
    governmentId?: string;
    farmOwnership?: string;
    farmPhoto?: string;
  };
  rating: number;
  reviewCount: number;
  totalProductsCount: number;
  farmSinceYear: number;
  createdAt?: string;
}

