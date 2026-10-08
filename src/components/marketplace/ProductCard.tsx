'use client';

import React from 'react';
import { Product } from '@/types';
import { useMarketplace } from '@/context/MarketplaceContext';
import Image from 'next/image';
import Link from 'next/link';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { OrganicBadge } from '@/components/ui/OrganicBadge';
import { MapPin, Plus, ShoppingBag, Clock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useMarketplace();

  return (
    <div className="group bg-white rounded-2xl border border-earth-200/80 hover:border-forest-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image & Badges */}
      <div className="relative aspect-4/3 w-full bg-earth-100 overflow-hidden">
        <Link href={`/products/${product.id}`} className="block w-full h-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <FreshnessBadge score={product.freshnessScore} size="sm" />
          <OrganicBadge method={product.farmingMethod} isOrganic={product.isOrganic} size="sm" />
        </div>

        {/* Harvest Time Pill */}
        <div className="absolute bottom-2 left-2.5 bg-forest-950/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>{product.harvestedAgo}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Farmer & Distance */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <Link
              href={`/farmers/${product.farmerId}`}
              className="hover:text-forest-800 font-medium truncate max-w-[65%]"
            >
              {product.farmerName}
            </Link>
            <span className="flex items-center gap-0.5 text-forest-700 font-medium shrink-0">
              <MapPin className="w-3 h-3 text-forest-600" />
              {product.farmDistanceKm} km
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-forest-800 transition-colors line-clamp-1 mb-1">
            <Link href={`/products/${product.id}`}>{product.name}</Link>
          </h3>

          <p className="text-xs text-slate-500 line-clamp-1 mb-3">
            {product.farmName}
          </p>
        </div>

        {/* Price & Add to Cart */}
        <div className="pt-3 border-t border-earth-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <span className="text-lg font-bold text-forest-950">₹{product.price}</span>
            <span className="text-xs text-slate-500 ml-1">/ {product.unitShort}</span>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-700 text-white hover:bg-forest-800 active:scale-95 transition-all text-xs font-semibold shadow-xs hover:shadow-md cursor-pointer"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
