'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminDisputeRecord } from '@/data/admin';
import { AdminDisputeModal } from '@/components/admin/AdminDisputeModal';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Loader2,
} from 'lucide-react';

export default function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const disputeId = resolvedParams.disputeId;

  const [dispute, setDispute] = useState<AdminDisputeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isCancelled = false;

    api
      .getAdminDisputeById(disputeId)
      .then((res) => {
        if (!isCancelled) {
          if (res && res.success && res.data) {
            setDispute(res.data);
            setError(null);
          } else {
            setDispute(null);
            setError('Dispute not found.');
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error('Failed to load admin dispute:', err);
          setError('Unable to load dispute details.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [disputeId, refreshTrigger]);

  const handleStartReview = async () => {
    if (!dispute) return;
    try {
      const res = await api.updateAdminDisputeStatus(dispute.id, {
        status: 'UNDER_REVIEW',
      });
      if (res && res.success) {
        showToast('Dispute marked as Under Review.');
        setModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast('Failed to mark dispute under review.');
      }
    } catch (err: unknown) {
      console.error('Error starting review:', err);
      const message = err instanceof Error ? err.message : 'Error updating dispute status.';
      showToast(message);
    }
  };

  const handleResolve = async (notes: string) => {
    if (!dispute) return;
    try {
      const res = await api.updateAdminDisputeStatus(dispute.id, {
        status: 'RESOLVED',
        resolution: notes,
        resolutionNote: notes,
      });
      if (res && res.success) {
        showToast('Dispute successfully resolved.');
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
    if (!dispute) return;
    try {
      const res = await api.updateAdminDisputeStatus(dispute.id, {
        status: 'REJECTED',
        resolution: notes,
        resolutionNote: notes,
      });
      if (res && res.success) {
        showToast('Dispute claim has been rejected.');
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

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading dispute dossier...</p>
      </div>
    );
  }

  if (error && !dispute) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/disputes"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 font-serif">Dispute Details</h1>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <AdminEmptyState
            icon={AlertOctagon}
            title="Dispute Not Found"
            description="The requested dispute dossier could not be located in records."
            actionText="Back to Disputes"
            onAction={() => {
              router.push('/admin/disputes');
            }}
          />
        </div>
      </div>
    );
  }

  if (!dispute) return null;

  const isOpen = dispute.status === 'Open' || dispute.rawStatus === 'OPEN';
  const isResolved = dispute.status === 'Resolved' || dispute.rawStatus === 'RESOLVED';
  const isUnderReview = dispute.status === 'Under Review' || dispute.rawStatus === 'UNDER_REVIEW';

  const resolutionText = dispute.resolutionNote || dispute.resolution;
  const timeline = dispute.timeline || [];

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/disputes"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dispute Arbitration Dossier
              </span>
              <span className="font-mono text-[11px] text-slate-500 font-bold">{dispute.disputeNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Mediation Details
            </h1>
          </div>
        </div>

        {/* Action Buttons: Start Review, Resolve, Reject */}
        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              type="button"
              onClick={handleStartReview}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Start Review</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Mediation Actions</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`p-4 rounded-3xl border flex items-center justify-between gap-4 ${
          isResolved
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : isUnderReview
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : isOpen
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : 'bg-slate-100 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-6 h-6" />
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
              Current Mediation Status
            </div>
            <div className="text-base font-extrabold">{dispute.status}</div>
          </div>
        </div>
        <div className="text-xs font-semibold">
          Filed on {dispute.date ? new Date(dispute.date).toLocaleDateString() : 'N/A'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 Cols): Dispute Details, Description, Resolution & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Reason & Description */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
              Claim Summary & Consumer Statement
            </h2>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="font-bold text-slate-900 text-sm">{dispute.reason}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{dispute.description}</p>
            </div>
          </div>

          {/* Resolution section */}
          {resolutionText && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                  Official Settlement Resolution
                </h2>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                {resolutionText}
              </p>
            </div>
          )}

          {/* Mediation Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
              Mediation Case Timeline
            </h2>

            <div className="relative pl-5 border-l-2 border-slate-100 space-y-4 my-2">
              {timeline.length > 0 ? (
                timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 bg-emerald-600 ring-emerald-200" />
                    <div className="text-xs font-bold text-slate-900">{step.stage}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{step.note}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {step.timestamp} • Actor: {step.actor}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No timeline entries recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Customer, Order, Product, Amount */}
        <div className="lg:col-span-4 space-y-6">
          {/* Claim Financials */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Claim Amount</span>
            <div className="text-3xl font-extrabold text-slate-900">₹{dispute.amount}</div>
            <p className="text-[11px] text-slate-500">Subject to direct grower & hub arbitration</p>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</span>
            <div className="font-bold text-slate-900 text-sm">{dispute.customerName}</div>
            <div className="text-slate-600">{dispute.customerEmail}</div>
            {dispute.customerPhone && <div className="text-slate-400">{dispute.customerPhone}</div>}
          </div>

          {/* Order & Product Info */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order & Crop</span>
            <div>
              <span className="text-slate-400 block text-[11px]">Produce:</span>
              <span className="font-bold text-slate-900">{dispute.productName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Grower:</span>
              <span className="font-semibold text-slate-800">{dispute.farmerName}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-forest-700">{dispute.orderNumber}</span>
              <Link
                href={`/admin/orders/${dispute.orderId}`}
                className="text-xs text-forest-700 hover:underline inline-flex items-center gap-1 font-bold"
              >
                <span>View Order</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      <AdminDisputeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        disputeNumber={dispute.disputeNumber}
        customerName={dispute.customerName}
        farmerName={dispute.farmerName}
        productName={dispute.productName}
        amount={dispute.amount}
        reason={dispute.reason}
        currentStatus={dispute.status}
        onResolve={handleResolve}
        onReject={handleReject}
        onStartReview={handleStartReview}
      />
    </div>
  );
}
