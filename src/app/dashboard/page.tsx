'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { FarmerCard } from '@/components/marketplace/FarmerCard';
import { RatingStars } from '@/components/ui/RatingStars';
import { ConsumerProfileAddresses } from '@/components/consumer/ConsumerProfileAddresses';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageSquare,
  User,
  Settings,
  ArrowRight,
  Truck,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export default function ConsumerDashboardPage() {
  const router = useRouter();
  const { orders, farmers, savedFarmerIds } = useMarketplace();
  const { isAuthenticated, role, user, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'saved' | 'reviews' | 'profile' | 'settings'
  >('overview');
  const [consumerReviews, setConsumerReviews] = useState<any[]>([]);

  // Protect route: redirect unauthenticated visitors or non-consumers to login
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || role !== 'consumer')) {
      router.replace('/login?from=/dashboard');
    }
  }, [isLoading, isAuthenticated, role, router]);

  useEffect(() => {
    if (!isAuthenticated || role !== 'consumer') return;

    api
      .getConsumerReviews()
      .then((res) => setConsumerReviews(res.data || []))
      .catch(() => setConsumerReviews([]));
  }, [isAuthenticated, role]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-forest-700 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading consumer dashboard...</p>
      </div>
    );
  }

  // Prevent flash while redirecting
  if (!isAuthenticated || role !== 'consumer') {
    return null;
  }

  const displayName = user?.name || 'Consumer';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Stats
  const activeOrders = orders.filter((o) =>
    ['placed', 'confirmed', 'harvesting', 'packed', 'out_for_delivery'].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === 'delivered');
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const savedFarmers = farmers.filter((f) => savedFarmerIds.includes(f.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-3xl p-6 sm:p-8 text-white mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-forest-700 border-2 border-emerald-400 flex items-center justify-center font-serif text-2xl font-bold text-emerald-300">
            {initials}
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Consumer Hub
            </div>
            <h1 className="text-2xl font-bold font-serif">Welcome back, {displayName.split(' ')[0]}!</h1>
            <p className="text-xs text-forest-200 mt-0.5">
              Supporting local regenerative farms in Bengaluru
            </p>
          </div>
        </div>

        <Link
          href="/explore"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          Explore Fresh Arrivals
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* DASHBOARD SIDEBAR (3 COLS) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-earth-200/80 p-4 shadow-xs space-y-1 sticky top-24">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Saved Farmers ({savedFarmers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>My Reviews</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Addresses</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-earth-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Preferences & Settings</span>
          </button>
        </div>

        {/* MAIN DASHBOARD CONTENT (9 COLS) */}
        <div className="lg:col-span-9 space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Overview Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active Deliveries</span>
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">{activeOrders.length}</div>
                  <p className="text-[10px] text-slate-500 mt-1">1 en-route right now</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Completed Orders</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">{completedOrders.length}</div>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% on-time</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Favorite Farmers</span>
                    <Heart className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">{savedFarmers.length}</div>
                  <p className="text-[10px] text-slate-500 mt-1">In Bengaluru rural</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Invested</span>
                    <TrendingUp className="w-4 h-4 text-forest-700" />
                  </div>
                  <div className="text-2xl font-extrabold text-forest-950">₹{totalSpent}</div>
                  <p className="text-[10px] text-forest-800 font-semibold mt-1">₹{Math.round(totalSpent * 0.75)} to farmers</p>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100">
                  <h2 className="font-bold text-slate-900 text-base">Recent Harvest Orders</h2>
                  <Link
                    href="/orders"
                    className="text-xs font-bold text-forest-800 hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-earth-100">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{order.id}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-forest-50 text-forest-800">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {order.items.map((i) => `${i.quantity}× ${i.productName.split(' ')[0]}`).join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Slot: {order.deliverySlot.timeRange}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <span className="text-sm font-bold text-forest-950">₹{order.total}</span>
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition-colors"
                        >
                          Track
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Favorite Farmers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 text-base">Your Favorite Farmers</h2>
                  <Link
                    href="/farmers"
                    className="text-xs font-bold text-forest-800 hover:underline flex items-center gap-1"
                  >
                    <span>Discover More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedFarmers.map((farmer) => (
                    <FarmerCard key={farmer.id} farmer={farmer} />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl text-slate-900">All Orders History</h2>
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="p-4 bg-white rounded-2xl border border-earth-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900">{o.id}</span>
                      <div className="text-xs text-slate-500 mt-0.5">{o.estimatedDelivery}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-900">₹{o.total}</span>
                      <Link href={`/orders/${o.id}`} className="text-xs font-bold text-forest-800 hover:underline">
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-4">
              <h2 className="font-bold text-xl text-slate-900">Favorite Farmers ({savedFarmers.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedFarmers.map((f) => (
                  <FarmerCard key={f.id} farmer={f} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white rounded-3xl border border-earth-200 p-6 space-y-4">
              <h2 className="font-bold text-xl text-slate-900">My Product & Farmer Reviews</h2>
              <div className="space-y-4 divide-y divide-earth-100">
                {consumerReviews.length > 0 ? (
                  consumerReviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-1">
                      <RatingStars rating={Number(rev.rating) || 0} />
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                      <div className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()} • {rev.productName || 'Farm product'}
                        {rev.verifiedPurchase ? ' • Verified Purchase' : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-sm text-slate-600">
                    You haven’t left any reviews yet. Once you buy and receive an order, you can rate the product here.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && <ConsumerProfileAddresses />}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl border border-earth-200 p-6 space-y-4">
              <h2 className="font-bold text-xl text-slate-900">Communication Preferences</h2>
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input type="checkbox" defaultChecked className="accent-forest-700 w-4 h-4" />
                  <span>Receive WhatsApp notifications on dawn harvest timings</span>
                </label>
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input type="checkbox" defaultChecked className="accent-forest-700 w-4 h-4" />
                  <span>Alert me when my favorite farmers list fresh crops</span>
                </label>
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input type="checkbox" defaultChecked className="accent-forest-700 w-4 h-4" />
                  <span>Notify me on delivery arrival via contactless PIN</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
