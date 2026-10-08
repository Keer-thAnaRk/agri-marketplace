'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useFarmer } from '@/context/FarmerContext';
import { useAuth } from '@/context/AuthContext';
import FarmerAvatar from '@/components/common/FarmerAvatar';
import {
  User,
  Tractor,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Save,
  FileCheck,
  ImageIcon,
  Sparkles,
  Edit2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function FarmProfilePage() {
  const { farmerProfile, updateProfile, showToast } = useFarmer();
  const { verificationStatus, updateVerificationStatus } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: farmerProfile.name,
    email: farmerProfile.email,
    phone: farmerProfile.phone,
    farmName: farmerProfile.farmName,
    location: farmerProfile.location || farmerProfile.farmLocation || '',
    city: farmerProfile.city,
    pincode: farmerProfile.pincode,
    farmingMethod: farmerProfile.farmingMethod,
    yearsFarming: farmerProfile.yearsFarming,
    acreage: farmerProfile.acreage || 5,
    mainCrops: Array.isArray(farmerProfile.mainCrops) ? farmerProfile.mainCrops.join(', ') : '',
    description: farmerProfile.description || farmerProfile.farmDescription || '',
    coverImage: farmerProfile.coverImage,
  });

  useEffect(() => {
    setFormData({
      name: farmerProfile.name,
      email: farmerProfile.email,
      phone: farmerProfile.phone,
      farmName: farmerProfile.farmName,
      location: farmerProfile.location || farmerProfile.farmLocation || '',
      city: farmerProfile.city,
      pincode: farmerProfile.pincode,
      farmingMethod: farmerProfile.farmingMethod,
      yearsFarming: farmerProfile.yearsFarming,
      acreage: farmerProfile.acreage || 5,
      mainCrops: Array.isArray(farmerProfile.mainCrops) ? farmerProfile.mainCrops.join(', ') : '',
      description: farmerProfile.description || farmerProfile.farmDescription || '',
      coverImage: farmerProfile.coverImage,
    });
  }, [farmerProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      farmName: formData.farmName,
      location: formData.location,
      city: formData.city,
      pincode: formData.pincode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      farmingMethod: formData.farmingMethod as any,
      yearsFarming: Number(formData.yearsFarming) || 1,
      acreage: Number(formData.acreage) || 1,
      mainCrops: formData.mainCrops.split(',').map((c) => c.trim()),
      description: formData.description,
      coverImage: formData.coverImage,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Farm Profile & Accreditation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Information presented transparently to conscious urban consumers on Krishi Market
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isEditing
              ? 'bg-earth-100 hover:bg-earth-200 text-slate-700'
              : 'bg-forest-800 hover:bg-forest-900 text-white shadow-xs'
          }`}
        >
          <Edit2 className="w-4 h-4" />
          <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Cover Image & Farm Avatar Hero */}
      <div className="bg-white rounded-3xl border border-earth-200/80 shadow-xs overflow-hidden">
        <div className="relative h-48 sm:h-64 w-full bg-forest-900">
          <Image
            src={formData.coverImage}
            alt={formData.farmName}
            fill
            className="object-cover opacity-90"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent" />

          {/* Verification banner in cover */}
          <div className="absolute top-4 right-4">
            {verificationStatus === 'Verified' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 text-xs font-bold backdrop-blur-md shadow-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>✓ Verified on {farmerProfile.verifiedDate || 'Sept 10, 2026'}</span>
              </span>
            )}
            {verificationStatus === 'Pending' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/80 text-amber-200 border border-amber-500/40 text-xs font-bold backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>🟡 Verification Pending</span>
              </span>
            )}
            {verificationStatus === 'Rejected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950/80 text-rose-200 border border-rose-500/40 text-xs font-bold backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>🔴 Verification Requires Attention</span>
              </span>
            )}
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-earth-100 shrink-0">
                <FarmerAvatar
                  src={farmerProfile.profilePhoto || farmerProfile.avatar}
                  name={formData.name || farmerProfile.name}
                  className="w-full h-full rounded-2xl text-2xl"
                  size={112}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
                    {formData.name}
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {formData.farmingMethod} Farming
                  </span>
                </div>
                <div className="text-xs font-bold text-forest-800">{formData.farmName}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formData.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Details / Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal & Farm Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-5 text-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
              <User className="w-4 h-4" />
              <span>1. Personal Information</span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>
            </div>
          </div>

          {/* Farm Information */}
          <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-5 text-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
              <Tractor className="w-4 h-4" />
              <span>2. Farm Information</span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Farming Method</label>
                  <select
                    disabled={!isEditing}
                    value={formData.farmingMethod}
                    onChange={(e) =>
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setFormData({ ...formData, farmingMethod: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
                  >
                    <option value="Organic">Organic</option>
                    <option value="Natural (ZBNF)">Natural (ZBNF)</option>
                    <option value="Hydroponic">Hydroponic</option>
                    <option value="Regenerative">Regenerative</option>
                    <option value="Pesticide-Free">Pesticide-Free</option>
                    <option value="Conventional">Conventional</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Years Farming</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={formData.yearsFarming}
                    onChange={(e) => setFormData({ ...formData, yearsFarming: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Main Crops</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.mainCrops}
                  onChange={(e) => setFormData({ ...formData, mainCrops: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Farm Story & Description */}
        <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-4 text-xs">
          <label className="font-bold text-slate-700 text-xs uppercase tracking-wider block">
            Farm Story, Soil Practices & Irrigation Infrastructure
          </label>
          <textarea
            rows={4}
            disabled={!isEditing}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-2xl text-slate-900 leading-relaxed disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-forest-600"
          />
        </div>

        {/* Farm Gallery */}
        <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
            <ImageIcon className="w-4 h-4" />
            <span>Farm Gallery</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {farmerProfile.gallery.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-4/3 rounded-2xl overflow-hidden border border-earth-200 shadow-2xs group"
              >
                <Image
                  src={img}
                  alt={`Farm photo ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Verification Status & Uploaded Documents */}
        <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-earth-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Accreditation & Verification Documents</span>
            </div>

            {verificationStatus === 'Verified' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified on {farmerProfile.verifiedDate || 'Sept 10, 2026'}</span>
              </span>
            )}
            {verificationStatus === 'Pending' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>🟡 Verification Pending</span>
              </span>
            )}
            {verificationStatus === 'Rejected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>🔴 Action Required</span>
              </span>
            )}
          </div>

          {/* Rejected Attention Banner (Section 12) */}
          {verificationStatus === 'Rejected' && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Verification Requires Attention</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                The land registration excerpt could not be audited against the Karnataka Bhoomi RTC database. Please attach an updated clear copy of your land records.
              </p>
              <button
                type="button"
                onClick={() => {
                  updateVerificationStatus('Verified');
                  showToast('Updated land verification documents submitted! Status marked as Verified.', 'success');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Update Verification Information
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-forest-700" />
                <div>
                  <div className="font-bold text-slate-900">Government Identity Proof</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {farmerProfile.documents.governmentId || 'KA-Aadhaar-9812-XXXX.pdf'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {verificationStatus === 'Verified' ? 'Audited' : 'Submitted'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-forest-700" />
                <div>
                  <div className="font-bold text-slate-900">Farm Ownership / RTC Extract</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {farmerProfile.documents.farmOwnership || 'RTC-Khata-Extract-78B.pdf'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {verificationStatus === 'Verified' ? 'Audited' : 'Submitted'}
              </span>
            </div>
          </div>
        </div>

        {/* Save button when editing */}
        {isEditing && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-forest-900/10 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Updates</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
