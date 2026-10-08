'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_PROFILE_DEFAULT } from '@/data/admin';
import {
  ShieldCheck,
  Search,
  Bell,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AdminNavbarProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  unreadCount?: number;
}

export function AdminNavbar({
  onMenuToggle,
  isMobileMenuOpen,
  unreadCount = 2,
}: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const title =
      segment === 'admin'
        ? 'Admin'
        : segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    return { title, href, isLast: index === pathSegments.length - 1 };
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/admin/farmers?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-forest-600 text-white flex items-center justify-center font-bold shadow-md shadow-forest-900/40 group-hover:bg-forest-500 transition-colors">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white tracking-tight">
                    Krishi Market Governance
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                    Superadmin
                  </span>
                </div>
                <div className="hidden sm:block text-[10px] text-slate-400 font-medium">
                  Bengaluru Agri Hub Cluster #1
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search farmers, crops, orders, batch IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 transition-all"
              />
            </form>
          </div>

          {/* Right: Consumer View, Notifications, Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden sm:flex text-xs text-slate-300 hover:text-white items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Consumer View</span>
            </Link>

            {/* Notification Bell */}
            <Link
              href="/admin/notifications"
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                  <Image
                    src={user?.avatar || ADMIN_PROFILE_DEFAULT.avatar}
                    alt="Admin Avatar"
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </div>
                <div className="hidden xl:block text-left text-xs">
                  <div className="font-bold text-white leading-tight">
                    {user?.name || ADMIN_PROFILE_DEFAULT.name}
                  </div>
                  <div className="text-[10px] text-slate-400">Chief Governance Officer</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl py-2 z-50 divide-y divide-slate-800">
                  <div className="px-4 py-2.5">
                    <p className="text-xs font-bold text-white">
                      {user?.name || ADMIN_PROFILE_DEFAULT.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user?.email || ADMIN_PROFILE_DEFAULT.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/admin/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Admin Profile</span>
                    </Link>

                    <Link
                      href="/admin/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Platform Settings</span>
                    </Link>

                    <Link
                      href="/farmer/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Farmer Portal Preview</span>
                    </Link>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-header Breadcrumbs Bar */}
        <div className="py-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                {crumb.isLast ? (
                  <span className="font-bold text-white shrink-0">{crumb.title}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-200 transition-colors shrink-0"
                  >
                    {crumb.title}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cluster 1 Cold Chain Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;
