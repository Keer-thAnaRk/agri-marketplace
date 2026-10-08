'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMarketplace } from '@/context/MarketplaceContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { api, getAuthToken } from '@/lib/api';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Tractor,
  RotateCw,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const { orders: contextOrders, showToast } = useMarketplace();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Customer requested cancellation before harvest');
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchOrder = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = getAuthToken();
      if (token) {
        const res = await api.getConsumerOrderById(orderId, token);
        if (res.success && res.data) {
          setOrder(res.data);
          if (isManualRefresh) {
            showToast('Order status refreshed', 'info');
          }
          return;
        }
      }

      // Fallback to context
      const found = contextOrders.find(
        (o) => o.id === orderId || (o as any).rawId === orderId || (o as any).orderNumber === orderId
      );
      if (found) {
        setOrder(found);
      }
    } catch (err: any) {
      console.warn('Failed to load order from backend, using fallback:', err);
      const found = contextOrders.find(
        (o) => o.id === orderId || (o as any).rawId === orderId || (o as any).orderNumber === orderId
      );
      if (found) {
        setOrder(found);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, contextOrders, showToast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const token = getAuthToken();
      const targetId = order.rawId || order.orderNumber || order.id;
      const res = await api.cancelConsumerOrder(targetId, cancelReason, token || undefined);

      if (res.success && res.data) {
        setOrder(res.data);
        setShowCancelModal(false);
        showToast('Order has been cancelled successfully. Reserved stock released.', 'success');
      } else {
        showToast(res.message || 'Failed to cancel order', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error cancelling order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <RotateCw className="w-8 h-8 mx-auto text-forest-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading harvest order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          type="orders"
          title="Order Not Found"
          description={`Could not find order details for #${orderId}. It may not exist or you do not have permission to view it.`}
          actionText="View All Orders"
          actionHref="/orders"
        />
      </div>
    );
  }

  const currentStatus = String(order.status || order.orderStatus || '').toLowerCase();
  const isCancellable = currentStatus === 'placed' || currentStatus === 'confirmed';
  const isCancelled = currentStatus === 'cancelled';
  const timelineSteps = Array.isArray(order.timeline) ? order.timeline : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-earth-200">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 rounded-xl border border-earth-200 hover:bg-earth-100 transition-colors text-slate-600"
            aria-label="Back to orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                Order #{order.orderNumber || order.id}
              </h1>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-800'
                    : currentStatus === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-forest-100 text-forest-900'
                }`}
              >
                {currentStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on{' '}
              {order.orderDate ||
                new Date(order.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
            </p>
          </div>
        </div>

        {/* Action Controls: Refresh & Cancel */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-earth-50 border border-earth-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh order status"
          >
            <RotateCw className={`w-3.5 h-3.5 text-forest-700 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>

          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {/* CANCELLED BANNER IF CANCELLED */}
      {isCancelled && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-sm text-rose-950">This Order Has Been Cancelled</h4>
            <p className="text-rose-800 leading-relaxed">
              The order was cancelled and the reserved produce has been returned to the available farm inventory. No further delivery actions will be taken.
            </p>
          </div>
        </div>
      )}

      {/* VISUAL TIMELINE CARD */}
      <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-earth-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-full">
              Live Fulfillment Radar
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Real-Time Harvest & Delivery Milestones</h2>
          </div>
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Estimated Delivery: {order.estimatedDelivery || `Today, ${order.deliverySlot?.timeRange || 'Morning'}`}
          </div>
        </div>

        {/* Responsive Timeline: Grid layout */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-3 relative z-10">
            {timelineSteps.map((milestone: any, idx: number) => {
              const isCompleted = milestone.isCompleted || milestone.completed;
              const isCurrent = milestone.isCurrent || milestone.current;
              const isStepCancelled = String(milestone.status || '').toLowerCase() === 'cancelled';

              return (
                <div key={idx} className="flex lg:flex-col items-start gap-4 lg:gap-2 group">
                  {/* Status Circle Node */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                      isStepCancelled
                        ? 'bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-800/25 ring-4 ring-rose-200'
                        : isCurrent
                        ? 'bg-forest-700 border-forest-800 text-white shadow-lg shadow-forest-800/25 ring-4 ring-forest-200'
                        : isCompleted
                        ? 'bg-emerald-600 border-emerald-700 text-white'
                        : 'bg-white border-dashed border-earth-300 text-slate-300'
                    }`}
                  >
                    {isStepCancelled ? (
                      <XCircle className="w-5 h-5" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5 animate-spin-slow" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                    )}
                  </div>

                  {/* Milestone Details */}
                  <div className="flex-1 lg:text-left min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-xs font-bold tracking-tight ${
                          isStepCancelled
                            ? 'text-rose-900 font-extrabold'
                            : isCurrent
                            ? 'text-forest-900 font-extrabold'
                            : isCompleted
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {milestone.label}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-forest-700 mb-0.5">
                      {milestone.timestamp}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ORDER DETAILS GRID: PRODUCTS + ADDRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Products in Order (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-earth-100">
            Produce Items in this Harvest Delivery ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-earth-100">
            {(order.items || []).map((item: any, idx: number) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-earth-200 bg-earth-50">
                    <Image
                      src={
                        item.productImage ||
                        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80'
                      }
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.productName}</h4>
                    <p className="text-xs text-forest-800">
                      Grown by: <span className="font-semibold">{item.farmName || item.farmerName || 'Verified Farm'}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Qty: {item.quantity} × {item.unit || 'kg'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-forest-950">
                    ₹{item.totalPrice || (item.price || item.unitPrice) * item.quantity}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ₹{item.unitPrice || item.price}/{item.unit || 'kg'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-earth-100 flex flex-col sm:flex-row justify-between text-xs text-slate-600 gap-2">
            <div>
              <span>Payment Mode: </span>
              <strong className="text-slate-900">{order.paymentMethod || 'UPI'}</strong> (Status:{' '}
              {order.paymentStatus || 'Pending'})
            </div>
            <div>
              <span>Total: </span>
              <strong className="text-forest-950 font-extrabold text-sm">₹{order.total}</strong>
            </div>
          </div>
        </div>

        {/* Right: Delivery & Rider Info (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
              <MapPin className="w-4 h-4" />
              <span>Delivery Destination</span>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <div className="font-bold text-sm text-slate-900">
                {order.deliveryAddress?.name || order.customerName}
              </div>
              <div>{order.deliveryAddress?.phone || order.customerPhone}</div>
              <div className="pt-1 text-slate-700 leading-relaxed font-medium">
                {order.deliveryAddress?.addressLine || 'Standard Hub Delivery'}
              </div>
              <div className="text-slate-500">
                {order.deliveryAddress?.city || 'Bengaluru'} – {order.deliveryAddress?.pincode || '560102'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-100 text-xs text-forest-900 space-y-1">
              <div className="font-bold">Allocated Delivery Slot:</div>
              <div>
                {order.deliverySlot?.name || 'Morning Harvest'} (
                {order.deliverySlot?.timeRange || '8:00 AM – 11:00 AM'})
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
              <Truck className="w-4 h-4" />
              <span>Eco-Delivery Partner</span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-sm">
                MK
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Manjunath K.</div>
                <div className="text-[11px] text-slate-500">Electric Delivery Fleet • 4.9 ★</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Produce is transported in active temperature-shielded crates to keep vegetables crisp and milk chilled.
            </p>
          </div>
        </div>
      </div>

      {/* CANCELLATION CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-earth-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cancel Order #{order.orderNumber || order.id}?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to cancel this order? Reserved farm produce will be released back to the marketplace.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Cancellation Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-earth-50 border border-earth-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
              >
                <option value="Changed mind / Ordered by mistake">Changed mind / Ordered by mistake</option>
                <option value="Need to change delivery slot or address">Need to change delivery slot or address</option>
                <option value="Found alternative / No longer needed">Found alternative / No longer needed</option>
                <option value="Customer requested cancellation before harvest">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl border border-earth-200 text-slate-700 text-xs font-bold hover:bg-earth-50 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
