'use client';

import React from 'react';
import { useMarketplace } from '@/context/MarketplaceContext';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useMarketplace();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-white border-forest-200 text-forest-950 shadow-lg';
        let Icon = CheckCircle2;
        let iconColor = 'text-forest-600';

        if (toast.type === 'info') {
          Icon = Info;
          iconColor = 'text-blue-600';
          bg = 'bg-white border-blue-200 text-slate-800 shadow-lg';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-amber-600';
          bg = 'bg-white border-amber-200 text-slate-800 shadow-lg';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          iconColor = 'text-red-600';
          bg = 'bg-white border-red-200 text-slate-800 shadow-lg';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-all duration-300 transform translate-y-0 ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
