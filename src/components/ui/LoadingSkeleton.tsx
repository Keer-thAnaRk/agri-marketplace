import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-earth-200/60 shadow-xs animate-pulse flex flex-col gap-3">
      <div className="w-full h-44 bg-earth-100 rounded-xl"></div>
      <div className="h-4 bg-earth-100 rounded-md w-3/4"></div>
      <div className="h-3 bg-earth-100 rounded-md w-1/2"></div>
      <div className="flex justify-between items-center mt-2">
        <div className="h-6 bg-earth-100 rounded-md w-1/3"></div>
        <div className="h-8 bg-earth-100 rounded-lg w-1/3"></div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-earth-100">
      <td className="py-4 px-4"><div className="h-4 bg-earth-100 rounded-md w-24"></div></td>
      <td className="py-4 px-4"><div className="h-4 bg-earth-100 rounded-md w-32"></div></td>
      <td className="py-4 px-4"><div className="h-4 bg-earth-100 rounded-md w-20"></div></td>
      <td className="py-4 px-4"><div className="h-4 bg-earth-100 rounded-md w-16"></div></td>
      <td className="py-4 px-4"><div className="h-6 bg-earth-100 rounded-full w-24"></div></td>
      <td className="py-4 px-4"><div className="h-8 bg-earth-100 rounded-lg w-20"></div></td>
    </tr>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-earth-200/60 shadow-xs animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="h-3.5 bg-earth-100 rounded-md w-24"></div>
        <div className="w-8 h-8 bg-earth-100 rounded-lg"></div>
      </div>
      <div className="h-8 bg-earth-100 rounded-md w-28 mb-2"></div>
      <div className="h-3 bg-earth-100 rounded-md w-36"></div>
    </div>
  );
}
