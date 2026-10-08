'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, ShieldCheck, HeartHandshake, Truck, Sprout, ArrowRight } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/farmer')) {
    return null;
  }

  return (
    <footer className="bg-forest-950 text-white pt-16 pb-24 border-t border-forest-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Guarantees Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-forest-800/60 mb-12">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-forest-850 border border-forest-700/70 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Verified Farmers</h4>
              <p className="text-xs text-forest-300 mt-0.5 leading-relaxed">
                In-person soil health & pesticide-free verification for every enrolled grower.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-forest-850 border border-forest-700/70 text-emerald-400 flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Dawn Harvests</h4>
              <p className="text-xs text-forest-300 mt-0.5 leading-relaxed">
                Harvested hours before dispatch. Freshness scores audited daily.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-forest-850 border border-forest-700/70 text-emerald-400 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">75% Farmer Direct Share</h4>
              <p className="text-xs text-forest-300 mt-0.5 leading-relaxed">
                Transparent revenue split. Eliminating exploitative middlemen margins.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-forest-850 border border-forest-700/70 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Hyperlocal Cold Route</h4>
              <p className="text-xs text-forest-300 mt-0.5 leading-relaxed">
                Electric vehicle fleet and chilled containers across Bengaluru hubs.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-forest-800/60">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-forest-800 border border-forest-700 flex items-center justify-center text-emerald-400">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl font-serif tracking-tight text-white">
                Krishi<span className="text-emerald-400 font-sans">Market</span>
              </span>
            </Link>
            <p className="text-forest-200 text-sm leading-relaxed max-w-sm mb-6">
              Fresh from local farms. Direct to your doorstep. Connecting conscious urban consumers
              with verified local farmers through complete seed-to-fork traceability.
            </p>
            <div className="flex items-center gap-3 text-xs text-forest-300">
              <span className="px-2.5 py-1 rounded-full bg-forest-900 border border-forest-700/80">
                Bengaluru Agri-Hub #1
              </span>
              <span className="px-2.5 py-1 rounded-full bg-forest-900 border border-forest-700/80">
                FSSAI Registered
              </span>
            </div>
          </div>

          {/* Marketplace Navigation */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-forest-300 mb-4">
              Marketplace
            </h5>
            <ul className="space-y-2.5 text-sm text-forest-200">
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  Explore Fresh Produce
                </Link>
              </li>
              <li>
                <Link href="/farmers" className="hover:text-white transition-colors">
                  Verified Local Farmers
                </Link>
              </li>
              <li>
                <Link href="/explore?category=Vegetables" className="hover:text-white transition-colors">
                  Seasonal Vegetables
                </Link>
              </li>
              <li>
                <Link href="/explore?category=Dairy" className="hover:text-white transition-colors">
                  Raw A2 Gir Cow Milk
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Track Your Delivery
                </Link>
              </li>
            </ul>
          </div>

          {/* Producer & Governance */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-forest-300 mb-4">
              For Farmers & Governance
            </h5>
            <ul className="space-y-2.5 text-sm text-forest-200">
              <li>
                <Link href="/farmer/dashboard" className="hover:text-white transition-colors">
                  Farmer Command Center
                </Link>
              </li>
              <li>
                <Link href="/farmer/products/new" className="hover:text-white transition-colors">
                  List New Harvest
                </Link>
              </li>
              <li>
                <Link href="/farmer/orders" className="hover:text-white transition-colors">
                  Harvest Fulfillment Pipeline
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Platform Admin Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/farmers" className="hover:text-white transition-colors">
                  Farmer Verification Queue
                </Link>
              </li>
            </ul>
          </div>

          {/* Bengaluru Hubs */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-forest-300 mb-4">
              Delivery Hubs (Bengaluru)
            </h5>
            <p className="text-xs text-forest-300 mb-3">
              Hyperlocal 4-hour morning & evening harvest deliveries to:
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-forest-200">
              {['HSR Layout', 'Indiranagar', 'Koramangala', 'Whitefield', 'Sarjapur Rd', 'Electronic City', 'Yelahanka', 'Jayanagar'].map(
                (hub) => (
                  <span
                    key={hub}
                    className="px-2 py-0.5 rounded-md bg-forest-900/90 border border-forest-800 text-forest-300"
                  >
                    {hub}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom copyright and tag */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-400 gap-4">
          <p>© 2026 Krishi Market Inc. Built for Indian agrarian sustainability & food transparency.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer">Privacy & Traceability Charter</span>
            <span className="hover:text-white cursor-pointer">Quality Guarantee</span>
            <span className="hover:text-white cursor-pointer">Farmer Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
