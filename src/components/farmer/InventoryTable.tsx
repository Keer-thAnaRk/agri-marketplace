'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { InventoryItem } from '@/types';
import { StockBadge } from './StockBadge';
import { calculateFreshness } from '@/utils/freshness';
import { Edit3, Eye, AlertTriangle, Sparkles, Clock, BadgePercent } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  onOpenStockModal: (item: InventoryItem) => void;
  compact?: boolean;
}

export function InventoryTable({
  items,
  onOpenStockModal,
  compact = false,
}: InventoryTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-earth-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-earth-200 bg-earth-50/60 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4">Product</th>
              <th className="py-3.5 px-4">Available</th>
              <th className="py-3.5 px-4">Reserved</th>
              <th className="py-3.5 px-4">Sold</th>
              <th className="py-3.5 px-4">Freshness & Expiry</th>
              {!compact && <th className="py-3.5 px-4">Threshold</th>}
              <th className="py-3.5 px-4">Stock Status</th>
              {!compact && <th className="py-3.5 px-4">Last Updated</th>}
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-100 font-medium text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={compact ? 7 : 9} className="py-10 text-center text-slate-400">
                  No inventory items recorded yet.
                </td>
              </tr>
            ) : (
              items.map((item) => {
              const isLowStock = item.status === 'Low Stock' || item.availableQuantity <= item.threshold;
              const isOutOfStock = item.status === 'Out of Stock' || item.availableQuantity === 0;

              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    isOutOfStock
                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                      : isLowStock
                      ? 'bg-amber-50/30 hover:bg-amber-50/50'
                      : 'hover:bg-earth-50/60'
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-earth-200 bg-earth-100">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.category} • ₹{item.price}/{item.unitShort}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-extrabold ${
                        isOutOfStock
                          ? 'text-rose-600'
                          : isLowStock
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {item.availableQuantity} {item.unitShort}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-amber-700">
                    {item.reservedQuantity} {item.unitShort}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-700">
                    {item.soldQuantity} {item.unitShort}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {(() => {
                      const lower = item.productName.toLowerCase();
                      const shelfLife = lower.includes('spinach') || lower.includes('palak') || lower.includes('coriander') || lower.includes('mint')
                        ? 3
                        : lower.includes('potato')
                        ? 14
                        : 6;
                      const harvestDate = item.lastUpdated.toLowerCase().includes('yesterday') ? 'Sept 23, 2026' : 'Sept 24, 2026';
                      const freshness = calculateFreshness(harvestDate, shelfLife);

                      return (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                freshness.status === 'Fresh'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : freshness.status === 'Good'
                                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                                  : freshness.status === 'Use Soon'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{freshness.percentage}% • {freshness.status}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{freshness.daysRemaining}d shelf life left</span>
                            {freshness.isApproachingExpiry && (
                              <Link
                                href="/farmer/surplus"
                                className="text-amber-800 font-bold hover:underline flex items-center gap-0.5 ml-1"
                                title="Create surplus flash discount"
                              >
                                <BadgePercent className="w-3 h-3 text-amber-600" />
                                <span>Surplus</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>

                  {!compact && (
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500">
                      {item.threshold} {item.unitShort}
                    </td>
                  )}

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <StockBadge status={item.status} />
                      {isLowStock && !isOutOfStock && (
                        <span title="Stock is below threshold!">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        </span>
                      )}
                    </div>
                  </td>

                  {!compact && (
                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-400">
                      {item.lastUpdated}
                    </td>
                  )}

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenStockModal(item)}
                        className="px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-forest-200/60"
                        title="Quick stock update"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update Stock</span>
                      </button>

                      <Link
                        href={`/farmer/products`}
                        className="p-1.5 rounded-xl border border-earth-200 text-slate-400 hover:text-forest-900 hover:bg-earth-100 transition-colors"
                        title="View produce catalog"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
