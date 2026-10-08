'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFarmer } from '@/context/FarmerContext';
import { ArrowLeft, Sprout, CheckCircle2, Calendar, Hash } from 'lucide-react';

export default function AddHarvestPage() {
  const router = useRouter();
  const { products, recordHarvest, farmerProfile } = useFarmer();

  const [formData, setFormData] = useState({
    productId: products[0]?.id || 'prod-1',
    productName: products[0]?.name || 'Vine-Ripened Country Nati Tomatoes',
    harvestDate: 'Sept 24, 2026',
    quantity: '100',
    unit: 'kg',
    batchNumber: `BAT-${new Date().toISOString().slice(5, 10).replace('-', '')}-${Math.floor(10 + Math.random() * 90)}`,
    expectedFreshness: 95,
    notes: 'Predawn hand picking, washed in filtered well water, sorted for uniform ripeness.',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductChange = (pId: string) => {
    const selected = products.find((p) => p.id === pId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        productId: selected.id,
        productName: selected.name,
        unit: selected.unitShort,
        batchNumber: `${selected.name.slice(0, 3).toUpperCase()}-${new Date().toISOString().slice(5, 10).replace('-', '')}-A`,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setErrors({ quantity: 'Enter a valid quantity harvested' });
      return;
    }

    setIsSubmitting(true);
    const qty = Number(formData.quantity);

    try {
      await recordHarvest({
        productId: formData.productId,
        productName: formData.productName,
        quantity: qty,
        unit: formData.unit,
        harvestDate: formData.harvestDate,
        farmName: farmerProfile.farmName,
        batchNumber: formData.batchNumber,
        availableQuantity: qty,
        expectedFreshness: Number(formData.expectedFreshness) || 95,
        status: 'Available',
        notes: formData.notes,
      });
      router.push('/farmer/harvests');
    } catch (err: any) {
      setErrors({ submit: err?.message || 'Failed to record harvest' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-earth-200/60">
        <Link
          href="/farmer/harvests"
          className="p-2 rounded-xl border border-earth-200 hover:bg-earth-100 transition-colors text-slate-600 cursor-pointer"
          aria-label="Back to harvests"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Record Fresh Harvest
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log morning picking, generate batch traceability numbers, and audit freshness scores
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-6 text-xs">
        <div className="space-y-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Select Crop / Produce *
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Harvest Date *
              </label>
              <input
                type="text"
                value={formData.harvestDate}
                onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Quantity Harvested ({formData.unit}) *
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                  errors.quantity ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                }`}
              />
              {errors.quantity && <p className="text-[11px] text-rose-600 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Traceability Batch Number
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Expected Freshness Score (0–100)
              </label>
              <input
                type="number"
                min="70"
                max="100"
                value={formData.expectedFreshness}
                onChange={(e) => setFormData({ ...formData, expectedFreshness: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Field Observations & Harvest Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-earth-200 flex items-center justify-between">
          <Link
            href="/farmer/harvests"
            className="px-4 py-2.5 rounded-xl border border-earth-200 font-bold text-slate-600 hover:bg-earth-100 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Logging Harvest...' : 'Record Harvest'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
