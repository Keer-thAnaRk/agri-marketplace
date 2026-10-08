import {
  FarmingMethod,
  OrderStatus,
} from '@/types';

// ============================================================================
// ADMIN FARMER INTERFACES & DATA
// ============================================================================

export interface AdminDocument {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: string;
  mimeType?: string;
  uploadedAt: string;
  url: string;
  verified: boolean;
}

export interface VerificationHistoryEntry {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED';
  actionDate: string;
  actedBy: string;
  reason?: string;
  notes?: string;
}

export interface AdminFarmerRecord {
  id: string;
  userId?: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  avatar: string;
  farmName: string;
  location: string;
  city: string;
  state: string;
  pincode: string;
  hub: string;
  farmingMethod: FarmingMethod | string;
  yearsFarming: number;
  acreage: number;
  mainCrops: string[];
  description: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  registeredAt: string;
  approvedAt?: string;
  approvedBy?: string;
  certifications: string[];
  documents: AdminDocument[];
  history: VerificationHistoryEntry[];
}

export const ADMIN_MOCK_FARMERS: AdminFarmerRecord[] = [
  {
    id: 'farmer-1',
    userId: 'user-farmer-1',
    name: 'Ravi Kumar Gowda',
    fullName: 'Ravi Kumar Gowda',
    email: 'ravi.gowda@greenvalley.in',
    phone: '+91 98450 12891',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    farmName: 'Green Valley Organic Estate',
    location: 'Sarjapur Agri Belt, Bengaluru Rural',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '562125',
    hub: 'Sarjapur Road',
    farmingMethod: 'Organic',
    yearsFarming: 14,
    acreage: 8.5,
    mainCrops: ['Country Tomatoes', 'Spinach', 'Baby Carrots', 'Bell Peppers'],
    description: 'Third-generation certified organic grower practicing Jeevamrutha enrichment and solar drip irrigation.',
    isVerified: true,
    verificationStatus: 'approved',
    registeredAt: '2024-03-15T09:30:00Z',
    approvedAt: '2024-03-18T14:20:00Z',
    approvedBy: 'Krishi Governance Admin (Priya M.)',
    certifications: ['Jaivik Bharat Certified', 'NPOP India Organic', 'SGS Soil Audit 2026'],
    documents: [
      {
        id: 'doc-101',
        name: 'Government Identity (Aadhaar)',
        type: 'GOVERNMENT_ID',
        fileName: 'ravi_aadhaar_card_masked.pdf',
        fileSize: '1.4 MB',
        uploadedAt: '2024-03-15T09:30:00Z',
        url: 'https://example.com/docs/ravi_aadhaar.pdf',
        verified: true,
      },
      {
        id: 'doc-102',
        name: 'Land Ownership RTC (Pahani Extract)',
        type: 'LAND_OWNERSHIP',
        fileName: 'karnataka_bhoomi_rtc_sarjapur_8.5ac.pdf',
        fileSize: '2.8 MB',
        uploadedAt: '2024-03-15T09:32:00Z',
        url: 'https://example.com/docs/ravi_rtc.pdf',
        verified: true,
      },
      {
        id: 'doc-103',
        name: 'Jaivik Bharat Organic Certificate',
        type: 'ORGANIC_CERTIFICATE',
        fileName: 'jaivik_bharat_cert_2026.pdf',
        fileSize: '3.1 MB',
        uploadedAt: '2024-03-15T09:35:00Z',
        url: 'https://example.com/docs/ravi_organic.pdf',
        verified: true,
      },
    ],
    history: [
      {
        id: 'h-101',
        status: 'PENDING',
        actionDate: '2024-03-15T09:30:00Z',
        actedBy: 'Farmer Self-Registration',
        notes: 'Submitted initial documentation and farm coordinates.',
      },
      {
        id: 'h-102',
        status: 'APPROVED',
        actionDate: '2024-03-18T14:20:00Z',
        actedBy: 'Krishi Governance Admin (Priya M.)',
        notes: 'Land records verified with Karnataka Bhoomi portal. Approved for immediate listing.',
      },
    ],
  },
  {
    id: 'farmer-2',
    userId: 'user-farmer-2',
    name: 'Anitha Reddy',
    fullName: 'Anitha Reddy',
    email: 'anitha@amritagreens.farm',
    phone: '+91 97410 44219',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    farmName: 'Amrita Permaculture Greens',
    location: 'Kanakapura Valley, South Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560062',
    hub: 'Jayanagar',
    farmingMethod: 'Natural (ZBNF)',
    yearsFarming: 9,
    acreage: 12.0,
    mainCrops: ['A2 Gir Cow Milk', 'Desi Eggs', 'Country Okra', 'Moringa Leaves'],
    description: 'Former tech engineer practicing natural zero-budget farming with 24 indigenous Gir cows.',
    isVerified: true,
    verificationStatus: 'approved',
    registeredAt: '2024-08-10T11:00:00Z',
    approvedAt: '2024-08-12T16:45:00Z',
    approvedBy: 'Krishi Governance Admin (Priya M.)',
    certifications: ['PGS-India Organic Green', 'FSSAI A2 Milk Certified'],
    documents: [
      {
        id: 'doc-201',
        name: 'Voter ID (Election Commission)',
        type: 'GOVERNMENT_ID',
        fileName: 'anitha_voter_card.pdf',
        fileSize: '890 KB',
        uploadedAt: '2024-08-10T11:00:00Z',
        url: 'https://example.com/docs/anitha_voter.pdf',
        verified: true,
      },
      {
        id: 'doc-202',
        name: 'Registered Farm Deed & RTC',
        type: 'LAND_OWNERSHIP',
        fileName: 'kanakapura_deed_12ac.pdf',
        fileSize: '4.2 MB',
        uploadedAt: '2024-08-10T11:05:00Z',
        url: 'https://example.com/docs/anitha_deed.pdf',
        verified: true,
      },
    ],
    history: [
      {
        id: 'h-201',
        status: 'PENDING',
        actionDate: '2024-08-10T11:00:00Z',
        actedBy: 'Farmer Self-Registration',
      },
      {
        id: 'h-202',
        status: 'APPROVED',
        actionDate: '2024-08-12T16:45:00Z',
        actedBy: 'Krishi Governance Admin (Priya M.)',
        notes: 'ZBNF inspection verified by field agent. Dairy license attached.',
      },
    ],
  },
  {
    id: 'farmer-pending-1',
    userId: 'user-farmer-pending-1',
    name: 'Siddaramaiah K. Pujar',
    fullName: 'Siddaramaiah K. Pujar',
    email: 'siddaramaiah.pujar@bengalurufarms.in',
    phone: '+91 94490 88214',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    farmName: 'Pujar Natural Agro Orchards',
    location: 'Devanahalli Airport Fringe, North Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '562110',
    hub: 'Yelahanka',
    farmingMethod: 'Natural (ZBNF)',
    yearsFarming: 18,
    acreage: 6.2,
    mainCrops: ['Devanahalli Pomelo (GI)', 'Custard Apples', 'Organic Guava'],
    description: 'Horticulturist preserving the geographical indication Devanahalli Pomelo and heirloom dryland fruits.',
    isVerified: false,
    verificationStatus: 'pending',
    registeredAt: '2026-09-26T14:15:00Z',
    certifications: ['Devanahalli Pomelo GI Registry #314'],
    documents: [
      {
        id: 'doc-301',
        name: 'Government Identity (Aadhaar)',
        type: 'GOVERNMENT_ID',
        fileName: 'siddaramaiah_aadhaar.pdf',
        fileSize: '1.2 MB',
        uploadedAt: '2026-09-26T14:15:00Z',
        url: 'https://example.com/docs/siddaramaiah_aadhaar.pdf',
        verified: false,
      },
      {
        id: 'doc-302',
        name: 'Bhoomi RTC Land Record',
        type: 'LAND_OWNERSHIP',
        fileName: 'devanahalli_pahani_survey_89.pdf',
        fileSize: '2.4 MB',
        uploadedAt: '2026-09-26T14:18:00Z',
        url: 'https://example.com/docs/siddaramaiah_rtc.pdf',
        verified: false,
      },
      {
        id: 'doc-303',
        name: 'Farm Geo-tagged Photograph',
        type: 'FARM_PHOTO',
        fileName: 'devanahalli_orchard_geotag.jpg',
        fileSize: '3.6 MB',
        uploadedAt: '2026-09-26T14:20:00Z',
        url: 'https://example.com/docs/siddaramaiah_farm.jpg',
        verified: false,
      },
    ],
    history: [
      {
        id: 'h-301',
        status: 'PENDING',
        actionDate: '2026-09-26T14:15:00Z',
        actedBy: 'Farmer Self-Registration',
        notes: 'Awaiting administrative verification of RTC survey number.',
      },
    ],
  },
  {
    id: 'farmer-rejected-1',
    userId: 'user-farmer-rejected-1',
    name: 'Mahesh Babu Naidu',
    fullName: 'Mahesh Babu Naidu',
    email: 'mahesh.naidu@bellaryfields.org',
    phone: '+91 98440 33119',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    farmName: 'Naidu Agro Traders & Farms',
    location: 'Bellary Rural Sector 4',
    city: 'Bellary',
    state: 'Karnataka',
    pincode: '583101',
    hub: 'Bellary Central',
    farmingMethod: 'Conventional',
    yearsFarming: 2,
    acreage: 1.5,
    mainCrops: ['Hybrid Tomatoes', 'Chilli'],
    description: 'Commercial trader applying for direct retail consumer marketplace access.',
    isVerified: false,
    verificationStatus: 'rejected',
    rejectionReason: 'Land ownership certificate or RTC extract was illegible. Coordinates are outside Bengaluru delivery cluster.',
    registeredAt: '2026-09-20T10:00:00Z',
    approvedAt: '2026-09-22T11:30:00Z',
    approvedBy: 'Krishi Governance Admin (Priya M.)',
    certifications: [],
    documents: [
      {
        id: 'doc-401',
        name: 'Government Identity (PAN Card)',
        type: 'GOVERNMENT_ID',
        fileName: 'mahesh_pan_blurry.pdf',
        fileSize: '512 KB',
        uploadedAt: '2026-09-20T10:00:00Z',
        url: 'https://example.com/docs/mahesh_pan.pdf',
        verified: false,
      },
    ],
    history: [
      {
        id: 'h-401',
        status: 'PENDING',
        actionDate: '2026-09-20T10:00:00Z',
        actedBy: 'Farmer Self-Registration',
      },
      {
        id: 'h-402',
        status: 'REJECTED',
        actionDate: '2026-09-22T11:30:00Z',
        actedBy: 'Krishi Governance Admin (Priya M.)',
        reason: 'Land ownership certificate or RTC extract was illegible. Coordinates are outside Bengaluru delivery cluster.',
        notes: 'Trader intermediary without valid organic direct farm registration.',
      },
    ],
  },
];

