import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accentColor?: 'forest' | 'amber' | 'emerald' | 'sky';
  subtitle?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trendText,
  trendDirection = 'up',
  accentColor = 'forest',
  subtitle,
}: StatCardProps) {
  let iconBg = 'bg-forest-50 text-forest-700 border-forest-100';
  if (accentColor === 'amber') iconBg = 'bg-amber-50 text-amber-700 border-amber-100';
  if (accentColor === 'emerald') iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (accentColor === 'sky') iconBg = 'bg-sky-50 text-sky-700 border-sky-100';

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-earth-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
          {value}
        </div>

        {trendText && (
          <div className="flex items-center gap-1.5 mt-2">
            {trendDirection === 'up' && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>{trendText}</span>
              </span>
            )}
            {trendDirection === 'down' && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                <TrendingDown className="w-3 h-3 text-rose-600" />
                <span>{trendText}</span>
              </span>
            )}
            {trendDirection === 'neutral' && (
              <span className="text-[11px] font-semibold text-slate-500">
                {trendText}
              </span>
            )}
          </div>
        )}

        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
