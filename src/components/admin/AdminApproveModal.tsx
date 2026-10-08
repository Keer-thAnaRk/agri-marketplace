'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface AdminApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  farmerName: string;
  farmName: string;
  isProcessing?: boolean;
}

export function AdminApproveModal({
  isOpen,
  onClose,
  onConfirm,
  farmerName,
  farmName,
  isProcessing = false,
}: AdminApproveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-extrabold text-slate-900 font-serif">
            Approve Farmer Verification
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            You are approving <span className="font-bold text-slate-900">{farmerName}</span> of{' '}
            <span className="font-bold text-slate-900">{farmName}</span>.
          </p>

          <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-left text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Immediate Marketplace Permissions</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Upon approval, the farmer will immediately be able to list harvest batches, manage real-time inventory, and receive direct consumer orders.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessing ? 'Approving...' : 'Confirm Approval'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminApproveModal;
