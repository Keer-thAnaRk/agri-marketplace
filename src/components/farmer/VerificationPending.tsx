'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFarmer } from '@/context/FarmerContext';
import FarmerAvatar from '@/components/common/FarmerAvatar';
import { api } from '@/lib/api';
import {
  Clock,
  CheckCircle2,
  Hourglass,
  LogOut,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
  MapPin,
  Calendar,
  Sprout,
  Mail,
  Phone,
  Tractor,
  Leaf,
} from 'lucide-react';

export function VerificationPending() {
  const router = useRouter();
  const { user, logout, verificationStatus } = useAuth();
  const { farmerProfile, showToast } = useFarmer();

  const displayName = user?.name || farmerProfile.name || 'Farmer';
  const displayFarmName = user?.farmName || farmerProfile.farmName || 'My Farm';
  const displayEmail = user?.email || farmerProfile.email || '';
  const displayPhone = user?.phone || farmerProfile.phone || '';
  const displayLocation = user?.location || farmerProfile.location || 'Karnataka';
  const displayMethod = farmerProfile.farmingMethod || 'Organic';
  const displayCrops = Array.isArray(farmerProfile.mainCrops) && farmerProfile.mainCrops.length > 0
    ? farmerProfile.mainCrops.join(', ')
    : 'Fresh Vegetables';
  const displayDate = user?.registeredAt || farmerProfile.registeredAt || 'Today';

  const handleRefresh = async () => {
    try {
      const statusRes = await api.getFarmerStatus();
      if (statusRes.success && statusRes.data) {
        if (statusRes.data.isApproved) {
          showToast('Congratulations! Your account has been approved by Admin.', 'success');
          window.location.href = '/farmer/dashboard';
          return;
        } else if (statusRes.data.isRejected) {
          showToast('Your application requires updates based on Admin review.', 'warning');
          window.location.href = '/farmer/verification-rejected';
          return;
        }
      }
    } catch {}

    showToast('Your registration is still under review by our Admin team.', 'info');
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
    showToast('You have been logged out successfully.', 'info');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-in fade-in duration-200">
      {/* Top Portal Header */}
      <div className="flex items-center justify-between pb-4 border-b border-earth-200/80">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-forest-800 text-white flex items-center justify-center shadow-xs">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="font-extrabold text-base font-serif text-slate-900 leading-none">
              Krishi<span className="text-forest-600 font-sans">Market</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-forest-700 mt-0.5">
              Farmer Accreditation Portal
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-earth-200 bg-white hover:bg-earth-50 font-medium transition-colors"
          >
            Marketplace
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      {/* Top Banner Notice */}
      <div className="bg-amber-500/10 border border-amber-300/80 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
          <Clock className="w-9 h-9 stroke-[2.2] animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 inline-block">
            Status: PENDING ADMIN APPROVAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
            Verification Pending
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Your Farmer profile is currently under review by the Krishi Market Admin team.
            You have successfully submitted your registration and verification documents.
          </p>
          <p className="text-xs font-semibold text-amber-900 max-w-lg mx-auto">
            You will be able to access your Farmer Dashboard, add products, manage inventory, and receive orders after your profile is approved.
          </p>
        </div>

        {/* Verification Timeline */}
        <div className="pt-2 max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-xs rounded-2xl border border-amber-200 p-4 space-y-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left">
              Verification Progress:
            </div>
            <div className="space-y-2.5 text-xs text-left">
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Registration Submitted</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Documents Received</span>
              </div>
              <div className="flex items-center gap-2.5 text-amber-900 font-bold">
                <Hourglass className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                <span>Admin Review Pending (Typically 24-48 hours)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Approval Status</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl border border-earth-300 hover:bg-earth-100 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Submitted Registration Information Summary (View-Only) */}
      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-earth-100">
          <div className="flex items-center gap-2.5">
            <Tractor className="w-5 h-5 text-forest-800" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 font-serif">
                Submitted Application Summary
              </h2>
              <p className="text-[11px] text-slate-500">
                Your submitted credentials awaiting accreditation audit
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
            🟡 Under Review
          </span>
        </div>

        {/* Farmer Hero inside Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-earth-50 border border-earth-200/70">
          <FarmerAvatar
            src={user?.profilePhoto || user?.avatar || farmerProfile.profilePhoto || farmerProfile.avatar}
            name={displayName}
            className="w-16 h-16 rounded-2xl border-2 border-forest-200 shadow-2xs text-lg shrink-0"
            size={64}
          />
          <div className="min-w-0">
            <div className="text-base font-bold text-slate-900 truncate">{displayName}</div>
            <div className="text-xs font-semibold text-forest-800 truncate">{displayFarmName}</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{displayLocation}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-earth-100 bg-earth-50/50 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</div>
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{displayEmail}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-earth-100 bg-earth-50/50 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</div>
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{displayPhone || 'Provided'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-earth-100 bg-earth-50/50 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Farming Method</div>
            <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{displayMethod} Cultivation</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-earth-100 bg-earth-50/50 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Crops</div>
            <div className="font-semibold text-slate-800 truncate">
              {displayCrops}
            </div>
          </div>
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Application reference ID: <span className="font-mono text-slate-600 font-semibold">{user?.id || 'FARM-PENDING'}</span>
        </div>
      </div>
    </div>
  );
}

export default VerificationPending;
