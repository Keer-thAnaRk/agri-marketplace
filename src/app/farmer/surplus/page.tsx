'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import { detectSurplus, SurplusCandidate } from '@/utils/surplus';
import { calculateFreshness } from '@/utils/freshness';
import { SurplusOffer } from '@/types';
import {
  BadgePercent,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldCheck,
  X,
  Tag,
  DollarSign,
  Boxes,
  Percent,
} from 'lucide-react';

export default function SurplusManagementPage() {
  const {
    products,
    harvests,
    inventory,
    surplusOffers,
    createSurplusOffer,
    claimSurplusOffer,
    cancelSurplusOffer,
  } = useFarmer();

  const [activeTab, setActiveTab] = useState<'candidates' | 'activeOffers'>('candidates');
  const [selectedCandidate, setSelectedCandidate] = useState<SurplusCandidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [quantityToOffer, setQuantityToOffer] = useState<number>(20);
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [offerReason, setOfferReason] = useState<string>('');

  // Run surplus detection algorithm
  const candidates = detectSurplus(products, harvests, inventory);

  // Compute metrics
  const activeOffersCount = surplusOffers.filter((o) => o.status === 'Active').length;
  const potentialWasteKg = candidates.reduce((acc, c) => acc + c.potentialWasteKg, 0);
  const recoverableValue = candidates.reduce((acc, c) => acc + c.estimatedRecoverableValue, 0);
  const totalValueSaved = surplusOffers
    .filter((o) => o.status === 'Claimed')
    .reduce((acc, o) => acc + o.offerPrice * o.availableQuantity, 1420);

  const handleOpenOfferModal = (candidate: SurplusCandidate) => {
    setSelectedCandidate(candidate);
    setDiscountPercent(candidate.discountPercent || 20);
    setQuantityToOffer(candidate.availableQuantity);
    setOfferReason(candidate.surplusReason);
    setIsModalOpen(true);
  };

  const handleCreateOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    const offerPrice = Math.max(
      5,
      Math.round(selectedCandidate.originalPrice * (1 - discountPercent / 100))
    );

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiryHours);

    await createSurplusOffer({
      productId: selectedCandidate.productId,
      productName: selectedCandidate.productName,
      productImage: selectedCandidate.image,
      batchNumber: selectedCandidate.batchNumber,
      availableQuantity: Number(quantityToOffer),
      unit: selectedCandidate.unitShort,
      originalPrice: selectedCandidate.originalPrice,
      discountPercent: Number(discountPercent),
      offerPrice,
      expiryDate: expiryDate.toISOString(),
      daysRemaining: Math.max(1, Math.ceil(expiryHours / 24)),
      freshnessPercentage: selectedCandidate.freshnessPercentage,
      reason: offerReason || 'Surplus harvest flash offer to minimize food waste.',
      status: 'Active',
    });

    setIsModalOpen(false);
    setSelectedCandidate(null);
    setActiveTab('activeOffers');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Smart Surplus Management
            </h1>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
              Zero Waste Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Algorithmic surplus detection, automated shelf-life clearance offers, and direct consumer flash discounting
          </p>
        </div>

        {candidates.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenOfferModal(candidates[0])}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Flash Offer</span>
          </button>
        )}
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Candidates Detected */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Surplus Detected</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800">
            {candidates.length} <span className="text-xs text-amber-600 font-normal">harvest lots</span>
          </div>
          <p className="text-[10px] text-amber-700 font-semibold mt-1">
            Requires discount before freshness drop
          </p>
        </div>

        {/* Potential Spoilage Risk */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">At-Risk Volume</span>
            <Boxes className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {potentialWasteKg} <span className="text-xs text-slate-400 font-normal">units</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total physical weight needing clearance</p>
        </div>

        {/* Recoverable Value */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Recoverable Value</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            ₹{recoverableValue.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-800 font-semibold mt-1">
            Potential income preserved by flash sales
          </p>
        </div>

        {/* Active Offers */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Live Offers</span>
            <BadgePercent className="w-4 h-4 text-forest-800" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {activeOffersCount} <span className="text-xs text-slate-400 font-normal">active</span>
          </div>
          <p className="text-[10px] text-forest-700 font-semibold mt-1">
            Live on marketplace flash deals
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-earth-200/80 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('candidates')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'candidates'
              ? 'bg-forest-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-earth-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Algorithmic Surplus Candidates</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'candidates'
                ? 'bg-amber-400 text-slate-950 font-extrabold'
                : 'bg-earth-200 text-slate-700'
            }`}
          >
            {candidates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activeOffers')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'activeOffers'
              ? 'bg-forest-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-earth-100 hover:text-slate-900'
          }`}
        >
          <BadgePercent className="w-4 h-4" />
          <span>Published Flash Offers</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'activeOffers'
                ? 'bg-emerald-400 text-slate-950 font-extrabold'
                : 'bg-earth-200 text-slate-700'
            }`}
          >
            {surplusOffers.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Candidates View */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          {candidates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-earth-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Zero Surplus Risk Detected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                All your active harvests and inventory are well within optimal freshness thresholds and normal velocity. No produce requires urgent discounting today!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((cand) => (
                <div
                  key={cand.productId}
                  className="bg-white rounded-3xl border border-earth-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-earth-200 bg-earth-50">
                          <Image
                            src={cand.image}
                            alt={cand.productName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <span className="font-mono text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-lg border border-forest-200">
                            {cand.batchNumber}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm mt-1 leading-tight">
                            {cand.productName}
                          </h3>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 shrink-0">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{cand.daysRemaining}d left</span>
                      </span>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-300/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                        <span>Surplus Detection Reason:</span>
                        <span className="font-mono">{cand.freshnessPercentage}% Fresh</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-snug">
                        {cand.surplusReason}
                      </p>
                    </div>

                    {/* Financial comparison */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-earth-50 rounded-xl border border-earth-100">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Original Price</span>
                        <span className="font-bold text-slate-700 line-through">₹{cand.originalPrice}/{cand.unitShort}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-emerald-800 block text-[10px] font-bold uppercase">Suggested Offer</span>
                        <span className="font-extrabold text-emerald-700">₹{cand.suggestedPrice}/{cand.unitShort} ({cand.discountPercent}% off)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                      <span>Available: <strong>{cand.availableQuantity} {cand.unitShort}</strong></span>
                      <span>Recoverable: <strong className="text-forest-900">₹{cand.estimatedRecoverableValue}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenOfferModal(cand)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <BadgePercent className="w-4 h-4 text-emerald-300" />
                    <span>Create Flash Offer ({cand.discountPercent}% Off)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Active Offers View */}
      {activeTab === 'activeOffers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surplusOffers.map((offer) => {
              const isActive = offer.status === 'Active';

              return (
                <div
                  key={offer.offerId}
                  className={`rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                    isActive
                      ? 'bg-white border-forest-300/80'
                      : 'bg-earth-50/60 border-earth-200 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-earth-200 bg-earth-50">
                          <Image
                            src={offer.productImage}
                            alt={offer.productName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-slate-500">
                              {offer.offerId}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {offer.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm mt-1 leading-tight">
                            {offer.productName}
                          </h3>
                        </div>
                      </div>

                      <span className="font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        {offer.discountPercent}% OFF
                      </span>
                    </div>

                    <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Original Price:</span>
                        <span className="line-through">₹{offer.originalPrice}/{offer.unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-900 font-bold">
                        <span>Flash Offer Price:</span>
                        <span className="text-emerald-700 text-sm font-extrabold">₹{offer.offerPrice}/{offer.unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-earth-200/60 text-[11px]">
                        <span>Offered Stock:</span>
                        <span className="font-semibold text-slate-800">{offer.availableQuantity} {offer.unit}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-earth-200">
                      &ldquo;{offer.reason}&rdquo;
                    </p>
                  </div>

                  {isActive ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => claimSurplusOffer(offer.offerId)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Claim Lot</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelSurplusOffer(offer.offerId)}
                        className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                        title="Cancel this offer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-400 font-medium py-1">
                      Offer {offer.status.toLowerCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE SURPLUS OFFER MODAL */}
      {isModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-earth-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-earth-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Create Surplus Flash Deal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish limited fresh produce deal to local consumers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-earth-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfferSubmit} className="space-y-4">
              {/* Product Preview */}
              <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200 flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-earth-200 bg-white">
                  <Image
                    src={selectedCandidate.image}
                    alt={selectedCandidate.productName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-900">
                    {selectedCandidate.productName}
                  </div>
                  <div className="text-xs text-slate-500">
                    Batch: {selectedCandidate.batchNumber} • Original: ₹{selectedCandidate.originalPrice}/{selectedCandidate.unitShort}
                  </div>
                </div>
              </div>

              {/* Discount Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Discount Percentage: {discountPercent}%
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        discountPercent === pct
                          ? 'bg-forest-800 text-white shadow-xs'
                          : 'bg-earth-100 text-slate-700 hover:bg-earth-200'
                      }`}
                    >
                      {pct}% OFF
                    </button>
                  ))}
                </div>
              </div>

              {/* Price comparison result */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-semibold">New Consumer Price:</span>
                <span className="text-base font-extrabold text-emerald-800">
                  ₹{Math.max(5, Math.round(selectedCandidate.originalPrice * (1 - discountPercent / 100)))} / {selectedCandidate.unitShort}
                </span>
              </div>

              {/* Quantity to offer */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Quantity for Flash Deal ({selectedCandidate.unitShort}):
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedCandidate.availableQuantity}
                  value={quantityToOffer}
                  onChange={(e) => setQuantityToOffer(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Max available in packhouse: {selectedCandidate.availableQuantity} {selectedCandidate.unitShort}
                </span>
              </div>

              {/* Expiry Window */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Offer Validity Window:
                </label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  <option value={12}>12 Hours (Same-day Morning/Evening Dispatch)</option>
                  <option value={24}>24 Hours (Next Day Delivery Window)</option>
                  <option value={48}>48 Hours (Standard 2-Day Flash)</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Surplus Note for Consumers:
                </label>
                <textarea
                  rows={2}
                  value={offerReason}
                  onChange={(e) => setOfferReason(e.target.value)}
                  placeholder="e.g., Ripe and sweet, ideal for cooking immediately."
                  className="w-full px-3.5 py-2 rounded-xl border border-earth-300 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-earth-300 text-xs font-semibold text-slate-700 hover:bg-earth-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Publish Flash Deal Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
