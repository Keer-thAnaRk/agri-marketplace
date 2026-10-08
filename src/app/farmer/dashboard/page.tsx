'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import { useAuth } from '@/context/AuthContext';
import { api, getAuthToken } from '@/lib/api';
import { StatCard } from '@/components/farmer/StatCard';
import { SalesChart } from '@/components/farmer/SalesChart';
import { OrderTable } from '@/components/farmer/OrderTable';
import { InventoryTable } from '@/components/farmer/InventoryTable';
import { ProfileCard } from '@/components/farmer/ProfileCard';
import { StockUpdateModal } from '@/components/farmer/StockUpdateModal';
import { InventoryItem, isFarmerApproved, isFarmerPending, isFarmerRejected, FarmerOrderStatus } from '@/types';
import { calculateFreshness } from '@/utils/freshness';
import { VerificationPending } from '@/components/farmer/VerificationPending';
import { VerificationRejected } from '@/components/farmer/VerificationRejected';
import {
  Package,
  Clock,
  Sprout,
  TrendingUp,
  Plus,
  ShieldCheck,
  ArrowRight,
  Boxes,
  Calendar,
  Truck,
  BadgePercent,
  AlertTriangle,
  MapPin,
  Play,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function FarmerDashboardPage() {
  const {
    farmerProfile,
    products,
    orders,
    inventory,
    updateOrderStatus,
    updateStock,
    salesSummary,
    deliveryBatches,
    updateBatchStatus,
  } = useFarmer();
  const { user, verificationStatus } = useAuth();

  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const currentStatus = user?.verificationStatus || verificationStatus;

  const fetchDashboard = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.getFarmerDashboard(token);
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.warn('Farmer dashboard live fetch note:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFarmerApproved(currentStatus)) {
      fetchDashboard();
    } else {
      setIsLoading(false);
    }
  }, [currentStatus, fetchDashboard]);

  // Page-level guard for defense-in-depth: Never render business dashboard data to unapproved farmers
  if (isFarmerPending(currentStatus)) {
    return <VerificationPending />;
  }
  if (isFarmerRejected(currentStatus)) {
    return <VerificationRejected />;
  }

  // Interactive handlers that refresh dashboard data after mutations
  const handleAdvanceStatus = async (orderId: string, nextStatus: FarmerOrderStatus) => {
    await updateOrderStatus(orderId, nextStatus);
    fetchDashboard();
  };

  const handleStockUpdate = async (productId: string, delta: number, reason: string) => {
    await updateStock(productId, delta, reason);
    fetchDashboard();
  };

  // Metrics resolution prioritizing real PostgreSQL data
  const displayTotalProducts = dashboardData != null
    ? dashboardData.totalProducts
    : farmerProfile.totalProductsCount;

  const displayActiveProducts = dashboardData != null
    ? dashboardData.activeProducts
    : products.filter((p) => p.status === 'Active' && p.inStock).length;

  const displayPendingOrders = dashboardData != null
    ? dashboardData.pendingOrders
    : orders.filter((o) => o.status === 'Pending').length;

  const displayMonthlyRevenue = dashboardData != null
    ? dashboardData.monthlyRevenue
    : (salesSummary.thisMonthSales || 0);

  const displayMonthlyTrend = dashboardData != null
    ? dashboardData.monthlyTrend
    : (salesSummary.monthlyTrend || '+0% from last month');

  const displayRecentOrders = dashboardData != null
    ? (dashboardData.recentOrders || [])
    : orders.slice(0, 5);

  const displayInventory = dashboardData != null
    ? (dashboardData.inventory || [])
    : inventory.slice(0, 5);

  const allInventoryItems = dashboardData != null
    ? (dashboardData.allInventory || dashboardData.inventory || [])
    : inventory;

  const displayDeliveryBatches = dashboardData != null
    ? (dashboardData.deliveryBatches || [])
    : deliveryBatches.slice(0, 3);

  const displayProfile = dashboardData?.profile || dashboardData?.farmerProfile || farmerProfile;

  const freshnessAlerts = allInventoryItems
    .map((item: any) => {
      const lower = (item.productName || '').toLowerCase();
      const shelfLife = item.shelfLifeDays || (lower.includes('spinach') || lower.includes('palak') || lower.includes('coriander') ? 3 : lower.includes('potato') ? 14 : 6);
      const harvestDate = item.harvestDate || (item.lastUpdated?.toLowerCase().includes('yesterday') ? 'Sept 23, 2026' : 'Sept 24, 2026');
      const freshness = calculateFreshness(harvestDate, shelfLife);
      return { item, freshness };
    })
    .filter(({ item, freshness }: any) => (item.availableQuantity || 0) > 0 && (freshness.isApproachingExpiry || freshness.status === 'Use Soon'));

  const handleOpenStockModal = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setIsStockModalOpen(true);
  };

  const displayName = user?.name || displayProfile.name || farmerProfile.name || 'Farmer';

  const isRealSalesData = Boolean(dashboardData || (user?.id && user?.id !== 'demo-farmer' && user?.id !== 'farmer-ravi'));
  const monthlyChartData = dashboardData
    ? (dashboardData.salesSummary?.monthlyRevenue || [])
    : (user?.id === 'demo-farmer' || user?.id === 'farmer-ravi' ? undefined : (salesSummary.monthlyRevenue || []));

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-earth-200/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Good morning, {displayName.split(' ')[0]} 👋
            </h1>
            {verificationStatus === 'Verified' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>✓ Verified Farmer</span>
              </span>
            )}
            {verificationStatus === 'Pending' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>🟡 Verification Pending</span>
              </span>
            )}
            {verificationStatus === 'Rejected' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>🔴 Verification Requires Attention</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your farm today.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/farmer/harvests/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-earth-200 bg-white hover:bg-earth-50 text-slate-700 text-xs font-bold shadow-xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-forest-700" />
            <span>Record Harvest</span>
          </Link>

          <Link
            href="/farmer/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </Link>
        </div>
      </div>

      {/* Verification Status Warning / Notification Banner (Section 12) */}
      {verificationStatus === 'Pending' && (
        <div className="p-4 bg-amber-500/10 border border-amber-300/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-amber-950">Verification Status: Pending Review</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Our verification committee is reviewing your farm land documents and ID. All dashboard features, harvests, products, orders, and surplus deals remain fully functional for demonstration.
              </p>
            </div>
          </div>
          <Link
            href="/farmer/profile"
            className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs transition-colors shrink-0 self-start sm:self-auto"
          >
            Review Uploads
          </Link>
        </div>
      )}

      {verificationStatus === 'Rejected' && (
        <div className="p-4 bg-rose-500/10 border border-rose-300/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold text-rose-950">Verification Requires Attention</span>
              <p className="text-[11px] text-rose-800 mt-0.5">
                Certain land records or credentials could not be verified by the local agency. Please update your document attachments to attain the Verified Farmer badge.
              </p>
            </div>
          </div>
          <Link
            href="/farmer/profile"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shrink-0 self-start sm:self-auto shadow-xs"
          >
            Update Verification Information
          </Link>
        </div>
      )}

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <StatCard
          label="Total Products"
          value={displayTotalProducts}
          icon={Sprout}
          trendText={dashboardData != null ? `${displayActiveProducts} in stock` : "+2 from last month"}
          trendDirection="up"
          accentColor="forest"
          subtitle="Listed in farm directory"
        />

        {/* Active Products */}
        <StatCard
          label="Active Products"
          value={displayActiveProducts}
          icon={Boxes}
          trendText={displayTotalProducts > 0 ? `${Math.round((displayActiveProducts / displayTotalProducts) * 100)}% in active season` : "0% in active season"}
          trendDirection="up"
          accentColor="emerald"
          subtitle="Available for ordering"
        />

        {/* Pending Orders */}
        <StatCard
          label="Pending Orders"
          value={displayPendingOrders}
          icon={Clock}
          trendText={displayPendingOrders > 0 ? "Requires confirmation" : "All cleared"}
          trendDirection={displayPendingOrders > 0 ? "down" : "neutral"}
          accentColor="amber"
          subtitle="Morning harvest queue"
        />

        {/* Monthly Revenue */}
        <StatCard
          label="Monthly Revenue"
          value={`₹${(displayMonthlyRevenue || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          trendText={displayMonthlyTrend || '+0% from last month'}
          trendDirection="up"
          accentColor="sky"
          subtitle="75% direct bank share"
        />
      </div>

      {/* Freshness Alerts Banner */}
      {freshnessAlerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-300/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Freshness & Spoilage Alerts ({freshnessAlerts.length} crops approaching shelf life)
                </h3>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full uppercase">
                  Action Recommended
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {freshnessAlerts
                  .map(
                    (a: any) =>
                      `${a.item.productName} (${a.freshness.daysRemaining}d left • ${a.freshness.percentage}% Fresh)`
                  )
                  .join(' • ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <Link
              href="/farmer/surplus"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <BadgePercent className="w-3.5 h-3.5" />
              <span>Launch Flash Surplus Deal</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Sales Chart + Farmer Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sales Chart (8 Cols) */}
        <div className="lg:col-span-8">
          <SalesChart
            title="Sales Overview"
            subtitle="Real-time revenue & order fulfillment trends"
            monthlyData={monthlyChartData}
            isRealData={isRealSalesData}
          />
        </div>

        {/* Farmer Profile Card (4 Cols) */}
        <div className="lg:col-span-4">
          <ProfileCard profile={displayProfile} />
        </div>
      </div>

      {/* Today's Delivery Batches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
              EV Hub Dispatch
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Today&apos;s Delivery Batches
            </h2>
          </div>

          <Link
            href="/farmer/deliveries"
            className="text-xs font-bold text-forest-800 hover:text-forest-950 hover:underline flex items-center gap-1"
          >
            <span>Manage All Batches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayDeliveryBatches.length === 0 ? (
            <div className="md:col-span-3 bg-white rounded-3xl border border-dashed border-earth-200/90 p-8 text-center text-slate-400">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No active delivery batches today.</p>
              <p className="text-xs text-slate-400 mt-1">Batches will appear here once orders are clustered for EV dispatch.</p>
            </div>
          ) : (
            displayDeliveryBatches.slice(0, 3).map((b: any) => (
              <div
                key={b.batchId || b.id}
                className="bg-white rounded-3xl border border-earth-200/90 p-5 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-forest-900 bg-forest-50 px-2.5 py-0.5 rounded-lg border border-forest-200">
                      {b.batchId || b.id}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-earth-100 text-slate-700">
                      {b.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm mt-2">
                    <MapPin className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                    <span>{b.area || b.hubArea || 'Local Hub'}</span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{b.deliverySlot}</span>
                  </div>

                  <div className="text-xs text-slate-600 mt-2 bg-earth-50 p-2.5 rounded-xl border border-earth-100 flex items-center justify-between">
                    <span>{(b.orderIds || b.orders || []).length} orders ({b.totalQuantity || '0 kg'})</span>
                    <span className="font-semibold text-slate-800">{b.estimatedDistanceKm || 0} km</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-earth-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 truncate">
                    {b.riderName ? b.riderName.split(' ')[0] : 'EV Hub'}
                  </span>
                  <Link
                    href={`/farmer/deliveries/${b.batchId || b.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 hover:underline"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
              Orders Queue
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Recent Orders
            </h2>
          </div>

          <Link
            href="/farmer/orders"
            className="text-xs font-bold text-forest-800 hover:text-forest-950 hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <OrderTable
          orders={displayRecentOrders}
          onAdvanceStatus={handleAdvanceStatus}
          showAllLink={true}
        />
      </div>

      {/* Inventory Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
              Stock Velocity
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Inventory Overview
            </h2>
          </div>

          <Link
            href="/farmer/inventory"
            className="text-xs font-bold text-forest-800 hover:text-forest-950 hover:underline flex items-center gap-1"
          >
            <span>Manage All Stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <InventoryTable
          items={displayInventory}
          onOpenStockModal={handleOpenStockModal}
          compact={true}
        />
      </div>

      {/* Stock Update Modal */}
      <StockUpdateModal
        isOpen={isStockModalOpen}
        item={selectedInventoryItem}
        onClose={() => setIsStockModalOpen(false)}
        onUpdate={handleStockUpdate}
      />
    </div>
  );
}
