'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminSaleRecord } from '@/data/admin';
import { api } from '@/lib/api';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import {
  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  Package,
  Wallet,
  RotateCw,
  AlertCircle,
} from 'lucide-react';

interface SalesMetrics {
  totalSales?: number;
  totalRevenue?: number;
  totalGrossRevenue?: number;
  totalFarmerRevenue?: number;
  completedSalesCount?: number;
  pendingPayoutsAmount?: number;
  paidPayoutsAmount?: number;
  refundedAmount?: number;
  pendingCount?: number;
  paidCount?: number;
  refundedCount?: number;
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<AdminSaleRecord[]>([]);
  const [dbMetrics, setDbMetrics] = useState<SalesMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    let isCancelled = false;

    api
      .getAdminSales({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      })
      .then((res) => {
        if (!isCancelled && res && res.success && Array.isArray(res.data)) {
          setSales(res.data);
          if (res.metrics) {
            setDbMetrics(res.metrics as SalesMetrics);
          }
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error('Failed to load admin sales:', err);
          setError('Unable to load sales.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, statusFilter, refreshTrigger]);

  // Compute stat card metrics directly from live data
  const totalSalesCount = dbMetrics?.totalSales ?? sales.length;
  const totalRevenue = dbMetrics?.totalRevenue ?? sales.reduce((acc, s) => acc + (s.grossAmount || 0), 0);
  const completedSalesCount = dbMetrics?.completedSalesCount ?? sales.filter((s) => s.status === 'PAID_OUT' || s.status === 'COMPLETED').length;
  const pendingPayoutsAmount = dbMetrics?.pendingPayoutsAmount ?? sales
    .filter((s) => s.status === 'PENDING_PAYOUT')
    .reduce((acc, s) => acc + s.revenue, 0);
  const paidPayoutsAmount = dbMetrics?.paidPayoutsAmount ?? sales
    .filter((s) => s.status === 'PAID_OUT')
    .reduce((acc, s) => acc + s.revenue, 0);

  // Client-side search & filtering fallback for instantaneous responsiveness
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (s.saleCode && s.saleCode.toLowerCase().includes(q)) ||
          (s.farmerName && s.farmerName.toLowerCase().includes(q)) ||
          (s.farmName && s.farmName.toLowerCase().includes(q)) ||
          (s.productName && s.productName.toLowerCase().includes(q)) ||
          (s.orderNumber && s.orderNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [sales, statusFilter, searchQuery]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Financial & Sales Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent revenue distribution auditing the strict 75% direct grower share rule
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/admin/payouts"
            className="px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Wallet className="w-4 h-4" />
            <span>Manage Farmer Payouts</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5 Stat Cards as Required */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <AdminStatCard
          title="Total Sales"
          value={isLoading ? '...' : totalSalesCount}
          subtext="Delivered transactions"
          icon={Package}
          iconColor="text-blue-700"
          iconBg="bg-blue-50"
        />

        <AdminStatCard
          title="Total Revenue"
          value={isLoading ? '...' : `₹${Number(totalRevenue).toLocaleString()}`}
          subtext="Gross produce value"
          icon={TrendingUp}
          iconColor="text-forest-700"
          iconBg="bg-forest-50"
        />

        <AdminStatCard
          title="Completed Sales"
          value={isLoading ? '...' : completedSalesCount}
          subtext="Fully settled orders"
          icon={CheckCircle2}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50"
        />

        <AdminStatCard
          title="Pending Payouts"
          value={isLoading ? '...' : `₹${Number(pendingPayoutsAmount).toFixed(0)}`}
          subtext="Scheduled for transfer"
          icon={Clock}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
        />

        <AdminStatCard
          title="Paid Payouts"
          value={isLoading ? '...' : `₹${Number(paidPayoutsAmount).toFixed(0)}`}
          subtext="Settled to grower banks"
          icon={IndianRupee}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Filters Bar: Search & Status */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by sale ID, farmer, product, order number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
        >
          <option value="ALL">All Payout Statuses</option>
          <option value="PAID_OUT">Paid Out</option>
          <option value="PENDING_PAYOUT">Pending Payout</option>
          <option value="REFUNDED">Refunded</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Sales Table: Sale ID, Farmer, Product, Order, Quantity, Revenue, Status, Date */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 space-y-4">
            <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-lg w-full animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-lg w-full animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-lg w-full animate-pulse" />
          </div>
        ) : filteredSales.length === 0 ? (
          <AdminEmptyState
            icon={IndianRupee}
            title="No sales found."
            description="Zero sales records match the specified criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Sale ID</th>
                  <th className="py-3.5 px-4">Farmer / Farm</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Farmer Revenue (75%)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sale ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {s.saleCode}
                    </td>

                    {/* Farmer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{s.farmerName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{s.farmName}</div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{s.productName}</div>
                      <div className="text-[11px] text-slate-400">{s.category}</div>
                    </td>

                    {/* Order Ref */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${s.orderId}`}
                        className="hover:underline text-forest-700 font-bold"
                      >
                        {s.orderNumber}
                      </Link>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                      {s.quantity} {s.unit}
                    </td>

                    {/* Revenue (75%) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-forest-800 text-sm">
                        ₹{Number(s.revenue).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Gross: ₹{Number(s.grossAmount).toFixed(2)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'PAID_OUT' || s.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : s.status === 'PENDING_PAYOUT'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : s.status === 'REFUNDED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminTablePagination
          currentPage={currentPage}
          totalItems={filteredSales.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
