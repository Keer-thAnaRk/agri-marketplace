'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMarketplace } from '@/context/MarketplaceContext';
import { MOCK_CATEGORIES } from '@/data/mockData';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { FarmerCard } from '@/components/marketplace/FarmerCard';
import { CategoryCard } from '@/components/marketplace/CategoryCard';
import { TraceabilityTimeline } from '@/components/marketplace/TraceabilityTimeline';
import { PriceBreakdown } from '@/components/marketplace/PriceBreakdown';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Truck,
  MapPin,
  ChevronDown,
  Search,
  CheckCircle2,
  Compass,
  Scale,
  ShoppingBag,
  PackageCheck,
  Users,
  Sprout,
  HeartHandshake,
} from 'lucide-react';

export default function LandingPage() {
  const { products, farmers, activeLocation, setIsLocationModalOpen } = useMarketplace();
  const [activeTraceIndex, setActiveTraceIndex] = useState(0);

  // Freshly harvested: products sorted by highest freshness score
  const freshHarvests = [...products]
    .sort((a, b) => b.freshnessScore - a.freshnessScore)
    .slice(0, 4);

  // Top nearby farmers
  const nearbyFarmers = [...farmers].slice(0, 3);

  // Traceability demo products
  const traceSamples = products.slice(0, 3);
  const selectedTraceProduct = traceSamples[activeTraceIndex] || traceSamples[0];

  return (
    <div className="space-y-20 pb-16">
      {/* 4. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-900 via-forest-850 to-forest-950 text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Background ambient accents */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#52b788_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-harvest-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Local Area Pill & Location Button */}
              <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-800/80 border border-forest-600/50 text-emerald-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Direct Farmer-to-Consumer Market
                </span>

                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium backdrop-blur-md transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-harvest-gold" />
                  <span>Delivering to: <strong className="text-emerald-300">{activeLocation.area.split(',')[0]}</strong></span>
                  <ChevronDown className="w-3 h-3 text-slate-300" />
                </button>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-[1.12]">
                Fresh from local farms. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-200 to-amber-200">
                  Direct to your doorstep.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-forest-100/90 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Discover fresh, locally grown produce directly from verified farmers near you.
                Know where your food comes from, how fresh it is, and who grew it with 100% verified harvest traceability.
              </p>

              {/* Hero CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/explore"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-forest-950 font-bold text-base transition-all duration-200 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <span>Explore Fresh Produce</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/farmer/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-forest-800/80 hover:bg-forest-800 hover:text-white border border-forest-600/70 text-forest-100 font-semibold text-base transition-all duration-200 backdrop-blur-md cursor-pointer"
                >
                  <span>Become a Farmer</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-forest-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm font-semibold text-forest-200">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Farmers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Dawn Harvests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Local Hyperlocal Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Cards */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Image Card */}
                <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 bg-forest-800">
                  <Image
                    src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80"
                    alt="Fresh organic harvest from local farm"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Floating Harvest Stat Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl text-slate-900 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-forest-200">
                        <Image
                          src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80"
                          alt="Farmer Ravi Kumar"
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          Vine Tomatoes • ₹52/kg
                        </div>
                        <div className="text-[11px] text-forest-800 font-medium">
                          Ravi Kumar • 2.4 km away
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                        Freshness: 96/100
                      </span>
                      <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
                        Picked 4 hrs ago
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Micro Badge Left */}
                <div className="absolute -top-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md py-2 px-3.5 rounded-2xl shadow-xl border border-forest-100 flex items-center gap-2.5 text-slate-900 text-xs font-bold animate-bounce-subtle">
                  <div className="w-7 h-7 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-600 uppercase font-semibold">Audited</span>
                    <span>100% Pesticide-Free</span>
                  </div>
                </div>

                {/* Floating Micro Badge Right */}
                <div className="hidden sm:flex absolute -bottom-6 -right-4 bg-forest-950/95 backdrop-blur-md py-2.5 px-4 rounded-2xl shadow-xl border border-forest-700 items-center gap-3 text-white text-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-forest-950 flex items-center justify-center font-extrabold text-sm">
                    75%
                  </div>
                  <div>
                    <span className="font-bold block text-emerald-300">Direct Farmer Payout</span>
                    <span className="text-[10px] text-forest-300">3x regular mandi rate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURED CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
              Browse the Field
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Shop by Category
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select produce harvested daily by local sustainable growers.
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-800 hover:text-forest-950 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {MOCK_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 6. FRESH HARVEST SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-forest-50 via-emerald-50/40 to-earth-50 rounded-3xl p-6 sm:p-8 border border-forest-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Morning Batch: 5:00 AM – 7:30 AM</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-tight">
                Freshly Harvested
              </h2>
              <p className="text-sm text-forest-800/80 mt-1">
                Picked recently. Delivered with care to your neighborhood.
              </p>
            </div>

            <Link
              href="/explore?sort=freshest"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 text-white hover:bg-forest-900 text-xs font-bold transition-all shadow-xs"
            >
              <span>See All Fresh Arrivals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Fresh Product Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {freshHarvests.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. NEARBY FARMERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
              Hyperlocal Agriculture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Farmers Near You
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Connect directly with regenerative cultivators within 10 km of your delivery hub.
            </p>
          </div>

          <Link
            href="/farmers"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-800 hover:text-forest-950 transition-colors"
          >
            <span>Meet All Verified Farmers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nearbyFarmers.map((farmer) => (
            <FarmerCard key={farmer.id} farmer={farmer} />
          ))}
        </div>
      </section>

      {/* 8. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
            Simple 4-Step Cycle
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            How Krishi Market Works
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Eliminating lengthy cold storage, middlemen markups, and chemical preservatives.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-3xl border border-earth-200/80 shadow-xs hover:shadow-md transition-all flex flex-col text-left group">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center font-extrabold text-lg mb-5 group-hover:bg-forest-700 group-hover:text-white transition-colors">
              <Compass className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-forest-700 uppercase tracking-wider mb-1">Step 01</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Discover</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Find verified farmers and seasonal produce growing in peri-urban belts right outside your door.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-3xl border border-earth-200/80 shadow-xs hover:shadow-md transition-all flex flex-col text-left group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-lg mb-5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Scale className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Step 02</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Choose</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compare harvest timestamps, brix sweetness, farming practices, and transparent pricing.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-3xl border border-earth-200/80 shadow-xs hover:shadow-md transition-all flex flex-col text-left group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-extrabold text-lg mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Step 03</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Order</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Place your order directly with the grower. Produce is harvested only after order confirmation.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-3xl border border-earth-200/80 shadow-xs hover:shadow-md transition-all flex flex-col text-left group">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-extrabold text-lg mb-5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">Step 04</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Receive</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get fresh harvest delivered in your chosen morning or evening slot with live stage tracking.
            </p>
          </div>
        </div>
      </section>

      {/* 9. TRANSPARENCY & FOOD ORIGIN SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-10 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
              Key Differentiator
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Know where your food comes from.
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every crop has an auditable seed-to-table digital journey. Switch between harvests to inspect:
            </p>

            {/* Produce Switcher Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {traceSamples.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTraceIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTraceIndex === idx
                      ? 'bg-forest-800 text-white shadow-sm'
                      : 'bg-earth-100 text-slate-700 hover:bg-forest-100'
                  }`}
                >
                  {item.name.split('(')[0]}
                </button>
              ))}
            </div>
          </div>

          <TraceabilityTimeline
            steps={selectedTraceProduct.traceability}
            productName={selectedTraceProduct.name}
            farmName={selectedTraceProduct.farmName}
          />
        </div>
      </section>

      {/* 10. PRICE TRANSPARENCY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
              Fair Trade Agri
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Where your money goes.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In traditional supply chains, farmers receive less than 25% of retail price while produce sits in storage for 5 to 7 days.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              At Krishi Market, ₹75 out of every ₹100 is credited directly into the farmer&apos;s bank account on the day of delivery.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-850 hover:bg-forest-900 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <span>Shop Fair-Price Produce</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <PriceBreakdown totalAmount={100} showTitle={true} compact={false} />
          </div>
        </div>
      </section>

      {/* FARMER ONBOARDING CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-800 text-emerald-300 text-xs font-bold">
              <Sprout className="w-3.5 h-3.5" />
              <span>Cultivator Network</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif">
              Are you a farmer in or around Bengaluru?
            </h3>
            <p className="text-forest-200 text-sm leading-relaxed">
              Get verified, list your harvests, receive predictable upfront demand, and earn 3x standard market rates with zero intermediary cuts.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/farmer/dashboard"
              className="px-6 py-3.5 rounded-xl bg-harvest-gold hover:bg-amber-400 text-forest-950 font-bold text-sm text-center shadow-lg transition-colors cursor-pointer"
            >
              Enroll Your Farm
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
