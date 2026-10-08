'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, setAdminToken } from '@/lib/api';
import {
  ShieldCheck,
  Loader2,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { demoLogin } = useAuth();

  const [email, setEmail] = useState('admin@krishimarket.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.loginAdmin(email, password);
      if (res?.data?.token) {
        setAdminToken(res.data.token);
        console.log('Admin login - Token set successfully');
        demoLogin('admin');
        router.push('/admin/dashboard');
      } else {
        setError('Authentication failed. No token received.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid administrator credentials.';
      console.error('Admin login error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.loginAdmin('admin@krishimarket.in', 'admin123');
      if (res?.data?.token) {
        setAdminToken(res.data.token);
        console.log('Demo admin login - Token set successfully');
        demoLogin('admin');
        router.push('/admin/dashboard');
      } else {
        setError('Demo administrator authentication failed.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to authenticate default admin account.';
      console.error('Demo admin login error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-forest-600 text-white items-center justify-center shadow-xl shadow-forest-900/50 mb-3 ring-4 ring-forest-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-serif">
            Krishi Governance Portal
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Superadmin Authentication & Platform Operational Center
          </p>
        </div>

        <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-forest-600 hover:bg-forest-500 active:bg-forest-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to Superadmin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold">Demo Access</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoAdmin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <UserCheck className="w-4 h-4" />
            <span>One-Click Superadmin Demo</span>
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Consumer Marketplace</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
