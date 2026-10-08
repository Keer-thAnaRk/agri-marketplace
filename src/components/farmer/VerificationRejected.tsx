'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFarmer } from '@/context/FarmerContext';
import FarmerAvatar from '@/components/common/FarmerAvatar';
import {
  XCircle,
  AlertCircle,
  FileEdit,
  LogOut,
  Send,
  X,
  MapPin,
  Sprout,
  CheckCircle2,
  UploadCloud,
  Leaf,
} from 'lucide-react';

export function VerificationRejected() {
  const router = useRouter();
  const { user, logout, resubmitFarmer } = useAuth();
  const { farmerProfile, showToast } = useFarmer();

  const [isResubmitting, setIsResubmitting] = useState(false);
  const [farmName, setFarmName] = useState(user?.farmName || farmerProfile.farmName || '');
  const [farmLocation, setFarmLocation] = useState(farmerProfile.farmLocation || user?.location || '');
  const [farmingMethod, setFarmingMethod] = useState(farmerProfile.farmingMethod || 'Organic');
  const [mainCrops, setMainCrops] = useState(farmerProfile.mainCrops?.join(', ') || '');
  const [auditNotes, setAuditNotes] = useState('');
  const [newDocumentUploaded, setNewDocumentUploaded] = useState(false);

  const rejectionReason =
    user?.rejectionReason ||
    farmerProfile.rejectionReason ||
    'Please upload clearer land ownership documents and verify your farm cultivation area with local agricultural coordinates.';

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
  };

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    resubmitFarmer(user.id, {
      farmName,
      farmLocation,
      location: farmLocation,
      farmingMethod,
      mainCrops: mainCrops.split(',').map((c) => c.trim()).filter(Boolean),
      auditNotes,
    });

    showToast('Your updated application has been resubmitted for Admin review!', 'success');
    setIsResubmitting(false);
    window.location.reload();
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
      {/* Top Rejection Banner */}
      <div className="bg-rose-500/10 border border-rose-300 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-xs">
          <XCircle className="w-9 h-9 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-900 bg-rose-100 px-3 py-1 rounded-full border border-rose-200 inline-block">
            Status: REJECTED
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
            Profile Rejected
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Your Farmer profile was not approved by the Krishi Market Admin team.
          </p>
        </div>

        {/* Rejection Reason Card */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-rose-200 p-5 text-left space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Admin Review Feedback & Reason:</span>
          </div>
          <div className="text-xs text-slate-700 bg-rose-50/70 p-3.5 rounded-xl border border-rose-100 leading-relaxed font-medium">
            &ldquo;{rejectionReason}&rdquo;
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Please review the comments above, correct your information or upload replacement documents, and resubmit for review.
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsResubmitting(true)}
            className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-98"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Resubmit Application</span>
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

      {/* Resubmission Modal / Drawer */}
      {isResubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-earth-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-earth-100">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-forest-800" />
                <h3 className="font-extrabold text-slate-900 text-lg font-serif">
                  Update & Resubmit Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResubmitting(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-earth-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Name</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Location / Address</label>
                <input
                  type="text"
                  required
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Farming Method</label>
                  <select
                    value={farmingMethod}
                    onChange={(e) => setFarmingMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                  >
                    <option value="Organic">Organic</option>
                    <option value="Natural (ZBNF)">Natural (ZBNF)</option>
                    <option value="Hydroponic">Hydroponic</option>
                    <option value="Regenerative">Regenerative</option>
                    <option value="Pesticide-Free">Pesticide-Free</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Main Crops</label>
                  <input
                    type="text"
                    required
                    value={mainCrops}
                    onChange={(e) => setMainCrops(e.target.value)}
                    placeholder="e.g. Tomatoes, Spinach"
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              {/* Upload Replacement Document */}
              <div className="p-3.5 bg-earth-50 rounded-2xl border border-earth-200 space-y-2">
                <label className="font-bold text-slate-800 block">
                  Upload Replacement Verification Document (Pahani / RTC / ID)
                </label>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    {newDocumentUploaded ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Updated_Land_Record_RTC_Certified.pdf (2.4 MB)</span>
                      </span>
                    ) : (
                      'PDF or image up to 10MB'
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewDocumentUploaded(true)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-earth-300 hover:bg-earth-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{newDocumentUploaded ? 'File Attached' : 'Attach File'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Response to Admin Auditor Notes
                </label>
                <textarea
                  rows={3}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Explain the corrections made or details about your land records..."
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResubmitting(false)}
                  className="px-4 py-2.5 rounded-xl border border-earth-300 text-slate-700 font-bold text-xs hover:bg-earth-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Re-Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationRejected;
