'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FarmerProduct, FarmingMethod, ProductStatus } from '@/types';
import { FarmerProductCard } from './ProductCard';
import { useFarmer } from '@/context/FarmerContext';
import {
  UploadCloud,
  CheckCircle2,
  Leaf,
  Clock,
  ShieldCheck,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

interface ProductFormProps {
  initialData?: Partial<FarmerProduct>;
  isEditing?: boolean;
}

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Grains',
  'Pulses',
  'Eggs',
  'Organic Products',
  'Other',
];

const UNITS = [
  { label: 'kg (Kilogram)', value: '1 kg', short: 'kg' },
  { label: 'gram (500g Pack)', value: '500 g', short: '500g' },
  { label: 'gram (250g Bunch)', value: '250 g', short: 'bunch' },
  { label: 'litre (1 Litre Bottle)', value: '1 Litre', short: 'L' },
  { label: 'dozen (12 pcs)', value: '1 Dozen', short: 'dz' },
  { label: 'piece (1 Unit / Head)', value: '1 piece', short: 'pc' },
];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80', // Tomatoes
  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80', // Potatoes
  'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80', // Spinach
  'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80', // Capsicum
  'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=800&q=80', // Carrots
  'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=800&q=80', // Cucumbers
];

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const { addProduct, updateProduct, farmerProfile } = useFarmer();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'Vegetables',
    description: initialData?.description || '',
    price: initialData?.price ? String(initialData.price) : '',
    unit: initialData?.unit || '1 kg',
    unitShort: initialData?.unitShort || 'kg',
    availableQuantity: initialData?.availableQuantity ? String(initialData.availableQuantity) : '',
    lowStockThreshold: initialData?.lowStockThreshold ? String(initialData.lowStockThreshold) : '15',
    harvestDate: initialData?.harvestDate || 'Sept 24, 2026',
    expectedFreshnessDuration: initialData?.expectedFreshnessDuration || '6 days room temperature',
    farmingMethod: (initialData?.farmingMethod || 'Organic') as FarmingMethod,
    isOrganic: initialData?.isOrganic ?? true,
    imageUrl: initialData?.images?.[0] || PRESET_IMAGES[0],
    status: (initialData?.status || 'Active') as ProductStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Produce name is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    if (!formData.price || Number(formData.price) <= 0) errs.price = 'Enter a valid price in ₹';
    if (!formData.availableQuantity || Number(formData.availableQuantity) < 0) {
      errs.availableQuantity = 'Enter valid available quantity';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUnitChange = (val: string) => {
    const selected = UNITS.find((u) => u.value === val);
    setFormData((prev) => ({
      ...prev,
      unit: val,
      unitShort: selected ? selected.short : 'kg',
    }));
  };

  const handleSave = async (saveAsStatus: ProductStatus) => {
    if (!validate()) return;
    setIsSubmitting(true);

    const priceNum = Number(formData.price);
    const qtyNum = Number(formData.availableQuantity);
    const thresholdNum = Number(formData.lowStockThreshold) || 10;

    try {
      if (isEditing && initialData?.id) {
        await updateProduct({
          ...initialData,
          id: initialData.id,
          name: formData.name,
          category: formData.category,
          description: formData.description,
          price: priceNum,
          unit: formData.unit,
          unitShort: formData.unitShort,
          images: [formData.imageUrl],
          harvestDate: formData.harvestDate,
          expectedFreshnessDuration: formData.expectedFreshnessDuration,
          farmingMethod: formData.farmingMethod,
          isOrganic: formData.isOrganic,
          availableQuantity: qtyNum,
          lowStockThreshold: thresholdNum,
          status: saveAsStatus,
          inStock: qtyNum > 0 && saveAsStatus === 'Active',
          farmerId: farmerProfile.id,
          farmerName: farmerProfile.name,
          farmName: farmerProfile.farmName,
          farmLocation: farmerProfile.location,
          farmDistanceKm: 2.4,
          shelfLifeDays: 7,
          harvestedAgo: 'Updated recently',
          freshnessScore: initialData.freshnessScore || 95,
          reservedQuantity: initialData.reservedQuantity || 0,
          soldQuantity: initialData.soldQuantity || 0,
          rating: initialData.rating || 5.0,
          reviewsCount: initialData.reviewsCount || 0,
          traceability: initialData.traceability || [],
        });
      } else {
        await addProduct({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          farmerId: farmerProfile.id,
          farmerName: farmerProfile.name,
          farmName: farmerProfile.farmName,
          farmLocation: farmerProfile.location,
          farmDistanceKm: 2.4,
          price: priceNum,
          unit: formData.unit,
          unitShort: formData.unitShort,
          images: [formData.imageUrl],
          harvestDate: formData.harvestDate,
          harvestedAgo: 'Harvested today at sunrise',
          freshnessScore: 96,
          shelfLifeDays: 7,
          isOrganic: formData.isOrganic,
          farmingMethod: formData.farmingMethod,
          inStock: qtyNum > 0 && saveAsStatus === 'Active',
          status: saveAsStatus,
          availableQuantity: qtyNum,
          reservedQuantity: 0,
          soldQuantity: 0,
          lowStockThreshold: thresholdNum,
          expectedFreshnessDuration: formData.expectedFreshnessDuration,
          harvestBatch: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
          rating: 5.0,
          reviewsCount: 0,
          traceability: [],
        });
      }

      router.push('/farmer/products');
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Form (8 Cols) */}
      <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-8">
        {/* Section 1: Produce Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
            <Leaf className="w-4 h-4" />
            <span>1. Product Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Vine-Ripened Country Nati Tomatoes"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                  errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Farming Method *
              </label>
              <select
                value={formData.farmingMethod}
                onChange={(e) =>
                  setFormData({ ...formData, farmingMethod: e.target.value as FarmingMethod })
                }
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
              >
                <option value="Organic">Organic Certified</option>
                <option value="Natural (ZBNF)">Natural (ZBNF)</option>
                <option value="Hydroponic">Hydroponic</option>
                <option value="Regenerative">Regenerative</option>
                <option value="Pesticide-Free">Pesticide-Free</option>
                <option value="Traditional">Traditional</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Description & Tasting Notes *
              </label>
              <textarea
                rows={3}
                placeholder="Describe variety, soil inputs, seed heritage, taste, and freshness benefits..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                  errors.description ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Packaging */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
            <Clock className="w-4 h-4" />
            <span>2. Pricing & Packaging Unit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                placeholder="e.g. 52"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                  errors.price ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                }`}
              />
              {errors.price && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.price}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Inventory & Stock Threshold */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
            <ShieldCheck className="w-4 h-4" />
            <span>3. Inventory & Availability</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Available Quantity ({formData.unitShort}) *
              </label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={formData.availableQuantity}
                onChange={(e) => setFormData({ ...formData, availableQuantity: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-earth-50 border rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                  errors.availableQuantity ? 'border-rose-400 bg-rose-50/20' : 'border-earth-200'
                }`}
              />
              {errors.availableQuantity && (
                <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.availableQuantity}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Low-Stock Threshold ({formData.unitShort})
              </label>
              <input
                type="number"
                placeholder="e.g. 15"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Triggers low-stock visual warning</p>
            </div>
          </div>
        </div>

        {/* Section 4: Harvest Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
            <Leaf className="w-4 h-4" />
            <span>4. Harvest & Freshness</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Harvest Date
              </label>
              <input
                type="text"
                placeholder="e.g. Sept 24, 2026"
                value={formData.harvestDate}
                onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Expected Freshness Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 6 days room temperature"
                value={formData.expectedFreshnessDuration}
                onChange={(e) =>
                  setFormData({ ...formData, expectedFreshnessDuration: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isOrganic}
                  onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
                  className="w-4 h-4 accent-forest-700"
                />
                <span>Certified 100% Organic & Chemical-Pesticide Free Produce</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Image Upload UI & Preset Choices */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
            <ImageIcon className="w-4 h-4" />
            <span>5. Product Imagery</span>
          </div>

          <div className="border-2 border-dashed border-earth-300 rounded-2xl p-6 text-center bg-earth-50/50 hover:bg-earth-50 transition-colors">
            <UploadCloud className="w-8 h-8 text-forest-700 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-900">Drag & drop produce photos here</div>
            <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or WEBP up to 5MB (Mock upload UI)</p>

            <div className="mt-4 pt-3 border-t border-earth-200 text-left">
              <div className="text-[11px] font-bold text-slate-700 mb-2">Or select from farm library presets:</div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: img })}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      formData.imageUrl === img ? 'border-forest-700 ring-2 ring-forest-500' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {formData.imageUrl === img && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-forest-800 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 text-left">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Custom Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-earth-200 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="pt-4 border-t border-earth-200 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/farmer/products"
            className="px-4 py-2.5 rounded-xl border border-earth-200 text-xs font-bold text-slate-600 hover:bg-earth-100 transition-colors"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave('Draft')}
                className="px-5 py-2.5 rounded-xl border border-earth-300 bg-earth-50 hover:bg-earth-100 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Save Draft
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('Active')}
              className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live Product Card Preview (4 Cols) */}
      <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Live Consumer Preview
        </div>
        <FarmerProductCard
          product={{
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price: Number(formData.price) || 0,
            unit: formData.unit,
            unitShort: formData.unitShort,
            images: [formData.imageUrl],
            isOrganic: formData.isOrganic,
            availableQuantity: Number(formData.availableQuantity) || 0,
            farmName: farmerProfile.farmName,
            farmLocation: farmerProfile.location,
            freshnessScore: 96,
          }}
          isPreview={true}
        />
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 space-y-1">
          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Traceability Pipeline Ready</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Once published, customers across Bengaluru hubs can order for morning sunrise harvest.
          </p>
        </div>
      </div>
    </div>
  );
}
