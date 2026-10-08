'use client';

import React, { useState } from 'react';
import { RotateCcw, X, AlertCircle } from 'lucide-react';

interface AdminResubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  farmerName: string;
  farmName: string;
  isProcessing?: boolean;
}

export function AdminResubmitModal({
  isOpen,
  onClose,
  onConfirm,
  farmerName,
  farmName,
  isProcessing = false,
}: AdminResubmitModalProps) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please specify which documents need resubmission.');
      return;
    }
    onConfirm(notes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
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
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                Request Resubmission
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Request updated documents from <span className="font-bold text-slate-900">{farmerName}</span> ({farmName}).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <span className="font-bold">Backend Endpoint Unavailable:</span> Document resubmission workflow is not currently supported in PostgreSQL backend. To request document updates from this grower, please use <strong>Reject Farmer</strong> with feedback.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2 border border-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Instructions for Farmer <span className="text-amber-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Please upload a higher resolution scan of your Pahani / RTC land record where the survey number is clearly legible."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isProcessing ? 'Submitting...' : 'Send Request (Not Connected)'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminResubmitModal;
