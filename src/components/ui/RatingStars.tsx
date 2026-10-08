import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}

export function RatingStars({ rating, reviewCount, size = 'sm' }: RatingStarsProps) {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`inline-flex items-center gap-1 ${textClass}`}>
      <div className="flex items-center text-amber-500">
        <Star className={`${starSize} fill-amber-400 text-amber-500`} />
      </div>
      <span className="font-semibold text-slate-800">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-slate-500 font-normal">({reviewCount})</span>
      )}
    </div>
  );
}
