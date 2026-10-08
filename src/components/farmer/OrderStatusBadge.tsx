import React from 'react';
import { FarmerOrderStatus } from '@/types';
import { Clock, CheckCircle2, Package, Sparkles, Check, XCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: FarmerOrderStatus | string;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ status, size = 'sm' }: OrderStatusBadgeProps) {
  const normStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  let styles = 'bg-amber-50 text-amber-800 border-amber-200';
  let Icon = Clock;

  switch (normStatus) {
    case 'Pending':
      styles = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = Clock;
      break;
    case 'Confirmed':
      styles = 'bg-sky-50 text-sky-800 border-sky-200';
      Icon = CheckCircle2;
      break;
    case 'Preparing':
      styles = 'bg-purple-50 text-purple-800 border-purple-200';
      Icon = Package;
      break;
    case 'Ready':
      styles = 'bg-teal-50 text-teal-800 border-teal-200';
      Icon = Sparkles;
      break;
    case 'Completed':
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = Check;
      break;
    case 'Cancelled':
      styles = 'bg-rose-50 text-rose-800 border-rose-200';
      Icon = XCircle;
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border transition-colors ${sizeClasses} ${styles}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{normStatus}</span>
    </span>
  );
}
