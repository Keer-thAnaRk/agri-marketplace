'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AdminPlatformMetrics,
  AdminActivityItem,
} from '@/data/admin';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { api } from '@/lib/api';
import {
  Users,
  Clock,
  UserCheck,
  ShoppingBag,
  Sprout,
  Package,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Activity,
  RotateCw,
  AlertCircle,
  Loader2,
  Truck,
  ShieldAlert,
  Boxes,
  PieChart as PieIcon,
} from 'lucide-react';
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
} from 'recharts';

// ============================================================================
// DATA TYPES FOR ADMIN DASHBOARD FRONTEND
// ============================================================================

export interface FarmerVerificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface OrderPipelineStats {
  total: number;
  placed: number;
  confirmed: number;
  harvesting: number;
  packed: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  active: number;
}

export interface ProductInventoryStats {
  total: number;
  active: number;
  draft: number;
  outOfStock: number;
  expired: number;
}

interface RecentFarmer {
  id: string;
  name: string;
  avatar: string;
  farmName: string;
  hub: string;
  location: string;
  verificationStatus: string;
  registeredAt: string;
}

interface PendingFarmer {
  id: string;
  name: string;
  farmName: string;
  location: string;
  hub: string;
  documents: Array<{ id: string; type: string; title: string }>;
  documentsCount: number;
  registeredAt: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  date: string;
}

interface RecentDispute {
  id: string;
  disputeNumber: string;
  orderId: string;
  customerName: string;
  productName: string;
  reason: string;
  amount: number;
  status: string;
  rawStatus: string;
  date: string;
}

interface CategorySlice {
  name: string;
  count: number;
  value: number;
  color: string;
}

interface RevenuePoint {
  month: string;
  revenue: number;
  orders: number;
  payouts: number;
}

interface FarmerRegPoint {
  month: string;
  registered: number;
  approved: number;
}

// ============================================================================
// ADMIN DASHBOARD PAGE COMPONENT
// ============================================================================

