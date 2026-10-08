'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { AdminOrderRecord } from '@/data/admin';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { api } from '@/lib/api';
import {
  Package,
  Search,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  Clock,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [farmerFilter, setFarmerFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Load real orders from PostgreSQL via Admin API
  useEffect(() => {
    let isCancelled = false;
    api
      .getAdminOrders()
      .then((res) => {
        if (!isCancelled && res.success && Array.isArray(res.data)) {
          setOrders(res.data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Unable to load orders from PostgreSQL. Please try again.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  // Extract unique farmers for filter from live data
  const uniqueFarmers = useMemo(
    () => Array.from(new Set(orders.map((o) => o.farmerName).filter(Boolean))),
    [orders]
  );

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status.toUpperCase() !== statusFilter.toUpperCase()) {
        return false;
      }
      if (paymentFilter !== 'ALL' && o.paymentStatus.toUpperCase() !== paymentFilter.toUpperCase()) {
        return false;
      }
      if (farmerFilter !== 'ALL' && o.farmerName !== farmerFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
          (o.farmerName && o.farmerName.toLowerCase().includes(q)) ||
          (o.farmName && o.farmName.toLowerCase().includes(q)) ||
          (o.deliveryAddress?.hub && o.deliveryAddress.hub.toLowerCase().includes(q)) ||
          (o.deliveryAddress?.addressLine && o.deliveryAddress.addressLine.toLowerCase().includes(q)) ||
          (o.items && o.items.some((item) => item.productName && item.productName.toLowerCase().includes(q)));
        if (!matches) return false;
      }
      return true;
    });
  }, [orders, statusFilter, paymentFilter, farmerFilter, searchQuery]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pendingFulfillment = orders.filter((o) =>
      ['PLACED', 'CONFIRMED', 'HARVESTING', 'PACKED'].includes(
        o.orderStatus?.toUpperCase() || o.status?.toUpperCase() || ''
      )
    ).length;
    const outForDelivery = orders.filter(
      (o) =>
        (o.orderStatus?.toUpperCase() || o.status?.toUpperCase() || '') ===
        'OUT_FOR_DELIVERY'
    ).length;
    const delivered = orders.filter(
      (o) =>
        (o.orderStatus?.toUpperCase() || o.status?.toUpperCase() || '') ===
        'DELIVERED'
    ).length;
    return { total, pendingFulfillment, outForDelivery, delivered };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Platform Orders & Dispatch Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time multi-farmer consumer orders, delivery batches, and fulfillment status across Bengaluru
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Orders"
          value={stats.total}
          subtext="Recorded across all hubs"
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <AdminStatCard
          title="In Fulfillment"
          value={stats.pendingFulfillment}
          subtext="Placed, harvesting or packing"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <AdminStatCard
          title="Out for Delivery"
          value={stats.outForDelivery}
          subtext="En route with eco-riders"
          icon={Truck}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <AdminStatCard
          title="Delivered"
          value={stats.delivered}
          subtext="Completed doorstep deliveries"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors self-start sm:self-auto shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters Bar: Search, Order Status, Payment Status, Farmer */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, consumer name, farmer, hub, product..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Order Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="HARVESTING">Harvesting</option>
            <option value="PACKED">Packed</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid (Settled via UPI / Card)</option>
            <option value="PENDING">Pending Payment</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Farmer */}
          <select
            value={farmerFilter}
            onChange={(e) => {
              setFarmerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer truncate"
          >
            <option value="ALL">All Fulfilling Farmers</option>
            {uniqueFarmers.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium pb-2">
              <Loader2 className="w-4 h-4 animate-spin text-forest-600" />
              <span>Loading platform orders from PostgreSQL...</span>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100/70 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <AdminEmptyState
            icon={Package}
            title="No Orders Found"
            description="No orders match the current criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setPaymentFilter('ALL');
              setFarmerFilter('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Farmer / Farm</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4">Delivery Slot</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="hover:underline hover:text-forest-700"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{o.customerName}</div>
                      <div className="text-[11px] text-slate-400">{o.customerPhone}</div>
                    </td>

                    {/* Farmer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{o.farmerName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{o.farmName}</div>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{o.items ? o.items.length : 0} items</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {o.items ? o.items.map((i) => i.productName).join(', ') : ''}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900">₹{o.total}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        ₹{o.farmerEarnings} to farmer
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                        }`}
                      >
                        {o.paymentStatus} ({o.paymentMethod})
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Delivery Slot */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <div className="font-semibold">{o.deliverySlot?.name || 'Standard'}</div>
                      <div className="text-[10px] text-slate-400">{o.deliverySlot?.timeRange || 'Morning Slot'}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredOrders.length > 0 && (
          <AdminTablePagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
