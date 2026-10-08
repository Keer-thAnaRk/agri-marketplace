'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import { InventoryTable } from '@/components/farmer/InventoryTable';
import { StockUpdateModal } from '@/components/farmer/StockUpdateModal';
import { InventoryItem } from '@/types';
import { calculateFreshness } from '@/utils/freshness';
import {
  Boxes,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  BadgePercent,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function InventoryManagementPage() {
  const { inventory, updateStock } = useFarmer();

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('All');

  // Summary Metrics
  const totalStockKg = inventory.reduce((sum, item) => sum + item.currentStock, 0);
  const totalReservedKg = inventory.reduce((sum, item) => sum + item.reservedQuantity, 0);
  const lowStockCount = inventory.filter((item) => item.status === 'Low Stock').length;
  const outOfStockCount = inventory.filter((item) => item.status === 'Out of Stock').length;

  const approachingExpiryCount = inventory.filter((item) => {
    const lower = item.productName.toLowerCase();
    const shelfLife = lower.includes('spinach') || lower.includes('palak') || lower.includes('coriander') ? 3 : lower.includes('potato') ? 14 : 6;
    const harvestDate = item.lastUpdated.toLowerCase().includes('yesterday') ? 'Sept 23, 2026' : 'Sept 24, 2026';
    const freshness = calculateFreshness(harvestDate, shelfLife);
    return item.availableQuantity > 0 && freshness.isApproachingExpiry;
  }).length;

  const handleOpenModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = inventory.filter((item) => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.harvestBatch && item.harvestBatch.toLowerCase().includes(q))
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
            Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time stock velocity, reservation queues, and automated threshold alerts
          </p>
        </div>

        <Link
          href="/farmer/harvests/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Fresh Harvest</span>
        </Link>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Stock</span>
            <Boxes className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalStockKg} <span className="text-xs text-slate-400 font-normal">units</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total physical inventory in farm packhouse</p>
        </div>

        {/* Reserved Stock */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reserved Stock</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800">
            {totalReservedKg} <span className="text-xs text-amber-600 font-normal">units</span>
          </div>
          <p className="text-[10px] text-amber-700 font-semibold mt-1">Allocated to placed consumer orders</p>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">
            {lowStockCount} <span className="text-xs text-slate-400 font-normal">crops</span>
          </div>
          <p className="text-[10px] text-amber-800 font-semibold mt-1">Below safety thresholds</p>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-800">
            {outOfStockCount} <span className="text-xs text-slate-400 font-normal">crops</span>
          </div>
          <p className="text-[10px] text-rose-700 font-semibold mt-1">Auto-paused from marketplace</p>
        </div>
      </div>

      {/* Smart Surplus Recommendation Banner */}
      {approachingExpiryCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-950 text-sm">
                  {approachingExpiryCount} Harvest Lot{approachingExpiryCount > 1 ? 's' : ''} Approaching Shelf Life Limit
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full uppercase">
                  Action Recommended
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                The Freshness Engine detected produce with limited days remaining. Convert to surplus flash deals to prevent food waste and recover capital.
              </p>
            </div>
          </div>

          <Link
            href="/farmer/surplus"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Surplus Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-earth-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-earth-100 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-earth-50 border border-earth-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <InventoryTable
        items={filteredItems}
        onOpenStockModal={handleOpenModal}
        compact={false}
      />

      {/* Update Stock Modal */}
      <StockUpdateModal
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={() => setIsModalOpen(false)}
        onUpdate={updateStock}
      />
    </div>
  );
}
