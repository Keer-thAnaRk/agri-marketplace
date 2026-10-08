'use client';

import React from 'react';
import { Farmer } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { RatingStars } from '@/components/ui/RatingStars';
import { MapPin, Heart, ArrowRight } from 'lucide-react';
import { useMarketplace } from '@/context/MarketplaceContext';

interface FarmerCardProps {
  farmer: Farmer;
}

export function FarmerCard({ farmer }: FarmerCardProps) {
  const { savedFarmerIds, toggleSaveFarmer } = useMarketplace();
  const isSaved = savedFarmerIds.includes(farmer.id);

  return (
    <div className="group bg-white rounded-3xl border border-earth-200/80 hover:border-forest-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Cover / Header image */}
      <div className="relative h-28 w-full bg-forest-900 overflow-hidden">
        <Image
          src={farmer.coverImage}
          alt={farmer.farmName}
          fill
          className="object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSaveFarmer(farmer.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isSaved ? 'bg-white text-rose-500' : 'bg-black/30 text-white hover:bg-white hover:text-rose-500'
          }`}
          aria-label="Save farmer"
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Distance pill */}
        <div className="absolute bottom-2.5 right-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[11px] font-bold text-forest-900 flex items-center gap-1 shadow-2xs">
          <MapPin className="w-3 h-3 text-forest-700" />
          <span>{farmer.distanceKm} km away</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 pt-0 flex-1 flex flex-col justify-between relative">
        <div>
          {/* Avatar and Verification */}
          <div className="flex items-end justify-between -mt-9 mb-3">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
              <Image
                src={farmer.avatar}
                alt={farmer.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            {farmer.isVerified && <VerifiedBadge label="Verified" size="sm" />}
          </div>

          {/* Farmer & Farm name */}
          <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-forest-800 transition-colors">
            <Link href={`/farmers/${farmer.id}`}>{farmer.name}</Link>
          </h3>
          <p className="text-xs font-medium text-forest-800 mb-2">{farmer.farmName}</p>

          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <span>{farmer.hub}</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{farmer.farmingMethod}</span>
          </div>

          {/* Rating */}
          <div className="mb-4">
            <RatingStars rating={farmer.rating} reviewCount={farmer.reviewCount} />
          </div>

          {/* Main crops */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Primary Harvests
            </div>
            <div className="flex flex-wrap gap-1.5">
              {farmer.mainCrops.map((crop, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-earth-50 text-slate-700 border border-earth-200/60"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* View Farm Button */}
        <div className="pt-3 border-t border-earth-100 mt-auto">
          <Link
            href={`/farmers/${farmer.id}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-forest-50 hover:bg-forest-700 hover:text-white text-forest-800 font-semibold text-xs transition-all duration-200"
          >
            <span>View Farm & Produce</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