// ============================================================================
// ADMIN PLATFORM METRICS
// ============================================================================

export interface AdminPlatformMetrics {
  totalFarmers: number;
  pendingVerification: number;
  approvedFarmers: number;
  rejectedFarmers: number;
  totalConsumers: number;
  totalProducts: number;
  activeOrders: number;
  totalRevenue: number;
  pendingPayouts: number;
  totalPaidOut: number;
  gmvMonthly: number;
  fulfillmentRate: number;
  onTimeRate: number;
}

export const ADMIN_METRICS: AdminPlatformMetrics = {
  totalFarmers: 38,
  pendingVerification: 4,
  approvedFarmers: 31,
  rejectedFarmers: 3,
  totalConsumers: 3420,
  totalProducts: 142,
  activeOrders: 28,
  totalRevenue: 1140000, // ₹11.4 Lakh
  pendingPayouts: 34250, // ₹34,250
  totalPaidOut: 855000, // ₹8.55 Lakh
  gmvMonthly: 284000,
  fulfillmentRate: 98.6,
  onTimeRate: 97.8,
};

// ============================================================================
// ADMIN CHARTS DATA (ORDERS, REVENUE, FARMERS, CATEGORIES)
// ============================================================================

export const ADMIN_REVENUE_OVER_TIME = [
  { month: 'Apr', revenue: 640000, orders: 3200, payouts: 480000 },
  { month: 'May', revenue: 780000, orders: 3950, payouts: 585000 },
  { month: 'Jun', revenue: 890000, orders: 4400, payouts: 667500 },
  { month: 'Jul', revenue: 950000, orders: 4700, payouts: 712500 },
  { month: 'Aug', revenue: 1040000, orders: 5120, payouts: 780000 },
  { month: 'Sep', revenue: 1140000, orders: 5400, payouts: 855000 },
];

