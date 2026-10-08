import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FarmerProfile } from '@/types';
import FarmerAvatar from '@/components/common/FarmerAvatar';
import { MapPin, ShieldCheck, Star, Sprout, Calendar, ArrowRight } from 'lucide-react';

interface ProfileCardProps {
  profile: FarmerProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-5">
      <div className="flex items-start gap-4">
        {/* Photo */}
        <FarmerAvatar
          src={profile.profilePhoto || profile.avatar}
          name={profile.name}
          className="w-16 h-16 rounded-2xl border-2 border-forest-200 shadow-2xs text-lg"
          size={64}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-serif truncate">
              {profile.name}
            </h3>
            {profile.isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Farmer</span>
              </span>
            )}
          </div>

          <div className="text-xs font-bold text-forest-800 mt-0.5">
            {profile.farmName}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{profile.location}</span>
          </div>
        </div>
      </div>

      {/* Badges / Metrics Row */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-earth-50 rounded-2xl border border-earth-100 text-center text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Method</div>
          <div className="font-extrabold text-forest-900 mt-0.5 truncate">
            {profile.farmingMethod}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rating</div>
          <div className="font-extrabold text-slate-900 mt-0.5 flex items-center justify-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{profile.rating}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Produce</div>
          <div className="font-extrabold text-slate-900 mt-0.5">
            {profile.totalProductsCount} products
          </div>
        </div>
      </div>

      {/* Farm since badge & CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-earth-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Farm since {profile.farmSinceYear}</span>
        </div>

        <Link
          href="/farmer/profile"
          className="text-xs font-bold text-forest-800 hover:text-forest-950 hover:underline flex items-center gap-1"
        >
          <span>View Farm Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
