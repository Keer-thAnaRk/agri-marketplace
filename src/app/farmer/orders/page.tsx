'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import { OrderTable } from '@/components/farmer/OrderTable';
import { FarmerOrderStatus } from '@/types';
import { Package, Search, Filter } from 'lucide-react';

export default function FarmerOrdersPage() {
  const { orders, updateOrderStatus } = useFarmer();
  const [activeTab, setActiveTab] = useState<'All' | FarmerOrderStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: ('All' | FarmerOrderStatus)[] = [
    'All',
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready',
    'Completed',
    'Cancelled',
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeTab !== 'All' && o.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.productsSummary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Orders & Fulfillment Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accept harvest queues, mark crops ready, and coordinate handover with local EV riders
          </p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-earth-200/80 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {tabs.map((tab) => {
            const count = orders.filter((o) => (tab === 'All' ? true : o.status === tab)).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-forest-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-earth-100 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab
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

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-earth-50 border border-earth-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Order Table with Status Progression Actions */}
      <OrderTable
        orders={filteredOrders}
        onAdvanceStatus={updateOrderStatus}
        showAllLink={false}
      />
    </div>
  );
}
