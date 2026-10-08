import React from 'react';
import { HeartHandshake, Truck, ShieldCheck } from 'lucide-react';

interface PriceBreakdownProps {
  totalAmount?: number;
  showTitle?: boolean;
  compact?: boolean;
}

export function PriceBreakdown({ totalAmount = 100, showTitle = true, compact = false }: PriceBreakdownProps) {
  const farmerShare = Math.round(totalAmount * 0.75);
  const deliveryShare = Math.round(totalAmount * 0.15);
  const platformShare = totalAmount - farmerShare - deliveryShare;

  return (
    <div className={`bg-forest-50/60 rounded-2xl border border-forest-100 ${compact ? 'p-3 text-xs' : 'p-5 sm:p-6'}`}>
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 pb-3 border-b border-forest-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
              Fair Agri Economics
            </span>
            <h4 className="text-base font-bold text-forest-950">Where your money goes</h4>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-forest-200">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            75% directly to farmers
          </span>
        </div>
      )}

      {/* Segmented bar */}
      <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex mb-4">
        <div
          style={{ width: '75%' }}
          className="bg-forest-700 h-full transition-all duration-500"
          title="Farmer Earnings: 75%"
        />
        <div
          style={{ width: '15%' }}
          className="bg-harvest-gold h-full transition-all duration-500"
          title="Eco Delivery: 15%"
        />
        <div
          style={{ width: '10%' }}
          className="bg-emerald-400 h-full transition-all duration-500"
          title="Platform & Quality Audits: 10%"
        />
      </div>

      {/* Breakdown cards */}
      <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-3 gap-3'}`}>
        <div className="bg-white p-3 rounded-xl border border-forest-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Farmer Earnings</div>
            <div className="text-sm font-bold text-forest-900">₹{farmerShare} (75%)</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Local Eco-Delivery</div>
            <div className="text-sm font-bold text-amber-900">₹{deliveryShare} (15%)</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-teal-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Platform & Audits</div>
            <div className="text-sm font-bold text-teal-900">₹{platformShare} (10%)</div>
          </div>
        </div>
      </div>

      {!compact && (
        <p className="mt-4 text-xs text-slate-600 text-center leading-relaxed">
          <strong className="text-forest-900">More transparency. Better value for farmers and consumers.</strong> Conventional retail middlemen take up to 60%. Krishi Market returns 75% back into local soil and farmers.
        </p>
      )}
    </div>
  );
}
