import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface VerifiedBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
}

export function VerifiedBadge({ label = 'Verified Farmer', size = 'sm' }: VerifiedBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-full shadow-2xs ${sizeClass}`}
      title="Verified by Krishi Market via physical soil, water and identity audits"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
      <span>{label}</span>
    </span>
  );
}
