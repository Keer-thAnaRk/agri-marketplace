'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminOrderRecord } from '@/data/admin';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Package,
  Clock,
  Truck,
  IndianRupee,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<AdminOrderRecord | null>(null);
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
      .getAdminOrderById(orderId)
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          setOrder(res.data);
          setError(null);
          setIsLoading(false);
        } else if (!isCancelled) {
          setError('Order details could not be retrieved.');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Failed to load order from database.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [orderId, refreshTrigger]);

  const handleStatusChange = async (nextStatus: string) => {
    if (!order || nextStatus === order.status) return;
    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      const res = await api.updateAdminOrderStatus(order.id, nextStatus);
      if (res.success && res.data) {
        setOrder(res.data);
        setStatusMessage({
          type: 'success',
          text: `Order status successfully transitioned to ${nextStatus.replace(/_/g, ' ')}.`,
        });
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status.';
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
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-forest-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Fetching order details, customer data, and timeline from PostgreSQL...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Order Not Found</h1>
        </div>

        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-900 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold text-sm">
              {error || `Order with ID "${orderId}" could not be found.`}
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
              href="/admin/orders"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Order Dispatch Audit
              </span>
              <span className="font-mono text-[11px] text-slate-500 font-bold">{order.orderNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Order Details
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500">Status:</span>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="text-xs font-extrabold uppercase bg-transparent text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="HARVESTING">Harvesting</option>
              <option value="PACKED">Packed</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-forest-600" />}
          </div>

          {order.deliveryBatchId && (
            <Link
              href={`/admin/deliveries`}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>Batch #{order.deliveryBatch?.batchCode || order.deliveryBatchId}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Order"
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
        {/* Left Column (8 Cols): Order Items, Pricing Breakdown, Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-forest-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                  Order Items ({order.items ? order.items.length : 0})
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-400">Direct From Farm</span>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-400">
                        Quantity: {item.quantity} × ₹{item.unitPrice} per {item.unit}
                      </div>
                      {item.farmerName && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Farmer: <span className="font-semibold text-slate-700">{item.farmerName}</span>
                          {item.farmName ? ` (${item.farmName})` : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 text-sm">₹{item.totalPrice}</span>
                      {typeof item.farmerShare === 'number' && (
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Farmer share: ₹{item.farmerShare}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3">No items found in this order.</p>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <IndianRupee className="w-4 h-4 text-forest-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Pricing & Settlement Breakdown
              </h2>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal (Farm produce value):</span>
                <span className="font-semibold text-slate-900">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee (Hyperlocal cold-chain):</span>
                <span className="font-semibold text-slate-900">
                  {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform Governance Fee (10%):</span>
                <span className="font-semibold text-slate-900">₹{order.platformFee}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/70 flex justify-between text-sm">
                <span className="font-bold text-slate-900">Total Consumer Charge:</span>
                <span className="font-black text-slate-900">₹{order.total}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center text-xs mt-2">
                <span className="font-bold text-emerald-900">Direct Farmer Payout (75% net):</span>
                <span className="font-black text-emerald-900 text-sm">₹{order.farmerEarnings}</span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Order Fulfillment Timeline
              </h2>
            </div>

            <div className="relative pl-5 border-l-2 border-slate-100 space-y-5 my-2">
              {order.timeline && order.timeline.length > 0 ? (
                order.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                        step.completed ? 'bg-emerald-600 ring-emerald-200' : 'bg-slate-300 ring-slate-100'
                      }`}
                    />
                    <div className="text-xs font-bold text-slate-900">{step.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{step.description}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {step.timestamp ? new Date(step.timestamp).toLocaleString() : ''}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No timeline steps recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Customer, Delivery Address, Farmer, Payment, Delivery Batch */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer & Address */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recipient</span>
              <h3 className="text-base font-bold text-slate-900 font-serif">Customer Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Customer Name</span>
                <span className="font-bold text-slate-900 text-sm">{order.customerName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Phone & Email</span>
                <span className="text-slate-700 block">{order.customerPhone || 'N/A'}</span>
                <span className="text-slate-500 block text-[11px]">{order.customerEmail || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Delivery Address</span>
                <span className="text-slate-700 block font-medium mt-0.5">
                  {order.deliveryAddress?.addressLine || 'N/A'}, {order.deliveryAddress?.hub || ''}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {order.deliveryAddress?.city || 'Bengaluru'} - {order.deliveryAddress?.pincode || ''}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Slot Window</span>
                <span className="font-semibold text-slate-800 block">
                  {order.deliverySlot?.name || 'Standard'} ({order.deliverySlot?.timeRange || 'Morning'})
                </span>
              </div>
            </div>
          </div>

          {/* Farmer Info */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier</span>
              <h3 className="text-base font-bold text-slate-900 font-serif">Farmer Information</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-sm">{order.farmerName}</div>
              <div className="text-slate-600">{order.farmName || 'Verified Farm'}</div>
              {order.farmerId && (
                <div className="pt-2">
                  <Link
                    href={`/admin/farmers/${order.farmerId}`}
                    className="text-xs font-bold text-forest-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Farm Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Batch Info */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logistics</span>
                <h3 className="text-base font-bold text-slate-900 font-serif">Delivery Batch</h3>
              </div>
              <Truck className="w-4 h-4 text-forest-700" />
            </div>

            {order.deliveryBatch ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Batch Code:</span>
                  <span className="font-mono font-bold text-slate-900">{order.deliveryBatch.batchCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Hub Area:</span>
                  <span className="font-semibold text-slate-800">{order.deliveryBatch.hubArea}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Batch Slot:</span>
                  <span className="font-semibold text-slate-800">{order.deliveryBatch.deliverySlot}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Batch Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                    {order.deliveryBatch.status}
                  </span>
                </div>
                {order.deliveryBatch.riderName && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Assigned Dispatch Rider</span>
                    <div className="font-bold text-slate-900">{order.deliveryBatch.riderName}</div>
                    {order.deliveryBatch.riderPhone && (
                      <div className="text-slate-500 text-[11px]">{order.deliveryBatch.riderPhone}</div>
                    )}
                    {order.deliveryBatch.riderVehicle && (
                      <div className="text-slate-400 text-[10px]">{order.deliveryBatch.riderVehicle}</div>
                    )}
                  </div>
                )}
                {typeof order.deliveryBatch.estimatedDistanceKm === 'number' && (
                  <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                    <span>Est. Distance:</span>
                    <span className="font-medium text-slate-700">{order.deliveryBatch.estimatedDistanceKm} km</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium">No delivery batch assigned yet.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Order will be batched during dispatch scheduling.</p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transaction</span>
              <h3 className="text-base font-bold text-slate-900 font-serif">Payment Status</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Method:</span>
                <span className="font-bold text-slate-900">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
