'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, DEMO_FARMER_USER } from '@/context/AuthContext';
import { useFarmer } from '@/context/FarmerContext';
import {
  Leaf,
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';

function FarmerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get('from') || '/farmer/dashboard';

  const { loginFarmer, demoLoginFarmer, isLoading: authLoading } = useAuth();
  const { showToast } = useFarmer();

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
    const result = await loginFarmer(email, password);
    setIsLoading(false);

    if (result.success) {
      showToast('Welcome to Krishi Market Farmer Portal!', 'success');
      const status = (result.verificationStatus || '').toLowerCase();
      if (status === 'pending') {
        router.push('/farmer/verification-pending');
      } else if (status === 'rejected') {
        router.push('/farmer/verification-rejected');
      } else {
        router.push('/farmer/dashboard');
      }
    } else {
      setError(result.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleDemoLogin = () => {
    demoLoginFarmer();
    showToast(`Signed in as demo farmer: ${DEMO_FARMER_USER.name} (Verified)`, 'success');
    router.push('/farmer/dashboard');
  };

  return (
    <div className="min-h-screen bg-earth-50/70 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Navbar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-earth-200 px-3.5 py-2 rounded-2xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-[11px] font-bold border border-forest-200">
          <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
          <span>Farmer Portal Access</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white rounded-3xl border border-earth-200 shadow-xl p-7 sm:p-10 space-y-6">
          {/* Brand & Portal Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-forest-800 text-white flex items-center justify-center mx-auto shadow-md">
              <Leaf className="w-7 h-7 text-emerald-400" />
            </div>

            <div>
              <div className="font-extrabold text-2xl font-serif tracking-tight text-slate-900 mt-2">
                Krishi<span className="text-forest-600 font-sans">Market</span>
              </div>
              <div className="inline-block text-[11px] font-extrabold tracking-widest uppercase text-forest-800 bg-forest-50 px-3 py-0.5 rounded-full border border-forest-200 mt-1">
                FARMER PORTAL
              </div>
            </div>

            <p className="text-xs text-slate-600 max-w-xs mx-auto pt-1 leading-relaxed">
              Manage your farm, products and orders in one place.
            </p>
          </div>

          {/* Quick Demo Login Option */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Development Demo Access</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                Verified
              </span>
            </div>

            <p className="text-[11px] text-emerald-800">
              Instant one-click access using the pre-configured verified demo farmer account (Ravi Kumar • Green Valley Farm).
            </p>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading || authLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Demo Farmer Login</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-earth-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              or sign in with credentials
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Farmer Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ravi.kumar@greenvalleyfarm.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-earth-50 border border-earth-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700">Password</label>
                <Link
                  href="/farmer/forgot-password"
                  className="text-[11px] font-bold text-forest-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-earth-50 border border-earth-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-forest-700 rounded w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full py-3 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-forest-900/10 transition-all cursor-pointer disabled:opacity-50 mt-2"
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

          {/* Create Account Button */}
          <div className="pt-2 border-t border-earth-100 space-y-3 text-center">
            <div className="text-xs text-slate-500">
              New to Krishi Market?
            </div>
            <Link
              href="/farmer/signup"
              className="w-full py-2.5 px-4 rounded-2xl border-2 border-forest-800 text-forest-800 hover:bg-forest-50 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer block"
            >
              <span>Create Farmer Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[11px] text-slate-400">
        © 2026 Krishi Market • Dedicated Farmer Direct Infrastructure • Bengaluru Cluster #1
      </div>
    </div>
  );
}

export default function FarmerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sand-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-forest-700" />
            <p className="text-xs text-slate-500 font-medium">Loading Farmer Portal...</p>
          </div>
        </div>
      }
    >
      <FarmerLoginContent />
    </Suspense>
  );
}
