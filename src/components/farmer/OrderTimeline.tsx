'use client';

import React from 'react';
import { FarmerOrder } from '@/data/orders';
import { FarmerOrderStatus } from '@/types';
import { CheckCircle2, Clock, Package, Sparkles, Check, ArrowRight } from 'lucide-react';

interface OrderTimelineProps {
  order: FarmerOrder;
  onAdvanceStatus: (orderId: string, nextStatus: FarmerOrderStatus) => void;
}

export function OrderTimeline({ order, onAdvanceStatus }: OrderTimelineProps) {
  const getAction = () => {
    switch (order.status) {
      case 'Pending':
        return {
          label: 'Confirm Order',
          nextStatus: 'Confirmed' as FarmerOrderStatus,
          buttonClass: 'bg-forest-800 hover:bg-forest-900 text-white',
          desc: 'Acknowledge harvest availability for this order.',
        };
      case 'Confirmed':
        return {
          label: 'Mark as Preparing',
          nextStatus: 'Preparing' as FarmerOrderStatus,
          buttonClass: 'bg-purple-700 hover:bg-purple-800 text-white',
          desc: 'Begin sunrise cutting, washing, and quality grading.',
        };
      case 'Preparing':
        return {
          label: 'Mark as Ready',
          nextStatus: 'Ready' as FarmerOrderStatus,
          buttonClass: 'bg-teal-700 hover:bg-teal-800 text-white',
          desc: 'Pack produce in aerated kraft crate ready for EV rider handover.',
        };
      case 'Ready':
        return {
          label: 'Mark as Completed',
          nextStatus: 'Completed' as FarmerOrderStatus,
          buttonClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
          desc: 'Confirm handover and unlock direct farmer payout.',
        };
      case 'Completed':
        return null;
      case 'Cancelled':
        return null;
      default:
        return null;
    }
  };

  const action = getAction();

  return (
    <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-earth-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
            Fulfillment Workflow
          </span>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Live Order Timeline
          </h3>
        </div>
        <div className="text-xs font-semibold text-slate-600">
          Current State:{' '}
          <strong className="text-forest-900 font-extrabold uppercase tracking-wide">
            {order.status}
          </strong>
        </div>
      </div>

      {/* Vertical/Horizontal Timeline */}
      <div className="space-y-4">
        {order.timeline.map((step, idx) => {
          const isDone = step.completed;
          const isCurrent = step.current;

          return (
            <div key={idx} className="flex items-start gap-4 relative">
              {/* Vertical connector line */}
              {idx < order.timeline.length - 1 && (
                <div
                  className={`absolute left-4 top-8 -bottom-4 w-0.5 ${
                    isDone ? 'bg-forest-700' : 'bg-earth-200'
                  }`}
                />
              )}

              {/* Status node */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  isDone
                    ? 'bg-forest-800 border-forest-800 text-white shadow-2xs'
                    : isCurrent
                    ? 'bg-amber-500 border-amber-500 text-white animate-pulse shadow-md'
                    : 'bg-white border-earth-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isDone
                        ? 'text-slate-900'
                        : isCurrent
                        ? 'text-amber-900 font-extrabold'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {step.timestamp}
                  </span>
                </div>
                {isCurrent && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                    Action required
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button Section */}
      {action && (
        <div className="pt-4 border-t border-earth-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-earth-50/60 p-4 rounded-2xl">
          <div>
            <div className="text-xs font-bold text-slate-800">Next Action:</div>
            <p className="text-[11px] text-slate-500">{action.desc}</p>
          </div>
          <button
            onClick={() => onAdvanceStatus(order.id, action.nextStatus)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${action.buttonClass}`}
          >
            <span>{action.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {order.status === 'Completed' && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-emerald-900">Order Completed & Fulfilled</div>
            <div className="text-[11px] text-emerald-700">
              Customer confirmed handover. Farmer share of ₹{order.amount} credited to payout balance.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