export const ADMIN_FARMER_REGISTRATIONS_CHART = [
  { month: 'Apr', registered: 6, approved: 5 },
  { month: 'May', registered: 9, approved: 8 },
  { month: 'Jun', registered: 12, approved: 10 },
  { month: 'Jul', registered: 15, approved: 13 },
  { month: 'Aug', registered: 22, approved: 19 },
  { month: 'Sep', registered: 28, approved: 24 },
];

export const ADMIN_CATEGORY_DISTRIBUTION = [
  { name: 'Vegetables', count: 58, value: 41, color: '#1B4332' },
  { name: 'Fruits', count: 32, value: 23, color: '#2D6A4F' },
  { name: 'Greens & Herbs', count: 24, value: 17, color: '#40916C' },
  { name: 'Dairy & Eggs', count: 16, value: 11, color: '#52B788' },
  { name: 'Grains & Pulses', count: 12, value: 8, color: '#74C69D' },
];

export const ADMIN_CONSUMER_GROWTH_CHART = [
  { month: 'Apr', consumers: 1420, activeDaily: 340 },
  { month: 'May', consumers: 1890, activeDaily: 480 },
  { month: 'Jun', consumers: 2310, activeDaily: 620 },
  { month: 'Jul', consumers: 2750, activeDaily: 760 },
  { month: 'Aug', consumers: 3100, activeDaily: 890 },
  { month: 'Sep', consumers: 3420, activeDaily: 1040 },
];

export const ADMIN_DELIVERY_PERFORMANCE_CHART = [
  { day: 'Mon', onTime: 98, delayed: 2, totalBatches: 18 },
  { day: 'Tue', onTime: 97, delayed: 3, totalBatches: 22 },
  { day: 'Wed', onTime: 99, delayed: 1, totalBatches: 20 },
  { day: 'Thu', onTime: 96, delayed: 4, totalBatches: 24 },
  { day: 'Fri', onTime: 98, delayed: 2, totalBatches: 26 },
  { day: 'Sat', onTime: 95, delayed: 5, totalBatches: 34 },
  { day: 'Sun', onTime: 97, delayed: 3, totalBatches: 30 },
];

// ============================================================================
// ADMIN RECENT ACTIVITY & DASHBOARD LOGS
// ============================================================================

export interface AdminActivityItem {
  id: string;
  type: 'FARMER_REGISTRATION' | 'ORDER_FULFILLED' | 'DISPUTE_OPENED' | 'PAYOUT_PROCESSED' | 'QUALITY_ALERT';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  badge: {
    label: string;
    variant: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';
  };
}

export const ADMIN_RECENT_ACTIVITIES: AdminActivityItem[] = [
  {
    id: 'act-1',
    type: 'PAYOUT_PROCESSED',
    title: 'Bi-Weekly Farmer Payout Settled',
    description: 'Settled ₹42,500 across 6 approved growers in Sarjapur & HSR clusters.',
    timestamp: '15 mins ago',
    actor: 'Krishi Automated Finance Bot',
    badge: { label: 'Finance', variant: 'emerald' },
  },
  {
    id: 'act-2',
    type: 'FARMER_REGISTRATION',
    title: 'New Organic Grower Application',
    description: 'Siddaramaiah K. Pujar submitted Pahani RTC for Devanahalli GI Pomelo farm.',
    timestamp: '1 hour ago',
    actor: 'Devanahalli Portal',
    badge: { label: 'Verification', variant: 'amber' },
  },
  {
    id: 'act-3',
    type: 'ORDER_FULFILLED',
    title: 'Dawn Batch Delivery #DB-102 Complete',
    description: 'All 4 consumer orders delivered across HSR Sector 2 with 100% on-time rating.',
    timestamp: '2 hours ago',
    actor: 'Rider Manjunath G.',
    badge: { label: 'Fulfillment', variant: 'blue' },
  },
  {
    id: 'act-4',
    type: 'DISPUTE_OPENED',
    title: 'Quality Dispute Reported',
    description: 'Arun Bhat reported outer seal detached on Bangalore Blue Grapes pack.',
    timestamp: '3 hours ago',
    actor: 'Customer Arun Bhat',
    badge: { label: 'Dispute', variant: 'rose' },
  },
  {
    id: 'act-5',
    type: 'QUALITY_ALERT',
    title: 'Freshness Index Verified',
    description: 'Harvest Batch HAR-20260927-01 clocked peak freshness score of 98%.',
    timestamp: '5 hours ago',
    actor: 'Cold-Chain Telemetry',
    badge: { label: 'Quality', variant: 'emerald' },
  },
];

// ============================================================================
// ADMIN PRODUCT CATALOG EXTENSIONS
// ============================================================================

export interface AdminProductRecord {
  id: string;
  name: string;
  category: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  location: string;
  price: number;
  unit: string;
  stock: number;
  isOrganic: boolean;
  farmingMethod: string;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT' | 'SUSPENDED' | 'EXPIRED' | string;
  freshnessScore: number;
  harvestBatchId?: string;
  harvestDate?: string;
  traceUrl?: string;
  isSurplus?: boolean;
  surplusDiscount?: number;
  images: string[];
  createdAt: string;
  // Extended detailed fields from PostgreSQL Product, Farmer & InventoryItem
  description?: string;
  shelfLifeDays?: number;
  expectedFreshnessDuration?: string;
  nutritionHighlights?: string[];
  currentStock?: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  soldQuantity?: number;
  lowStockThreshold?: number;
  inventoryStatus?: string;
  inventoryExists?: boolean;
  farmerVerificationStatus?: string;
  farmerCity?: string;
  farmerState?: string;
  farmerHub?: string;
}

