'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import { DeliveryBatch, DeliveryBatchStatus } from '@/types';
import { groupOrdersByAreaAndSlot, calculateBatchLogistics } from '@/utils/deliveryBatch';
import {
  Truck,
  MapPin,
  Clock,
  Package,
  Users,
  CheckCircle2,
  ChevronRight,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Navigation,
  X,
  AlertCircle,
  Play,
} from 'lucide-react';

export default function DeliveriesPage() {
  const { deliveryBatches, orders, createDeliveryBatch, updateBatchStatus, autoCreateDeliveryBatches } = useFarmer();

  const [statusFilter, setStatusFilter] = useState<'All' | DeliveryBatchStatus>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoBatching, setIsAutoBatching] = useState(false);

  // New batch creation states
  const [selectedClusterKey, setSelectedClusterKey] = useState<string>('');
  const [selectedRider, setSelectedRider] = useState<string>('Manjunath G. (Ather Cargo EV)');

  // Cluster unbatched orders
  const groupedClusters = groupOrdersByAreaAndSlot(orders);
  const clusterKeys = Array.from(groupedClusters.keys());

  // Metrics
  const totalBatches = deliveryBatches.length;
  const activeBatches = deliveryBatches.filter(
    (b) => b.status === 'Preparing' || b.status === 'Ready' || b.status === 'Out for Delivery'
  ).length;
  const totalOrdersBatched = deliveryBatches.reduce((acc, b) => acc + b.orderIds.length, 0);
  const totalDistanceKm = deliveryBatches.reduce((acc, b) => acc + b.estimatedDistanceKm, 0);

  const filteredBatches = deliveryBatches.filter((b) => {
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    return true;
  });

  const getNextStatus = (currentStatus: DeliveryBatchStatus): DeliveryBatchStatus | null => {
    if (currentStatus === 'Pending') return 'Preparing';
    if (currentStatus === 'Preparing') return 'Ready';
    if (currentStatus === 'Ready') return 'Out for Delivery';
    if (currentStatus === 'Out for Delivery') return 'Delivered';
    return null;
  };

  const handleCreateBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClusterKey) return;

    const clusterOrders = groupedClusters.get(selectedClusterKey) || [];
    if (clusterOrders.length === 0) return;

    const [area, slot] = selectedClusterKey.split('__');
    const { estimatedDistanceKm, estimatedDeliveryTime } = calculateBatchLogistics(
      area,
      clusterOrders.length
    );

    const customerNames = Array.from(new Set(clusterOrders.map((o) => o.customerName)));
    const productsList = Array.from(
      new Set(clusterOrders.flatMap((o) => o.items.map((i) => i.productName.split(' ')[0])))
    ).join(', ');

    const totalKg = clusterOrders.reduce((sum, o) => {
      const parsed = parseInt(o.totalQuantity, 10);
      return sum + (isNaN(parsed) ? 3 : parsed);
    }, 0);

    createDeliveryBatch({
      area,
      deliverySlot: slot === 'Morning' ? '8:00 AM – 11:00 AM' : '12:00 PM – 3:30 PM',
      orderIds: clusterOrders.map((o) => o.id),
      customerCount: customerNames.length,
      customerNames,
      farmerNames: ['Green Valley Farm (Ravi Kumar)'],
      productsSummary: productsList || 'Fresh Farm Produce',
      totalQuantity: `${totalKg} kg`,
      estimatedDistanceKm,
      estimatedDeliveryTime,
      status: 'Preparing',
      riderName: selectedRider.split('(')[0].trim(),
      riderVehicle: selectedRider.includes('(')
        ? selectedRider.split('(')[1].replace(')', '')
        : 'EV Cargo Bike',
    });

    setIsModalOpen(false);
    setSelectedClusterKey('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Delivery Batching & Logistics
            </h1>
            <span className="text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
              Smart Hub Dispatch
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Group neighborhood orders by delivery slot, calculate optimal EV courier routes, and track multi-stop dispatch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isAutoBatching}
            onClick={async () => {
              setIsAutoBatching(true);
              try {
                await autoCreateDeliveryBatches();
              } catch {} finally {
                setIsAutoBatching(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-forest-300 bg-forest-50 hover:bg-forest-100 text-forest-900 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 text-emerald-600 ${isAutoBatching ? 'animate-spin' : ''}`} />
            <span>{isAutoBatching ? 'Optimizing...' : 'Smart Auto-Batch'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (clusterKeys.length > 0) setSelectedClusterKey(clusterKeys[0]);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Delivery Batch</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Batches */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Batches</span>
            <Truck className="w-4 h-4 text-forest-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {activeBatches} <span className="text-xs text-slate-400 font-normal">batches</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">In preparation or out on route</p>
        </div>

        {/* Orders Batched */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Orders Consolidated</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {totalOrdersBatched} <span className="text-xs text-slate-400 font-normal">orders</span>
          </div>
          <p className="text-[10px] text-emerald-800 font-semibold mt-1">Multi-stop neighborhood deliveries</p>
        </div>

        {/* Total Route Distance */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Transit Distance</span>
            <Navigation className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalDistanceKm.toFixed(1)} <span className="text-xs text-slate-400 font-normal">km</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Optimized Bengaluru cluster routes</p>
        </div>

        {/* Carbon Reduction */}
        <div className="bg-white p-5 rounded-3xl border border-earth-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Green EV Fleet</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-forest-900">
            100% <span className="text-xs text-emerald-600 font-bold">EV</span>
          </div>
          <p className="text-[10px] text-forest-700 font-semibold mt-1">Zero tailpipe emissions delivery</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-earth-200/80">
        {(['All', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'] as const).map((tab) => {
          const count = deliveryBatches.filter((b) => (tab === 'All' ? true : b.status === tab)).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-earth-100 hover:text-slate-900'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab
                    ? 'bg-emerald-400 text-slate-950 font-extrabold'
                    : 'bg-earth-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Batches Grid or Empty State */}
      {filteredBatches.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-earth-200/90 shadow-xs max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-earth-100 flex items-center justify-center mx-auto text-slate-400">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-serif">No Delivery Batches Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {clusterKeys.length === 0
              ? 'No orders are currently ready for batching.'
              : 'You have unbatched orders ready to be grouped into smart delivery clusters.'}
          </p>
          {clusterKeys.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedClusterKey(clusterKeys[0]);
                setIsModalOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-forest-800 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-forest-900 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Consolidate Ready Orders</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBatches.map((batch) => {
          const nextStatus = getNextStatus(batch.status);

          let statusStyle = 'bg-slate-100 text-slate-700 border-slate-300';
          if (batch.status === 'Preparing') statusStyle = 'bg-amber-50 text-amber-900 border-amber-300';
          else if (batch.status === 'Ready') statusStyle = 'bg-blue-50 text-blue-900 border-blue-300';
          else if (batch.status === 'Out for Delivery') statusStyle = 'bg-purple-50 text-purple-900 border-purple-300 animate-pulse';
          else if (batch.status === 'Delivered') statusStyle = 'bg-emerald-50 text-emerald-900 border-emerald-300';

          return (
            <div
              key={batch.batchId}
              className="bg-white rounded-3xl border border-earth-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Batch Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-forest-900 bg-forest-50 px-2.5 py-1 rounded-xl border border-forest-200">
                        {batch.batchId}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusStyle}`}>
                        {batch.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 font-serif mt-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-forest-700 shrink-0" />
                      <span>{batch.area}</span>
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-400 block">Delivery Slot</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{batch.deliverySlot}</span>
                    </span>
                  </div>
                </div>

                {/* Batch Logistics Details */}
                <div className="p-3.5 bg-earth-50 rounded-2xl border border-earth-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-forest-700" />
                      <span>Orders Consolidated:</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {batch.orderIds.length} orders ({batch.customerCount} customers)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-forest-700" />
                      <span>Customers:</span>
                    </span>
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">
                      {batch.customerNames.join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-forest-700" />
                      <span>Route Logistics:</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {batch.estimatedDistanceKm} km • ~{batch.estimatedDeliveryTime}
                    </span>
                  </div>

                  {batch.riderName && (
                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-earth-200/60">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Assigned Rider:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {batch.riderName} ({batch.riderVehicle})
                      </span>
                    </div>
                  )}
                </div>

                {/* Mini Timeline Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Dispatch Progress</span>
                    <span className="font-mono text-forest-900 font-bold">{batch.status}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {batch.timeline.map((step, idx) => (
                      <div
                        key={idx}
                        className={`h-2 rounded-full transition-all ${
                          step.completed
                            ? 'bg-forest-800'
                            : step.current
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-slate-200'
                        }`}
                        title={`${step.label}: ${step.timestamp}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-earth-100 flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/farmer/deliveries/${batch.batchId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-900 text-xs font-bold border border-forest-200 transition-all cursor-pointer"
                >
                  <span>View Batch Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {nextStatus && (
                  <button
                    type="button"
                    onClick={() => updateBatchStatus(batch.batchId, nextStatus)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Advance to &ldquo;{nextStatus}&rdquo;</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* CREATE DELIVERY BATCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-earth-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-earth-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-forest-800 text-white flex items-center justify-center">
                  <Truck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 font-serif">
                    Consolidate Delivery Batch
                  </h3>
                  <p className="text-xs text-slate-500">
                    Group neighborhood orders by delivery cluster
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

            <form onSubmit={handleCreateBatchSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Unbatched Order Cluster:
                </label>
                {clusterKeys.length === 0 ? (
                  <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200 text-xs text-slate-500 text-center">
                    All current active orders have already been grouped into delivery batches!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clusterKeys.map((key) => {
                      const clusterOrders = groupedClusters.get(key) || [];
                      const [area, slot] = key.split('__');
                      const isSelected = selectedClusterKey === key;

                      return (
                        <div
                          key={key}
                          onClick={() => setSelectedClusterKey(key)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-forest-50 border-forest-800 ring-2 ring-forest-800/20'
                              : 'bg-white border-earth-200 hover:border-earth-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-forest-700" />
                              <span>{area}</span>
                            </span>
                            <span className="text-[11px] font-bold text-forest-800 bg-white px-2 py-0.5 rounded-lg border border-forest-200">
                              {slot} Slot
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {clusterOrders.length} orders: {clusterOrders.map((o) => o.id).join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rider Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Assign EV Courier / Rider:
                </label>
                <select
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
                >
                  <option value="Manjunath G. (Ather Cargo EV)">Manjunath G. (Ather Cargo EV)</option>
                  <option value="Praveen Kumar (Yulu Wynn Cargo)">Praveen Kumar (Yulu Wynn Cargo)</option>
                  <option value="Santhosh Gowda (Euler HiLoad EV)">Santhosh Gowda (Euler HiLoad EV)</option>
                  <option value="Chethan R. (River Indie EV)">Chethan R. (River Indie EV)</option>
                </select>
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
                  disabled={!selectedClusterKey}
                  className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Generate Batch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
