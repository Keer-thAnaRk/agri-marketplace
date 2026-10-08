'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMarketplace } from '@/context/MarketplaceContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderStatus } from '@/types';
import { api, getAuthToken } from '@/lib/api';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Calendar,
  Search,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function OrdersPage() {
  const { orders: contextOrders } = useMarketplace();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setOrders(contextOrders);
        setTotalCount(contextOrders.length);
        setLoading(false);
        return;
      }

      const res = await api.getConsumerOrders(
        {
          status: filterStatus === 'all' ? undefined : filterStatus,
          search: searchQuery.trim() || undefined,
          page,
          limit: 10,
        },
        token
      );

      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || res.data.length);
        } else {
          setTotalPages(1);
          setTotalCount(res.data.length);
        }
      } else {
        // Fallback to context
        setOrders(contextOrders);
        setTotalCount(contextOrders.length);
      }
    } catch (err) {
      console.warn('Failed to load orders from PostgreSQL, using fallback:', err);
      setOrders(contextOrders);
      setTotalCount(contextOrders.length);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery, page, contextOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-300 px-3 py-1 rounded-full animate-pulse">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            Out for Delivery
          </span>
        );
      case 'harvesting':
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Harvesting & Packing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300 px-3 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelled
          </span>
        );
      case 'placed':
      case 'confirmed':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 bg-forest-50 border border-forest-300 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-forest-600" />
            Order Confirmed
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-earth-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            My Farm Harvest Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track live harvesting, packing, and doorstep delivery from local farmers
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-earth-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-forest-600 focus:ring-1 focus:ring-forest-600 transition-all shadow-2xs"
            />
          </div>

          {/* Tab Filter */}
          <div className="flex items-center gap-1 bg-earth-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => {
                setFilterStatus('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-white text-forest-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => {
                setFilterStatus('active');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filterStatus === 'active'
                  ? 'bg-white text-forest-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setFilterStatus('completed');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filterStatus === 'completed'
                  ? 'bg-white text-forest-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => {
                setFilterStatus('cancelled');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filterStatus === 'cancelled'
                  ? 'bg-white text-forest-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Orders List / Loading / Empty */}
      {loading ? (
        <div className="py-16 text-center space-y-4">
          <RefreshCw className="w-8 h-8 mx-auto text-forest-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your farm harvest orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          type="orders"
          title="No orders found"
          description="You do not have any orders matching the current filter or search criteria."
          actionText="Browse Marketplace"
          actionHref="/explore"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const displayId = order.orderNumber || order.id;
            const itemsList = Array.isArray(order.items) ? order.items : [];
            const address = order.deliveryAddress;
            const slot = order.deliverySlot;

            return (
              <div
                key={order.rawId || order.id}
                className="bg-white rounded-3xl border border-earth-200/80 p-5 sm:p-6 shadow-xs hover:border-forest-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Order Info */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-extrabold text-slate-900">
                      #{displayId}
                    </span>
                    {getStatusBadge(order.status || order.orderStatus)}
                    <span className="text-xs text-slate-400">
                      {order.orderDate ||
                        new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {itemsList.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-1.5 pr-3 bg-earth-50 rounded-xl border border-earth-200/60 shrink-0"
                      >
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-earth-200 bg-white">
                          <Image
                            src={
                              item.productImage ||
                              'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80'
                            }
                            alt=""
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <div className="text-xs font-semibold text-slate-800">
                          {item.quantity}× {item.productName ? item.productName.split(' ')[0] : 'Item'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-forest-700" />
                      {address?.hub || address?.city || 'Local Delivery'}
                    </span>
                    <span>•</span>
                    <span>
                      Slot:{' '}
                      <strong className="text-slate-800 font-semibold">
                        {slot?.timeRange || 'Morning (8am - 11am)'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-earth-100 shrink-0">
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Total Amount</div>
                    <div className="text-xl font-extrabold text-forest-950">₹{order.total}</div>
                  </div>

                  <Link
                    href={`/orders/${order.rawId || order.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Track Live Delivery</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-earth-200">
          <p className="text-xs text-slate-500">
            Page <strong className="text-slate-800 font-semibold">{page}</strong> of{' '}
            <strong className="text-slate-800 font-semibold">{totalPages}</strong>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-earth-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-earth-50 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-earth-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-earth-50 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