export const ADMIN_MOCK_PRODUCTS: AdminProductRecord[] = [
  {
    id: 'prod-1',
    name: 'Country Nati Tomatoes',
    category: 'Vegetables',
    farmerId: 'farmer-1',
    farmerName: 'Ravi Kumar Gowda',
    farmName: 'Green Valley Organic Estate',
    location: 'Sarjapur Road, Bengaluru',
    price: 52,
    unit: '1 kg',
    stock: 85,
    isOrganic: true,
    farmingMethod: 'Organic',
    status: 'ACTIVE',
    freshnessScore: 98,
    harvestBatchId: 'HAR-20260927-01',
    harvestDate: '2026-09-27',
    traceUrl: '/trace/HAR-20260927-01',
    isSurplus: false,
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
    createdAt: '2024-04-10T08:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Hydroponic English Cucumbers',
    category: 'Vegetables',
    farmerId: 'farmer-4',
    farmerName: 'Deepak & Sandhya Verma',
    farmName: 'HydroLeaf Urban Agrotech',
    location: 'Electronic City, Bengaluru',
    price: 75,
    unit: '500 g',
    stock: 40,
    isOrganic: true,
    farmingMethod: 'Hydroponic',
    status: 'ACTIVE',
    freshnessScore: 96,
    harvestBatchId: 'HAR-20260927-04',
    harvestDate: '2026-09-27',
    traceUrl: '/trace/HAR-20260927-04',
    isSurplus: true,
    surplusDiscount: 20,
    images: ['https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=600&q=80'],
    createdAt: '2024-05-14T09:15:00Z',
  },
  {
    id: 'prod-3',
    name: 'Bangalore Blue Grapes (GI Tagged)',
    category: 'Fruits',
    farmerId: 'farmer-3',
    farmerName: 'Mallikarjun Patil',
    farmName: 'Sahyadri Highlands Orchard',
    location: 'Doddaballapura, Bengaluru',
    price: 110,
    unit: '500 g',
    stock: 25,
    isOrganic: true,
    farmingMethod: 'Regenerative',
    status: 'ACTIVE',
    freshnessScore: 92,
    harvestBatchId: 'HAR-20260926-02',
    harvestDate: '2026-09-26',
    traceUrl: '/trace/HAR-20260926-02',
    isSurplus: false,
    images: ['https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=600&q=80'],
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Tender Baby Palak (Spinach)',
    category: 'Greens & Herbs',
    farmerId: 'farmer-1',
    farmerName: 'Ravi Kumar Gowda',
    farmName: 'Green Valley Organic Estate',
    location: 'Sarjapur Road, Bengaluru',
    price: 35,
    unit: '250 g bunch',
    stock: 0,
    isOrganic: true,
    farmingMethod: 'Organic',
    status: 'OUT_OF_STOCK',
    freshnessScore: 90,
    harvestBatchId: 'HAR-20260925-08',
    harvestDate: '2026-09-25',
    isSurplus: false,
    images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'],
    createdAt: '2024-04-12T07:30:00Z',
  },
  {
    id: 'prod-5',
    name: 'A2 Gir Cow Farm Fresh Milk',
    category: 'Dairy & Eggs',
    farmerId: 'farmer-2',
    farmerName: 'Anitha Reddy',
    farmName: 'Amrita Permaculture Greens',
    location: 'Kanakapura Road, Bengaluru',
    price: 90,
    unit: '1 Litre bottle',
    stock: 60,
    isOrganic: true,
    farmingMethod: 'Natural (ZBNF)',
    status: 'ACTIVE',
    freshnessScore: 100,
    harvestBatchId: 'HAR-20260927-09',
    harvestDate: '2026-09-27',
    traceUrl: '/trace/HAR-20260927-09',
    isSurplus: false,
    images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'],
    createdAt: '2024-08-15T06:00:00Z',
  },
];

// ============================================================================
// ADMIN ORDERS MOCK DATA
// ============================================================================

export interface AdminOrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: {
    addressLine: string;
    city: string;
    hub: string;
    pincode: string;
    state?: string;
  };
  deliverySlot: {
    name: string;
    timeRange: string;
    description?: string;
  };
  farmerId: string;
  farmerName: string;
  farmName: string;
  items: Array<{
    id: string;
    productId?: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    farmerId?: string;
    farmerName?: string;
    farmName?: string;
    farmerShare?: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  farmerEarnings: number;
  total: number;
  paymentMethod: 'UPI' | 'Card' | 'Cash on Delivery' | string;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | string;
  status: OrderStatus | string;
  orderStatus?: string;
  deliveryBatchId?: string | null;
  deliveryBatch?: {
    id: string;
    batchCode: string;
    hubArea: string;
    deliverySlot: string;
    status: string;
    riderName?: string | null;
    riderPhone?: string | null;
    riderVehicle?: string | null;
    estimatedDistanceKm?: number | null;
    estimatedDeliveryTime?: string | null;
  } | null;
  createdAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string | null;
  timeline: Array<{
    status: string;
    title: string;
    description: string;
    timestamp: string;
    completed: boolean;
    isCompleted?: boolean;
    current?: boolean;
    isCurrent?: boolean;
  }>;
}

