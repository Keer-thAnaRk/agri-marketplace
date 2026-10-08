'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMarketplace } from '@/context/MarketplaceContext';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { MOCK_CATEGORIES } from '@/data/mockData';
import { FarmingMethod } from '@/types';
import {
  Filter,
  X,
  SlidersHorizontal,
  Search,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  Check,
} from 'lucide-react';

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSort = searchParams.get('sort') || 'recommended';
  const initialQuery = searchParams.get('q') || '';

  const { products } = useMarketplace();

  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(400);
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [onlyOrganic, setOnlyOrganic] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>(initialSort);

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMaxPrice(400);
    setMaxDistance(10);
    setOnlyOrganic(false);
    setSelectedMethod('all');
    setMinRating(0);
    setOnlyInStock(false);
    setSortBy('recommended');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (maxPrice < 400) count++;
    if (maxDistance < 10) count++;
    if (onlyOrganic) count++;
    if (selectedMethod !== 'all') count++;
    if (minRating > 0) count++;
    if (onlyInStock) count++;
    return count;
  }, [selectedCategory, maxPrice, maxDistance, onlyOrganic, selectedMethod, minRating, onlyInStock]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = product.name.toLowerCase().includes(q);
          const matchesFarmer = product.farmerName.toLowerCase().includes(q);
          const matchesFarm = product.farmName.toLowerCase().includes(q);
          const matchesCategory = product.category.toLowerCase().includes(q);
          if (!matchesName && !matchesFarmer && !matchesFarm && !matchesCategory) return false;
        }

        // Category
        if (selectedCategory && product.category !== selectedCategory) {
          return false;
        }

        // Price
        if (product.price > maxPrice) {
          return false;
        }

        // Distance
        if (product.farmDistanceKm > maxDistance) {
          return false;
        }

        // Organic
        if (onlyOrganic && !product.isOrganic) {
          return false;
        }

        // Farming Method
        if (selectedMethod !== 'all' && product.farmingMethod !== selectedMethod) {
          return false;
        }

        // Min rating
        if (product.rating < minRating) {
          return false;
        }

        // Availability
        if (onlyInStock && !product.inStock) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_low':
            return a.price - b.price;
          case 'price_high':
            return b.price - a.price;
          case 'freshest':
            return b.freshnessScore - a.freshnessScore;
          case 'nearest':
            return a.farmDistanceKm - b.farmDistanceKm;
          case 'recommended':
          default:
            return b.rating - a.rating;
        }
      });
  }, [
    products,
    searchQuery,
    selectedCategory,
    maxPrice,
    maxDistance,
    onlyOrganic,
    selectedMethod,
    minRating,
    onlyInStock,
    sortBy,
  ]);

  const farmingMethodsList: FarmingMethod[] = [
    'Organic',
    'Natural (ZBNF)',
    'Hydroponic',
    'Regenerative',
    'Pesticide-Free',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Fresh Produce Marketplace
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Direct from local Bengaluru farmers. Filter by distance, harvest freshness, and organic certification.
            </p>
          </div>

          <div className="text-xs font-semibold text-forest-800 bg-forest-50 px-3 py-1.5 rounded-xl border border-forest-200 self-start sm:self-auto">
            Showing {filteredProducts.length} harvested crops
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* DESKTOP LEFT SIDEBAR FILTERS (4 COLS) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white p-6 rounded-3xl border border-earth-200 shadow-xs space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-earth-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-slate-900 text-sm">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-forest-700 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-forest-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
              Category
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  !selectedCategory
                    ? 'bg-forest-50 text-forest-900 font-bold'
                    : 'text-slate-600 hover:bg-earth-50'
                }`}
              >
                <span>All Categories</span>
                {!selectedCategory && <Check className="w-3.5 h-3.5 text-forest-700" />}
              </button>
              {MOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name === selectedCategory ? '' : cat.name)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedCategory === cat.name
                      ? 'bg-forest-50 text-forest-900 font-bold'
                      : 'text-slate-600 hover:bg-earth-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  {selectedCategory === cat.name && (
                    <Check className="w-3.5 h-3.5 text-forest-700" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="pt-4 border-t border-earth-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Max Price
              </label>
              <span className="text-xs font-bold text-forest-900">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="30"
              max="400"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>₹30</span>
              <span>₹400+</span>
            </div>
          </div>

          {/* Farm Distance Radius */}
          <div className="pt-4 border-t border-earth-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Farm Distance
              </label>
              <span className="text-xs font-bold text-forest-900">Within {maxDistance} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-forest-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>1 km (Ultra local)</span>
              <span>15 km</span>
            </div>
          </div>

          {/* Farming Method */}
          <div className="pt-4 border-t border-earth-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
              Farming Method
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-earth-50 border border-earth-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">All Farming Methods</option>
              {farmingMethodsList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Organic Toggles & Stock */}
          <div className="pt-4 border-t border-earth-100 space-y-3">
            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOrganic}
                onChange={(e) => setOnlyOrganic(e.target.checked)}
                className="rounded text-forest-700 focus:ring-forest-600 w-4 h-4 accent-forest-700 cursor-pointer"
              />
              <span>Certified Organic Only</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded text-forest-700 focus:ring-forest-600 w-4 h-4 accent-forest-700 cursor-pointer"
              />
              <span>In-Stock Available Today</span>
            </label>
          </div>
        </aside>

        {/* MAIN AREA: SEARCH, SORT & PRODUCT GRID (9 COLS) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Top Control Bar: Search & Sort */}
          <div className="bg-white p-4 rounded-2xl border border-earth-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search produce name, farmer, or variety..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-earth-50/70 border border-earth-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white text-slate-800 transition-all"
              />
            </div>

            {/* Mobile Filter Button */}
            <div className="flex items-center gap-2 sm:shrink-0">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center justify-center gap-2 px-3 py-2 bg-earth-100 text-slate-800 rounded-xl text-xs font-bold"
              >
                <Filter className="w-3.5 h-3.5 text-forest-700" />
                <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-earth-50 border border-earth-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
                >
                  <option value="recommended">Recommended (Top Rated)</option>
                  <option value="freshest">Freshest First (Highest Score)</option>
                  <option value="nearest">Nearest Farm First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 font-medium">Active Filters:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-100 text-forest-900 text-xs font-semibold">
                  Category: {selectedCategory}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-forest-950"
                    onClick={() => setSelectedCategory('')}
                  />
                </span>
              )}
              {maxPrice < 400 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-100 text-forest-900 text-xs font-semibold">
                  Under ₹{maxPrice}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-forest-950"
                    onClick={() => setMaxPrice(400)}
                  />
                </span>
              )}
              {maxDistance < 10 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-100 text-forest-900 text-xs font-semibold">
                  Within {maxDistance} km
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-forest-950"
                    onClick={() => setMaxDistance(10)}
                  />
                </span>
              )}
              {onlyOrganic && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-semibold">
                  Organic
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-emerald-950"
                    onClick={() => setOnlyOrganic(false)}
                  />
                </span>
              )}
              {selectedMethod !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-100 text-forest-900 text-xs font-semibold">
                  Method: {selectedMethod}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-forest-950"
                    onClick={() => setSelectedMethod('all')}
                  />
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-rose-600 underline font-medium cursor-pointer ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Grid or Empty State */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              type="search"
              title="No produce found"
              description="No harvests match your active criteria. Try broadening your distance radius or clearing category filters."
              actionText="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER MODAL / BOTTOM SHEET */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="p-4 border-b border-earth-100 flex items-center justify-between bg-forest-50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-forest-800" />
                <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Categories */}
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 block mb-2">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-3 py-1.5 rounded-lg font-semibold ${
                      !selectedCategory ? 'bg-forest-800 text-white' : 'bg-earth-100 text-slate-700'
                    }`}
                  >
                    All
                  </button>
                  {MOCK_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.name === selectedCategory ? '' : c.name)}
                      className={`px-3 py-1.5 rounded-lg font-semibold ${
                        selectedCategory === c.name
                          ? 'bg-forest-800 text-white'
                          : 'bg-earth-100 text-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-500 uppercase tracking-wider">Max Price</span>
                  <span className="text-forest-900">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="400"
                  step="10"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-forest-700"
                />
              </div>

              {/* Distance */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-slate-500 uppercase tracking-wider">Farm Distance</span>
                  <span className="text-forest-900">Within {maxDistance} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full accent-forest-700"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={onlyOrganic}
                    onChange={(e) => setOnlyOrganic(e.target.checked)}
                    className="w-4 h-4 accent-forest-700"
                  />
                  <span>Certified Organic Only</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 accent-forest-700"
                  />
                  <span>In-Stock Available Today</span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-earth-100 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl border border-earth-200 text-slate-700 font-bold text-xs"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-forest-800 text-white font-bold text-xs shadow-xs"
              >
                Apply Filters ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading marketplace...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
