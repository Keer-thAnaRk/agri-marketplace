'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { FarmerProvider } from '@/context/FarmerContext';
import { FarmerNavbar } from '@/components/farmer/FarmerNavbar';
import { FarmerSidebar } from '@/components/farmer/FarmerSidebar';
import { FarmerToastContainer } from '@/components/farmer/Toast';
import { FarmerAuthGuard } from '@/components/farmer/FarmerAuthGuard';

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Exclude dashboard layout shell for login, signup, and password recovery pages
  const isAuthPage =
    pathname === '/farmer/login' ||
    pathname === '/farmer/signup' ||
    pathname === '/farmer/register' ||
    pathname === '/farmer/forgot-password' ||
    pathname === '/farmer/reset-password';

  if (isAuthPage) {
    return (
      <FarmerProvider>
        <FarmerAuthGuard>
          <div className="min-h-screen bg-earth-50/70 text-slate-900">
            {children}
          </div>
          <FarmerToastContainer />
        </FarmerAuthGuard>
      </FarmerProvider>
    );
  }

  return (
    <FarmerProvider>
      <FarmerAuthGuard>
        <div className="min-h-screen bg-[#FBF9F5] text-slate-900 flex flex-col">
        {/* Top Navbar */}
        <FarmerNavbar
          isSidebarOpen={mobileSidebarOpen}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Main Body with Sidebar + Content */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex gap-8 items-start">
            {/* Desktop & Mobile Drawer Sidebar */}
            <FarmerSidebar
              isOpen={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
            />

            {/* Dynamic Dashboard Page Content */}
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>

        {/* Farmer Module Toast Notification Container */}
        <FarmerToastContainer />
      </div>
      </FarmerAuthGuard>
    </FarmerProvider>
  );
}