export const ADMIN_MOCK_ORDERS: AdminOrderRecord[] = [
  {
    id: 'ord-101',
    orderNumber: 'KM-20260927-1042',
    customerId: 'consumer-1',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98450 12345',
    customerEmail: 'ananya.sharma@example.com',
    deliveryAddress: {
      addressLine: 'Flat 402, Green Glen Layout, Outer Ring Road',
      city: 'Bengaluru',
      hub: 'HSR Layout',
      pincode: '560102',
    },
    deliverySlot: {
      name: 'Morning Fresh Harvest',
      timeRange: '7:00 AM – 10:30 AM',
    },
    farmerId: 'farmer-1',
    farmerName: 'Ravi Kumar Gowda',
    farmName: 'Green Valley Organic Estate',
    items: [
      {
        id: 'item-1',
        productName: 'Country Nati Tomatoes',
        quantity: 2,
        unit: '1 kg',
        unitPrice: 52,
        totalPrice: 104,
      },
      {
        id: 'item-2',
        productName: 'Hydroponic English Cucumbers',
        quantity: 1,
        unit: '500 g',
        unitPrice: 75,
        totalPrice: 75,
      },
    ],
    subtotal: 179,
    deliveryFee: 0,
    platformFee: 18,
    farmerEarnings: 134.25,
    total: 197,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'delivered',
    deliveryBatchId: 'DB-102',
    createdAt: '2026-09-27T06:15:00Z',
    timeline: [
      {
        status: 'placed',
        title: 'Order Placed',
        description: 'Order placed by consumer via UPI',
        timestamp: '06:15 AM',
        completed: true,
      },
      {
        status: 'confirmed',
        title: 'Confirmed by Farmer',
        description: 'Green Valley confirmed farm inventory availability',
        timestamp: '06:30 AM',
        completed: true,
      },
      {
        status: 'packed',
        title: 'Crate Packed & Temperature Logged',
        description: 'Vegetables packed in reusable crates with QR tags',
        timestamp: '07:15 AM',
        completed: true,
      },
      {
        status: 'out_for_delivery',
        title: 'Out for Delivery (Batch #DB-102)',
        description: 'Rider Manjunath G. en route to HSR Sector 2',
        timestamp: '08:00 AM',
        completed: true,
      },
      {
        status: 'delivered',
        title: 'Delivered to Doorstep',
        description: 'Handed over directly to customer with zero transit delay',
        timestamp: '08:45 AM',
        completed: true,
      },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: 'KM-20260927-1043',
    customerId: 'consumer-2',
    customerName: 'Raghavan Iyer',
    customerPhone: '+91 97420 55431',
    customerEmail: 'raghavan.iyer@example.com',
    deliveryAddress: {
      addressLine: 'Villa 12, Sobha Classic, Haralur Road',
      city: 'Bengaluru',
      hub: 'Sarjapur Road',
      pincode: '560103',
    },
    deliverySlot: {
      name: 'Morning Fresh Harvest',
      timeRange: '7:00 AM – 10:30 AM',
    },
    farmerId: 'farmer-2',
    farmerName: 'Anitha Reddy',
    farmName: 'Amrita Permaculture Greens',
    items: [
      {
        id: 'item-3',
        productName: 'A2 Gir Cow Farm Fresh Milk',
        quantity: 2,
        unit: '1 Litre bottle',
        unitPrice: 90,
        totalPrice: 180,
      },
    ],
    subtotal: 180,
    deliveryFee: 25,
    platformFee: 18,
    farmerEarnings: 135.0,
    total: 223,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'out_for_delivery',
    deliveryBatchId: 'DB-104',
    createdAt: '2026-09-27T06:45:00Z',
    timeline: [
      {
        status: 'placed',
        title: 'Order Placed',
        description: 'Order placed by consumer via UPI',
        timestamp: '06:45 AM',
        completed: true,
      },
      {
        status: 'confirmed',
        title: 'Confirmed by Farmer',
        description: 'Amrita Greens morning milking completed',
        timestamp: '07:05 AM',
        completed: true,
      },
      {
        status: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Dispatched with insulated cold-box',
        timestamp: '08:30 AM',
        completed: true,
      },
    ],
  },
  {
    id: 'ord-103',
    orderNumber: 'KM-20260927-1044',
    customerId: 'consumer-3',
    customerName: 'Sneha Chawla',
    customerPhone: '+91 99880 77123',
    customerEmail: 'sneha.c@example.com',
    deliveryAddress: {
      addressLine: 'Apt 501, Raheja Residency, 3rd Block',
      city: 'Bengaluru',
      hub: 'Koramangala',
      pincode: '560034',
    },
    deliverySlot: {
      name: 'Midday Delivery',
      timeRange: '12:00 PM – 3:30 PM',
    },
    farmerId: 'farmer-3',
    farmerName: 'Mallikarjun Patil',
    farmName: 'Sahyadri Highlands Orchard',
    items: [
      {
        id: 'item-4',
        productName: 'Bangalore Blue Grapes (GI Tagged)',
        quantity: 3,
        unit: '500 g',
        unitPrice: 110,
        totalPrice: 330,
      },
    ],
    subtotal: 330,
    deliveryFee: 0,
    platformFee: 33,
    farmerEarnings: 247.5,
    total: 363,
    paymentMethod: 'Card',
    paymentStatus: 'PAID',
    status: 'packed',
    deliveryBatchId: 'DB-103',
    createdAt: '2026-09-27T08:10:00Z',
    timeline: [
      {
        status: 'placed',
        title: 'Order Placed',
        description: 'Consumer order placed via credit card',
        timestamp: '08:10 AM',
        completed: true,
      },
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Vineyard harvest lot verified',
        timestamp: '08:40 AM',
        completed: true,
      },
      {
        status: 'packed',
        title: 'Quality Packaging Complete',
        description: 'Ventilated grape punnets secured in crate',
        timestamp: '09:30 AM',
        completed: true,
      },
    ],
  },
];

// ============================================================================
// ADMIN SALES & PAYOUTS
// ============================================================================

