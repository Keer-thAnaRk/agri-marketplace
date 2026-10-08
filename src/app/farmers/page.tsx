'use client';

import React, { useState, useMemo } from 'react';
import { useMarketplace } from '@/context/MarketplaceContext';
import { FarmerCard } from '@/components/marketplace/FarmerCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, MapPin, Filter, SlidersHorizontal, ShieldCheck, Tractor } from 'lucide-react';

export default function FarmersDirectoryPage() {
  const { farmers, activeLocation } = useMarketplace();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [onlyVerified, setOnlyVerified] = useState(false);

  const filteredFarmers = useMemo(() => {
    return farmers.filter((farmer) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = farmer.name.toLowerCase().includes(q);
        const matchesFarm = farmer.farmName.toLowerCase().includes(q);
        const matchesHub = farmer.hub.toLowerCase().includes(q);
        const matchesCrops = farmer.mainCrops.some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesFarm && !matchesHub && !matchesCrops) return false;
      }

      if (selectedMethod !== 'all' && farmer.farmingMethod !== selectedMethod) {
        return false;
      }

      if (onlyVerified && !farmer.isVerified) {
        return false;
      }

      return true;
    });
  }, [farmers, searchTerm, selectedMethod, onlyVerified]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-800 border border-forest-600 text-emerald-300 text-xs font-bold">
            <Tractor className="w-3.5 h-3.5" />
            Verified Cultivators Network
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight">
            Meet Local Farmers Near You
          </h1>
          <p className="text-sm sm:text-base text-forest-100 leading-relaxed font-normal">
            Every farmer is physically visited, soil audited, and vetted for pesticide-free practices.
            Know your grower, visit their estate, and order dawn harvests directly.
          </p>
        </div>
      </div>

      {/* Control bar: search, method filter, verified toggle */}
      <div className="bg-white p-4 rounded-2xl border border-earth-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search farmers by name, farm, crop, or Bengaluru hub..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-earth-50 border border-earth-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 text-xs bg-earth-50 border border-earth-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="all">All Farming Practices</option>
            <option value="Organic">Certified Organic</option>
            <option value="Natural (ZBNF)">Natural (ZBNF)</option>
            <option value="Hydroponic">Hydroponic</option>
            <option value="Regenerative">Regenerative</option>
            <option value="Pesticide-Free">Pesticide-Free</option>
          </select>

          <label className="flex items-center gap-2 px-3 py-2 bg-earth-50 border border-earth-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer hover:bg-forest-50 transition-colors">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="accent-forest-700 w-3.5 h-3.5"
            />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Only</span>
          </label>
        </div>
      </div>

      {/* Farmers Grid */}
      {filteredFarmers.length === 0 ? (
        <EmptyState
          type="farmers"
          title="No farmers found"
          description="Try relaxing your filters or searching another Bengaluru neighborhood."
          actionText="View All Farmers"
          onAction={() => {
            setSearchTerm('');
            setSelectedMethod('all');
            setOnlyVerified(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarmers.map((farmer) => (
            <FarmerCard key={farmer.id} farmer={farmer} />
          ))}
        </div>
      )}
    </div>
  );
}
