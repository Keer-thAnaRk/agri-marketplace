'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole, isFarmerPending, isFarmerRejected } from '@/types';
import { ShieldCheck, Tractor, ShoppingBag, ChevronUp, ChevronDown, UserX } from 'lucide-react';

export function RoleSwitcher() {
  const { setUserRole, showToast } = useMarketplace();
  const { role, switchRole, isAuthenticated, user, verificationStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleSwitch = (newRole: UserRole | null) => {
    if (newRole === 'farmer') {
      setUserRole('farmer');
      const currentVStatus = user?.verificationStatus || verificationStatus;
      if (isAuthenticated && role === 'farmer') {
        // Keep active authenticated farmer session intact
        if (!pathname.startsWith('/farmer')) {
          if (isFarmerPending(currentVStatus)) {
            router.push('/farmer/verification-pending');
          } else if (isFarmerRejected(currentVStatus)) {
            router.push('/farmer/verification-rejected');
          } else {
            router.push('/farmer/dashboard');
          }
        }
        return;
      }
      switchRole('farmer');
      showToast('Switched to Demo Farmer View (Ravi Kumar)', 'info');
      if (!pathname.startsWith('/farmer')) {
        router.push('/farmer/dashboard');
      }
    } else if (newRole === 'admin') {
      switchRole(newRole);
      setUserRole('admin');
      showToast('Switched to Platform Admin View', 'info');
      if (!pathname.startsWith('/admin')) {
        router.push('/admin');
      }
    } else if (newRole === 'consumer') {
      switchRole(newRole);
      setUserRole('consumer');
      showToast('Switched to Demo Consumer View (Ananya Sharma)', 'info');
      router.push('/dashboard');
    } else {
      // Logged out / Public visitor mode
      setUserRole('consumer');
      switchRole(null);
      showToast('Switched to Public Visitor Mode (Logged Out)', 'info');
      if (pathname.startsWith('/farmer') || pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        router.push('/');
      }
    }
  };

  return (
    <aside aria-label="Demo role selector" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-forest-950/95 backdrop-blur-md text-white border border-forest-800/80 shadow-2xl rounded-full px-3 py-1.5 flex items-center gap-2 text-xs transition-all duration-200">
        <div className="flex items-center gap-1.5 px-2 py-0.5 text-forest-300 font-semibold border-r border-forest-800/80 pr-3">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAuthenticated ? 'bg-emerald-400' : 'bg-slate-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isAuthenticated ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          </span>
          <span className="hidden sm:inline">Role View:</span>
        </div>

        {!collapsed && (
          <div className="flex items-center gap-1">
            {/* Public Visitor option */}
            <button
              onClick={() => handleSwitch(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                !isAuthenticated
                  ? 'bg-slate-700 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-forest-900'
              }`}
              title="Browse as unauthenticated public visitor"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Visitor</span>
            </button>

            <button
              onClick={() => handleSwitch('consumer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors cursor-pointer ${
                isAuthenticated && role === 'consumer'
                  ? 'bg-forest-600 text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-forest-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Consumer (Ananya)</span>
            </button>

            <button
              onClick={() => handleSwitch('farmer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors cursor-pointer ${
                isAuthenticated && role === 'farmer'
                  ? 'bg-amber-600 text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-forest-900'
              }`}
            >
              <Tractor className="w-3.5 h-3.5" />
              <span>
                {isAuthenticated && role === 'farmer' && user?.name
                  ? `Farmer (${user.name.trim().split(/\s+/)[0]})`
                  : 'Farmer (Ravi)'}
              </span>
            </button>

            <button
              onClick={() => handleSwitch('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors cursor-pointer ${
                isAuthenticated && role === 'admin'
                  ? 'bg-emerald-700 text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-forest-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={collapsed ? 'Expand role switcher' : 'Minimize'}
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
}
