'use client';

import React, { useState, useEffect } from 'react';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useRouter } from 'next/navigation';
import { Search, X, Sprout, Tractor, ArrowUpRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { MOCK_CATEGORIES } from '@/data/mockData';

export function GlobalSearchModal() {
  const { isSearchModalOpen, setIsSearchModalOpen, products, farmers } = useMarketplace();
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchingProducts = trimmed
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          p.category.toLowerCase().includes(trimmed) ||
          p.description.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const matchingFarmers = trimmed
    ? farmers.filter(
        (f) =>
          f.name.toLowerCase().includes(trimmed) ||
          f.farmName.toLowerCase().includes(trimmed) ||
          f.mainCrops.some((c) => c.toLowerCase().includes(trimmed))
      ).slice(0, 3)
    : [];

  const matchingCategories = trimmed
    ? MOCK_CATEGORIES.filter(
        (c) =>
          c.name.toLowerCase().includes(trimmed) ||
          c.description.toLowerCase().includes(trimmed)
      ).slice(0, 3)
    : [];

  const handleSelectProduct = (id: string) => {
    setIsSearchModalOpen(false);
    setQuery('');
    router.push(`/products/${id}`);
  };

  const handleSelectFarmer = (id: string) => {
    setIsSearchModalOpen(false);
    setQuery('');
    router.push(`/farmers/${id}`);
  };

  const handleSelectCategory = (catName: string) => {
    setIsSearchModalOpen(false);
    setQuery('');
    router.push(`/explore?category=${encodeURIComponent(catName)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-earth-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-earth-100 flex items-center gap-3 bg-earth-50/50">
          <Search className="w-5 h-5 text-forest-700 shrink-0" />
          <input
            type="text"
            placeholder="Search fresh produce, verified farmers, categories (e.g. 'tomato', 'Ravi', 'organic')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-base bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="text-xs px-2.5 py-1 bg-white border border-earth-200 rounded-lg text-slate-500 hover:bg-earth-100 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Search Results Area */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-earth-100 space-y-4">
          {!trimmed && (
            <div className="py-8 text-center text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Quick suggestions</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 max-w-md mx-auto">
                {['Vine Tomatoes', 'A2 Gir Cow Milk', 'Butterhead Lettuce', 'Bangalore Grapes', 'Organic Spinach'].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className="text-xs px-3 py-1.5 rounded-full bg-earth-100 text-slate-700 hover:bg-forest-100 hover:text-forest-900 transition-colors"
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {trimmed &&
            matchingProducts.length === 0 &&
            matchingFarmers.length === 0 &&
            matchingCategories.length === 0 && (
              <div className="py-10 text-center text-slate-500">
                <p className="text-sm">No produce or farmers matched &ldquo;{query}&rdquo;</p>
                <button
                  onClick={() => {
                    setIsSearchModalOpen(false);
                    router.push(`/explore?q=${encodeURIComponent(query)}`);
                  }}
                  className="mt-3 text-xs font-semibold text-forest-700 hover:underline inline-flex items-center gap-1"
                >
                  Browse entire catalog for &ldquo;{query}&rdquo; <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          {/* Matching Products */}
          {matchingProducts.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-800 mb-2.5">
                <Sprout className="w-3.5 h-3.5" />
                <span>Produce ({matchingProducts.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchingProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-forest-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-earth-200">
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="44px"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 group-hover:text-forest-800">
                          {p.name}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{p.farmerName}</span>
                          <span>•</span>
                          <span>{p.farmDistanceKm} km away</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-forest-800">₹{p.price}</div>
                      <div className="text-[11px] text-slate-500">/{p.unitShort}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching Farmers */}
          {matchingFarmers.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-800 mb-2.5">
                <Tractor className="w-3.5 h-3.5" />
                <span>Farmers ({matchingFarmers.length})</span>
              </div>
              <div className="space-y-1.5">
                {matchingFarmers.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleSelectFarmer(f.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-forest-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-forest-200">
                        <Image
                          src={f.avatar}
                          alt={f.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 group-hover:text-forest-800">
                          {f.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {f.farmName} • {f.distanceKm} km away
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-forest-700 font-medium group-hover:underline flex items-center gap-1">
                      View Farm <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching Categories */}
          {matchingCategories.length > 0 && (
            <div className="pt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-forest-800 mb-2.5">
                Categories
              </div>
              <div className="flex flex-wrap gap-2">
                {matchingCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCategory(c.name)}
                    className="px-3 py-1.5 rounded-xl bg-forest-50 text-forest-900 border border-forest-200 hover:bg-forest-100 text-xs font-medium transition-colors"
                  >
                    {c.name} ({c.productCount} items)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
