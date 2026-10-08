'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Leaf,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Loader2,
  Tractor,
} from 'lucide-react';

function ConsumerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get('from') || '/dashboard';

  const { loginConsumer, demoLoginConsumer, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await loginConsumer(email, password);
    setIsLoading(false);

    if (result.success) {
      router.push(fromUrl);
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  const handleDemoConsumerLogin = () => {
    demoLoginConsumer();
    router.push(fromUrl);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-gradient-to-b from-sand-50/80 to-[#FBF9F5]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-forest-700 to-forest-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="font-serif text-2xl font-black text-slate-900 tracking-tight">
                Krishi<span className="text-forest-600 font-sans">Market</span>
              </span>
            </div>
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
            <span>Consumer Portal</span>
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Welcome back
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            Sign in to track your orders, saved farms, and fresh produce deliveries.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-sm border border-earth-200/80 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ananya@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-earth-50/50 border border-earth-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-forest-700 hover:text-forest-900 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-earth-50/50 border border-earth-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-earth-300 text-forest-700 focus:ring-forest-600 cursor-pointer"
                />
                <span className="text-xs text-slate-600 select-none">Remember me</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Development / Evaluation Demo Option */}
          <div className="mt-5 pt-4 border-t border-earth-100">
            <div className="p-3 bg-forest-50/80 border border-forest-100/90 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-forest-600" />
                  Demo Evaluation Option
                </span>
                <span className="text-[10px] text-forest-600 font-medium">1-Click</span>
              </div>
              <button
                type="button"
                onClick={handleDemoConsumerLogin}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-forest-100/70 border border-forest-200 text-forest-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Continue as Demo Consumer</span>
                <span className="text-forest-600 font-normal">(Ananya Sharma)</span>
              </button>
            </div>
          </div>

          {/* Create Consumer Account */}
          <div className="mt-5 pt-4 border-t border-earth-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              New to Krishi Market?
            </p>
            <Link
              href="/signup"
              className="w-full py-2.5 px-4 rounded-xl border border-forest-700 text-forest-800 hover:bg-forest-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors block"
            >
              <span>Create Consumer Account</span>
            </Link>
          </div>

          {/* Farmer Portal Shortcut */}
          <div className="mt-4 pt-3 border-t border-earth-100 text-center">
            <p className="text-[11px] text-slate-500 mb-1.5">
              Are you a farmer or agricultural grower?
            </p>
            <Link
              href="/farmer/login"
              className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-900 font-bold hover:underline"
            >
              <Tractor className="w-3.5 h-3.5 text-amber-600" />
              <span>Login to Farmer Portal →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsumerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-sand-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-forest-700" />
            <p className="text-xs text-slate-500 font-medium">Loading Login...</p>
          </div>
        </div>
      }
    >
      <ConsumerLoginContent />
    </Suspense>
  );
}
