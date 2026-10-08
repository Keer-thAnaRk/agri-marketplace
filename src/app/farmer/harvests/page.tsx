'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import { HarvestCard } from '@/components/farmer/HarvestCard';
import { HarvestTraceabilityTimeline } from '@/components/farmer/HarvestTimeline';
import { Plus, Search, Calendar, Sprout, Filter } from 'lucide-react';

export default function HarvestManagementPage() {
  const { harvests, farmerProfile } = useFarmer();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Low Stock' | 'Sold Out'>('All');

  const filteredHarvests = harvests.filter((h) => {
    if (statusFilter !== 'All' && h.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        h.id.toLowerCase().includes(q) ||
        h.productName.toLowerCase().includes(q) ||
        h.batchNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Harvest Management
            </h1>
            <span className="text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
              Traceability Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log dawn picking batches, track seed-to-fork origin codes, and audit crop freshness scores
          </p>
        </div>

        <Link
          href="/farmer/harvests/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Harvest</span>
        </Link>
      </div>

      {/* Traceability Architectural Banner (Section 17) */}
      <HarvestTraceabilityTimeline
        farmName={farmerProfile.farmName}
        batchNumber="TOM-2409-A"
        harvestDate="Sept 24, 2026"
        quantityHarvested="100 kg"
        availableQuantity="65 kg"
        freshnessScore={92}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-earth-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Available', 'Low Stock', 'Sold Out'] as const).map((tab) => {
            const count = harvests.filter((h) => (tab === 'All' ? true : h.status === tab)).length;

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab
                    ? 'bg-forest-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-earth-100 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab
                      ? 'bg-emerald-400 text-forest-950 font-extrabold'
                      : 'bg-earth-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search batch or harvest ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-earth-50 border border-earth-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Harvest Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHarvests.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No harvest records match your filter criteria.
          </div>
        ) : (
          filteredHarvests.map((harvest) => (
            <HarvestCard key={harvest.id} harvest={harvest} />
          ))
        )}
      </div>
    </div>
  );
}
