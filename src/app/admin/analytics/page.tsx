'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  ShoppingBag,
  Sprout,
  Package,
  Truck,
  IndianRupee,
  RotateCw,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
  Boxes,
  ShieldAlert,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Percent,
} from 'lucide-react';

// ============================================================================
// DATA INTERFACES
// ============================================================================

interface RevenuePoint {
  month: string;
  revenue: number;
  payouts: number;
  orders: number;
  gmv?: number;
  farmerEarnings?: number;
  platformRevenue?: number;
}

interface FarmerRegPoint {
  month: string;
  registered: number;
  approved: number;
}

interface CategorySlice {
  name: string;
  count: number;
  value: number;
  color: string;
  revenue?: number;
  sharePercentage?: number;
}

interface ConsumerGrowthPoint {
  month: string;
  consumers: number;
  activeDaily: number;
}

interface DeliveryPerfPoint {
  day: string;
  onTime: number;
}

interface TopProduct {
  productId?: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  ordersCount: number;
}

interface TopFarmer {
  farmerId?: string;
  farmerName?: string;
  farmName: string;
  totalSales: number;
  volumeSold: number;
  ordersCount: number;
}

interface AnalyticsKPIs {
  totalUsers: number;
  totalFarmers: number;
  approvedFarmers: number;
  pendingFarmers: number;
  rejectedFarmers: number;
  totalConsumers: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
  grossOrderValue: number;
  farmerEarnings: number;
  platformRevenue: number;
  activeDeliveryBatches: number;
  activeSurplusOffers: number;
  openDisputes: number;
}

interface InventoryAnalytics {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  expired: number;
  currentStock: number;
  availableQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
}

interface SurplusAnalytics {
  totalOffers: number;
  activeOffers: number;
  claimedOffers: number;
  expiredOffers: number;
  cancelledOffers: number;
  totalAvailableQuantity: number;
}

interface CustomerAnalytics {
  totalConsumers: number;
  consumersWithOrders: number;
  orderCount: number;
  averageOrderValue: number;
}

