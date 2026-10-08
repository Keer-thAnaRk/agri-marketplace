import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Harvest } from '@/types';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { Calendar, Hash, Sprout, CheckCircle2, AlertTriangle, XCircle, QrCode, ArrowRight } from 'lucide-react';

interface HarvestCardProps {
  harvest: Harvest;
}

export function HarvestCard({ harvest }: HarvestCardProps) {
  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      <span>Available</span>
    </span>
  );

  if (harvest.status === 'Low Stock') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        <span>Low Stock</span>
      </span>
    );
  } else if (harvest.status === 'Sold Out') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" />
        <span>Sold Out</span>
      </span>
    );
  }

  const soldPct = Math.round(
    ((harvest.quantity - harvest.availableQuantity) / harvest.quantity) * 100
  );

  return (
    <div className="bg-white rounded-3xl border border-earth-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {harvest.productImage && (
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-earth-200 bg-earth-100">
                <Image
                  src={harvest.productImage}
                  alt={harvest.productName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div>
              <div className="font-mono text-[11px] font-bold text-forest-800 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span>{harvest.id}</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm leading-tight mt-0.5">
                {harvest.productName}
              </h3>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {statusBadge}
            <FreshnessBadge score={harvest.expectedFreshness} size="sm" />
          </div>
        </div>

        {/* Harvest batch tag & date */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 mb-3">
          <span className="px-2.5 py-1 rounded-xl bg-forest-50 text-forest-900 border border-forest-100 font-mono text-[11px]">
            Batch: {harvest.batchNumber}
          </span>
          <span className="flex items-center gap-1 text-slate-500 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{harvest.harvestDate}</span>
          </span>
        </div>

        {/* Quantity metrics */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-earth-50 rounded-2xl border border-earth-100 text-center text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Harvested</div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {harvest.quantity} {harvest.unit}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available</div>
            <div className="text-base font-extrabold text-emerald-700 mt-0.5">
              {harvest.availableQuantity} {harvest.unit}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1 mt-3">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>Allocated to Orders: {soldPct}%</span>
            <span>{harvest.farmName}</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${100 - soldPct}%` }}
              className="bg-emerald-500 h-full"
              title={`Available: ${100 - soldPct}%`}
            />
            <div
              style={{ width: `${soldPct}%` }}
              className="bg-forest-800 h-full"
              title={`Allocated: ${soldPct}%`}
            />
          </div>
        </div>

        {harvest.notes && (
          <p className="text-[11px] text-slate-500 italic mt-3 bg-earth-50/60 p-2.5 rounded-xl border border-earth-100/70">
            &ldquo;{harvest.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-earth-100 flex items-center justify-between gap-2">
        <Link
          href={`/farmer/harvests/${harvest.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-900 text-xs font-bold border border-forest-200 transition-all cursor-pointer group"
        >
          <QrCode className="w-3.5 h-3.5 text-forest-700" />
          <span>View Trace & QR Code</span>
          <ArrowRight className="w-3 h-3 text-forest-700 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