export default function AdminDashboardPage() {
  // Primary KPI metrics
  const [metrics, setMetrics] = useState<AdminPlatformMetrics | null>(null);

  // Modular subsystem breakdown statistics
  const [farmerStats, setFarmerStats] = useState<FarmerVerificationStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderPipelineStats | null>(null);
  const [productStats, setProductStats] = useState<ProductInventoryStats | null>(null);

  // Operational records and lists
  const [recentFarmers, setRecentFarmers] = useState<RecentFarmer[]>([]);
  const [pendingFarmers, setPendingFarmers] = useState<PendingFarmer[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [openDisputes, setOpenDisputes] = useState<RecentDispute[]>([]);
  const [activities, setActivities] = useState<AdminActivityItem[]>([]);

  // Time-series and distribution charts
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [ordersChart, setOrdersChart] = useState<Array<{ month: string; orders: number }>>([]);
  const [farmerRegChart, setFarmerRegChart] = useState<FarmerRegPoint[]>([]);
  const [categoryChart, setCategoryChart] = useState<CategorySlice[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    // Get admin token explicitly
    const adminToken = localStorage.getItem('krishi_admin_token');
    console.log('Admin dashboard - Token available:', !!adminToken);

    const fetchDashboard = async (retryCount = 0) => {
      try {
        const res = await api.getAdminDashboard(undefined, adminToken || undefined);
        
        if (!isCancelled) {
          console.log('Admin dashboard - API response:', res);
          if (res && res.success && res.data) {
            const data = res.data;
            if (data.metrics) setMetrics(data.metrics);
            if (data.farmerStats) setFarmerStats(data.farmerStats);
            if (data.orderStats) setOrderStats(data.orderStats);
            if (data.productStats) setProductStats(data.productStats);

            setRecentFarmers(data.recentFarmers || []);
            setPendingFarmers(data.pendingFarmers || []);
            setRecentOrders(data.recentOrders || []);
            setOpenDisputes(data.recentDisputes || []);
            setActivities(data.recentActivities || []);

            if (data.charts) {
              setRevenueChart(data.charts.revenueOverTime || []);
              setOrdersChart(data.charts.ordersOverTime || []);
              setFarmerRegChart(data.charts.farmerRegistrations || []);
              setCategoryChart(data.charts.categoryDistribution || []);
            }
            setError(null);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          } else {
            console.error('Admin dashboard - Invalid response structure:', res);
            setError('Unable to load dashboard data. Invalid response from server.');
          }
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error('Failed to load dashboard data:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          
          // Check for database connection pool error - retry once
          if ((errorMessage.includes('max clients reached') || errorMessage.includes('EMAXCONNSESSION')) && retryCount < 1) {
            console.log('Admin dashboard - Database connection limit reached, retrying...');
            setError('Database connection limit reached. Retrying...');
            setTimeout(() => {
              if (!isCancelled) {
                fetchDashboard(retryCount + 1);
              }
            }, 2000);
            return;
          }
          
          // Check for database connection pool error
          if (errorMessage.includes('max clients reached') || errorMessage.includes('EMAXCONNSESSION')) {
            setError('Database connection limit reached. Please wait a moment and try again.');
          } else if (errorMessage.includes('Network error')) {
            setError('Unable to connect to the backend server. Please ensure the backend is running on port 5000.');
          } else {
            setError(`Unable to load dashboard data: ${errorMessage}`);
          }
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  // Safe zero-default aggregations
  const displayMetrics: AdminPlatformMetrics = metrics || {
    totalFarmers: 0,
    pendingVerification: 0,
    approvedFarmers: 0,
    rejectedFarmers: 0,
    totalConsumers: 0,
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    totalPaidOut: 0,
    gmvMonthly: 0,
    fulfillmentRate: 100,
    onTimeRate: 100,
  };

  const displayFarmerStats: FarmerVerificationStats = farmerStats || {
    total: displayMetrics.totalFarmers,
    pending: displayMetrics.pendingVerification,
    approved: displayMetrics.approvedFarmers,
    rejected: displayMetrics.rejectedFarmers,
  };

  const displayOrderStats: OrderPipelineStats = orderStats || {
    total: displayMetrics.activeOrders,
    placed: 0,
    confirmed: 0,
    harvesting: 0,
    packed: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
    active: displayMetrics.activeOrders,
  };

  const displayProductStats: ProductInventoryStats = productStats || {
    total: displayMetrics.totalProducts,
    active: displayMetrics.totalProducts,
    draft: 0,
    outOfStock: 0,
    expired: 0,
  };

  const verificationRate =
    displayFarmerStats.total > 0
      ? Math.round((displayFarmerStats.approved / displayFarmerStats.total) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* TOP BANNER / HEADER BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-md border border-forest-200/60">
              Live Governance Operations
            </span>
            <span className="text-[11px] text-slate-400">Bengaluru Hub Cluster #1</span>
            {lastUpdated && (
              <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                • Updated {lastUpdated}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif mt-1">
            Platform Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Operational oversight of grower enrollments, direct order fulfillment, and marketplace economics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Refresh dashboard"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-forest-600' : ''}`} />
          </button>

          {displayFarmerStats.pending > 0 && (
            <Link
              href="/admin/farmers?tab=pending"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{displayFarmerStats.pending} Pending RTCs</span>
            </Link>
          )}

          <Link
            href="/admin/disputes"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Disputes ({openDisputes.length})</span>
          </Link>
        </div>
      </div>

      {/* Error state alert */}
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

      {/* Loading state indicator */}
      {isLoading && !metrics && (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Aggregating live platform metrics...</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OVERVIEW STAT CARDS (8 CARDS) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Marketplace Key Performance Indicators
          </h2>
          <span className="text-[11px] text-slate-400">8 Core Platform Metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: Total Farmers */}
          <AdminStatCard
            title="Total Farmers"
            value={displayFarmerStats.total}
            subtext="Registered across hub clusters"
            icon={Users}
            iconColor="text-forest-700"
            iconBg="bg-forest-50"
            trend={
              displayFarmerStats.total > 0
                ? { value: `${displayFarmerStats.approved} verified`, isPositive: true }
                : undefined
            }
          />

          {/* Card 2: Pending Farmer Verifications */}
          <AdminStatCard
            title="Pending Verifications"
            value={displayFarmerStats.pending}
            subtext="Pahani RTC review queue"
            icon={Clock}
            iconColor="text-amber-700"
            iconBg="bg-amber-50"
          />

          {/* Card 3: Approved Farmers */}
          <AdminStatCard
            title="Approved Farmers"
            value={displayFarmerStats.approved}
            subtext="Fully certified & active growers"
            icon={UserCheck}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-50"
            trend={
              displayFarmerStats.total > 0
                ? {
                    value: `${verificationRate}% verified`,
                    isPositive: true,
                  }
                : undefined
            }
          />

          {/* Card 4: Total Consumers */}
          <AdminStatCard
            title="Total Consumers"
            value={displayMetrics.totalConsumers.toLocaleString()}
            subtext="Bengaluru household accounts"
            icon={ShoppingBag}
            iconColor="text-blue-700"
            iconBg="bg-blue-50"
          />

          {/* Card 5: Total Products */}
          <AdminStatCard
            title="Total Products"
            value={displayProductStats.total}
            subtext="Listed in platform catalogue"
            icon={Sprout}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-50"
          />

          {/* Card 6: Active Products */}
          <AdminStatCard
            title="Active Products"
            value={displayProductStats.active}
            subtext={`${displayProductStats.outOfStock} currently out of stock`}
            icon={CheckCircle2}
            iconColor="text-forest-700"
            iconBg="bg-forest-50"
            trend={
              displayProductStats.total > 0
                ? {
                    value: `${Math.round((displayProductStats.active / (displayProductStats.total || 1)) * 100)}% available`,
                    isPositive: true,
                  }
                : undefined
            }
          />

          {/* Card 7: Total Orders */}
          <AdminStatCard
            title="Total Orders"
            value={displayOrderStats.total}
            subtext={`${displayOrderStats.active || displayMetrics.activeOrders} in fulfillment`}
            icon={Package}
            iconColor="text-indigo-700"
            iconBg="bg-indigo-50"
          />

          {/* Card 8: Total Revenue */}
          <AdminStatCard
            title="Total Revenue (GMV)"
            value={
              displayMetrics.totalRevenue >= 100000
                ? `₹${(displayMetrics.totalRevenue / 100000).toFixed(1)} Lakh`
                : `₹${displayMetrics.totalRevenue.toLocaleString()}`
            }
            subtext="Direct marketplace gross sales"
            icon={TrendingUp}
            iconColor="text-forest-700"
            iconBg="bg-forest-50"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Governance Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/farmers?tab=pending"
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              {displayFarmerStats.pending > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {displayFarmerStats.pending}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-900 group-hover:text-forest-800">
                Review Farmers
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pending applications</div>
            </div>
          </Link>

          <Link
            href="/admin/farmers"
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-forest-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-900 group-hover:text-forest-800">
                Manage Farmers
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Directory & hub maps</div>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-900 group-hover:text-forest-800">
                Manage Products
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Catalog & stock tiers</div>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-900 group-hover:text-forest-800">
                View Orders
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dispatch & tracking</div>
            </div>
          </Link>

          <Link
            href="/admin/deliveries"
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-900 group-hover:text-forest-800">
                Deliveries
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Cluster batches</div>
            </div>
          </Link>

          <Link
            href="/admin/disputes"
            className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              {openDisputes.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {openDisputes.length}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-900 group-hover:text-forest-800">
                Review Disputes
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Mediation & claims</div>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FARMER VERIFICATION OVERVIEW */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Farmer Verification & KYC Overview
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pahani RTC land verification, organic certification checks, and grower admission
            </p>
          </div>

          <Link
            href="/admin/farmers?tab=pending"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition-colors shrink-0 shadow-2xs"
          >
            <span>Review Farmers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Pending Verification
              </span>
              <div className="text-2xl font-extrabold text-amber-950 font-serif mt-0.5">
                {displayFarmerStats.pending}
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">Awaiting land record approval</p>
            </div>
            <Clock className="w-7 h-7 text-amber-600/70" />
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Approved & Active
              </span>
              <div className="text-2xl font-extrabold text-emerald-950 font-serif mt-0.5">
                {displayFarmerStats.approved}
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">Authorized for marketplace supply</p>
            </div>
            <CheckCircle2 className="w-7 h-7 text-emerald-600/70" />
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Rejected Applications
              </span>
              <div className="text-2xl font-extrabold text-rose-950 font-serif mt-0.5">
                {displayFarmerStats.rejected}
              </div>
              <p className="text-[11px] text-rose-700 mt-0.5">Failed documentation audits</p>
            </div>
            <ShieldAlert className="w-7 h-7 text-rose-600/70" />
          </div>
        </div>

        {/* Queue and Recent Farmers 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
          {/* Column 1: Pending Application Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Pending RTC Audit Queue ({pendingFarmers.length})
              </span>
              <Link
                href="/admin/farmers?tab=pending"
                className="text-xs font-bold text-amber-700 hover:underline"
              >
                Review All →
              </Link>
            </div>

            {pendingFarmers.length === 0 ? (
              <AdminEmptyState
                icon={CheckCircle2}
                title="All Verifications Cleared"
                description="Zero pending grower applications in the queue."
              />
            ) : (
              <div className="space-y-2.5">
                {pendingFarmers.map((pf) => (
                  <div
                    key={pf.id}
                    className="p-3 rounded-2xl bg-amber-50/40 border border-amber-200/60 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{pf.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {pf.farmName} • {pf.location || pf.hub}
                      </div>
                      <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                        {pf.documentsCount} RTC / KYC documents attached
                      </div>
                    </div>
                    <Link
                      href={`/admin/farmers/${pf.id}`}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0 shadow-2xs"
                    >
                      Audit RTC
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Recently Registered Farmers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Recently Enrolled Growers ({recentFarmers.length})
              </span>
              <Link
                href="/admin/farmers"
                className="text-xs font-bold text-forest-700 hover:underline"
              >
                Full Directory →
              </Link>
            </div>

            {recentFarmers.length === 0 ? (
              <AdminEmptyState
                icon={Users}
                title="No Growers Enrolled"
                description="Newly registered farmers will appear here."
              />
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                {recentFarmers.map((farmer) => (
                  <div key={farmer.id} className="py-2 px-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <Image src={farmer.avatar} alt={farmer.name} fill className="object-cover" sizes="32px" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{farmer.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {farmer.farmName} • {farmer.hub}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          farmer.verificationStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-800'
                            : farmer.verificationStatus === 'pending'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {farmer.verificationStatus.toUpperCase()}
                      </span>
                      <Link
                        href={`/admin/farmers/${farmer.id}`}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        title="View profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ORDERS & FULFILLMENT PIPELINE OVERVIEW */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-700" />
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Orders & Fulfillment Pipeline Overview
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time progression through Krishi 7-stage harvesting and dispatch lifecycle
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shrink-0 shadow-2xs"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 7 Order Status Workflow Progression Blocks */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Operational Lifecycle Progression (7 Stages)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Stage 1: Placed */}
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                1. Placed
              </span>
              <div className="text-xl font-black text-blue-950 font-serif mt-1">
                {displayOrderStats.placed}
              </div>
              <span className="text-[10px] text-blue-600 mt-0.5">Payment verified</span>
            </div>

            {/* Stage 2: Confirmed */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                2. Confirmed
              </span>
              <div className="text-xl font-black text-indigo-950 font-serif mt-1">
                {displayOrderStats.confirmed}
              </div>
              <span className="text-[10px] text-indigo-600 mt-0.5">Farmer accepted</span>
            </div>

            {/* Stage 3: Harvesting */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                3. Harvesting
              </span>
              <div className="text-xl font-black text-amber-950 font-serif mt-1">
                {displayOrderStats.harvesting}
              </div>
              <span className="text-[10px] text-amber-600 mt-0.5">Field harvest</span>
            </div>

            {/* Stage 4: Packed */}
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                4. Packed
              </span>
              <div className="text-xl font-black text-purple-950 font-serif mt-1">
                {displayOrderStats.packed}
              </div>
              <span className="text-[10px] text-purple-600 mt-0.5">QC & crating</span>
            </div>

            {/* Stage 5: Out for Delivery */}
            <div className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                5. Out Delivery
              </span>
              <div className="text-xl font-black text-cyan-950 font-serif mt-1">
                {displayOrderStats.outForDelivery}
              </div>
              <span className="text-[10px] text-cyan-600 mt-0.5">In transit route</span>
            </div>

            {/* Stage 6: Delivered */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                6. Delivered
              </span>
              <div className="text-xl font-black text-emerald-950 font-serif mt-1">
                {displayOrderStats.delivered}
              </div>
              <span className="text-[10px] text-emerald-600 mt-0.5">Fulfilled</span>
            </div>

            {/* Stage 7: Cancelled */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                7. Cancelled
              </span>
              <div className="text-xl font-black text-slate-700 font-serif mt-1">
                {displayOrderStats.cancelled}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">Void / returned</span>
            </div>
          </div>
        </div>

        {/* Recent Orders Table / Cadence Bar Chart Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Recent Orders List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Recent Orders in Pipeline ({recentOrders.length})
              </span>
              <Link href="/admin/orders" className="text-xs font-bold text-forest-700 hover:underline">
                View All →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <AdminEmptyState
                icon={Package}
                title="No Orders Yet"
                description="New consumer orders will appear here in real time."
              />
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                {recentOrders.map((order) => (
                  <div key={order.id} className="py-2.5 px-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {order.customerName} • {order.itemCount} items • ₹{order.total}
                      </div>
                    </div>

                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
                      title="Inspect order"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders Volume Trend Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Order Volume Cadence (Monthly)</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Historical Volume
              </span>
            </div>

            <div className="h-56 w-full bg-slate-50/50 rounded-2xl p-3 border border-slate-100 flex items-center justify-center">
              {ordersChart.length === 0 ? (
                <div className="text-xs text-slate-400">No monthly order history recorded.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MARKETPLACE OVERVIEW (CATEGORY BREAKDOWN & INVENTORY HEALTH) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Marketplace Diversity
              </span>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Products by Category
              </h3>
            </div>
            <PieIcon className="w-4 h-4 text-slate-400" />
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
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Catalog Health, Stock Status & Surplus Alerts */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Supply Health
                </span>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Catalog Inventory & Surplus
                </h3>
              </div>
              <Link href="/admin/products" className="text-xs font-bold text-forest-700 hover:underline">
                Manage Catalog
              </Link>
            </div>

            {/* 4 Inventory Status Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Active
                </span>
                <div className="text-xl font-black text-emerald-950 font-serif mt-0.5">
                  {displayProductStats.active}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Draft
                </span>
                <div className="text-xl font-black text-slate-800 font-serif mt-0.5">
                  {displayProductStats.draft}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                  Out Stock
                </span>
                <div className="text-xl font-black text-rose-950 font-serif mt-0.5">
                  {displayProductStats.outOfStock}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Expired
                </span>
                <div className="text-xl font-black text-amber-950 font-serif mt-0.5">
                  {displayProductStats.expired}
                </div>
              </div>
            </div>

            {/* Low-Stock & Surplus Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Boxes className="w-4 h-4 text-forest-700" />
                <span>Inventory Replenishment & Surplus Deals</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Direct farm harvest batches guarantee peak freshness. When stock runs low or surplus
                deals are published by certified farmers, automated alerts notify dispatch hubs.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to update listing prices or statuses?</span>
            <Link
              href="/admin/products"
              className="font-bold text-forest-700 hover:text-forest-900 inline-flex items-center gap-1"
            >
              <span>Product Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MACRO FINANCIAL & SUPPLY TRENDS (REVENUE & REGISTRATIONS CHARTS) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Financial Growth & Supply Trends
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Over Time Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
                  Financial Growth
                </span>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Revenue Over Time (₹ GMV)
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                Live Trend
              </span>
            </div>
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4332" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1B4332" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [
                      `₹${Number(val || 0).toLocaleString()}`,
                      'Gross GMV',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1B4332"
                    strokeWidth={3}
                    fill="url(#adminRevGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Farmer Registrations Growth */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Supply Pipeline
                </span>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Farmer Registrations & Approvals
                </h3>
              </div>
              <Link
                href="/admin/farmers"
                className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={farmerRegChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="registered" name="Applications" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved Growers" fill="#1B4332" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. RECENT OPERATIONAL ACTIVITY STREAM */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900 font-serif">
              Recent Operational Governance Log
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Live Audit Stream</span>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No operational governance events recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act) => (
              <div
                key={act.id}
                className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        act.badge.variant === 'emerald'
                          ? 'bg-emerald-50 text-emerald-800'
                          : act.badge.variant === 'blue'
                          ? 'bg-blue-50 text-blue-800'
                          : act.badge.variant === 'amber'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {act.badge.label}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{act.title}</span>
                  </div>
                  <p className="text-xs text-slate-500">{act.description}</p>
                  <p className="text-[10px] text-slate-400">Actor: {act.actor}</p>
                </div>

                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  {act.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
