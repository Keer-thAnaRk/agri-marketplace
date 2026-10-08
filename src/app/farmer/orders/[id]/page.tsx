'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFarmer } from '@/context/FarmerContext';
import { OrderTimeline } from '@/components/farmer/OrderTimeline';
import { OrderStatusBadge } from '@/components/farmer/OrderStatusBadge';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  User,
  Package,
  CreditCard,
  Truck,
  ShieldCheck,
} from 'lucide-react';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { orders, updateOrderStatus } = useFarmer();

  const contextOrder = orders.find((o) => o.id === orderId || (o as any).rawId === orderId || (o as any).orderNumber === orderId);
  const [dbOrder, setDbOrder] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!contextOrder && orderId) {
      const { api, getAuthToken } = require('@/lib/api');
      const token = getAuthToken();
      if (token) {
        api.getFarmerOrderById(orderId, token)
          .then((res: any) => {
            if (res.success && res.data) {
              setDbOrder(res.data);
            }
          })
          .catch(() => {});
      }
    }
  }, [contextOrder, orderId]);

  const order = contextOrder || dbOrder || orders[0];

  if (!order) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Order not found</h2>
        <Link href="/farmer/orders" className="text-xs text-forest-800 underline mt-2 block">
          Back to orders list
        </Link>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div className="flex items-center gap-3">
          <Link
            href="/farmer/orders"
            className="p-2 rounded-xl border border-earth-200 hover:bg-earth-100 transition-colors text-slate-600"
            aria-label="Back to orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {order.id}
              </h1>
              <OrderStatusBadge status={order.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {order.orderDate} • Delivery Slot: {order.deliverySlot.name} ({order.deliverySlot.timeRange})
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Items, Customer Info & Address (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Produce Items Card */}
          <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-earth-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-forest-700" />
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  Harvested Products Ordered
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {order.items.length} items
              </span>
            </div>

            <div className="divide-y divide-earth-100">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-earth-200 bg-earth-100">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-400">
                        ₹{item.price}/{item.unit}
                      </div>
                    </div>
                  </div>

                  <div className="text-right whitespace-nowrap">
                    <div className="font-extrabold text-forest-950 text-sm">
                      ₹{item.price * item.quantity}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold">
                      Qty: {item.quantity} {item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Section */}
            <div className="pt-4 border-t border-earth-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>₹{order.amount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Direct Farmer Share (100% of Produce)</span>
                <span className="font-bold text-forest-800">₹{order.amount}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-forest-950 pt-2 border-t border-earth-100">
                <span>Total Farmer Payout</span>
                <span>₹{order.amount}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Card */}
          <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-earth-100">
              <User className="w-4 h-4 text-forest-700" />
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Customer & Delivery Logistics
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-earth-50 rounded-2xl border border-earth-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Consumer
                </span>
                <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{order.customerPhone}</span>
                </div>
              </div>

              <div className="p-3.5 bg-earth-50 rounded-2xl border border-earth-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Delivery Slot
                </span>
                <div className="font-bold text-forest-900">{order.deliverySlot.name}</div>
                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{order.deliverySlot.timeRange}</span>
                </div>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-earth-50 rounded-2xl border border-earth-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Delivery Destination
                </span>
                <div className="flex items-start gap-2 pt-0.5">
                  <MapPin className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">
                      {order.deliveryAddress.addressLine}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {order.deliveryAddress.city} – {order.deliveryAddress.pincode} ({order.deliveryAddress.hub} Hub)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Timeline with interactive status progression buttons (5 Cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <OrderTimeline order={order} onAdvanceStatus={updateOrderStatus} />
        </div>
      </div>
    </div>
  );
}
