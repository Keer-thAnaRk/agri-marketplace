'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Leaf,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Tractor,
  CheckCircle2,
} from 'lucide-react';

function ConsumerSignupContent() {
  const router = useRouter();
  const { signupConsumer, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !phone || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to Krishi Market terms and privacy policy.');
      return;
    }

    setIsLoading(true);
    const result = await signupConsumer({
      fullName,
      email,
      phone,
      password,
    });
    setIsLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Failed to create account. Please try again.');
    }
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
            <span>Join Krishi Marketplace</span>
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Create Consumer Account
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            Enjoy dawn-harvested fresh produce delivered directly from verified local growers.
          </p>
        </div>

        {/* Signup Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-sm border border-earth-200/80 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-earth-50/50 border border-earth-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
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

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98450 12345"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-earth-50/50 border border-earth-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-earth-50/50 border border-earth-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-earth-50/50 border border-earth-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-earth-300 text-forest-700 focus:ring-forest-600 cursor-pointer"
                />
                <span className="text-[11px] text-slate-600 leading-tight select-none">
                  I agree to the Krishi Market Terms of Service and understand produce is harvested directly upon order.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div className="mt-5 pt-4 border-t border-earth-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              Already have a consumer account?
            </p>
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl border border-forest-700 text-forest-800 hover:bg-forest-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors block"
            >
              <span>Login to Your Account</span>
            </Link>
          </div>

          {/* Farmer Portal Option */}
          <div className="mt-4 pt-3 border-t border-earth-100 text-center">
            <p className="text-[11px] text-slate-500 mb-1.5">
              Are you an organic farmer or producer?
            </p>
            <Link
              href="/farmer/signup"
              className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-900 font-bold hover:underline"
            >
              <Tractor className="w-3.5 h-3.5 text-amber-600" />
              <span>Join as Farmer →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsumerSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-sand-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-forest-700" />
            <p className="text-xs text-slate-500 font-medium">Loading Sign Up...</p>
          </div>
        </div>
      }
    >
      <ConsumerSignupContent />
    </Suspense>
  );
}
