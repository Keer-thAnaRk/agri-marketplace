import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StockBadgeProps {
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | string;
  size?: 'sm' | 'md';
}

export function StockBadge({ status, size = 'sm' }: StockBadgeProps) {
  let styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let Icon = CheckCircle2;
  let label = 'In Stock';

  if (status === 'Low Stock') {
    styles = 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
    Icon = AlertTriangle;
    label = 'Low Stock';
  } else if (status === 'Out of Stock') {
    styles = 'bg-rose-50 text-rose-800 border-rose-200 font-bold';
    Icon = XCircle;
    label = 'Out of Stock';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${sizeClasses} ${styles}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 text-current' : 'w-3.5 h-3.5 text-current'} />
      <span>{label}</span>
    </span>
  );
}
