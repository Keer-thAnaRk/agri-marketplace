'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, setAdminToken } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname();
  const { isAuthenticated, role, user, isLoading, demoLogin } = useAuth();

  const [timedOut, setTimedOut] = useState(false);
  const [emailInput, setEmailInput] = useState('admin@krishimarket.in');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const isLoginRoute = pathname === '/admin/login';
  const effectiveLoading = isLoading && !timedOut;

  // If on admin login page, allow directly
  if (isLoginRoute) {
    return <>{children}</>;
  }

  // Loading state
  if (effectiveLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-forest-600 text-white flex items-center justify-center shadow-lg shadow-forest-900/50">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div className="text-center">
            <div className="font-extrabold text-base text-white tracking-wide">
              Krishi Market Governance
            </div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
              Verifying Superadmin Privileges...
            </div>
          </div>
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // Verified admin session
  const isAdmin = isAuthenticated && role === 'admin';

  if (isAdmin) {
    return <>{children}</>;
  }

  // Handler for quick demo admin login
  const handleQuickDemoAdmin = async () => {
    setSubmitting(true);
    setAuthError('');
    try {
      const res = await api.loginAdmin('admin@krishimarket.in', 'admin123');
      if (res && res.data?.token) {
        setAdminToken(res.data.token);
        demoLogin('admin');
      } else {
        setAuthError('Failed to initialize administrator session.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Administrator authentication failed.';
      setAuthError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for credential login
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError('');

    try {
      const res = await api.loginAdmin(emailInput, passwordInput);
      if (res && res.data?.token) {
        setAdminToken(res.data.token);
        demoLogin('admin');
      } else {
        setAuthError('Authentication failed. No token received.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid administrator credentials.';
      setAuthError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-forest-600 text-white items-center justify-center shadow-xl shadow-forest-900/50 mb-3 ring-4 ring-forest-500/20">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight font-serif">
            Krishi Superadmin Portal
          </h2>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Restricted administrative governance area. Authentication with platform governance credentials required.
          </p>
        </div>

        <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {isAuthenticated && role !== 'admin' && (
            <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-800 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                Currently authenticated as <span className="font-bold underline capitalize">{role}</span> ({user?.name}). Administrator privileges are required.
              </div>
            </div>
          )}

          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@krishimarket.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-forest-600 hover:bg-forest-500 active:bg-forest-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate to Admin Console</span>
                </>
              )}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold">Or Quick Access</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickDemoAdmin}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <UserCheck className="w-4 h-4" />
            <span>Launch Instant Superadmin Session</span>
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <span>← Return to Public Marketplace</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAuthGuard;
