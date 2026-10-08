import React from 'react';
import { TraceabilityStep } from '@/types';
import { Sprout, Scissors, PackageCheck, Truck, Home, CheckCircle2, Clock } from 'lucide-react';

interface TraceabilityTimelineProps {
  steps: TraceabilityStep[];
  productName?: string;
  farmName?: string;
}

export function TraceabilityTimeline({ steps, productName, farmName }: TraceabilityTimelineProps) {
  const getStepIcon = (step: TraceabilityStep['step']) => {
    switch (step) {
      case 'farm':
        return <Sprout className="w-4 h-4" />;
      case 'harvest':
        return <Scissors className="w-4 h-4" />;
      case 'pack':
        return <PackageCheck className="w-4 h-4" />;
      case 'dispatch':
        return <Truck className="w-4 h-4" />;
      case 'delivery':
        return <Home className="w-4 h-4" />;
      default:
        return <Sprout className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-earth-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-earth-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
            Verified Traceability Journey
          </span>
          <h4 className="text-lg font-bold text-slate-900 mt-1">
            {productName ? `${productName} – Farm to Doorstep` : 'Know where your food comes from'}
          </h4>
        </div>
        {farmName && (
          <div className="text-xs text-slate-500 font-medium">
            Origin: <span className="font-semibold text-forest-800">{farmName}</span>
          </div>
        )}
      </div>

      {/* Desktop Horizontal / Mobile Vertical Timeline */}
      <div className="relative">
        {/* Desktop connected line */}
        <div className="hidden md:block absolute top-6 left-6 right-6 h-1 bg-earth-200 -z-0" />

        {/* Show empty state if no steps */}
        {!steps || steps.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Traceability information not available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-3 relative z-10">
            {steps.map((item, index) => {
            const isDone = item.completed;
            return (
              <div key={index} className="flex md:flex-col items-start gap-4 md:gap-2 group">
                {/* Status node */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                    isDone
                      ? 'bg-forest-700 border-forest-800 text-white shadow-md shadow-forest-800/20'
                      : 'bg-white border-dashed border-earth-300 text-slate-400'
                  }`}
                >
                  {getStepIcon(item.step)}
                </div>

                {/* Details */}
                <div className="flex-1 md:text-left min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      {item.title}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-forest-800 mb-0.5 truncate">
                    {item.location}
                  </div>
                  <div className="text-[10px] text-slate-400 mb-1">
                    {item.timestamp}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {item.details}
                  </p>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
