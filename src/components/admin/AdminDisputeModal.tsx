'use client';

import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, XCircle, X } from 'lucide-react';

interface AdminDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeNumber: string;
  customerName: string;
  farmerName: string;
  productName: string;
  amount: number;
  reason: string;
  currentStatus: string;
  onResolve: (notes: string) => void;
  onReject: (notes: string) => void;
  onStartReview: () => void;
}

export function AdminDisputeModal({
  isOpen,
  onClose,
  disputeNumber,
  customerName,
  farmerName,
  productName,
  amount,
  reason,
  currentStatus,
  onResolve,
  onReject,
  onStartReview,
}: AdminDisputeModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState(
    'Full resolution verified with customer and farm advisor. Credit issued.'
  );
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'resolve' | 'reject'>('resolve');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                  Dispute Actions: {disputeNumber}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {productName} • ₹{amount} dispute filed by {customerName}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1 mb-4">
            <div className="font-semibold text-slate-800">Reported Issue:</div>
            <p className="text-slate-600 italic">&ldquo;{reason}&rdquo;</p>
            <div className="text-[11px] text-slate-500 pt-1">
              Grower: <span className="font-semibold text-slate-800">{farmerName}</span>
            </div>
          </div>

          {currentStatus === 'Open' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
              <div className="text-xs text-blue-900 font-medium">
                Dispute is currently Open. Begin investigation?
              </div>
              <button
                type="button"
                onClick={onStartReview}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Mark Under Review
              </button>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('resolve')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'resolve'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolve with Settlement
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reject')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'reject'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reject Dispute
            </button>
          </div>

          {activeTab === 'resolve' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Resolution & Settlement Notes
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="State the resolution details and any wallet refund/credit issued..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onResolve(resolutionNotes)}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Resolution</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Explain why this dispute does not meet quality compensation terms..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900"
              />
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onReject(rejectionNotes)}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Claim</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDisputeModal;
