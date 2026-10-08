import React from 'react';
import { Tractor, Sprout, ShoppingBag, Truck, CheckCircle2, ArrowRight } from 'lucide-react';

interface HarvestTimelineProps {
  farmName?: string;
  batchNumber?: string;
  harvestDate?: string;
  quantityHarvested?: string;
  availableQuantity?: string;
  freshnessScore?: number;
}

export function HarvestTraceabilityTimeline({
  farmName = 'Green Valley Farm',
  batchNumber = 'TOM-2409-A',
  harvestDate = 'Sept 24, 2026',
  quantityHarvested = '100 kg',
  availableQuantity = '65 kg',
  freshnessScore = 92,
}: HarvestTimelineProps) {
  const steps = [
    {
      label: 'FARM',
      title: farmName,
      detail: 'HSR Layout / Sarjapur, Bengaluru',
      icon: Tractor,
      completed: true,
      badge: 'Certified Organic',
    },
    {
      label: 'HARVEST',
      title: `Batch: ${batchNumber}`,
      detail: `Harvested: ${harvestDate} (${quantityHarvested})`,
      icon: Sprout,
      completed: true,
      badge: `Freshness: ${freshnessScore}/100`,
    },
    {
      label: 'PRODUCT',
      title: 'Produce Catalog Listed',
      detail: `Available: ${availableQuantity}`,
      icon: ShoppingBag,
      completed: true,
      badge: 'Active in Marketplace',
    },
    {
      label: 'ORDER',
      title: 'Consumer Fulfillment',
      detail: 'Hyperlocal 4-hr Cold Route Dispatch',
      icon: Truck,
      completed: false,
      badge: 'Pending Hub Call',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-earth-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
            Seed-to-Fork Traceability Architecture
          </span>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Harvest Traceability Pipeline
          </h3>
        </div>
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
          Audit Score: {freshnessScore}/100
        </span>
      </div>

      {/* Horizontal Step Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className={`p-4 rounded-2xl border transition-all relative ${
                step.completed
                  ? 'bg-forest-50/50 border-forest-200/80'
                  : 'bg-earth-50/40 border-earth-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold tracking-wider text-forest-800 uppercase px-2 py-0.5 rounded-md bg-white border border-forest-200">
                  {step.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    step.completed
                      ? 'bg-forest-800 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="font-bold text-slate-900 text-xs mt-1 truncate">
                {step.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {step.detail}
              </div>

              <div className="mt-2.5 pt-2 border-t border-earth-200/60 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-forest-700">
                  {step.badge}
                </span>
                {step.completed && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
