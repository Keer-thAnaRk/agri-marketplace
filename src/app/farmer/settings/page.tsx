'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarmer } from '@/context/FarmerContext';
import { api, getAuthToken } from '@/lib/api';
import {
  User,
  Bell,
  Lock,
  Globe,
  Sliders,
  LogOut,
  Save,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function FarmerSettingsPage() {
  const router = useRouter();
  const { farmerProfile, updateProfile, logout, showToast } = useFarmer();

  const [activeTab, setActiveTab] = useState<
    'account' | 'notifications' | 'security' | 'preferences' | 'language'
  >('account');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Account State
  const [name, setName] = useState(farmerProfile.name);
  const [email, setEmail] = useState(farmerProfile.email);
  const [phone, setPhone] = useState(farmerProfile.phone);

  // Notifications State
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [inventoryWarnings, setInventoryWarnings] = useState(true);
  const [marketingEmail, setMarketingEmail] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  // Preferences State
  const [currency, setCurrency] = useState('INR (₹)');
  const [payoutSchedule, setPayoutSchedule] = useState('Weekly (Every Friday)');
  const [autoPauseLowStock, setAutoPauseLowStock] = useState(true);

  // Language State
  const [language, setLanguage] = useState('English');

  // Load settings on mount from PostgreSQL
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.getFarmerSettings(token)
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.account) {
            if (d.account.name) setName(d.account.name);
            if (d.account.email) setEmail(d.account.email);
            if (d.account.phone) setPhone(d.account.phone);
          }
          if (d.notifications) {
            setOrderAlerts(d.notifications.orderAlerts);
            setSmsAlerts(d.notifications.smsAlerts);
            setInventoryWarnings(d.notifications.inventoryWarnings);
            setMarketingEmail(d.notifications.marketingEmail);
          }
          if (d.security) {
            setTwoFactorAuth(d.security.twoFactorAuth);
          }
          if (d.preferences) {
            if (d.preferences.currency) setCurrency(d.preferences.currency);
            if (d.preferences.payoutSchedule) setPayoutSchedule(d.preferences.payoutSchedule);
            if (typeof d.preferences.autoPauseLowStock === 'boolean') {
              setAutoPauseLowStock(d.preferences.autoPauseLowStock);
            }
          }
          if (d.language) {
            setLanguage(d.language);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load settings from server, using local fallback:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);
    const token = getAuthToken();
    try {
      if (token) {
        const res = await api.updateFarmerSettings({ account: { name, phone } }, token);
        if (!res.success) {
          throw new Error(res.message || 'Failed to update account.');
        }
      }
      await updateProfile({ name, phone });
      showToast('Account information updated successfully.', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update account.');
      showToast(err.message || 'Failed to update account.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setErrorMessage(null);
    setIsSaving(true);
    const token = getAuthToken();
    try {
      if (token) {
        const res = await api.updateFarmerSettings(
          {
            notifications: {
              orderAlerts,
              smsAlerts,
              inventoryWarnings,
              marketingEmail,
            },
          },
          token
        );
        if (!res.success) throw new Error(res.message || 'Failed to save notifications.');
      }
      showToast('Notification preferences saved successfully.', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save notifications.');
      showToast(err.message || 'Failed to save notifications.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const token = getAuthToken();
    if (!token) {
      showToast('Authentication required.', 'error');
      return;
    }

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      showToast('Please enter your current password.', 'error');
      return;
    }

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      showToast('Please enter a new password.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('New password cannot be identical to current password.');
      showToast('New password cannot be identical to current password.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Password change
      const passRes = await api.changeFarmerPassword(
        { currentPassword, newPassword },
        token
      );
      if (!passRes.success) {
        throw new Error(passRes.message || 'Password update failed.');
      }

      // 2. Also persist 2FA preference
      await api.updateFarmerSettings(
        { security: { twoFactorAuth } },
        token
      );

      setCurrentPassword('');
      setNewPassword('');
      showToast('Security settings and password updated.', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setErrorMessage(null);
    setIsSaving(true);
    const token = getAuthToken();
    try {
      if (token) {
        const res = await api.updateFarmerSettings(
          {
            preferences: {
              payoutSchedule,
              autoPauseLowStock,
            },
          },
          token
        );
        if (!res.success) throw new Error(res.message || 'Failed to save preferences.');
      }
      showToast('Operational preferences saved successfully.', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save preferences.');
      showToast(err.message || 'Failed to save preferences.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectLanguage = async (selectedLang: string, nativeName: string) => {
    setLanguage(selectedLang);
    const token = getAuthToken();
    if (token) {
      try {
        await api.updateFarmerSettings({ language: selectedLang }, token);
      } catch (err) {
        console.warn('Could not persist language to server:', err);
      }
    }
    showToast(`Language set to ${selectedLang} (${nativeName})`, 'info');
  };

  const handleLogout = () => {
    logout();
    router.push('/farmer/login');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'language', label: 'Language', icon: Globe },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-earth-200/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your account credentials, payout schedules, notifications, and security protocols
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Tabs (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-earth-200/80 p-3 shadow-xs space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  active
                    ? 'bg-forest-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-forest-50 hover:text-forest-950'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-earth-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout from Farmer Portal</span>
            </button>
          </div>
        </div>

        {/* Right Settings Panel (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Account */}
          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Personal & Farm Account Details
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Update primary contact and farm identification
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3.5 py-2.5 bg-earth-100 border border-earth-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                    title="Email is your primary login credential and cannot be changed here."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Saving...' : 'Save Account Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Alerts & Notification Channels
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Configure real-time SMS, WhatsApp, and email alerts for harvest operations
                </p>
              </div>

              <div className="space-y-4 divide-y divide-earth-100">
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">New Order Confirmations</div>
                    <div className="text-[11px] text-slate-500">
                      Receive immediate instant push when consumers place morning harvest orders
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={orderAlerts}
                    onChange={(e) => setOrderAlerts(e.target.checked)}
                    className="w-5 h-5 accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">SMS / WhatsApp Dispatch Alerts</div>
                    <div className="text-[11px] text-slate-500">
                      Send morning SMS when delivery rider arrives at your farm gate
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="w-5 h-5 accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Low Stock Automated Triggers</div>
                    <div className="text-[11px] text-slate-500">
                      Alert when inventory falls below your configured threshold
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={inventoryWarnings}
                    onChange={(e) => setInventoryWarnings(e.target.checked)}
                    className="w-5 h-5 accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Platform Agri News & Crop Demand Tips</div>
                    <div className="text-[11px] text-slate-500">
                      Weekly Bengaluru market rate forecasts and organic input recommendations
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={marketingEmail}
                    onChange={(e) => setMarketingEmail(e.target.checked)}
                    className="w-5 h-5 accent-forest-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Security & Authentication
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Protect your grower payouts and marketplace account
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    <div>
                      <div className="font-bold text-slate-900">Two-Factor Authentication (2FA)</div>
                      <div className="text-[11px] text-slate-500">
                        Require SMS OTP when updating bank details or changing price
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={twoFactorAuth}
                    onChange={(e) => setTwoFactorAuth(e.target.checked)}
                    className="w-5 h-5 accent-forest-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Farm Operations Preferences
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Set default units, automated pause behavior, and direct bank settlement frequencies
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Settlement Currency</label>
                  <input
                    type="text"
                    disabled
                    value={currency}
                    className="w-full px-3.5 py-2.5 bg-earth-100 border border-earth-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Direct Bank Payout Frequency</label>
                  <select
                    value={payoutSchedule}
                    onChange={(e) => setPayoutSchedule(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
                  >
                    <option value="Weekly (Every Friday)">Weekly (Every Friday) — Recommended</option>
                    <option value="Bi-weekly (1st & 15th)">Bi-weekly (1st & 15th of month)</option>
                    <option value="Monthly Direct Deposit">Monthly Direct Deposit</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3.5 bg-earth-50 rounded-2xl border border-earth-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPauseLowStock}
                      onChange={(e) => setAutoPauseLowStock(e.target.checked)}
                      className="w-4 h-4 accent-forest-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Auto-pause produce when stock hits zero
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Prevents consumers from ordering depleted harvest batches
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: Language */}
          {activeTab === 'language' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Language & Regional Localization
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Select your preferred language for the Farmer Portal
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'en', name: 'English', native: 'English', active: language === 'English' },
                  { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', active: language === 'Kannada' },
                  { id: 'te', name: 'Telugu', native: 'తెలుగు', active: language === 'Telugu' },
                  { id: 'ta', name: 'Tamil', native: 'தமிழ்', active: language === 'Tamil' },
                  { id: 'hi', name: 'Hindi', native: 'हिन्दी', active: language === 'Hindi' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.name, lang.native)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      lang.name === language
                        ? 'border-forest-700 bg-forest-50/60 ring-2 ring-forest-500/20'
                        : 'border-earth-200 bg-white hover:bg-earth-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{lang.name}</div>
                      <div className="text-slate-500 text-[11px]">{lang.native}</div>
                    </div>
                    {lang.name === language && (
                      <CheckCircle2 className="w-5 h-5 text-forest-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
