'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Search,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Tractor,
  ShieldCheck,
  User,
  Leaf,
  LogOut,
  LayoutDashboard,
  Package,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const {
    activeLocation,
    setIsLocationModalOpen,
    setIsSearchModalOpen,
    cartCount,
  } = useMarketplace();

  const { isAuthenticated, user, role, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Public visitor base links
  const baseLinks = [
    { name: 'Home', href: '/' },
    { name: 'Explore Produce', href: '/explore' },
    { name: 'Surplus Deals', href: '/surplus' },
    { name: 'Farmers Near You', href: '/farmers' },
    { name: 'How It Works', href: '/#how-it-works' },
  ];

  // Only include Dashboard when logged in as consumer
  const navLinks =
    isAuthenticated && role === 'consumer'
      ? [...baseLinks, { name: 'Dashboard', href: '/dashboard' }]
      : baseLinks;

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return false;
    return pathname.startsWith(href);
  };

  // Farmer portal uses its own specialized FarmerNavbar
  if (pathname?.startsWith('/farmer')) {
    return null;
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-earth-200/80 transition-all">
      {/* Top Banner Notice */}
      <div className="bg-forest-900 text-forest-100 text-[11px] py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Today&apos;s Morning Harvests dispatched across Bengaluru. Direct from farm to table.</span>
        <span className="hidden sm:inline opacity-70">| Zero synthetic chemicals</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-2 sm:gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forest-700 to-forest-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-forest-950 font-serif block leading-none">
                  Krishi<span className="text-forest-600 font-sans">Market</span>
                </span>
                <span className="text-[10px] text-earth-600 tracking-wider uppercase font-semibold block mt-0.5">
                  Farmer-Direct Agri
                </span>
              </div>
            </Link>

            {/* Location Selector */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-earth-50 hover:bg-forest-50 border border-earth-200 text-left transition-colors cursor-pointer group"
              title="Click to change your delivery neighborhood in Bengaluru"
            >
              <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600 leading-none">
                  Delivering to
                </div>
                <div className="text-xs font-bold text-forest-900 flex items-center gap-1 leading-none mt-0.5">
                  <span className="truncate max-w-[120px]">{activeLocation.area.split(',')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-forest-600 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-forest-50 text-forest-900 font-semibold'
                      : 'text-slate-600 hover:text-forest-800 hover:bg-earth-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-earth-50 hover:bg-earth-100 text-slate-500 hover:text-forest-900 border border-earth-200 transition-colors text-xs font-medium cursor-pointer"
              title="Search produce and farmers (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-forest-700" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-earth-200 rounded text-slate-600">
                ⌘K
              </kbd>
            </button>

            {/* Notifications (available to all or authenticated) */}
            <NotificationDropdown />

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 text-slate-700 hover:text-forest-800 hover:bg-forest-50 rounded-full transition-colors"
              aria-label="View shopping basket"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-forest-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Public Visitor State vs Authenticated State */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-earth-200">
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-forest-900 hover:bg-earth-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-2 rounded-xl border border-earth-300 bg-white hover:bg-earth-50 text-slate-800 text-xs font-bold transition-all shadow-2xs"
                >
                  Sign Up
                </Link>

                {/* Join as Farmer dropdown button */}
                <div className="relative group">
                  <Link
                    href="/farmer/signup"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <Tractor className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Join as Farmer</span>
                  </Link>

                  {/* Hover dropdown for existing farmers */}
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-xl border border-earth-200 p-2.5 hidden group-hover:block transition-all z-50">
                    <p className="text-[11px] text-slate-500 mb-1.5 px-1 font-medium">
                      Already have a farmer account?
                    </p>
                    <Link
                      href="/farmer/login"
                      className="w-full text-left px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-900 text-xs font-bold flex items-center justify-between transition-colors block"
                    >
                      <span>Login as Farmer</span>
                      <span className="text-[11px] text-forest-700">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative pl-1 border-l border-earth-200" ref={profileRef}>
                {/* Authenticated User Avatar Button */}
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-earth-100/70 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-forest-800 text-emerald-300 flex items-center justify-center font-bold text-xs shadow-xs">
                    {userInitials}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">
                      {user?.name || 'My Account'}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize leading-tight">
                      {role || 'User'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-earth-200 py-2 z-50 animate-in fade-in-50 duration-150">
                    <div className="px-4 py-2 border-b border-earth-100">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user?.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {user?.email}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-100 text-forest-800 capitalize">
                        {role === 'consumer' ? 'Verified Consumer' : role || 'Member'}
                      </span>
                    </div>

                    <div className="py-1">
                      {role === 'consumer' && (
                        <>
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-forest-50 hover:text-forest-900 font-medium transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-forest-700" />
                            <span>Consumer Dashboard</span>
                          </Link>
                          <Link
                            href="/orders"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-forest-50 hover:text-forest-900 font-medium transition-colors"
                          >
                            <Package className="w-4 h-4 text-forest-700" />
                            <span>My Orders & Tracking</span>
                          </Link>
                        </>
                      )}

                      {role === 'farmer' && (
                        <Link
                          href="/farmer/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-forest-50 hover:text-forest-900 font-medium transition-colors"
                        >
                          <Tractor className="w-4 h-4 text-forest-700" />
                          <span>Farmer Dashboard</span>
                        </Link>
                      )}

                      {role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-forest-50 hover:text-forest-900 font-medium transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-forest-700" />
                          <span>Admin Portal</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-earth-100">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 font-bold transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-forest-900 lg:hidden rounded-lg hover:bg-earth-50 transition-colors"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-earth-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          {/* Mobile Location Selector */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsLocationModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-forest-50 border border-forest-100 text-left"
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-forest-700" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-600">Delivering to</div>
                <div className="text-xs font-bold text-forest-950">{activeLocation.area}</div>
              </div>
            </div>
            <span className="text-xs font-bold text-forest-700">Change</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isLinkActive(link.href)
                    ? 'bg-forest-50 text-forest-900 font-bold'
                    : 'text-slate-700 hover:bg-earth-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-earth-50"
              >
                My Orders & Live Tracking
              </Link>
            )}
          </nav>

          {/* Mobile Auth Actions */}
          <div className="pt-3 border-t border-earth-100 space-y-2">
            {!isAuthenticated ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-earth-300 text-slate-800 text-xs font-bold text-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-forest-800 text-white text-xs font-bold text-center"
                  >
                    Sign Up
                  </Link>
                </div>
                <Link
                  href="/farmer/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-forest-900 text-white text-xs font-bold text-center w-full"
                >
                  <Tractor className="w-4 h-4 text-emerald-400" />
                  <span>Join as Farmer</span>
                </Link>
                <div className="text-center pt-1">
                  <Link
                    href="/farmer/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs text-amber-800 font-bold hover:underline"
                  >
                    Already have a farmer account? Login as Farmer →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-earth-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                    <div className="text-[11px] text-slate-500 capitalize">{role || 'Member'}</div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200"
                  >
                    Log Out
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/farmer/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-forest-800 text-white text-xs font-bold text-center"
                  >
                    <Tractor className="w-4 h-4 text-emerald-400" />
                    <span>Farmer Portal</span>
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 text-white text-xs font-bold text-center"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Admin Portal</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
