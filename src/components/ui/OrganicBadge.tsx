import React from 'react';
import { FarmingMethod } from '@/types';
import { ShieldCheck, Droplets, Sparkles, Sprout } from 'lucide-react';

interface OrganicBadgeProps {
  method: FarmingMethod;
  isOrganic?: boolean;
  size?: 'sm' | 'md';
}

export function OrganicBadge({ method, isOrganic, size = 'sm' }: OrganicBadgeProps) {
  const text = method;
  let bg = 'bg-forest-50 text-forest-800 border-forest-200';
  let Icon = Sprout;

  if (method === 'Hydroponic') {
    bg = 'bg-cyan-50 text-cyan-800 border-cyan-200';
    Icon = Droplets;
  } else if (method === 'Natural (ZBNF)') {
    bg = 'bg-amber-50 text-amber-900 border-amber-200';
    Icon = Sparkles;
  } else if (isOrganic || method === 'Organic') {
    bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    Icon = ShieldCheck;
  }

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border ${bg} ${sizeClass}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{text}</span>
    </span>
  );
}