export interface AdminSaleRecord {
  id: string;
  saleCode: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  farmerPhone?: string | null;
  farmerEmail?: string | null;
  orderId: string;
  orderNumber: string;
  orderStatus?: string | null;
  orderPaymentStatus?: string | null;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  grossAmount: number;
  platformFee: number;
  revenue: number; // 75% farmer direct share
  status: 'COMPLETED' | 'PENDING_PAYOUT' | 'PAID_OUT' | 'REFUNDED';
  payoutDate?: string | null;
  transactionReference?: string | null;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    beneficiary: string;
  };
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ADMIN_MOCK_SALES: AdminSaleRecord[] = [
  {
    id: 'sale-101',
    saleCode: 'SALE-20260927-9912',
    farmerId: 'farmer-1',
    farmerName: 'Ravi Kumar Gowda',
    farmName: 'Green Valley Organic Estate',
    orderId: 'ord-101',
    orderNumber: 'KM-20260927-1042',
    productName: 'Country Nati Tomatoes',
    category: 'Vegetables',
    quantity: 2,
    unit: '1 kg',
    unitPrice: 52,
    grossAmount: 104,
    platformFee: 26,
    revenue: 78.0,
    status: 'PAID_OUT',
    payoutDate: '2026-09-27T12:30:00Z',
    transactionReference: 'NEFT-ICICI-9948210384',
    bankDetails: {
      accountNumber: '••••••••8912',
      ifsc: 'ICIC0001892',
      bankName: 'ICICI Bank Sarjapur',
      beneficiary: 'Ravi Kumar Gowda',
    },
    date: '2026-09-27',
  },
  {
    id: 'sale-102',
    saleCode: 'SALE-20260927-9913',
    farmerId: 'farmer-4',
    farmerName: 'Deepak & Sandhya Verma',
    farmName: 'HydroLeaf Urban Agrotech',
    orderId: 'ord-101',
    orderNumber: 'KM-20260927-1042',
    productName: 'Hydroponic English Cucumbers',
    category: 'Vegetables',
    quantity: 1,
    unit: '500 g',
    unitPrice: 75,
    grossAmount: 75,
    platformFee: 18.75,
    revenue: 56.25,
    status: 'PENDING_PAYOUT',
    payoutDate: null,
    transactionReference: null,
    bankDetails: {
      accountNumber: '••••••••4431',
      ifsc: 'HDFC0000240',
      bankName: 'HDFC Bank Electronic City',
      beneficiary: 'Deepak Verma',
    },
    date: '2026-09-27',
  },
  {
    id: 'sale-103',
    saleCode: 'SALE-20260926-8841',
    farmerId: 'farmer-2',
    farmerName: 'Anitha Reddy',
    farmName: 'Amrita Permaculture Greens',
    orderId: 'ord-098',
    orderNumber: 'KM-20260926-0912',
    productName: 'A2 Gir Cow Farm Fresh Milk',
    category: 'Dairy & Eggs',
    quantity: 4,
    unit: '1 Litre bottle',
    unitPrice: 90,
    grossAmount: 360,
    platformFee: 90,
    revenue: 270.0,
    status: 'PAID_OUT',
    payoutDate: '2026-09-26T18:00:00Z',
    transactionReference: 'IMPS-SBI-772910398',
    bankDetails: {
      accountNumber: '••••••••3198',
      ifsc: 'SBIN0004012',
      bankName: 'State Bank of India Kanakapura',
      beneficiary: 'Anitha Reddy',
    },
    date: '2026-09-26',
  },
  {
    id: 'sale-104',
    saleCode: 'SALE-20260925-7732',
    farmerId: 'farmer-3',
    farmerName: 'Mallikarjun Patil',
    farmName: 'Sahyadri Highlands Orchard',
    orderId: 'ord-091',
    orderNumber: 'KM-20260925-0811',
    productName: 'Bangalore Blue Grapes (GI Tagged)',
    category: 'Fruits',
    quantity: 5,
    unit: '500 g',
    unitPrice: 110,
    grossAmount: 550,
    platformFee: 137.5,
    revenue: 412.5,
    status: 'PENDING_PAYOUT',
    payoutDate: null,
    transactionReference: null,
    bankDetails: {
      accountNumber: '••••••••6012',
      ifsc: 'CNRB0001092',
      bankName: 'Canara Bank Doddaballapura',
      beneficiary: 'Mallikarjun Patil',
    },
    date: '2026-09-25',
  },
];

// ============================================================================
// ADMIN DISPUTES EXTENSIONS
// ============================================================================

export interface AdminDisputeRecord {
  id: string;
  disputeNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  productName: string;
  amount: number;
  reason: string;
  description: string;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Rejected' | 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  rawStatus?: string;
  resolutionNote?: string | null;
  resolution?: string | null;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  order?: {
    id?: string;
    orderNumber?: string;
    status?: string;
    paymentStatus?: string;
    total?: number;
    date?: string | null;
  };
  timeline: Array<{
    stage: string;
    note: string;
    timestamp: string;
    actor: string;
  }>;
}

