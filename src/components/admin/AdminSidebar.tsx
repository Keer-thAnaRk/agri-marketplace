'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserX,
  Clock,
  Sprout,
  Package,
  IndianRupee,
  Wallet,
  Truck,
  AlertOctagon,
  Star,
  BarChart3,
  Bell,
  Settings,
  User,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: string;
  badgeColor?: string;
}

interface SidebarSection {
  title: string | null;
  items: SidebarItem[];
}

interface AdminSidebarProps {
  onNavClick?: () => void;
  pendingFarmerCount?: number;
  openDisputeCount?: number;
  unreadNotifCount?: number;
}

function AdminSidebarInner({
  onNavClick,
  pendingFarmerCount = 4,
  openDisputeCount = 2,
  unreadNotifCount = 2,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  const navSections: SidebarSection[] = [
    {
      title: null, // Top level
      items: [
        {
          name: 'Dashboard',
          href: '/admin/dashboard',
          icon: LayoutDashboard,
          active: pathname === '/admin' || pathname === '/admin/dashboard',
        },
      ],
    },
    {
      title: 'FARMERS',
      items: [
        {
          name: 'All Farmers',
          href: '/admin/farmers',
          icon: Users,
          active: pathname === '/admin/farmers' && (!currentTab || currentTab === 'all'),
        },
        {
          name: 'Pending Verification',
          href: '/admin/farmers?tab=pending',
          icon: Clock,
          active: pathname === '/admin/farmers' && currentTab === 'pending',
          badge: pendingFarmerCount > 0 ? String(pendingFarmerCount) : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
        {
          name: 'Approved',
          href: '/admin/farmers?tab=approved',
          icon: UserCheck,
          active: pathname === '/admin/farmers' && currentTab === 'approved',
        },
        {
          name: 'Rejected',
          href: '/admin/farmers?tab=rejected',
          icon: UserX,
          active: pathname === '/admin/farmers' && currentTab === 'rejected',
        },
      ],
    },
    {
      title: 'MARKETPLACE',
      items: [
        {
          name: 'Products',
          href: '/admin/products',
          icon: Sprout,
          active: pathname.startsWith('/admin/products'),
        },
        {
          name: 'Orders',
          href: '/admin/orders',
          icon: Package,
          active: pathname.startsWith('/admin/orders'),
        },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        {
          name: 'Sales Ledger',
          href: '/admin/sales',
          icon: IndianRupee,
          active: pathname === '/admin/sales',
        },
        {
          name: 'Farmer Payouts',
          href: '/admin/payouts',
          icon: Wallet,
          active: pathname === '/admin/payouts',
        },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          name: 'Delivery Batches',
          href: '/admin/deliveries',
          icon: Truck,
          active: pathname.startsWith('/admin/deliveries'),
        },
        {
          name: 'Disputes',
          href: '/admin/disputes',
          icon: AlertOctagon,
          active: pathname.startsWith('/admin/disputes'),
          badge: openDisputeCount > 0 ? String(openDisputeCount) : undefined,
          badgeColor: 'bg-rose-100 text-rose-800',
        },
        {
          name: 'Customer Reviews',
          href: '/admin/reviews',
          icon: Star,
          active: pathname.startsWith('/admin/reviews'),
        },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        {
          name: 'Platform Analytics',
          href: '/admin/analytics',
          icon: BarChart3,
          active: pathname === '/admin/analytics',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          name: 'User Management',
          href: '/admin/users',
          icon: Users,
          active: pathname.startsWith('/admin/users'),
        },
        {
          name: 'Notifications',
          href: '/admin/notifications',
          icon: Bell,
          active: pathname === '/admin/notifications',
          badge: unreadNotifCount > 0 ? String(unreadNotifCount) : undefined,
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          name: 'Platform Settings',
          href: '/admin/settings',
          icon: Settings,
          active: pathname === '/admin/settings',
        },
        {
          name: 'Admin Profile',
          href: '/admin/profile',
          icon: User,
          active: pathname === '/admin/profile',
        },
      ],
    },
  ];

  return (
    <nav className="space-y-6">
      {navSections.map((section, idx) => (
        <div key={idx} className="space-y-1">
          {section.title && (
            <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavClick}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    item.active
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        item.active
                          ? 'text-emerald-400'
                          : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                        item.active ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar(props: AdminSidebarProps) {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
          <div className="space-y-2">
            <div className="h-9 bg-slate-100 rounded-xl" />
            <div className="h-9 bg-slate-100 rounded-xl" />
            <div className="h-9 bg-slate-100 rounded-xl" />
            <div className="h-9 bg-slate-100 rounded-xl" />
          </div>
        </div>
      }
    >
      <AdminSidebarInner {...props} />
    </React.Suspense>
  );
}

export default AdminSidebar;
