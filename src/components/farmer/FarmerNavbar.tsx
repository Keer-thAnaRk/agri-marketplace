'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFarmer } from '@/context/FarmerContext';
import { useAuth } from '@/context/AuthContext';
import { VerificationStatus, isFarmerApproved, isFarmerPending, isFarmerRejected } from '@/types';
import FarmerAvatar from '@/components/common/FarmerAvatar';
import { FarmerNotificationDropdown } from './NotificationDropdown';
import {
  Search,
  Menu,
  X,
  ShieldCheck,
  Tractor,
  ArrowLeft,
  ChevronDown,
  User,
  Settings,
  LogOut,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface FarmerNavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function FarmerNavbar({ onToggleSidebar, isSidebarOpen }: FarmerNavbarProps) {
  const router = useRouter();
  const { farmerProfile, showToast } = useFarmer();
  const { user, verificationStatus, logout, updateVerificationStatus } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
    showToast('You have been logged out successfully.', 'info');
  };

  const handleVerificationStatusChange = (status: VerificationStatus) => {
    updateVerificationStatus(status);
    showToast(`Verification status set to: ${status}`, 'info');
  };

  const currentVStatus = user?.verificationStatus || verificationStatus;

  // Status Badge UI
  let statusBadge = (
    <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      <span>✓ Verified Farmer</span>
    </div>
  );

  if (isFarmerPending(currentVStatus)) {
    statusBadge = (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>🟡 Verification Pending</span>
      </div>
    );
  } else if (isFarmerRejected(currentVStatus)) {
    statusBadge = (
      <Link
        href="/farmer/verification-rejected"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        <span>🔴 Verification Rejected</span>
      </Link>
    );
  }

  const displayName = user?.name || farmerProfile.name;
  const displayFarmName = user?.farmName || farmerProfile.farmName;
  const displayAvatar = user?.profilePhoto || user?.avatar || farmerProfile.profilePhoto || farmerProfile.avatar;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-earth-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          {/* Left: Mobile hamburger + Mobile Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-earth-100 lg:hidden transition-colors cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/farmer/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-forest-800 text-white flex items-center justify-center font-bold shadow-xs">
                <Tractor className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-extrabold text-slate-900 text-sm font-serif">
                Farmer<span className="text-forest-700 font-sans">Portal</span>
              </div>
            </Link>

            {/* Desktop search box */}
            <div className="hidden md:flex items-center relative w-64 lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products, orders, harvests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-earth-50 border border-earth-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Right: Notifications + Verification badge + Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Back to Marketplace Link */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-earth-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-earth-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </Link>

            {/* Notifications Dropdown */}
            <FarmerNotificationDropdown />

            {/* Verification Badge */}
            {statusBadge}

            {/* Profile Avatar & Interactive Dropdown Menu (Section 8) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-2xl hover:bg-earth-100/80 border border-earth-200/80 transition-all cursor-pointer group"
                aria-expanded={profileDropdownOpen}
              >
                <FarmerAvatar
                  src={displayAvatar}
                  name={displayName}
                  className="w-8 h-8 rounded-xl border border-forest-300 shadow-2xs text-[11px]"
                  size={32}
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight group-hover:text-forest-900">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {displayFarmName}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl border border-earth-200 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  {/* User Profile Header */}
                  <div className="p-3 bg-earth-50/80 rounded-2xl border border-earth-100 space-y-1">
                    <div className="font-extrabold text-sm text-slate-900 leading-tight">
                      {displayName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{user?.email || farmerProfile.email}</div>
                    <div className="text-[11px] font-semibold text-forest-800 pt-0.5">
                      {displayFarmName}
                    </div>

                    {/* Verification Status Pill */}
                    <div className="pt-2">
                      {verificationStatus === 'Verified' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ Verified Farmer</span>
                        </span>
                      )}
                      {verificationStatus === 'Pending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                          <span>🟡 Verification Pending</span>
                        </span>
                      )}
                      {verificationStatus === 'Rejected' && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                            <span>🔴 Requires Attention</span>
                          </span>
                          <Link
                            href="/farmer/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="text-[11px] font-bold text-rose-700 hover:underline block"
                          >
                            Update Verification Information →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-0.5 text-xs font-semibold text-slate-700">
                    <Link
                      href="/farmer/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-earth-100 hover:text-forest-900 transition-colors"
                    >
                      <User className="w-4 h-4 text-forest-700" />
                      <span>View Profile</span>
                    </Link>

                    <Link
                      href="/farmer/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-earth-100 hover:text-forest-900 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-forest-700" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  {/* Divider and Logout */}
                  <div className="pt-1 border-t border-earth-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
