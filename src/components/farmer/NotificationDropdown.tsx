'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useFarmer } from '@/context/FarmerContext';
import {
  Bell,
  Check,
  CheckCheck,
  Package,
  Boxes,
  Star,
  CheckCircle2,
  Info,
} from 'lucide-react';

export function FarmerNotificationDropdown() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, unreadCount } =
    useFarmer();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'inventory':
        return <Boxes className="w-4 h-4 text-rose-600" />;
      case 'review':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-400" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-forest-700" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-earth-100 transition-colors cursor-pointer"
        aria-label="Farmer notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-earth-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 border-b border-earth-100 flex items-center justify-between bg-earth-50/50">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Farm Notifications
              </h4>
              <p className="text-[11px] text-slate-500">{unreadCount} unread alerts</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[11px] font-bold text-forest-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-earth-100 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markNotificationAsRead(item.id)}
                  className={`p-3.5 hover:bg-earth-50/80 transition-colors cursor-pointer flex items-start gap-3 text-xs ${
                    !item.isRead ? 'bg-forest-50/40' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-earth-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                      {item.message}
                    </p>

                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-block text-[10px] font-bold text-forest-800 hover:underline mt-1"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-earth-100 bg-earth-50/40 text-center">
            <Link
              href="/farmer/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-forest-800 hover:underline"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
