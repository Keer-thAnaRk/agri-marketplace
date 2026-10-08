import React from 'react';

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 bg-earth-200/70 rounded-md w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-earth-200 p-6 shadow-xs animate-pulse space-y-3">
      <div className="h-4 bg-earth-200/70 rounded-md w-1/3" />
      <div className="h-8 bg-earth-200/70 rounded-md w-1/2" />
      <div className="h-3 bg-earth-200/70 rounded-md w-2/3" />
    </div>
  );
}