export const ADMIN_MOCK_DISPUTES: AdminDisputeRecord[] = [
  {
    id: 'disp-1',
    disputeNumber: 'DISP-8901',
    orderId: 'ord-090',
    orderNumber: 'KM-20260917-0612',
    customerId: 'consumer-4',
    customerName: 'Rajesh Nair',
    customerEmail: 'rajesh.nair@example.com',
    customerPhone: '+91 98451 99281',
    farmerId: 'farmer-1',
    farmerName: 'Ravi Kumar Gowda',
    farmName: 'Green Valley Organic Estate',
    productName: 'Country Nati Tomatoes',
    reason: 'Transit bruising on 2 tomatoes due to monsoon potholes',
    amount: 52,
    date: '2026-09-17',
    status: 'Resolved',
    description: 'Customer received 1kg pack where two tomatoes sustained bruising along the bottom crate seam during transit.',
    resolutionNote: 'Issued 50% credit (₹26) to consumer wallet. Farmer upgraded to honeycomb cardboard spacers.',
    timeline: [
      {
        stage: 'Dispute Filed',
        note: 'Customer uploaded photo of bruised tomatoes.',
        timestamp: '2026-09-17 09:30 AM',
        actor: 'Rajesh Nair (Customer)',
      },
      {
        stage: 'Review Started',
        note: 'Governance team contacted grower Ravi Kumar.',
        timestamp: '2026-09-17 11:15 AM',
        actor: 'Support Agent (Priya M.)',
      },
      {
        stage: 'Resolved',
        note: 'Wallet credit dispatched. Case closed.',
        timestamp: '2026-09-17 01:20 PM',
        actor: 'Support Lead',
      },
    ],
  },
  {
    id: 'disp-2',
    disputeNumber: 'DISP-8902',
    orderId: 'ord-095',
    orderNumber: 'KM-20260921-0988',
    customerId: 'consumer-3',
    customerName: 'Sneha Chawla',
    customerEmail: 'sneha.c@example.com',
    customerPhone: '+91 99880 77123',
    farmerId: 'farmer-5',
    farmerName: 'Gururaj Kulkarni',
    farmName: 'Sahyadri Organic Millets',
    productName: 'Unpolished Chana Dal',
    reason: 'Delayed slot arrival by 45 minutes',
    amount: 125,
    date: '2026-09-21',
    status: 'Under Review',
    description: 'EV delivery van suffered a puncture near Hoskote flyover. Arrival slipped past slot by 45 minutes.',
    timeline: [
      {
        stage: 'Dispute Filed',
        note: 'Customer flagged delivery arrival at 11:15 AM vs 10:30 AM slot.',
        timestamp: '2026-09-21 11:30 AM',
        actor: 'Sneha Chawla',
      },
      {
        stage: 'Under Review',
        note: 'Hub logistics lead verifying GPS puncture telemetry.',
        timestamp: '2026-09-21 12:00 PM',
        actor: 'Hub Manager (Arun K.)',
      },
    ],
  },
  {
    id: 'disp-3',
    disputeNumber: 'DISP-8903',
    orderId: 'ord-099',
    orderNumber: 'KM-20260921-1102',
    customerId: 'consumer-5',
    customerName: 'Arun Bhat',
    customerEmail: 'arun.bhat@example.com',
    customerPhone: '+91 98459 33210',
    farmerId: 'farmer-3',
    farmerName: 'Mallikarjun Patil',
    farmName: 'Sahyadri Highlands Orchard',
    productName: 'Bangalore Blue Grapes (GI Tagged)',
    reason: 'Package seal was partially torn during transit inspection',
    amount: 110,
    date: '2026-09-21',
    status: 'Open',
    description: 'Outer tamper-evident adhesive tape had detached during transit inspection at Doddaballapura hub.',
    timeline: [
      {
        stage: 'Dispute Opened',
        note: 'Customer requested verification of fruit freshness seal.',
        timestamp: '2026-09-21 03:45 PM',
        actor: 'Arun Bhat',
      },
    ],
  },
];

// ============================================================================
// ADMIN DELIVERY BATCHES
// ============================================================================

export interface AdminDeliveryBatchOrder {
  id: string;
  rawId?: string;
  orderNumber: string;
  status: string;
  orderStatus?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: {
    addressLine: string;
    hub: string;
    city: string;
    pincode: string;
    state?: string;
  };
  deliverySlot: {
    name: string;
    timeRange: string;
  };
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    productId?: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    farmerId?: string;
    farmerName: string;
    farmName: string;
  }>;
}

export interface AdminDeliveryBatchRecord {
  id: string;
  batchCode: string;
  hub: string;
  hubArea?: string;
  deliverySlot: string;
  ordersCount: number;
  orderNumbers: string[];
  orders?: AdminDeliveryBatchOrder[];
  totalQuantity: string;
  totalQuantityNumber?: number;
  riderName: string;
  riderPhone: string;
  riderVehicle: string;
  estimatedDistanceKm: number;
  estimatedDuration: string;
  estimatedDeliveryTime?: string;
  status:
    | 'PENDING'
    | 'PREPARING'
    | 'READY'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'CREATED'
    | 'PACKING'
    | 'READY_FOR_PICKUP'
    | 'DISPATCHED'
    | string;
  rawStatus?: string;
  productsSummary?: string | null;
  createdAt: string;
  updatedAt?: string;
  timeline: Array<{
    id?: string;
    status: string;
    label: string;
    timestamp: string;
    rawTimestamp?: string | null;
    completed: boolean;
    current?: boolean;
    isCompleted?: boolean;
    isCurrent?: boolean;
  }>;
}

