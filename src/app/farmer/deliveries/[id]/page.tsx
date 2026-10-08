'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useFarmer } from '@/context/FarmerContext';
import { DeliveryBatchStatus } from '@/types';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Clock,
  Package,
  Users,
  CheckCircle2,
  Phone,
  Navigation,
  Printer,
  Zap,
  Play,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

export default function DeliveryBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.id as string;
  const { deliveryBatches, orders, updateBatchStatus } = useFarmer();
  const [dbBatch, setDbBatch] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (batchId) {
      const { api, getAuthToken } = require('@/lib/api');
      const token = getAuthToken();
      if (token) {
        api.getFarmerDeliveryBatchById(batchId, token)
          .then((res: any) => {
            if (res.success && res.data) {
              setDbBatch(res.data);
            }
          })
          .catch(() => {});
      }
    }
  }, [batchId]);

  const batch = dbBatch || deliveryBatches.find(
    (b) => b.batchId.toLowerCase() === batchId?.toLowerCase() || (b as any).id === batchId || (b as any).rawId === batchId
  ) || deliveryBatches[0];

  if (!batch) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-earth-200">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Delivery Batch Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Batch ID &ldquo;{batchId}&rdquo; was not found.</p>
        <Link
          href="/farmer/deliveries"
          className="inline-flex items-center gap-2 px-4 py-2 bg-forest-800 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Batches</span>
        </Link>
      </div>
    );
  }

  // Find matching orders
  const batchOrders =
    (batch as any).orders && (batch as any).orders.length > 0
      ? (batch as any).orders
      : orders.filter((o) => batch.orderIds.includes(o.id) || batch.orderIds.includes((o as any).orderNumber));

  const getNextStatus = (currentStatus: DeliveryBatchStatus): DeliveryBatchStatus | null => {
    if (currentStatus === 'Pending') return 'Preparing';
    if (currentStatus === 'Preparing') return 'Ready';
    if (currentStatus === 'Ready') return 'Out for Delivery';
    if (currentStatus === 'Out for Delivery') return 'Delivered';
    return null;
  };

  const nextStatus = getNextStatus(batch.status);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/70">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-earth-200 bg-white hover:bg-earth-50 text-slate-600 transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-lg border border-forest-200">
                {batch.batchId}
              </span>
              <span className="text-xs text-slate-400">Neighborhood Dispatch Route</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-serif mt-1">
              {batch.area} Delivery Batch
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-earth-300 hover:bg-earth-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Manifest</span>
          </button>

          {nextStatus && (
            <button
              type="button"
              onClick={() => updateBatchStatus(batch.batchId, nextStatus)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mark as &ldquo;{nextStatus}&rdquo;</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Stepper Progression Banner */}
      <div className="bg-white rounded-3xl border border-earth-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-earth-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Batch Dispatch Lifecycle
          </span>
          <span className="text-xs font-bold text-forest-900 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
            Current Status: {batch.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {batch.timeline.map((step: any, idx: number) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                step.completed
                  ? 'bg-forest-50 border-forest-300 text-forest-950 font-bold'
                  : step.current
                  ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold ring-2 ring-amber-400/30'
                  : 'bg-earth-50/50 border-earth-200 text-slate-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Step {idx + 1}
              </div>
              <div className="text-xs mt-1 leading-snug">{step.label}</div>
              <div className="text-[10px] font-mono mt-1 text-slate-500">
                {step.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logistics & Rider Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logistics Summary */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-earth-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-earth-100">
            <Navigation className="w-5 h-5 text-forest-700" />
            <h3 className="font-extrabold text-base text-slate-900 font-serif">
              Route & Cargo Manifest
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cluster Area
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block truncate">
                {batch.area}
              </span>
            </div>

            <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Delivery Window
              </span>
              <span className="text-xs font-extrabold text-forest-900 mt-1 block">
                {batch.deliverySlot}
              </span>
            </div>

            <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Est. Distance
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {batch.estimatedDistanceKm} km
              </span>
            </div>

            <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Transit Duration
              </span>
              <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                ~{batch.estimatedDeliveryTime}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-earth-50 rounded-2xl border border-earth-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Aggregated Produce: <strong>{batch.productsSummary}</strong></span>
            <span>Total Weight: <strong>{batch.totalQuantity}</strong></span>
          </div>
        </div>

        {/* Assigned Courier Rider */}
        <div className="bg-forest-900 text-white rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base font-serif text-white">
                Assigned EV Courier
              </h3>
            </div>
            <p className="text-xs text-forest-200 mt-1">
              Green delivery fleet partner operating on cold-chain crate carriers.
            </p>

            <div className="mt-4 p-3.5 bg-forest-800/80 rounded-2xl border border-forest-700/80 space-y-1.5 text-xs">
              <div className="font-bold text-white text-sm">
                {batch.riderName || 'Manjunath G.'}
              </div>
              <div className="text-forest-200">
                Vehicle: {batch.riderVehicle || 'Ather Cargo EV'}
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>EV Battery at 92% • Route Accepted</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert(`Calling courier partner: ${batch.riderName || 'Manjunath G.'}`)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Phone className="w-4 h-4" />
            <span>Contact Rider</span>
          </button>
        </div>
      </div>

      {/* Orders Included in Batch */}
      <div className="bg-white rounded-3xl border border-earth-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-earth-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-forest-700" />
            <h3 className="font-extrabold text-base text-slate-900 font-serif">
              Orders Grouped in this Batch ({batchOrders.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {batch.customerCount} unique destination stops
          </span>
        </div>

        <div className="divide-y divide-earth-100">
          {batchOrders.map((order: any, idx: number) => (
            <div
              key={order.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-lg border border-forest-200">
                    Stop #{idx + 1}: {order.id}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {order.customerName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.deliveryAddress.addressLine}</span>
                  </span>
                  <span>•</span>
                  <span>{order.items.length} items ({order.totalQuantity})</span>
                  <span>•</span>
                  <span className="font-bold text-forest-900">₹{order.amount}</span>
                </div>
              </div>

              <Link
                href={`/farmer/orders/${order.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-earth-200 hover:bg-earth-50 text-slate-700 text-xs font-semibold transition-all self-start sm:self-auto cursor-pointer"
              >
                <span>View Order</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
