'use client';

import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-forest-700',
  iconBg = 'bg-forest-50',
  trend,
  className = '',
}: AdminStatCardProps) {
  return (
    <div
      className={`bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
          {value}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtext && <p className="text-[11px] text-slate-500 font-medium mt-2">{subtext}</p>}
    </div>
  );
}

export default AdminStatCard;