export const ADMIN_MOCK_DELIVERIES: AdminDeliveryBatchRecord[] = [
  {
    id: 'batch-101',
    batchCode: 'DB-102',
    hub: 'HSR Layout',
    deliverySlot: '8:00 AM – 11:00 AM (Morning)',
    ordersCount: 4,
    orderNumbers: ['KM-20260927-1042', 'KM-1024', 'KM-1026', 'KM-1027'],
    totalQuantity: '20 kg',
    riderName: 'Manjunath G.',
    riderPhone: '+91 98450 11992',
    riderVehicle: 'Ather Cargo EV (KA-01-EV-3412)',
    estimatedDistanceKm: 8.4,
    estimatedDuration: '45 mins',
    status: 'DELIVERED',
    createdAt: '2026-09-27T06:30:00Z',
    timeline: [
      { status: 'CREATED', label: 'Batch Formed from Confirmed Orders', timestamp: '06:30 AM', completed: true },
      { status: 'PACKING', label: 'Crops Consolidated at HSR Hub', timestamp: '07:15 AM', completed: true },
      { status: 'READY_FOR_PICKUP', label: 'Quality Audit Cleared', timestamp: '07:45 AM', completed: true },
      { status: 'DISPATCHED', label: 'Out for Delivery on Route #4', timestamp: '08:00 AM', completed: true },
      { status: 'DELIVERED', label: 'All 4 Stops Successfully Completed', timestamp: '08:45 AM', completed: true },
    ],
  },
  {
    id: 'batch-102',
    batchCode: 'DB-103',
    hub: 'Koramangala',
    deliverySlot: '12:00 PM – 3:30 PM (Midday)',
    ordersCount: 2,
    orderNumbers: ['KM-20260927-1044', 'KM-1025'],
    totalQuantity: '8 kg',
    riderName: 'Praveen Kumar',
    riderPhone: '+91 97410 88219',
    riderVehicle: 'Yulu Wynn Cargo (KA-03-EX-9921)',
    estimatedDistanceKm: 5.6,
    estimatedDuration: '30 mins',
    status: 'READY_FOR_PICKUP',
    createdAt: '2026-09-27T07:10:00Z',
    timeline: [
      { status: 'CREATED', label: 'Batch Formed', timestamp: '07:10 AM', completed: true },
      { status: 'PACKING', label: 'Sorting Midday Produce', timestamp: '08:30 AM', completed: true },
      { status: 'READY_FOR_PICKUP', label: 'Ready for Rider Handover', timestamp: '11:15 AM', completed: true },
      { status: 'DISPATCHED', label: 'Dispatched to Route', timestamp: 'Pending', completed: false },
      { status: 'DELIVERED', label: 'Delivered', timestamp: 'Pending', completed: false },
    ],
  },
  {
    id: 'batch-103',
    batchCode: 'DB-104',
    hub: 'Sarjapur Road',
    deliverySlot: '8:00 AM – 11:00 AM (Morning)',
    ordersCount: 3,
    orderNumbers: ['KM-20260927-1043', 'KM-1018', 'KM-1019'],
    totalQuantity: '14 kg',
    riderName: 'Raghuveer Singh',
    riderPhone: '+91 99002 44102',
    riderVehicle: 'Hero Electric Nyx (KA-51-AB-1082)',
    estimatedDistanceKm: 11.2,
    estimatedDuration: '55 mins',
    status: 'DISPATCHED',
    createdAt: '2026-09-27T06:50:00Z',
    timeline: [
      { status: 'CREATED', label: 'Batch Formed', timestamp: '06:50 AM', completed: true },
      { status: 'PACKING', label: 'Cold-chain Insulated Pack', timestamp: '07:30 AM', completed: true },
      { status: 'READY_FOR_PICKUP', label: 'Picked Up by Rider', timestamp: '08:15 AM', completed: true },
      { status: 'DISPATCHED', label: 'En Route to Haralur & Bellandur', timestamp: '08:30 AM', completed: true },
      { status: 'DELIVERED', label: 'Delivered', timestamp: 'Pending', completed: false },
    ],
  },
];

// ============================================================================
// ADMIN NOTIFICATIONS
// ============================================================================

export interface AdminNotificationRecord {
  id: string;
  category: 'verification' | 'orders' | 'disputes' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  priority: 'low' | 'medium' | 'high';
}

export const ADMIN_MOCK_NOTIFICATIONS: AdminNotificationRecord[] = [
  {
    id: 'n-1',
    category: 'verification',
    title: 'New Farmer Verification Request',
    message: 'Siddaramaiah K. Pujar submitted Pahani RTC for Devanahalli GI Pomelo orchard.',
    timestamp: '25 mins ago',
    isRead: false,
    link: '/admin/farmers/farmer-pending-1',
    priority: 'high',
  },
  {
    id: 'n-2',
    category: 'disputes',
    title: 'Dispute DISP-8903 Requires Attention',
    message: 'Arun Bhat reported outer seal detached on Bangalore Blue Grapes pack.',
    timestamp: '2 hours ago',
    isRead: false,
    link: '/admin/disputes/disp-3',
    priority: 'high',
  },
  {
    id: 'n-3',
    category: 'orders',
    title: 'Large Morning Volume Spike',
    message: 'HSR Layout hub registered +42% morning breakfast harvest orders today.',
    timestamp: '3 hours ago',
    isRead: true,
    link: '/admin/orders',
    priority: 'medium',
  },
  {
    id: 'n-4',
    category: 'system',
    title: 'Bi-Weekly Payout Run Complete',
    message: '₹42,500 successfully settled across 6 verified growers with zero bank rejections.',
    timestamp: '5 hours ago',
    isRead: true,
    link: '/admin/payouts',
    priority: 'low',
  },
  {
    id: 'n-5',
    category: 'verification',
    title: 'Organic Certification Expiring Soon',
    message: 'Green Valley Organic Estate Jaivik Bharat audit renews in 30 days.',
    timestamp: '1 day ago',
    isRead: true,
    link: '/admin/farmers/farmer-1',
    priority: 'medium',
  },
];

// ============================================================================
// ADMIN SETTINGS & PROFILE DEFAULTS
// ============================================================================

export interface AdminProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  accountStatus: string;
  joinedDate: string;
  avatar: string;
  twoFactorEnabled: boolean;
}

export const ADMIN_PROFILE_DEFAULT: AdminProfileData = {
  name: 'Priya Mahadevan',
  email: 'admin@krishimarket.in',
  phone: '+91 80 4000 1234',
  role: 'Superadmin & Chief Agricultural Governance Officer',
  department: 'Bengaluru Agri Hub Cluster Governance',
  accountStatus: 'Active & Verified',
  joinedDate: 'January 2024',
  avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
  twoFactorEnabled: true,
};

export interface AdminPlatformSettingsData {
  platformCommissionPercent: number;
  farmerDirectSharePercent: number;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  maxDeliveryRadiusKm: number;
  orderCancellationGracePeriodMins: number;
  autoApproveDocumentThreshold: boolean;
  smsNotificationsEnabled: boolean;
  emailAlertsEnabled: boolean;
  weeklyPayoutDay: string;
}

export const ADMIN_PLATFORM_SETTINGS_DEFAULT: AdminPlatformSettingsData = {
  platformCommissionPercent: 10,
  farmerDirectSharePercent: 75,
  freeDeliveryThreshold: 499,
  standardDeliveryFee: 40,
  maxDeliveryRadiusKm: 25,
  orderCancellationGracePeriodMins: 15,
  autoApproveDocumentThreshold: false,
  smsNotificationsEnabled: true,
  emailAlertsEnabled: true,
  weeklyPayoutDay: 'Friday',
};
