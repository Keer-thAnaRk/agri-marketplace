'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isFarmerApproved, isFarmerPending, isFarmerRejected } from '@/types';
import { VerificationPending } from '@/components/farmer/VerificationPending';
import { VerificationRejected } from '@/components/farmer/VerificationRejected';
import { Leaf, Loader2 } from 'lucide-react';

interface FarmerAuthGuardProps {
  children: React.ReactNode;
}

const AUTH_ROUTES = [
  '/farmer/login',
  '/farmer/signup',
  '/farmer/register',
  '/farmer/forgot-password',
  '/farmer/reset-password',
];

export function FarmerAuthGuard({ children }: FarmerAuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, role, user, verificationStatus, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const effectiveLoading = isLoading && !timedOut;

  const currentStatus = user?.verificationStatus || verificationStatus;

  useEffect(() => {
    if (!effectiveLoading && !isAuthRoute) {
      if (!isAuthenticated || role !== 'farmer') {
        const redirectUrl = `/farmer/login?from=${encodeURIComponent(pathname)}`;
        router.replace(redirectUrl);
        return;
      }

      if (isFarmerApproved(currentStatus)) {
        if (pathname === '/farmer/verification-pending' || pathname === '/farmer/verification-rejected') {
          router.replace('/farmer/dashboard');
        }
      } else if (isFarmerPending(currentStatus)) {
        if (pathname === '/farmer/verification-rejected') {
          router.replace('/farmer/verification-pending');
        }
      } else if (isFarmerRejected(currentStatus)) {
        if (pathname === '/farmer/verification-pending') {
          router.replace('/farmer/verification-rejected');
        }
      }
    }
  }, [effectiveLoading, isAuthenticated, role, isAuthRoute, pathname, router, currentStatus]);

  // If on public auth route (login, signup, etc.): allow through immediately
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // If loading session
  if (effectiveLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white flex items-center justify-center shadow-md">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <div className="font-extrabold text-base font-serif text-slate-900">
              Krishi<span className="text-forest-600 font-sans">Market</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
              Verifying Farmer Session...
            </div>
          </div>
          <Loader2 className="w-5 h-5 text-forest-700 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // If not authenticated, prevent flash of protected content while redirect happens
  if (!isAuthenticated || role !== 'farmer') {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-forest-700 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Redirecting to Farmer Portal login...</p>
        </div>
      </div>
    );
  }

  // AUTHORIZATION GATE: If pending, replace entire page content with VerificationPending
  if (isFarmerPending(currentStatus)) {
    return <VerificationPending />;
  }

  // AUTHORIZATION GATE: If rejected, replace entire page content with VerificationRejected
  if (isFarmerRejected(currentStatus)) {
    return <VerificationRejected />;
  }

  // AUTHORIZATION GATE: Only approved farmers can render the Farmer Module!
  return <>{children}</>;
}

export default FarmerAuthGuard;
