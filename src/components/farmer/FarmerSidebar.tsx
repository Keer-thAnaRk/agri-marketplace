'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFarmer } from '@/context/FarmerContext';
import { useAuth } from '@/context/AuthContext';
import { isFarmerApproved, isFarmerPending, isFarmerRejected } from '@/types';
import {
  LayoutDashboard,
  Sprout,
  PlusCircle,
  Boxes,
  Package,
  Calendar,
  TrendingUp,
  Tractor,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Leaf,
  ShieldCheck,
  X,
  BadgePercent,
  Truck,
  Lock,
} from 'lucide-react';

interface FarmerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function FarmerSidebar({ isOpen = false, onClose }: FarmerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { farmerProfile, unreadCount, showToast } = useFarmer();
  const { user, verificationStatus, logout } = useAuth();

  const currentStatus = user?.verificationStatus || verificationStatus;
  const isApproved = isFarmerApproved(currentStatus);
  const isPending = isFarmerPending(currentStatus);
  const isRejected = isFarmerRejected(currentStatus);

  const navItems = [
    { name: 'Dashboard', href: '/farmer/dashboard', icon: LayoutDashboard },
    { name: 'My Products', href: '/farmer/products', icon: Sprout },
    { name: 'Add Product', href: '/farmer/products/new', icon: PlusCircle },
    { name: 'Inventory', href: '/farmer/inventory', icon: Boxes },
    { name: 'Harvests & Trace', href: '/farmer/harvests', icon: Calendar },
    { name: 'Surplus Engine', href: '/farmer/surplus', icon: BadgePercent },
    { name: 'Delivery Batches', href: '/farmer/deliveries', icon: Truck },
    { name: 'Orders', href: '/farmer/orders', icon: Package },
    { name: 'Sales', href: '/farmer/sales', icon: TrendingUp },
    { name: 'Farm Profile', href: '/farmer/profile', icon: Tractor },
    {
      name: 'Notifications',
      href: '/farmer/notifications',
      icon: Bell,
      badge: isApproved && unreadCount > 0 ? String(unreadCount) : undefined,
    },
    { name: 'Settings', href: '/farmer/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    showToast('You have been logged out successfully.', 'info');
    if (onClose) onClose();
    router.push('/farmer/login');
  };

  const content = (
    <div className="flex flex-col h-full justify-between">
      {/* Brand Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-3 py-2">
          <Link
            href={isApproved ? "/farmer/dashboard" : "/farmer/verification-pending"}
            onClick={onClose}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-forest-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-forest-950 font-serif leading-none">
                Krishi<span className="text-forest-600 font-sans">Market</span>
              </div>
              <div className="text-[10px] text-earth-700 tracking-wider uppercase font-bold mt-1 text-forest-700">
                FARMER PORTAL
              </div>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-earth-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Farmer Info pill */}
        <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200/70 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 truncate">
              {user?.farmName || farmerProfile.farmName}
            </span>
            {isApproved && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                ✓ Verified
              </span>
            )}
            {isPending && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 shrink-0">
                🟡 Pending
              </span>
            )}
            {isRejected && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 shrink-0">
                🔴 Rejected
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {user?.name || farmerProfile.name} • {(user?.location || farmerProfile.location).split(',')[0]}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== '/farmer/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-forest-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-forest-50 hover:text-forest-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>

                {!isApproved ? (
                  <span className="text-slate-400 flex items-center gap-1 text-[10px] font-semibold">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Locked</span>
                  </span>
                ) : item.badge ? (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-emerald-400 text-forest-950' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: Help & Logout */}
      <div className="pt-4 border-t border-earth-200/70 space-y-1">
        <a
          href="mailto:support@krishimarket.in?subject=Farmer%20Support%20Request"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-earth-100 hover:text-slate-900 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Help & Support</span>
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 bg-white rounded-3xl border border-earth-200/80 p-4 shadow-xs sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full p-4 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
