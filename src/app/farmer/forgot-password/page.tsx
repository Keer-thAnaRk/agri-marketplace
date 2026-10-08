'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Leaf,
  Mail,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Loader2,
} from 'lucide-react';

export default function FarmerForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    await requestPasswordReset(email);
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-earth-50/70 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Navbar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/farmer/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-earth-200 px-3.5 py-2 rounded-2xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-[11px] font-bold border border-forest-200">
          <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
          <span>Farmer Account Recovery</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white rounded-3xl border border-earth-200 shadow-xl p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-forest-800 text-white flex items-center justify-center mx-auto shadow-md">
              <KeyRound className="w-7 h-7 text-emerald-400" />
            </div>

            <div>
              <div className="font-extrabold text-2xl font-serif tracking-tight text-slate-900 mt-2">
                Reset Your Password
              </div>
              <div className="inline-block text-[11px] font-extrabold tracking-widest uppercase text-forest-800 bg-forest-50 px-3 py-0.5 rounded-full border border-forest-200 mt-1">
                FARMER PORTAL
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-xs mx-auto pt-1 leading-relaxed">
              Enter your registered farmer email to receive password reset instructions.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Registered Farmer Email
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-forest-900/10 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Request Received</span>
                </div>
                <p className="font-medium text-emerald-800 leading-relaxed">
                  If an account exists for this email, password reset instructions will be sent.
                </p>
              </div>

              <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200 text-[11px] text-slate-500">
                Email provided: <strong className="text-slate-800 font-mono">{email}</strong>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={`/farmer/reset-password?email=${encodeURIComponent(email)}`}
                  className="w-full py-2.5 px-4 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Proceed to Reset Password Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/farmer/login"
                  className="w-full py-2 px-4 rounded-2xl border border-earth-200 hover:bg-earth-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-slate-500">
            Remembered your password?{' '}
            <Link href="/farmer/login" className="font-bold text-forest-800 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400">
        © 2026 Krishi Market • Dedicated Farmer Direct Infrastructure • Bengaluru Cluster #1
      </div>
    </div>
  );
}
