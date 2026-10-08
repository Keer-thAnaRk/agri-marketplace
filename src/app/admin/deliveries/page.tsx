'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { AdminDeliveryBatchRecord } from '@/data/admin';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { api } from '@/lib/api';
import {
  Truck,
  Search,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  Clock,
  Package,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDeliveriesPage() {
  const [batches, setBatches] = useState<AdminDeliveryBatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [slotFilter, setSlotFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Load real delivery batches from PostgreSQL via Admin API
  useEffect(() => {
    let isCancelled = false;
    api
      .getAdminDeliveryBatches()
      .then((res) => {
        if (!isCancelled && res.success && Array.isArray(res.data)) {
          setBatches(res.data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Unable to load delivery batches from PostgreSQL. Please try again.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  // Extract unique hubs & slots from real data
  const uniqueHubs = useMemo(
    () => Array.from(new Set(batches.map((b) => b.hub || b.hubArea).filter(Boolean))) as string[],
    [batches]
  );
  const uniqueSlots = useMemo(
    () => Array.from(new Set(batches.map((b) => b.deliverySlot).filter(Boolean))),
    [batches]
  );

  // Normalize status for comparisons
  const normalizeStatus = (status: string) => {
    const s = (status || '').toUpperCase().replace(/\s+/g, '_');
    if (s === 'CREATED') return 'PENDING';
    if (s === 'PACKING') return 'PREPARING';
    if (s === 'READY_FOR_PICKUP') return 'READY';
    if (s === 'DISPATCHED') return 'OUT_FOR_DELIVERY';
    return s;
  };

  // Filter batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const bHub = b.hub || b.hubArea || '';
      if (hubFilter !== 'ALL' && bHub !== hubFilter) return false;

      if (statusFilter !== 'ALL') {
        const filterNorm = normalizeStatus(statusFilter);
        const bNorm = normalizeStatus(b.status);
        if (filterNorm !== bNorm) return false;
      }

      if (slotFilter !== 'ALL' && b.deliverySlot !== slotFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (b.batchCode && b.batchCode.toLowerCase().includes(q)) ||
          (bHub && bHub.toLowerCase().includes(q)) ||
          (b.riderName && b.riderName.toLowerCase().includes(q)) ||
          (b.riderVehicle && b.riderVehicle.toLowerCase().includes(q)) ||
          (b.orderNumbers && b.orderNumbers.some((num) => num.toLowerCase().includes(q)));
        if (!matches) return false;
      }
      return true;
    });
  }, [batches, hubFilter, statusFilter, slotFilter, searchQuery]);

  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBatches.slice(start, start + itemsPerPage);
  }, [filteredBatches, currentPage]);

  const stats = useMemo(() => {
    const total = batches.length;
    const preparing = batches.filter((b) =>
      ['PENDING', 'PREPARING'].includes(normalizeStatus(b.status))
    ).length;
    const ready = batches.filter(
      (b) => normalizeStatus(b.status) === 'READY'
    ).length;
    const outForDelivery = batches.filter(
      (b) => normalizeStatus(b.status) === 'OUT_FOR_DELIVERY'
    ).length;
    const delivered = batches.filter(
      (b) => normalizeStatus(b.status) === 'DELIVERED'
    ).length;
    return { total, preparing, ready, outForDelivery, delivered };
  }, [batches]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Hyperlocal Delivery Batches & Fleet Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor consolidated EV delivery runs, rider assignments, and dawn/sunset slot dispatches
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
            title="Refresh Delivery Batches"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Dispatch Runs"
          value={stats.total}
          subtext="Across all hyperlocal hubs"
          icon={Truck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <AdminStatCard
          title="Packing & Ready"
          value={stats.preparing + stats.ready}
          subtext="Preparing or ready for pickup"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <AdminStatCard
          title="Out for Delivery"
          value={stats.outForDelivery}
          subtext="En route with EV fleet"
          icon={Package}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <AdminStatCard
          title="Delivered"
          value={stats.delivered}
          subtext="Completed customer handovers"
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

      {/* Filters Bar: Hub, Status, Slot, Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by batch code, hub, rider name, vehicle number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Hub */}
          <select
            value={hubFilter}
            onChange={(e) => {
              setHubFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Delivery Hubs</option>
            {uniqueHubs.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Batch Statuses</option>
            <option value="PENDING">Pending (Batch Formed)</option>
            <option value="PREPARING">Preparing (Packing Produce)</option>
            <option value="READY">Ready for Pickup</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery (Dispatched)</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Delivery Slot */}
          <select
            value={slotFilter}
            onChange={(e) => {
              setSlotFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer truncate"
          >
            <option value="ALL">All Delivery Slots</option>
            {uniqueSlots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table: Batch code, Hub, Delivery slot, Orders, Quantity, Rider, Vehicle, Distance, Status */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium pb-2">
              <Loader2 className="w-4 h-4 animate-spin text-forest-600" />
              <span>Loading delivery batches from PostgreSQL...</span>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100/70 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredBatches.length === 0 ? (
          <AdminEmptyState
            icon={Truck}
            title="No Delivery Batches Found"
            description="No delivery batches match the current criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setHubFilter('ALL');
              setStatusFilter('ALL');
              setSlotFilter('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Batch Code</th>
                  <th className="py-3.5 px-4">Hub Area</th>
                  <th className="py-3.5 px-4">Delivery Slot</th>
                  <th className="py-3.5 px-4">Orders</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Rider</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Distance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedBatches.map((b) => {
                  const statusUpper = normalizeStatus(b.status);
                  const isDelivered = statusUpper === 'DELIVERED';
                  const isOut = statusUpper === 'OUT_FOR_DELIVERY';
                  const isReady = statusUpper === 'READY';
                  const isCancelled = statusUpper === 'CANCELLED';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Batch Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <Link
                          href={`/admin/deliveries/${b.id}`}
                          className="hover:underline hover:text-forest-700"
                        >
                          {b.batchCode}
                        </Link>
                      </td>

                      {/* Hub */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900">
                        {b.hub || b.hubArea}
                      </td>

                      {/* Delivery Slot */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {b.deliverySlot}
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          {b.ordersCount || (b.orders ? b.orders.length : 0)} orders
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                        {b.totalQuantity}
                      </td>

                      {/* Rider */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{b.riderName || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-400">{b.riderPhone || 'N/A'}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {b.riderVehicle || 'EV Cargo'}
                      </td>

                      {/* Distance */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        {b.estimatedDistanceKm || 0} km
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : isOut
                              ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                              : isReady
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              : isCancelled
                              ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/deliveries/${b.id}`}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredBatches.length > 0 && (
          <AdminTablePagination
            currentPage={currentPage}
            totalItems={filteredBatches.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
