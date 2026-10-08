'use client';

import React, { useState } from 'react';
import { InventoryItem } from '@/types';
import { X, Boxes, Plus, Minus, Check } from 'lucide-react';

interface StockUpdateModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onUpdate: (productId: string, delta: number, reason: string) => Promise<void> | void;
}

export function StockUpdateModal({
  isOpen,
  item,
  onClose,
  onUpdate,
}: StockUpdateModalProps) {
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>('Fresh Morning Picking');

  if (!isOpen || !item) return null;

  const currentAvailable = item.availableQuantity;
  const delta = operation === 'add' ? amount : -amount;
  const resultingAvailable = Math.max(0, currentAvailable + delta);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    onUpdate(item.productId, delta, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-earth-200 animate-in zoom-in-95 duration-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Update Stock Level</h3>
              <p className="text-xs text-slate-500">{item.productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-earth-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current quantity display */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-earth-50 rounded-2xl border border-earth-200/70 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Available</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {currentAvailable} <span className="text-xs text-slate-500 font-normal">{item.unitShort}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projected Available</span>
            <div
              className={`text-xl font-extrabold mt-0.5 ${
                resultingAvailable <= item.threshold ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {resultingAvailable} <span className="text-xs text-slate-500 font-normal">{item.unitShort}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Action Tabs: Add vs Remove */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-2 bg-earth-100/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setOperation('add');
                  if (reason === 'Quality Sorting Discard') setReason('Fresh Morning Picking');
                }}
                className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  operation === 'add'
                    ? 'bg-white text-forest-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add Stock</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOperation('remove');
                  if (reason === 'Fresh Morning Picking') setReason('Quality Sorting Discard');
                }}
                className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  operation === 'remove'
                    ? 'bg-white text-rose-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Minus className="w-3.5 h-3.5 text-rose-600" />
                <span>Remove Stock</span>
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Quantity to {operation === 'add' ? 'Add' : 'Remove'} ({item.unitShort})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
              <div className="flex gap-1.5 shrink-0">
                {[5, 10, 25].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="px-2.5 py-2 rounded-xl bg-earth-100 hover:bg-earth-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason selection */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
            >
              {operation === 'add' ? (
                <>
                  <option value="Fresh Morning Picking">Fresh Morning Picking</option>
                  <option value="Additional Greenhouse Harvest">Additional Greenhouse Harvest</option>
                  <option value="Inventory Reconciliation Audit">Inventory Reconciliation Audit</option>
                  <option value="Unreserved Order Restock">Unreserved Order Restock</option>
                </>
              ) : (
                <>
                  <option value="Quality Sorting Discard">Quality Sorting Discard (Blemish / Soft)</option>
                  <option value="Damaged in Packhouse">Damaged in Packhouse</option>
                  <option value="Direct Farm-Gate Sale">Direct Farm-Gate Sale</option>
                  <option value="Seed Preservation Allocation">Seed Preservation Allocation</option>
                </>
              )}
            </select>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-earth-200 text-xs font-semibold text-slate-600 hover:bg-earth-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Update Inventory</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
