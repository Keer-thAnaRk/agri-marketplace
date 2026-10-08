'use client';

import React from 'react';
import Link from 'next/link';
import { FarmerOrder } from '@/data/orders';
import { OrderStatusBadge } from './OrderStatusBadge';
import { FarmerOrderStatus } from '@/types';
import { ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';

interface OrderTableProps {
  orders: FarmerOrder[];
  onAdvanceStatus?: (orderId: string, nextStatus: FarmerOrderStatus) => void;
  showAllLink?: boolean;
}

export function OrderTable({
  orders,
  onAdvanceStatus,
  showAllLink = false,
}: OrderTableProps) {
  const getNextStep = (status: FarmerOrderStatus) => {
    switch (status) {
      case 'Pending':
        return { label: 'Confirm Order', next: 'Confirmed' as FarmerOrderStatus, color: 'bg-forest-800 hover:bg-forest-900 text-white' };
      case 'Confirmed':
        return { label: 'Mark Preparing', next: 'Preparing' as FarmerOrderStatus, color: 'bg-purple-700 hover:bg-purple-800 text-white' };
      case 'Preparing':
        return { label: 'Mark Ready', next: 'Ready' as FarmerOrderStatus, color: 'bg-teal-700 hover:bg-teal-800 text-white' };
      case 'Ready':
        return { label: 'Mark Completed', next: 'Completed' as FarmerOrderStatus, color: 'bg-emerald-700 hover:bg-emerald-800 text-white' };
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-earth-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-earth-200 bg-earth-50/60 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Products</th>
              <th className="py-3.5 px-4">Quantity</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Delivery Slot</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-100 font-medium text-slate-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  No orders match this filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const step = getNextStep(order.status);

                return (
                  <tr key={order.id} className="hover:bg-earth-50/60 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      <Link
                        href={`/farmer/orders/${order.id}`}
                        className="text-forest-800 hover:underline flex items-center gap-1 group"
                      >
                        <span>{order.id}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.customerPhone}</div>
                    </td>

                    <td className="py-4 px-4 max-w-[180px]">
                      <div className="truncate font-semibold text-slate-800" title={order.productsSummary}>
                        {order.productsSummary}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {order.totalQuantity}
                    </td>

                    <td className="py-4 px-4 font-extrabold text-forest-950 whitespace-nowrap">
                      ₹{order.amount}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">
                        {order.deliverySlot.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {order.deliverySlot.timeRange}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {step && onAdvanceStatus ? (
                          <button
                            onClick={() => onAdvanceStatus(order.id, step.next)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${step.color}`}
                          >
                            {step.label}
                          </button>
                        ) : order.status === 'Completed' ? (
                          <span className="text-emerald-700 font-bold inline-flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        ) : null}

                        <Link
                          href={`/farmer/orders/${order.id}`}
                          className="p-1.5 rounded-xl border border-earth-200 text-slate-500 hover:text-forest-900 hover:bg-forest-50 transition-colors"
                          title="View order details"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAllLink && (
        <div className="p-3 border-t border-earth-100 bg-earth-50/40 text-center">
          <Link
            href="/farmer/orders"
            className="text-xs font-bold text-forest-800 hover:text-forest-900 hover:underline inline-flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
