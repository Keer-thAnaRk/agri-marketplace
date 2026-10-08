'use client';

import React, { useState } from 'react';
import { ADMIN_PLATFORM_SETTINGS_DEFAULT, ADMIN_PROFILE_DEFAULT } from '@/data/admin';
import {
  Settings,
  Bell,
  Sliders,
  Palette,
  CheckCircle2,
  Lock,
  Save,
} from 'lucide-react';

type SettingsTab = 'account' | 'platform' | 'notifications' | 'security' | 'appearance';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('platform');

  const [platformSettings, setPlatformSettings] = useState(ADMIN_PLATFORM_SETTINGS_DEFAULT);
  const [profileSettings, setProfileSettings] = useState(ADMIN_PROFILE_DEFAULT);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Governance settings saved successfully.');
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
            Platform Settings & Governance Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure commission thresholds, peri-urban delivery radii, security policies, and alerts
          </p>
        </div>
      </div>

      {/* 5 Section Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {(
          [
            { id: 'platform', label: 'Platform Settings', icon: Sliders },
            { id: 'account', label: 'Account', icon: Settings },
            { id: 'notifications', label: 'Notification Preferences', icon: Bell },
            { id: 'security', label: 'Security & 2FA', icon: Lock },
            { id: 'appearance', label: 'Appearance', icon: Palette },
          ] as { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-forest-700 text-forest-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Platform Settings */}
        {activeTab === 'platform' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Agri-Commerce Platform Parameters
              </h2>
              <p className="text-xs text-slate-500">
                These settings directly regulate grower economics, delivery rules, and order fulfillment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Platform Commission Rate (%)
                </label>
                <input
                  type="number"
                  value={platformSettings.platformCommissionPercent}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      platformCommissionPercent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Fixed platform governance & quality maintenance percentage
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Farmer Direct Share Target (%)
                </label>
                <input
                  type="number"
                  disabled
                  value={platformSettings.farmerDirectSharePercent}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-bold"
                />
                <span className="text-[10px] text-emerald-700 mt-1 block font-semibold">
                  Locked by platform constitution to strictly guarantee 75% minimum
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Free Delivery Threshold (₹ INR)
                </label>
                <input
                  type="number"
                  value={platformSettings.freeDeliveryThreshold}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      freeDeliveryThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Orders equal or above this amount receive free delivery
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Standard Delivery Fee (₹ INR)
                </label>
                <input
                  type="number"
                  value={platformSettings.standardDeliveryFee}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      standardDeliveryFee: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Hyperlocal electric delivery fleet charge
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Max Hyperlocal Delivery Radius (km)
                </label>
                <input
                  type="number"
                  value={platformSettings.maxDeliveryRadiusKm}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      maxDeliveryRadiusKm: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Radial distance from rural agricultural hubs into urban sectors
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Weekly Farmer Payout Day
                </label>
                <select
                  value={platformSettings.weeklyPayoutDay}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      weeklyPayoutDay: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 cursor-pointer"
                >
                  <option value="Monday">Monday Morning</option>
                  <option value="Wednesday">Wednesday Midweek</option>
                  <option value="Friday">Friday Settlement</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Scheduled automated bank batch transfer run
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Account Settings */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Governance Account Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profileSettings.name}
                  onChange={(e) => setProfileSettings({ ...profileSettings, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={profileSettings.email}
                  disabled
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Phone</label>
                <input
                  type="text"
                  value={profileSettings.phone}
                  onChange={(e) => setProfileSettings({ ...profileSettings, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Governance Department</label>
                <input
                  type="text"
                  value={profileSettings.department}
                  onChange={(e) =>
                    setProfileSettings({ ...profileSettings, department: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Notification Preferences */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Dispatch & Verification Alert Channels
              </h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    Real-time SMS Alerts on New Farmer Registrations
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Receive urgent SMS ping when a new Pahani RTC record is queued.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={platformSettings.smsNotificationsEnabled}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      smsNotificationsEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-forest-700 rounded-sm focus:ring-forest-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    Daily Payout & Financial Reconciliation Email
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Daily 6:00 PM summary of 75% farmer direct credits and bank settlements.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={platformSettings.emailAlertsEnabled}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      emailAlertsEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-forest-700 rounded-sm focus:ring-forest-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: Security & 2FA */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Security & Two-Factor Authentication
              </h2>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-emerald-950">
                  Two-Factor Authentication (2FA) is Active
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  Hardware token and SMS OTP required for payout execution and farmer approvals.
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                ENFORCED
              </span>
            </div>
          </div>
        )}

        {/* TAB 5: Appearance */}
        {activeTab === 'appearance' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Governance Dashboard Appearance
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl border-2 border-forest-600 bg-forest-50/30 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">Krishi Classic Earth</div>
                  <div className="text-[11px] text-slate-500">Emerald forest & sand palette</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-forest-700" />
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-700">Dark Ops Center</div>
                  <div className="text-[11px] text-slate-400">High-contrast night telemetry</div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Preview</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-600 active:bg-forest-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Governance Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
