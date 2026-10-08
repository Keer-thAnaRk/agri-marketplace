'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import { ProductForm } from '@/components/farmer/ProductForm';
import { ArrowLeft, Edit3 } from 'lucide-react';

export default function EditProductPage() {
  const params = useParams();
  const productId = params?.id as string;
  const { products } = useFarmer();

  const product = products.find((p) => p.id === productId) || products[0];

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
              Edit Product Details
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              <Edit3 className="w-3 h-3 text-sky-700" />
              <span>Editing Mode</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Modify price, available harvest volume, freshness score, or images for &ldquo;{product?.name}&rdquo;
          </p>
        </div>
      </div>

      {/* Product Form in Edit Mode */}
      <ProductForm initialData={product} isEditing={true} />
    </div>
  );
}
