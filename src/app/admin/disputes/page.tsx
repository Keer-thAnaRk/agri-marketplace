'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminDisputeRecord } from '@/data/admin';
import { api } from '@/lib/api';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import { AdminDisputeModal } from '@/components/admin/AdminDisputeModal';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import {
  AlertOctagon,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  MessageSquare,
  RotateCw,
  AlertCircle,
  Loader2,
  Star,
} from 'lucide-react';

interface DisputeMetrics {
  totalDisputes: number;
  openCount: number;
  reviewCount: number;
  resolvedCount: number;
  rejectedCount: number;
  totalDisputedAmount: number;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<AdminDisputeRecord[]>([]);
  const [dbMetrics, setDbMetrics] = useState<DisputeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [activeTab, setActiveTab] = useState<'ALL' | 'Open' | 'Under Review' | 'Resolved' | 'Rejected'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected dispute for modal
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isCancelled = false;

    api
      .getAdminDisputes({
        search: searchQuery.trim() || undefined,
        status: activeTab !== 'ALL' ? activeTab : undefined,
      })
      .then((res) => {
        if (!isCancelled && res && res.success && Array.isArray(res.data)) {
          setDisputes(res.data);
          if (res.metrics) {
            setDbMetrics(res.metrics as DisputeMetrics);
          }
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error('Failed to load admin disputes:', err);
          setError('Unable to load disputes.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, activeTab, refreshTrigger]);

  // Tab counts
  const totalCount = dbMetrics?.totalDisputes ?? disputes.length;
  const openCount = dbMetrics?.openCount ?? disputes.filter((d) => d.status === 'Open' || d.rawStatus === 'OPEN').length;
  const reviewCount = dbMetrics?.reviewCount ?? disputes.filter((d) => d.status === 'Under Review' || d.rawStatus === 'UNDER_REVIEW').length;
  const resolvedCount = dbMetrics?.resolvedCount ?? disputes.filter((d) => d.status === 'Resolved' || d.rawStatus === 'RESOLVED').length;
  const rejectedCount = dbMetrics?.rejectedCount ?? disputes.filter((d) => d.status === 'Rejected' || d.rawStatus === 'REJECTED').length;

  // Filter disputes on client for instant responsiveness
  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      if (activeTab !== 'ALL') {
        const matchesTab =
          d.status === activeTab ||
          d.rawStatus === activeTab ||
          (activeTab === 'Open' && (d.status === 'Open' || d.rawStatus === 'OPEN')) ||
          (activeTab === 'Under Review' && (d.status === 'Under Review' || d.rawStatus === 'UNDER_REVIEW')) ||
          (activeTab === 'Resolved' && (d.status === 'Resolved' || d.rawStatus === 'RESOLVED')) ||
          (activeTab === 'Rejected' && (d.status === 'Rejected' || d.rawStatus === 'REJECTED'));
        if (!matchesTab) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (d.disputeNumber && d.disputeNumber.toLowerCase().includes(q)) ||
          (d.orderNumber && d.orderNumber.toLowerCase().includes(q)) ||
          (d.customerName && d.customerName.toLowerCase().includes(q)) ||
          (d.farmerName && d.farmerName.toLowerCase().includes(q)) ||
          (d.productName && d.productName.toLowerCase().includes(q)) ||
          (d.reason && d.reason.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [disputes, activeTab, searchQuery]);

  const paginatedDisputes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDisputes.slice(start, start + itemsPerPage);
  }, [filteredDisputes, currentPage, itemsPerPage]);

  // Action handlers
  const handleStartReview = async () => {
    if (!selectedDispute) return;
    try {
      const res = await api.updateAdminDisputeStatus(selectedDispute.id, {
        status: 'UNDER_REVIEW',
      });
      if (res && res.success) {
        showToast(`Dispute ${selectedDispute.disputeNumber} marked Under Review.`);
        setModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast('Failed to update dispute status.');
      }
    } catch (err: unknown) {
      console.error('Error updating dispute to Under Review:', err);
      const message = err instanceof Error ? err.message : 'Error updating dispute status.';
      showToast(message);
    }
  };

  const handleResolve = async (notes: string) => {
    if (!selectedDispute) return;
    try {
      const res = await api.updateAdminDisputeStatus(selectedDispute.id, {
        status: 'RESOLVED',
        resolution: notes,
        resolutionNote: notes,
      });
      if (res && res.success) {
        showToast(`Dispute ${selectedDispute.disputeNumber} resolved.`);
        setModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast('Failed to resolve dispute.');
      }
    } catch (err: unknown) {
      console.error('Error resolving dispute:', err);
      const message = err instanceof Error ? err.message : 'Error resolving dispute.';
      showToast(message);
    }
  };

  const handleReject = async (notes: string) => {
    if (!selectedDispute) return;
    try {
      const res = await api.updateAdminDisputeStatus(selectedDispute.id, {
        status: 'REJECTED',
        resolution: notes,
        resolutionNote: notes,
      });
      if (res && res.success) {
        showToast(`Dispute ${selectedDispute.disputeNumber} rejected.`);
        setModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast('Failed to reject dispute.');
      }
    } catch (err: unknown) {
      console.error('Error rejecting dispute:', err);
      const message = err instanceof Error ? err.message : 'Error rejecting dispute.';
      showToast(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Quality Disputes & Claims Mediation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Handle customer produce feedback, transit damage claims, and fair grower arbitration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/reviews"
            className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Customer Reviews</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
            title="Refresh disputes"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-forest-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Dispute Cases"
          value={totalCount}
          subtext="Customer quality & transit claims"
          icon={AlertOctagon}
          iconColor="text-slate-800"
        />
        <AdminStatCard
          title="Open (Action Required)"
          value={openCount}
          subtext="Awaiting governance review"
          icon={AlertTriangle}
          iconColor="text-rose-600"
        />
        <AdminStatCard
          title="Under Investigation"
          value={reviewCount}
          subtext="Telemetry & grower arbitration"
          icon={Clock}
          iconColor="text-amber-600"
        />
        <AdminStatCard
          title="Disputed Claims Total"
          value={`₹${(dbMetrics?.totalDisputedAmount ?? 0).toLocaleString()}`}
          subtext={`${resolvedCount} resolved settlements`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
        />
      </div>

      {/* Error State Banner */}
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
            className="font-bold underline hover:text-rose-950 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Tabs: Open, Under Review, Resolved, Rejected */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('ALL');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'border-forest-700 text-forest-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Disputes ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('Open');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'Open'
              ? 'border-rose-600 text-rose-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Open</span>
          {openCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-extrabold">
              {openCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('Under Review');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'Under Review'
              ? 'border-amber-600 text-amber-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Under Review ({reviewCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('Resolved');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'Resolved'
              ? 'border-emerald-600 text-emerald-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Resolved ({resolvedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('Rejected');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'Rejected'
              ? 'border-slate-600 text-slate-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Rejected ({rejectedCount})</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by dispute ID, order reference, customer, or crop..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading claims & mediation records...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <AdminEmptyState
            icon={AlertOctagon}
            title="No Disputes Found"
            description="Zero dispute tickets match the selected status or query."
            actionText="Show All Disputes"
            onAction={() => {
              setActiveTab('ALL');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Dispute ID</th>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Product / Grower</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedDisputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Dispute ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <Link
                        href={`/admin/disputes/${d.id}`}
                        className="hover:underline hover:text-rose-700"
                      >
                        {d.disputeNumber}
                      </Link>
                    </td>

                    {/* Order Ref */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${d.orderId}`}
                        className="hover:underline text-forest-700"
                      >
                        {d.orderNumber}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{d.customerName}</div>
                      <div className="text-[11px] text-slate-400">{d.customerEmail}</div>
                    </td>

                    {/* Product & Farmer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{d.productName}</div>
                      <div className="text-[11px] text-slate-400">{d.farmerName}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                      ₹{d.amount}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="truncate text-slate-800 font-medium">{d.reason}</div>
                      <div className="text-[11px] text-slate-400 truncate">{d.description}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Resolved' || d.rawStatus === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : d.status === 'Under Review' || d.rawStatus === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : d.status === 'Open' || d.rawStatus === 'OPEN'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {d.date ? new Date(d.date).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/disputes/${d.id}`}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDispute(d);
                            setModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Action</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminTablePagination
          currentPage={currentPage}
          totalItems={filteredDisputes.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Action Modal */}
      {selectedDispute && (
        <AdminDisputeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          disputeNumber={selectedDispute.disputeNumber}
          customerName={selectedDispute.customerName}
          farmerName={selectedDispute.farmerName}
          productName={selectedDispute.productName}
          amount={selectedDispute.amount}
          reason={selectedDispute.reason}
          currentStatus={selectedDispute.status}
          onResolve={handleResolve}
          onReject={handleReject}
          onStartReview={handleStartReview}
        />
      )}
    </div>
  );
}
