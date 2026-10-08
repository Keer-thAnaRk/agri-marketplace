'use client';

import React from 'react';
import { useFarmer } from '@/context/FarmerContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export function FarmerToastContainer() {
  const { toasts, removeToast } = useFarmer();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let colorClasses = 'bg-emerald-950/95 text-emerald-100 border-emerald-800';

        if (toast.type === 'error') {
          Icon = XCircle;
          colorClasses = 'bg-rose-950/95 text-rose-100 border-rose-800';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          colorClasses = 'bg-amber-950/95 text-amber-100 border-amber-800';
        } else if (toast.type === 'info') {
          Icon = Info;
          colorClasses = 'bg-forest-950/95 text-forest-100 border-forest-800';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${colorClasses}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
