'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, role, isAuthenticated } = useAuth();

  useEffect(() => {
    // Debug logging
    console.log('Admin layout - Auth state:', { isAuthenticated, role, user });

    // Check if user is authenticated and has admin role
    if (!isAuthenticated || role !== 'admin') {
      // Redirect to admin login page
      console.log('Admin layout - Redirecting to login (not authenticated or not admin)');
      router.push('/admin/login');
    } else {
      console.log('Admin layout - Access granted for admin user');
    }
  }, [isAuthenticated, role, router]);

  // Show loading state while checking authentication
  if (!isAuthenticated || role !== 'admin') {
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
