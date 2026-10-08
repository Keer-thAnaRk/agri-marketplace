'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMarketplace } from '@/context/MarketplaceContext';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { RatingStars } from '@/components/ui/RatingStars';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { MOCK_REVIEWS } from '@/data/mockData';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Heart,
  Droplets,
  Sprout,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

export default function FarmerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const farmerId = resolvedParams.id;

  const { farmers, products, savedFarmerIds, toggleSaveFarmer } = useMarketplace();
  const [liveFarmer, setLiveFarmer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const contextFarmer = farmers.find((f) => f.id === farmerId);

  useEffect(() => {
    let isMounted = true;
    api
      .getPublicFarmerById(farmerId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setLiveFarmer(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch single farmer by id:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [farmerId]);

  const farmer = liveFarmer || contextFarmer;
  const farmerProducts = liveFarmer?.products || products.filter((p) => p.farmerId === farmerId);
  const farmerReviews = MOCK_REVIEWS.filter((r) => r.farmerId === farmerId);
  const isSaved = farmer ? savedFarmerIds.includes(farmer.id) : false;

  if (isLoading && !farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-earth-200 rounded-3xl" />
          <div className="h-8 bg-earth-200 rounded w-1/3" />
          <div className="h-24 bg-earth-200 rounded" />
        </div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          type="farmers"
          title="Farmer Profile Not Found"
          description="We could not locate this cultivator profile."
          actionText="Back to Farmers Directory"
          actionHref="/farmers"
        />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Cover Banner */}
      <div className="relative h-64 sm:h-80 w-full bg-forest-950 overflow-hidden">
        <Image
          src={farmer.coverImage}
          alt={farmer.farmName}
          fill
          priority
          className="object-cover opacity-80"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative flex items-end pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between w-full gap-4">
            {/* Farmer Identity */}
            <div className="flex items-end gap-4 sm:gap-6">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white shrink-0">
                <Image src={farmer.avatar} alt={farmer.name} fill className="object-cover" sizes="128px" />
              </div>
              <div className="text-white space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">{farmer.name}</h1>
                  {farmer.isVerified && <VerifiedBadge label="Verified Cultivator" size="sm" />}
                </div>
                <p className="text-forest-200 text-sm font-semibold">{farmer.farmName}</p>
                <div className="flex items-center gap-3 text-xs text-forest-300 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-harvest-gold" />
                    {farmer.location} ({farmer.distanceKm} km away)
                  </span>
                  <span>•</span>
                  <span>{farmer.acreage} acres</span>
                  <span>•</span>
                  <span>{farmer.yearsFarming} years regenerative farming</span>
                </div>
              </div>
            </div>

            {/* Favorite & Direct Contact Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleSaveFarmer(farmer.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-forest-950 border border-white/30'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
                <span>{isSaved ? 'Favorited' : 'Favorite'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-earth-200 shadow-xs">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Method</div>
            <div className="text-sm font-bold text-forest-900 mt-0.5">{farmer.farmingMethod}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rating</div>
            <div className="mt-0.5">
              <RatingStars rating={farmer.rating} reviewCount={farmer.reviewCount} />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Crops</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{farmerProducts.length} Listed</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Member Since</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{farmer.joinedDate}</div>
          </div>
        </div>

        {/* SECTION 1: AVAILABLE HARVESTS / PRODUCTS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-earth-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-full">
                Direct Catalog
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">Available Produce from {farmer.name}</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {farmerProducts.length} items ready for harvest
            </span>
          </div>

          {farmerProducts.length === 0 ? (
            <EmptyState
              type="products"
              title="No produce currently listed"
              description="This farm is preparing their next seasonal seeding cycle."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {farmerProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: FARM STORY */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-earth-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
            <Sprout className="w-4 h-4" />
            <span>Farm Heritage & Origin</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            The Story Behind {farmer.farmName}
          </h3>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
            {farmer.story}
          </p>

          <div className="pt-4 border-t border-earth-100 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-2 self-center">
              Audited Certifications:
            </span>
            {farmer.certifications?.map((c: string, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-semibold border border-emerald-200"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{c}</span>
              </span>
            ))}
          </div>
        </section>

        {/* SECTION 3: FARMING PRACTICES & WATER SOURCE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
              <Sprout className="w-4 h-4" />
              <span>Soil Regeneration</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Soil & Nutrition Techniques</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
              {farmer.soilPractices?.map((practice: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Droplets className="w-4 h-4" />
              <span>Hydrology & Irrigation</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Water Source & Conservation</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {farmer.waterSource}
            </p>
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-center gap-2 font-medium">
              <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Micro-drip fertigation minimizes groundwater consumption by 65%.</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: RECENT HARVESTS */}
        <section className="bg-forest-50/70 rounded-3xl p-6 sm:p-8 border border-forest-100 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
            <Clock className="w-4 h-4" />
            <span>Harvest Schedule Log</span>
          </div>
          <h4 className="text-lg font-bold text-forest-950">Recent & Upcoming Pickings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {farmer.mainCrops?.map((crop: string, idx: number) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-forest-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{crop}</div>
                  <div className="text-xs text-slate-500">Scheduled: 5:30 AM Daily</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: CUSTOMER REVIEWS */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-earth-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-forest-700" />
              <h3 className="text-xl font-bold text-slate-900">What Bengaluru Consumers Say</h3>
            </div>
            <RatingStars rating={farmer.rating} reviewCount={farmer.reviewCount} />
          </div>

          <div className="space-y-4 divide-y divide-earth-100">
            {farmerReviews.length > 0 ? (
              farmerReviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-earth-200">
                        <Image src={rev.userAvatar} alt="" fill className="object-cover" sizes="32px" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{rev.userName}</div>
                        <div className="text-[10px] text-slate-400">{rev.date}</div>
                      </div>
                    </div>
                    <RatingStars rating={rev.rating} />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No reviews yet for this farmer.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
