'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import {
  CheckCheck,
  Package,
  Boxes,
  Star,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function FarmerNotificationsPage() {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadCount,
  } = useFarmer();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-amber-600" />;
      case 'inventory':
        return <Boxes className="w-5 h-5 text-rose-600" />;
      case 'review':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-400" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-forest-700" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time harvest alerts, order confirmations, inventory warnings, and customer reviews
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 text-xs font-bold transition-colors cursor-pointer border border-forest-200"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-forest-800 text-white shadow-xs'
              : 'bg-white border border-earth-200 text-slate-600 hover:bg-earth-50'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'unread'
              ? 'bg-forest-800 text-white shadow-xs'
              : 'bg-white border border-earth-200 text-slate-600 hover:bg-earth-50'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-earth-200/80 shadow-xs divide-y divide-earth-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No notifications in this view.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markNotificationAsRead(item.id)}
              className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                !item.isRead ? 'bg-forest-50/40 hover:bg-forest-50/60' : 'hover:bg-earth-50/60'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-white border border-earth-200 flex items-center justify-center shrink-0 shadow-2xs">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>

                {item.link && (
                  <Link
                    href={item.link}
                    className="inline-block text-xs font-bold text-forest-800 hover:underline mt-2"
                  >
                    View Details →
                  </Link>
                )}
              </div>

              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
