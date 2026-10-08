'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useMarketplace } from '@/context/MarketplaceContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import {
  Sparkles,
  Clock,
  Tag,
  ShoppingBag,
  ArrowRight,
  Search,
  RotateCw,
  Flame,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  Info,
} from 'lucide-react';

export default function SurplusMarketplacePage() {
  const { addToCart, showToast } = useMarketplace();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('discount_high');
  const [totalCount, setTotalCount] = useState(0);

  const fetchSurplusOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPublicSurplusOffers({
        search: searchQuery.trim() || undefined,
        minDiscount: minDiscount > 0 ? minDiscount : undefined,
        sortBy,
        limit: 50,
      });

      if (res.success && Array.isArray(res.data)) {
        setOffers(res.data);
        setTotalCount(res.pagination?.total || res.data.length);
      } else {
        setOffers([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.warn('Could not fetch surplus offers:', err);
      setOffers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, minDiscount, sortBy]);

  useEffect(() => {
    fetchSurplusOffers();
  }, [fetchSurplusOffers]);

  const handleAddSurplusToCart = (offer: any) => {
    const mockProduct: any = {
      id: offer.productId,
      name: offer.productName,
      price: offer.offerPrice,
      originalPrice: offer.originalPrice,
      unit: offer.unit,
      unitShort: offer.unit,
      images: [offer.productImage],
      farmerId: offer.farmerId,
      farmerName: offer.farmerName,
      farmName: offer.farmName,
      inStock: true,
      availableQuantity: offer.availableQuantity,
      freshnessScore: offer.freshnessPercentage,
      farmingMethod: 'Organic',
      isOrganic: true,
      shelfLifeDays: offer.daysRemaining || 3,
      harvestDate: offer.harvestDate,
    };

    addToCart(mockProduct, 1);
    showToast(`Added ${offer.productName} (Flash Offer: ₹${offer.offerPrice}) to basket!`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-extrabold uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Zero-Waste Surplus Deals</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif tracking-tight leading-tight">
            Flash Harvest Discounts
          </h1>

          <p className="text-sm sm:text-base text-amber-50 leading-relaxed font-normal">
            Help local farmers minimize food loss while enjoying premium, freshly picked produce at 15% to 50% discount. Harvested with peak freshness and ready for immediate consumption.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-earth-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search surplus deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-earth-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-forest-600 focus:ring-1 focus:ring-forest-600 shadow-2xs"
            />
          </div>

          {/* Min discount chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setMinDiscount(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                minDiscount === 0 ? 'bg-forest-900 text-white' : 'bg-earth-100 text-slate-600 hover:bg-earth-200'
              }`}
            >
              All Deals ({totalCount})
            </button>
            <button
              onClick={() => setMinDiscount(20)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                minDiscount === 20 ? 'bg-forest-900 text-white' : 'bg-earth-100 text-slate-600 hover:bg-earth-200'
              }`}
            >
              20%+ OFF
            </button>
            <button
              onClick={() => setMinDiscount(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                minDiscount === 30 ? 'bg-forest-900 text-white' : 'bg-earth-100 text-slate-600 hover:bg-earth-200'
              }`}
            >
              30%+ OFF
            </button>
          </div>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-white border border-earth-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-forest-600"
          >
            <option value="discount_high">Highest Discount</option>
            <option value="price_low">Lowest Price</option>
            <option value="expiry_soon">Expiring Soonest</option>
          </select>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RotateCw className="w-8 h-8 mx-auto text-amber-500 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Scanning live farm packhouses for flash offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          type="products"
          title="No Active Surplus Offers"
          description="Local farm stock is currently in optimal harvest balance! Check back soon or explore regular fresh produce."
          actionText="Explore Marketplace"
          actionHref="/explore"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-3xl border border-amber-200/70 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Image & Discount Badge */}
                <div className="relative aspect-4/3 w-full bg-earth-100 overflow-hidden">
                  <Image
                    src={offer.productImage}
                    alt={offer.productName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Discount ribbon */}
                  <div className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{offer.discountPercent}% OFF</span>
                  </div>

                  {/* Freshness Badge */}
                  <div className="absolute top-3 right-3">
                    <FreshnessBadge score={offer.freshnessPercentage} size="sm" />
                  </div>

                  {/* Expiry countdown pill */}
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1 rounded-xl flex items-center justify-between">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Clock className="w-3 h-3" />
                      <span>{offer.daysRemaining}d optimal window</span>
                    </span>
                    <span className="font-mono text-slate-300">{offer.offerCode}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-forest-800 transition-colors">
                      {offer.productName}
                    </h3>
                    <p className="text-xs text-forest-800 font-semibold">
                      {offer.farmName} • {offer.farmLocation}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    {offer.reason}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>
                      Stock: <strong className="text-slate-900">{offer.availableQuantity} {offer.unit}</strong> remaining
                    </span>
                    {offer.batchNumber && (
                      <Link
                        href={`/trace/${encodeURIComponent(offer.batchNumber)}`}
                        className="text-forest-700 font-bold hover:underline"
                      >
                        View Provenance →
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing & Add to Cart Footer */}
              <div className="p-5 pt-0 border-t border-earth-100 mt-2 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-forest-950">₹{offer.offerPrice}</span>
                    <span className="text-xs text-slate-400 line-through">₹{offer.originalPrice}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">per {offer.unit}</div>
                </div>

                <button
                  onClick={() => handleAddSurplusToCart(offer)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Claim Deal</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
