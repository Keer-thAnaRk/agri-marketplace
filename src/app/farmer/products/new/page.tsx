'use client';

import React from 'react';
import Link from 'next/link';
import { ProductForm } from '@/components/farmer/ProductForm';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-earth-200/60">
        <Link
          href="/farmer/products"
          className="p-2 rounded-xl border border-earth-200 hover:bg-earth-100 transition-colors text-slate-600 cursor-pointer"
          aria-label="Back to products list"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Add New Product
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
              <Sparkles className="w-3 h-3 text-forest-700" />
              <span>Direct Listing</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            List newly harvested produce directly on the Krishi Market consumer platform
          </p>
        </div>
      </div>

      {/* Product Form with Live Preview */}
      <ProductForm isEditing={false} />
    </div>
  );
}