interface HealthAnalytics {
  disputes: {
    total: number;
    open: number;
    underReview: number;
    resolved: number;
    rejected: number;
  };
  reviews: {
    totalReviews: number;
    averageRating: number;
    verifiedPurchasesCount: number;
  };
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6M');
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [ordersChart, setOrdersChart] = useState<Array<{ month: string; orders: number }>>([]);
  const [categoryChart, setCategoryChart] = useState<CategorySlice[]>([]);
  const [farmerRegChart, setFarmerRegChart] = useState<FarmerRegPoint[]>([]);
  const [consumerGrowthChart, setConsumerGrowthChart] = useState<ConsumerGrowthPoint[]>([]);
  const [deliveryPerfChart, setDeliveryPerfChart] = useState<DeliveryPerfPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topFarmers, setTopFarmers] = useState<TopFarmer[]>([]);
  const [inventory, setInventory] = useState<InventoryAnalytics | null>(null);
  const [surplus, setSurplus] = useState<SurplusAnalytics | null>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
  const [healthAnalytics, setHealthAnalytics] = useState<HealthAnalytics | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    api
      .getAdminAnalytics(timeRange)
      .then((res) => {
        if (!isCancelled) {
          if (res && res.success && res.data) {
            const d = res.data;
            setKpis(d.kpis || null);
            setRevenueChart(d.revenueOverTime || []);
            setOrdersChart(d.ordersOverTime || []);
            setCategoryChart(d.categoryDistribution || []);
            setFarmerRegChart(d.farmerRegistrations || []);
            setConsumerGrowthChart(d.consumerGrowth || []);
            setDeliveryPerfChart(d.deliveryPerformance || []);
            setTopProducts(d.productPerformance?.topProducts || []);
            setTopFarmers(d.farmerPerformance?.topFarmers || []);
            setInventory(d.inventoryAnalytics || null);
            setSurplus(d.surplusAnalytics || null);
            setCustomerAnalytics(d.customerAnalytics || null);
            setHealthAnalytics(d.healthAnalytics || null);
            setError(null);
          } else {
            setError('Unable to load analytics data.');
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error('Failed to load analytics:', err);
          setError('Unable to load analytics data.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [timeRange, refreshTrigger]);

  const totalSKUs = categoryChart.reduce((acc, c) => acc + c.count, 0);

  // ============================================================================
  // CSV EXPORT HANDLERS
  // ============================================================================
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
  };

  const exportKPISummary = () => {
    if (!kpis) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', kpis.totalUsers],
      ['Total Consumers', kpis.totalConsumers],
      ['Total Farmers', kpis.totalFarmers],
      ['Approved Farmers', kpis.approvedFarmers],
      ['Pending Farmers', kpis.pendingFarmers],
      ['Rejected Farmers', kpis.rejectedFarmers],
      ['Total Products', kpis.totalProducts],
      ['Active Products', kpis.activeProducts],
      ['Total Orders', kpis.totalOrders],
      ['Delivered Orders', kpis.completedOrders],
      ['Cancelled Orders', kpis.cancelledOrders],
      ['Gross GMV (INR)', kpis.grossOrderValue],
      ['Farmer Payouts (INR)', kpis.farmerEarnings],
      ['Platform Revenue (INR)', kpis.platformRevenue],
      ['Active Delivery Batches', kpis.activeDeliveryBatches],
      ['Active Surplus Offers', kpis.activeSurplusOffers],
      ['Open Customer Disputes', kpis.openDisputes],
      ['Average Order Value (INR)', customerAnalytics?.averageOrderValue || 0],
    ];
    const csv = rows.map((r) => `"${r[0]}","${r[1]}"`).join('\n');
    downloadCSV(`krishi_market_kpis_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const exportTopProducts = () => {
    if (topProducts.length === 0) return;
    const rows = [
      ['Rank', 'Product Name', 'Quantity Sold', 'Gross Revenue (INR)', 'Orders Count'],
      ...topProducts.map((p, idx) => [
        idx + 1,
        p.productName,
        p.quantitySold,
        p.revenue,
        p.ordersCount,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    downloadCSV(`krishi_market_top_products_${timeRange}.csv`, csv);
  };

  const exportTopFarmers = () => {
    if (topFarmers.length === 0) return;
    const rows = [
      ['Rank', 'Farm Name', 'Farmer Name', 'Volume Sold', 'Total Sales (INR)', 'Orders Count'],
      ...topFarmers.map((f, idx) => [
        idx + 1,
        f.farmName,
        f.farmerName || 'N/A',
        f.volumeSold,
        f.totalSales,
        f.ordersCount,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    downloadCSV(`krishi_market_top_farmers_${timeRange}.csv`, csv);
  };

  const exportRevenueTrend = () => {
    if (revenueChart.length === 0) return;
    const rows = [
      ['Period', 'Gross GMV (INR)', 'Farmer Direct Payouts (INR)', 'Orders Placed'],
      ...revenueChart.map((r) => [r.month, r.revenue, r.payouts, r.orders]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    downloadCSV(`krishi_market_revenue_trend_${timeRange}.csv`, csv);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Platform Analytics & Agri-Economics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Holistic data intelligence across growers, consumer adoption, order fulfillment, and logistics
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Refresh analytics"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-forest-600' : ''}`} />
          </button>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-bold">
            {['7D', '30D', '90D', '6M', '1Y'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setTimeRange(range);
                  setIsLoading(true);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-2xl text-xs font-bold shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-forest-700" />
              <span>Export CSV</span>
            </button>

            {exportMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg p-1.5 z-30 text-xs"
                onMouseLeave={() => setExportMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={exportKPISummary}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium flex items-center justify-between"
                >
                  <span>KPI Summary Snapshot</span>
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={exportTopProducts}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium flex items-center justify-between"
                >
                  <span>Top Selling Products</span>
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={exportTopFarmers}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium flex items-center justify-between"
                >
                  <span>Top Farmer Performance</span>
                  <Sprout className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={exportRevenueTrend}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium flex items-center justify-between"
                >
                  <span>Revenue & Payouts Trend</span>
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="font-bold underline hover:text-rose-950 text-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading overlay when switching periods without prior data */}
      {isLoading && !kpis && (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Computing historical aggregations from PostgreSQL...</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16 OVERVIEW OPERATIONAL KPIS */}
      {/* ========================================================================= */}
      {kpis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Operational Key Performance Indicators (PostgreSQL Real-Time)
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">
              Active Period: {timeRange}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Financials Group */}
            <AdminStatCard
              title="Gross GMV (Sales)"
              value={`₹${(kpis.grossOrderValue || 0).toLocaleString()}`}
              subtext={`${kpis.totalSales} recorded sales`}
              icon={IndianRupee}
              iconColor="text-forest-700"
              iconBg="bg-forest-50"
            />
            <AdminStatCard
              title="Farmer Direct Payouts"
              value={`₹${(kpis.farmerEarnings || 0).toLocaleString()}`}
              subtext="75% Fair price guarantee"
              icon={TrendingUp}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-50"
            />
            <AdminStatCard
              title="Platform Revenue"
              value={`₹${(kpis.platformRevenue || 0).toLocaleString()}`}
              subtext="Commission & delivery share"
              icon={Percent}
              iconColor="text-blue-700"
              iconBg="bg-blue-50"
            />
            <AdminStatCard
              title="Average Order Value"
              value={`₹${(customerAnalytics?.averageOrderValue || 0).toLocaleString()}`}
              subtext={`${customerAnalytics?.consumersWithOrders || 0} active buyers`}
              icon={ShoppingBag}
              iconColor="text-indigo-700"
              iconBg="bg-indigo-50"
            />

            {/* Orders Group */}
            <AdminStatCard
              title="Total Orders"
              value={kpis.totalOrders}
              subtext="Consumer checkout count"
              icon={Package}
              iconColor="text-blue-700"
              iconBg="bg-blue-50"
            />
            <AdminStatCard
              title="Delivered Orders"
              value={kpis.completedOrders}
              subtext="Fulfilled fresh to doorstep"
              icon={CheckCircle2}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-50"
            />
            <AdminStatCard
              title="Active Delivery Batches"
              value={kpis.activeDeliveryBatches}
              subtext="Assigned / In-transit dispatch"
              icon={Truck}
              iconColor="text-indigo-700"
              iconBg="bg-indigo-50"
            />
            <AdminStatCard
              title="Cancelled Orders"
              value={kpis.cancelledOrders}
              subtext="Refunded or farmer cancelled"
              icon={XCircle}
              iconColor="text-rose-700"
              iconBg="bg-rose-50"
            />

            {/* Farmers Group */}
            <AdminStatCard
              title="Total Registered Farmers"
              value={kpis.totalFarmers}
              subtext="Agricultural supply base"
              icon={Users}
              iconColor="text-forest-700"
              iconBg="bg-forest-50"
            />
            <AdminStatCard
              title="Approved Farmers"
              value={kpis.approvedFarmers}
              subtext="Certified KYC & Land verified"
              icon={Award}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-50"
            />
            <AdminStatCard
              title="Pending Verifications"
              value={kpis.pendingFarmers}
              subtext={kpis.pendingFarmers > 0 ? 'Requires admin audit' : 'Queue cleared'}
              icon={Clock}
              iconColor={kpis.pendingFarmers > 0 ? 'text-amber-700' : 'text-slate-600'}
              iconBg={kpis.pendingFarmers > 0 ? 'bg-amber-50' : 'bg-slate-100'}
            />
            <AdminStatCard
              title="Rejected Applications"
              value={kpis.rejectedFarmers}
              subtext="Unverified compliance"
              icon={XCircle}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
            />

            {/* Catalog & Operations Group */}
            <AdminStatCard
              title="Total Produce Catalog"
              value={kpis.totalProducts}
              subtext={`${kpis.activeProducts} currently active`}
              icon={Sprout}
              iconColor="text-forest-700"
              iconBg="bg-forest-50"
            />
            <AdminStatCard
              title="Total Registered Consumers"
              value={kpis.totalConsumers}
              subtext="Household customer accounts"
              icon={Users}
              iconColor="text-blue-700"
              iconBg="bg-blue-50"
            />
            <AdminStatCard
              title="Active Surplus Deals"
              value={kpis.activeSurplusOffers}
              subtext="Zero-waste flash offers"
              icon={Boxes}
              iconColor="text-amber-700"
              iconBg="bg-amber-50"
            />
            <AdminStatCard
              title="Open Customer Disputes"
              value={kpis.openDisputes}
              subtext={kpis.openDisputes > 0 ? 'Requires resolution' : 'No open complaints'}
              icon={ShieldAlert}
              iconColor={kpis.openDisputes > 0 ? 'text-rose-700' : 'text-slate-600'}
              iconBg={kpis.openDisputes > 0 ? 'bg-rose-50' : 'bg-slate-100'}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: REVENUE ANALYTICS (Revenue Over Time) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-forest-700" />
            <h2 className="text-base font-bold text-slate-900 font-serif">
              1. Revenue Analytics & Farmer Direct Payouts
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            75% Farmer Direct Share Rule
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="analyticsGmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4332" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1B4332" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="analyticsPayoutGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52B788" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#52B788" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [
                    `₹${Number(val || 0).toLocaleString()}`,
                    name === 'revenue' ? 'Gross GMV' : 'Farmer Payouts (75%)',
                  ]}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="revenue" name="Gross GMV" stroke="#1B4332" strokeWidth={3} fill="url(#analyticsGmvGrad)" />
                <Area type="monotone" dataKey="payouts" name="Farmer Payouts" stroke="#52B788" strokeWidth={2} fill="url(#analyticsPayoutGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2 & 3: ORDER ANALYTICS & PRODUCT CATEGORY DISTRIBUTION */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 2: Order Analytics (Orders over time & volume) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                2. Order Analytics & Volume Cadence
              </h3>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
              Live Order Cadence
            </span>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="orders" name="Consumer Orders" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 3: Product Analytics (Product Category Distribution) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-forest-700" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                3. Product Analytics & Category Share
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">{totalSKUs} Active Produce SKUs</span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {categoryChart.length === 0 ? (
              <div className="text-xs text-slate-400">No products available in catalogue.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4 & 5: FARMER & CONSUMER ANALYTICS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 4: Farmer Analytics (Registrations & Onboarding) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-forest-700" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                4. Farmer Analytics & Supply Pipeline
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
              Grower Onboarding
            </span>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={farmerRegChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="registered" name="Farmer Applications" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Verified Certified" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 5: Consumer Analytics (Consumer Growth & Retention) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                5. Consumer Analytics & Urban Household Growth
              </h3>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
              Adoption Curve
            </span>
          </div>

          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consumerGrowthChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="consumers" name="Total Registered" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="activeDaily" name="Monthly Active Buyers" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: DELIVERY FLEET TELEMETRY */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-700" />
            <h2 className="text-base font-bold text-slate-900 font-serif">
              6. Delivery Analytics & Fleet Telemetry Performance
            </h2>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
            Rolling 7-Day Performance
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="h-60 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deliveryPerfChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit="%" domain={[0, 100]} />
                <Tooltip
                  formatter={(val: unknown) => [`${String(val)}%`, 'On-Time Fulfillment']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="onTime" name="On-Time Slot Delivery (%)" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEADERBOARDS: TOP SELLING PRODUCTS & TOP GROWERS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-forest-700" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Top Selling Produce SKUs
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
              By Gross Volume & GMV
            </span>
          </div>

          <div className="overflow-x-auto">
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No orders recorded in this time range.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Product Name</th>
                    <th className="pb-2 text-right">Units Sold</th>
                    <th className="pb-2 text-right">Gross GMV</th>
                    <th className="pb-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 font-bold text-slate-900">{p.productName}</td>
                      <td className="py-2.5 text-right font-medium text-slate-700">{p.quantitySold}</td>
                      <td className="py-2.5 text-right font-bold text-forest-700">₹{p.revenue.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-slate-500">{p.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Performing Growers Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Top Performing Growers
              </h3>
            </div>
            <span className="text-xs font-semibold text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-md">
              Grower Leaderboard
            </span>
          </div>

          <div className="overflow-x-auto">
            {topFarmers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No farmer transactions recorded in this period.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Farm & Grower</th>
                    <th className="pb-2 text-right">Volume</th>
                    <th className="pb-2 text-right">Total Sales</th>
                    <th className="pb-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topFarmers.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5">
                        <div className="font-bold text-slate-900">{f.farmName}</div>
                        {f.farmerName && <div className="text-[10px] text-slate-400">{f.farmerName}</div>}
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-700">{f.volumeSold}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-700">₹{f.totalSales.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-slate-500">{f.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OPERATIONAL HEALTH: INVENTORY, SURPLUS & DISPUTE AUDITS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inventory Status Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-forest-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Inventory Stock Levels
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {inventory?.totalItems || 0} Stock Batches
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div className="text-[10px] font-bold text-emerald-800 uppercase">In Stock</div>
              <div className="text-lg font-extrabold text-emerald-900 mt-0.5">
                {inventory?.inStock || 0}
              </div>
            </div>
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Low Stock</div>
              <div className="text-lg font-extrabold text-amber-900 mt-0.5">
                {inventory?.lowStock || 0}
              </div>
            </div>
            <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100">
              <div className="text-[10px] font-bold text-rose-800 uppercase">Out of Stock</div>
              <div className="text-lg font-extrabold text-rose-900 mt-0.5">
                {inventory?.outOfStock || 0}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-600 uppercase">Available Qty</div>
              <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                {(inventory?.availableQuantity || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Surplus Deals Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Surplus Flash Deals
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Zero Waste
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Active Deals</div>
              <div className="text-lg font-extrabold text-amber-900 mt-0.5">
                {surplus?.activeOffers || 0}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
              <div className="text-[10px] font-bold text-blue-800 uppercase">Claimed Deals</div>
              <div className="text-lg font-extrabold text-blue-900 mt-0.5">
                {surplus?.claimedOffers || 0}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-600 uppercase">Total Offers</div>
              <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                {surplus?.totalOffers || 0}
              </div>
            </div>
            <div className="p-2.5 bg-forest-50/60 rounded-xl border border-forest-100">
              <div className="text-[10px] font-bold text-forest-800 uppercase">Surplus Units</div>
              <div className="text-lg font-extrabold text-forest-900 mt-0.5">
                {(surplus?.totalAvailableQuantity || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Quality Assurance & Reviews Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Disputes & Consumer Trust
              </h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              Audit Health
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-600 uppercase">Total Disputes</div>
              <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                {healthAnalytics?.disputes?.total || 0}
              </div>
            </div>
            <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100">
              <div className="text-[10px] font-bold text-rose-800 uppercase">Open / In Review</div>
              <div className="text-lg font-extrabold text-rose-900 mt-0.5">
                {(healthAnalytics?.disputes?.open || 0) + (healthAnalytics?.disputes?.underReview || 0)}
              </div>
            </div>
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Avg Rating</div>
              <div className="text-lg font-extrabold text-amber-900 mt-0.5 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{healthAnalytics?.reviews?.averageRating || 0}</span>
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div className="text-[10px] font-bold text-emerald-800 uppercase">Verified Reviews</div>
              <div className="text-lg font-extrabold text-emerald-900 mt-0.5">
                {healthAnalytics?.reviews?.verifiedPurchasesCount || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
