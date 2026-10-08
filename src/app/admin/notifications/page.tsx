'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import {
  Bell,
  AlertTriangle,
  Package,
  ShieldCheck,
  Check,
  Trash2,
  ExternalLink,
  Truck,
  Layers,
  Star,
  RefreshCw,
  Search,
  Filter,
  CheckCheck,
} from 'lucide-react';

export interface AdminNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  rawType?: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
  timestamp?: string;
}

type NotificationTab =
  | 'all'
  | 'unread'
  | 'VERIFICATION'
  | 'ORDER'
  | 'DELIVERY'
  | 'DISPUTE'
  | 'INVENTORY'
  | 'SYSTEM';

const TABS: { id: NotificationTab; label: string; countKey?: string }[] = [
  { id: 'all', label: 'All Alerts' },
  { id: 'unread', label: 'Unread' },
  { id: 'VERIFICATION', label: 'Verification' },
  { id: 'ORDER', label: 'Orders' },
  { id: 'DELIVERY', label: 'Logistics' },
  { id: 'DISPUTE', label: 'Disputes' },
  { id: 'INVENTORY', label: 'Inventory' },
  { id: 'SYSTEM', label: 'System' },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(
    async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      try {
        const filters: {
          type?: string;
          status?: string;
          page?: number;
          limit?: number;
        } = {
          page: currentPage,
          limit: 20,
        };

        if (activeTab === 'unread') {
          filters.status = 'unread';
        } else if (activeTab !== 'all') {
          filters.type = activeTab;
        }

        const res = await api.getAdminNotifications(filters);

        if (res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
          setUnreadCount(typeof res.unreadCount === 'number' ? res.unreadCount : 0);
          setTotalCount(typeof res.total === 'number' ? res.total : res.count || 0);
          if (res.pagination) {
            setTotalPages(res.pagination.totalPages || 1);
          }
        } else {
          setNotifications([]);
          setTotalCount(0);
        }
      } catch (err: any) {
        console.error('Failed to load admin notifications:', err);
        setErrorMessage(
          err.message || 'Unable to load notifications. Please check connection and try again.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, currentPage]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const dispatchUpdateEvent = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-notifications-updated'));
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setActionInProgress(id);
      await api.markAdminNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      dispatchUpdateEvent();
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionInProgress('all-read');
      await api.markAllAdminNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      dispatchUpdateEvent();
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionInProgress(id);
      await api.deleteAdminNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      fetchNotifications(false);
      dispatchUpdateEvent();
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }
    try {
      setActionInProgress('clear-all');
      await api.clearAllAdminNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setTotalCount(0);
      dispatchUpdateEvent();
    } catch (err: any) {
      console.error('Failed to clear notifications:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const norm = (category || '').toLowerCase();
    switch (norm) {
      case 'verification':
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
      case 'order':
      case 'orders':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'delivery':
        return <Truck className="w-5 h-5 text-purple-600" />;
      case 'dispute':
      case 'disputes':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'inventory':
        return <Layers className="w-5 h-5 text-emerald-600" />;
      case 'review':
        return <Star className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    const norm = (category || '').toLowerCase();
    switch (norm) {
      case 'verification':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'order':
      case 'orders':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'dispute':
      case 'disputes':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'inventory':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const q = searchQuery.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.type && n.type.toLowerCase().includes(q))
    );
  }, [notifications, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              Governance Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time administrative alerts for farmer verifications, logistics batches, customer disputes, and platform events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchNotifications(false)}
            disabled={isLoading || isRefreshing}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={actionInProgress === 'all-read'}
              className="px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={actionInProgress === 'clear-all'}
              className="px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Clear all alerts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Tabs Navigation */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-0.5 flex-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              let badge = null;
              if (tab.id === 'unread' && unreadCount > 0) {
                badge = (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                    {unreadCount}
                  </span>
                );
              } else if (tab.id === 'all' && totalCount > 0) {
                badge = (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
                    {totalCount}
                  </span>
                );
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center ${
                    isActive
                      ? 'border-forest-700 text-forest-900 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {badge}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => fetchNotifications()}
            className="font-bold underline hover:no-underline ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-3xl border border-slate-200 bg-white animate-pulse flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <AdminEmptyState
            icon={Bell}
            title={
              searchQuery
                ? 'No Matching Alerts'
                : activeTab === 'unread'
                ? 'No Unread Alerts'
                : 'No Notifications'
            }
            description={
              searchQuery
                ? `No alerts found matching "${searchQuery}". Try a different keyword.`
                : activeTab === 'unread'
                ? 'You have caught up with all governance notifications.'
                : 'No administrative alerts recorded in the system.'
            }
          />
        ) : (
          filteredNotifications.map((n) => {
            const isActing = actionInProgress === n.id;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                  n.isRead
                    ? 'bg-white border-slate-200/80 text-slate-700'
                    : 'bg-emerald-50/40 border-emerald-200 text-slate-900 ring-1 ring-emerald-500/20'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
                    {getCategoryIcon(n.type)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-900">{n.title}</span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${getCategoryBadgeClass(
                          n.type
                        )}`}
                      >
                        {n.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {n.timestamp ||
                        new Date(n.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 justify-end">
                  {!n.isRead && (
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleMarkAsRead(n.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                      title="Mark as Read"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => {
                        if (!n.isRead) {
                          handleMarkAsRead(n.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
          <div>
            Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
