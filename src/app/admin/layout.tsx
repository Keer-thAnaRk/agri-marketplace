'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAdminToken } from '@/lib/api';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, role, isAuthenticated } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check for admin token in localStorage as fallback
    const adminToken = getAdminToken();
    const hasToken = !!adminToken;
    
    // Debug logging
    console.log('Admin layout - Auth state:', { isAuthenticated, role, user, hasToken });

    // Allow access if either:
    // 1. AuthContext shows authenticated admin role, OR
    // 2. Admin token exists in localStorage
    const isAuthorized = (isAuthenticated && role === 'admin') || hasToken;

    if (!isAuthorized) {
      // Redirect to admin login page
      console.log('Admin layout - Redirecting to login (not authenticated or not admin)');
      router.push('/admin/login');
    } else {
      console.log('Admin layout - Access granted for admin user');
    }
    
    setIsCheckingAuth(false);
  }, [isAuthenticated, role, router]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-slate-400">Checking authentication...</div>
      </div>
    );
  }

  const adminToken = getAdminToken();
  const isAuthorized = (isAuthenticated && role === 'admin') || adminToken;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-rose-950/50 text-rose-400 items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-slate-400">You must be logged in as an administrator to access this page.</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="px-6 py-2.5 bg-forest-600 hover:bg-forest-500 text-white font-bold rounded-xl transition-colors"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
