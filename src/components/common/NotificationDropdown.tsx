'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMarketplace } from '@/context/MarketplaceContext';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Truck,
  Package,
  AlertTriangle,
  UserCheck,
  Sparkles,
  Check,
} from 'lucide-react';

export function NotificationDropdown() {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useMarketplace();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'order_shipped':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'delivery_update':
        return <Package className="w-4 h-4 text-forest-600" />;
      case 'farmer_verification':
        return <UserCheck className="w-4 h-4 text-purple-600" />;
      case 'low_inventory':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'new_order':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-700 hover:text-forest-800 hover:bg-forest-50 rounded-full transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-harvest-amber text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
            {unreadNotificationsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-earth-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 pb-2.5 border-b border-earth-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 bg-forest-100 text-forest-800 text-[11px] font-semibold rounded-full">
                  {unreadNotificationsCount} new
                </span>
              )}
            </div>
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-forest-700 hover:text-forest-900 font-medium flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-earth-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-3.5 hover:bg-earth-50/70 transition-colors flex gap-3 cursor-pointer ${
                    !notif.isRead ? 'bg-forest-50/40' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-earth-200 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs font-semibold ${!notif.isRead ? 'text-forest-950 font-bold' : 'text-slate-700'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-block mt-1.5 text-[11px] text-forest-700 hover:underline font-semibold"
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
