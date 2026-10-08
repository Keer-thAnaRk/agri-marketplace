'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ADMIN_PROFILE_DEFAULT } from '@/data/admin';
import {
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Edit2,
  Save,
  X,
} from 'lucide-react';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState(ADMIN_PROFILE_DEFAULT);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...ADMIN_PROFILE_DEFAULT });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ ...editFormData });
    setIsEditing(false);
    showToast('Admin profile successfully updated.');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Governance Administrator Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Superadmin credentials, cluster authority, and personal contact details
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditFormData({ ...profile });
            setIsEditing(!isEditing);
          }}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 Cols): Profile View or Edit Form */}
        <div className="lg:col-span-8 space-y-6">
          {!isEditing ? (
            /* Profile View */
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-slate-100">
                <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 shadow-xs">
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                      {profile.accountStatus}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Cluster #1</span>
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900 font-serif">{profile.name}</h2>
                  <p className="text-xs font-semibold text-slate-600">{profile.role}</p>
                  <p className="text-xs text-slate-400">{profile.department}</p>
                </div>
              </div>

              {/* Detail Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Address</span>
                  </span>
                  <span className="font-bold text-slate-900 block truncate">{profile.email}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact Phone</span>
                  </span>
                  <span className="font-bold text-slate-900 block">{profile.phone}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Role Privileges</span>
                  </span>
                  <span className="font-bold text-slate-900 block">{profile.role}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined Governance</span>
                  </span>
                  <span className="font-bold text-slate-900 block">{profile.joinedDate}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Form UI */
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                  Edit Administrator Information
                </h2>
                <p className="text-xs text-slate-500">Update your public credentials and contact details.</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={editFormData.email}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Phone</label>
                    <input
                      type="text"
                      required
                      value={editFormData.phone}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Governance Department</label>
                    <input
                      type="text"
                      required
                      value={editFormData.department}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, department: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-forest-700 hover:bg-forest-600 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column (4 Cols): Security & Key Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security</span>
              <h3 className="text-base font-bold text-slate-900 font-serif">Security Badges</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-emerald-950">2FA Protected</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Cluster 1 Authority</span>
                <CheckCircle2 className="w-4 h-4 text-forest-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
