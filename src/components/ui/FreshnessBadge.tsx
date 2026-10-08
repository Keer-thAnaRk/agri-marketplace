import React from 'react';
import { Sparkles, Leaf } from 'lucide-react';

interface FreshnessBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function FreshnessBadge({ score, size = 'sm', showLabel = true }: FreshnessBadgeProps) {
  let colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let badgeText = 'Super Fresh';

  if (score >= 95) {
    colorStyles = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold';
    badgeText = 'Peak Fresh';
  } else if (score >= 88) {
    colorStyles = 'bg-teal-50 text-teal-800 border-teal-200';
    badgeText = 'Farm Fresh';
  } else {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    badgeText = 'Good Fresh';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm sm:text-base px-3 py-1.5 gap-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border shadow-xs transition-all ${colorStyles} ${sizeClasses[size]}`}
      title={`Freshness index: ${score} out of 100 based on harvest timestamp and transit temperature`}
    >
      <Leaf className="w-3 h-3 text-emerald-600 shrink-0" />
      <span>
        {showLabel && <span className="opacity-80 mr-1">Freshness:</span>}
        <strong className="font-bold">{score}</strong>/100
      </span>
    </div>
  );
}
