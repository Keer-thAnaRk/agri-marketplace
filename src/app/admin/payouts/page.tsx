'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminSaleRecord } from '@/data/admin';
import { api } from '@/lib/api';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import { AdminPayoutModal } from '@/components/admin/AdminPayoutModal';
import {
  Wallet,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  Eye,
  RotateCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface PayoutMetrics {
  pendingCount?: number;
  paidCount?: number;
  refundedCount?: number;
  paidPayoutsAmount?: number;
  pendingPayoutsAmount?: number;
}

export default function AdminPayoutsPage() {
  const [sales, setSales] = useState<AdminSaleRecord[]>([]);
  const [dbMetrics, setDbMetrics] = useState<PayoutMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [activeTab, setActiveTab] = useState<'PENDING' | 'PAID' | 'REFUNDED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected sale for modal
  const [selectedSale, setSelectedSale] = useState<AdminSaleRecord | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError: boolean = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let isCancelled = false;

    api
      .getAdminSales({
        search: searchQuery.trim() || undefined,
      })
      .then((res) => {
        if (!isCancelled && res && res.success && Array.isArray(res.data)) {
          setSales(res.data);
          if (res.metrics) {
            setDbMetrics(res.metrics as PayoutMetrics);
          }
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error('Failed to load admin payouts:', err);
          setError('Unable to load payouts.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, refreshTrigger]);

  // Tab counts
  const pendingCount = dbMetrics?.pendingCount ?? sales.filter((s) => s.status === 'PENDING_PAYOUT').length;
  const paidCount = dbMetrics?.paidCount ?? sales.filter((s) => s.status === 'PAID_OUT' || s.status === 'COMPLETED').length;
  const refundedCount = dbMetrics?.refundedCount ?? sales.filter((s) => s.status === 'REFUNDED').length;

  // Filter payouts based on active tab and search query
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (activeTab === 'PENDING' && s.status !== 'PENDING_PAYOUT') return false;
      if (activeTab === 'PAID' && s.status !== 'PAID_OUT' && s.status !== 'COMPLETED') return false;
      if (activeTab === 'REFUNDED' && s.status !== 'REFUNDED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (s.farmerName && s.farmerName.toLowerCase().includes(q)) ||
          (s.farmName && s.farmName.toLowerCase().includes(q)) ||
          (s.saleCode && s.saleCode.toLowerCase().includes(q)) ||
          (s.orderNumber && s.orderNumber.toLowerCase().includes(q)) ||
          (s.productName && s.productName.toLowerCase().includes(q)) ||
          (s.transactionReference && s.transactionReference.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [sales, activeTab, searchQuery]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage, itemsPerPage]);

  const handleMarkPaid = async (reference: string) => {
    if (!selectedSale) return;
    setIsProcessing(true);
    try {
      const res = await api.markAdminSalePaid(selectedSale.id, {
        transactionReference: reference.trim() || undefined,
        payoutDate: new Date().toISOString(),
      });

      if (res && res.success) {
        showToast(`Payout for ${selectedSale.saleCode} marked as settled with ref ${reference}.`);
        setPayoutModalOpen(false);
        setSelectedSale(null);
        setIsLoading(true);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        throw new Error(res?.message || 'Server rejected payout settlement.');
      }
    } catch (err: unknown) {
      console.error('Failed to mark payout as settled:', err);
      const msg = err instanceof Error ? err.message : 'Operation failed';
      showToast(`Unable to update payout: ${msg}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border animate-in slide-in-from-bottom duration-200 ${
            toastMessage.isError
              ? 'bg-rose-900 border-rose-700'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Farmer Payout Settlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit grower bank disbursements, NEFT/IMPS transaction numbers, and settlement timestamps
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
            title="Refresh Settlements"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/admin/sales"
            className="px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>View Sales Ledger</span>
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

      {/* 3 Tabs: Pending, Paid, Refunded */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('PENDING');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'PENDING'
              ? 'border-amber-600 text-amber-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Payouts</span>
          {pendingCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-extrabold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('PAID');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'PAID'
              ? 'border-emerald-600 text-emerald-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Paid ({paidCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('REFUNDED');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'REFUNDED'
              ? 'border-slate-600 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refunded ({refundedCount})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name, sale ID, order reference, or UTR number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Table: Farmer, Sale, Order, Amount, Status, Payout date, Transaction reference */}
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
            icon={Wallet}
            title="No payouts found"
            description="Zero payout records found for the selected tab."
            actionText="Reset Search"
            onAction={() => {
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Farmer / Farm</th>
                  <th className="py-3.5 px-4">Sale ID</th>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Payout Amount (75%)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payout Date</th>
                  <th className="py-3.5 px-4">Transaction Reference</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Farmer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.farmerName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{s.farmName}</div>
                    </td>

                    {/* Sale */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {s.saleCode}
                    </td>

                    {/* Order */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${s.orderId}`}
                        className="hover:underline text-forest-700 font-bold"
                      >
                        {s.orderNumber}
                      </Link>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-forest-800 text-sm">
                        ₹{Number(s.revenue).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
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

                    {/* Payout Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {s.payoutDate ? new Date(s.payoutDate).toLocaleDateString() : 'Not available'}
                    </td>

                    {/* Transaction Reference */}
                    <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {s.transactionReference ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {s.transactionReference}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not available</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSale(s);
                          setPayoutModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{s.status === 'PENDING_PAYOUT' ? 'Settle' : 'Details'}</span>
                      </button>
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

      {/* Payout Detail Modal */}
      {selectedSale && (
        <AdminPayoutModal
          isOpen={payoutModalOpen}
          onClose={() => {
            if (!isProcessing) {
              setPayoutModalOpen(false);
              setSelectedSale(null);
            }
          }}
          saleCode={selectedSale.saleCode}
          farmerName={selectedSale.farmerName}
          farmName={selectedSale.farmName}
          amount={selectedSale.revenue}
          productName={selectedSale.productName}
          orderNumber={selectedSale.orderNumber}
          bankDetails={selectedSale.bankDetails}
          onMarkPaid={handleMarkPaid}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
