'use client';

import React, { useState } from 'react';
import { XCircle, X, AlertTriangle } from 'lucide-react';

interface AdminRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  farmerName: string;
  farmName: string;
  isProcessing?: boolean;
}

export function AdminRejectModal({
  isOpen,
  onClose,
  onConfirm,
  farmerName,
  farmName,
  isProcessing = false,
}: AdminRejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickReasons = [
    'Land ownership certificate or RTC extract is illegible or unverified.',
    'Government Identity (Aadhaar / Voter ID) document copy is unclear.',
    'Farm coordinates are outside the active Bengaluru delivery hub cluster.',
    'Water and soil test report does not meet organic cultivation standards.',
    'Applicant is a commercial trader without direct cultivation records.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific rejection reason.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                Reject Farmer Application
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rejecting verification for <span className="font-bold text-slate-900">{farmerName}</span> (
                {farmName}).
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="State the clear reason for application rejection so the grower can understand the deficit..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Reason Presets
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {quickReasons.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReason(qr);
                      setError('');
                    }}
                    className="w-full text-left text-[11px] p-2 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-900 border border-slate-100 hover:border-rose-200 transition-colors text-slate-600 block"
                  >
                    • {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{isProcessing ? 'Rejecting...' : 'Reject Farmer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminRejectModal;
