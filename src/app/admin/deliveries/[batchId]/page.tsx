'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminDeliveryBatchRecord } from '@/data/admin';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Truck,
  Clock,
  Package,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function AdminDeliveryBatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(params);
  const batchId = resolvedParams.batchId;

  const [batch, setBatch] = useState<AdminDeliveryBatchRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    let isCancelled = false;

    api
      .getAdminDeliveryBatchById(batchId)
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          setBatch(res.data);
          setError(null);
          setIsLoading(false);
        } else if (!isCancelled) {
          setError('Delivery batch could not be found.');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Unable to load delivery batch from database.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [batchId, refreshTrigger]);

  const handleStatusChange = async (nextStatus: string) => {
    if (!batch || nextStatus === batch.status) return;
    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      const res = await api.updateAdminDeliveryBatchStatus(batch.id, nextStatus);
      if (res.success && res.data) {
        setBatch(res.data);
        setStatusMessage({
          type: 'success',
          text: `Delivery batch status successfully transitioned to ${nextStatus.replace(/_/g, ' ')}.`,
        });
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update delivery batch status.';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
          <Link
            href="/admin/deliveries"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-8 w-56 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-forest-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Fetching delivery batch, assigned orders, route metrics, and timeline from PostgreSQL...
          </p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
          <Link
            href="/admin/deliveries"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Delivery Batch Not Found</h1>
        </div>

        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-900 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold text-sm">
              {error || `Delivery batch "${batchId}" could not be found.`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setRefreshTrigger((prev) => prev + 1);
              }}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Retry Loading
            </button>
            <Link
              href="/admin/deliveries"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Back to Deliveries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/deliveries"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Logistics Dispatch Run
              </span>
              <span className="font-mono text-[11px] text-slate-500 font-bold">{batch.batchCode}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Delivery Batch Overview
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            <select
              value={batch.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="text-xs font-extrabold uppercase bg-transparent text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="PENDING">Pending (Batch Formed)</option>
              <option value="PREPARING">Preparing (Packing)</option>
              <option value="READY">Ready for Pickup</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery (Dispatched)</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-600" />}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Batch Details"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 Cols): Batch Info, Assigned Orders, Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Batch Information */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Truck className="w-4 h-4 text-forest-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Batch Information
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Hub Cluster
                </span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {batch.hub || batch.hubArea}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Delivery Slot
                </span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {batch.deliverySlot}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Payload
                </span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {batch.totalQuantity}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Route Distance
                </span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {batch.estimatedDistanceKm || 0} km
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-slate-500 border-t border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Created on: {new Date(batch.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Assigned Orders with Product Information */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-forest-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                  Consolidated Orders ({batch.orders ? batch.orders.length : batch.orderNumbers.length})
                </h2>
              </div>
              <span className="text-xs text-slate-400">Zero cross-hub mixing</span>
            </div>

            <div className="divide-y divide-slate-100">
              {batch.orders && batch.orders.length > 0 ? (
                batch.orders.map((order, idx) => (
                  <div key={order.id} className="py-4 space-y-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-900">{order.orderNumber}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Stop #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {order.status}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          }`}
                        >
                          {order.paymentStatus} ({order.paymentMethod})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900 text-xs">₹{order.total}</span>
                        <Link
                          href={`/admin/orders/${order.id || order.rawId || order.orderNumber}`}
                          className="text-xs font-bold text-forest-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Inspect Order</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer</span>
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{order.customerPhone}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivery Address</span>
                        <div className="text-slate-700 text-[11px] font-medium flex items-start gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.hub}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products breakdown */}
                    {order.items && order.items.length > 0 && (
                      <div className="pl-3 border-l-2 border-slate-200 space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Produce in this order ({order.items.length} items)
                        </span>
                        <div className="divide-y divide-slate-100 text-xs">
                          {order.items.map((item) => (
                            <div key={item.id} className="py-1.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                              <div>
                                <span className="font-semibold text-slate-900">{item.productName}</span>
                                <span className="text-slate-400 text-[11px] ml-2">
                                  {item.quantity} {item.unit} @ ₹{item.unitPrice}
                                </span>
                                {item.farmerName && (
                                  <div className="text-[10px] text-slate-500">
                                    Farmer: <span className="font-medium text-slate-700">{item.farmerName}</span>
                                    {item.farmName ? ` (${item.farmName})` : ''}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-slate-800 text-[11px]">₹{item.totalPrice}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : batch.orderNumbers && batch.orderNumbers.length > 0 ? (
                batch.orderNumbers.map((orderNum, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-900">{orderNum}</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Stop #{idx + 1}
                      </span>
                    </div>

                    <Link
                      href={`/admin/orders/${orderNum}`}
                      className="text-xs font-bold text-forest-700 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Inspect Order</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No orders assigned to this delivery batch yet.
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Dispatch Lifecycle Timeline
              </h2>
            </div>

            <div className="relative pl-5 border-l-2 border-slate-100 space-y-4 my-2">
              {batch.timeline && batch.timeline.length > 0 ? (
                batch.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                        step.completed || step.isCompleted
                          ? 'bg-emerald-600 ring-emerald-200'
                          : 'bg-slate-300 ring-slate-100'
                      }`}
                    />
                    <div className="text-xs font-bold text-slate-900">{step.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{step.timestamp}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No timeline steps recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Rider Information & Delivery Route */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Logistics Driver
              </span>
              <h3 className="text-base font-bold text-slate-900 font-serif">Rider Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Rider Name</span>
                <span className="font-bold text-slate-900 text-sm">{batch.riderName || 'Unassigned Rider'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Mobile Phone</span>
                <span className="text-slate-700 font-medium">{batch.riderPhone || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Assigned EV Fleet Vehicle</span>
                <span className="text-slate-900 font-semibold">{batch.riderVehicle || 'EV Cargo'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Estimated Route Time</span>
                <span className="text-slate-700 font-medium">
                  {batch.estimatedDuration || batch.estimatedDeliveryTime || '30 mins'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
