'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/context/MarketplaceContext';
import { BENGALURU_LOCATIONS } from '@/data/mockData';
import { MapPin, X, Check, Navigation, Search } from 'lucide-react';

export function LocationModal() {
  const { isLocationModalOpen, setIsLocationModalOpen, activeLocation, setActiveLocation, showToast } =
    useMarketplace();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isLocationModalOpen) return null;

  const filteredLocations = BENGALURU_LOCATIONS.filter((loc) =>
    loc.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.pincode.includes(searchTerm)
  );

  const handleSelect = (loc: typeof BENGALURU_LOCATIONS[0]) => {
    setActiveLocation(loc);
    setIsLocationModalOpen(false);
    showToast(`Delivery location set to ${loc.area}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-earth-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-earth-100 flex items-center justify-between bg-forest-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Select Delivery Location</h3>
              <p className="text-xs text-slate-500">Find fresh farms closest to your neighbourhood</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-earth-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search area or pincode (e.g. HSR, 560102)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-earth-50 border border-earth-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition-all text-slate-800"
              autoFocus
            />
          </div>

          <button
            onClick={() => {
              setActiveLocation(BENGALURU_LOCATIONS[0]);
              setIsLocationModalOpen(false);
              showToast('Using GPS location: HSR Layout', 'info');
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-forest-800 bg-forest-100/70 hover:bg-forest-100 rounded-xl transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-forest-700" />
            <span>Detect My Current Location (GPS)</span>
          </button>
        </div>

        {/* Location List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-earth-100">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
            Bengaluru Delivery Hubs
          </div>
          {filteredLocations.map((loc) => {
            const isSelected = activeLocation.id === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className={`w-full text-left py-3 px-3 rounded-xl flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-forest-50/80 text-forest-900 font-semibold'
                    : 'hover:bg-earth-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{loc.area}</div>
                  <div className="text-xs text-slate-500">{loc.city} – {loc.pincode}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-forest-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
