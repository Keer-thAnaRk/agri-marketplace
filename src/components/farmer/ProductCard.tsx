import React from 'react';
import Image from 'next/image';
import { FarmerProduct } from '@/types';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { OrganicBadge } from '@/components/ui/OrganicBadge';
import { StockBadge } from './StockBadge';
import { MapPin, ShieldCheck, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Partial<FarmerProduct>;
  isPreview?: boolean;
}

export function FarmerProductCard({ product, isPreview = false }: ProductCardProps) {
  const name = product.name || 'Produce Name Preview';
  const category = product.category || 'Vegetables';
  const price = product.price || 0;
  const unit = product.unit || '1 kg';
  const unitShort = product.unitShort || 'kg';
  const image =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80';
  const freshness = product.freshnessScore || 95;
  const isOrganic = product.isOrganic ?? true;
  const availableQty = product.availableQuantity || 0;
  const farmName = product.farmName || 'Green Valley Farm';
  const farmLocation = product.farmLocation || 'HSR Layout, Bengaluru';

  return (
    <div className="bg-white rounded-3xl border border-earth-200 shadow-sm overflow-hidden flex flex-col group transition-all duration-300">
      {isPreview && (
        <div className="bg-forest-900 text-forest-100 text-[10px] font-bold uppercase tracking-wider py-1 px-4 text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Consumer Marketplace Live Preview</span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-4/3 w-full bg-earth-100 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-103 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 360px"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {isOrganic && (
            <OrganicBadge
              method={product.farmingMethod || 'Organic'}
              isOrganic={isOrganic}
              size="sm"
            />
          )}
        </div>

        <div className="absolute top-3 right-3">
          <FreshnessBadge score={freshness} size="sm" />
        </div>

        <div className="absolute bottom-3 left-3">
          <StockBadge status={availableQty > 0 ? 'In Stock' : 'Out of Stock'} size="sm" />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>{category}</span>
            <span className="text-emerald-700 font-bold">{availableQty} {unitShort} available</span>
          </div>

          <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
            {name}
          </h4>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description || 'Pure farm harvest directly delivered to Bengaluru kitchens.'}
          </p>
        </div>

        <div className="pt-3 border-t border-earth-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Direct Price</div>
            <div className="text-lg font-extrabold text-forest-950 leading-none">
              ₹{price} <span className="text-xs text-slate-500 font-normal">/{unit}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">{farmName}</div>
            <div className="text-[11px] text-forest-800 font-semibold flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{farmLocation.split(',')[0]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
