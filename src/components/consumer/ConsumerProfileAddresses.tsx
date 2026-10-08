'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Home,
  Star,
  X,
  ShieldCheck,
  Phone,
  User,
  Mail,
  Building,
} from 'lucide-react';

interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  hub: string;
  isDefault: boolean;
}

export function ConsumerProfileAddresses() {
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Address modal/form states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    addressLine: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    hub: 'East Hub',
    isDefault: false,
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);

  // Load real profile and addresses from PostgreSQL
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getConsumerProfile();
      if (res.success && res.data) {
        setName(res.data.name || '');
        setPhone(res.data.phone || '');
        setEmail(res.data.email || '');
        setAddresses(res.data.consumerAddresses || []);
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    try {
      setProfileSaving(true);
      const res = await api.updateConsumerProfile({ name, phone });
      if (res.success && res.data) {
        updateUser({ name: res.data.name, phone: res.data.phone || '' });
        setMessage({ type: 'success', text: 'Profile updated successfully in PostgreSQL!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      name: name || user?.name || '',
      phone: phone || user?.phone || '',
      addressLine: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      hub: 'East Hub',
      isDefault: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const handleOpenEditModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      hub: addr.hub,
      isDefault: addr.isDefault,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!addressForm.name.trim() || !addressForm.phone.trim() || !addressForm.addressLine.trim() || !addressForm.pincode.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required address fields.' });
      return;
    }

    try {
      setAddressSubmitting(true);
      if (editingAddressId) {
        await api.updateConsumerAddress(editingAddressId, addressForm);
        setMessage({ type: 'success', text: 'Delivery address updated successfully.' });
      } else {
        await api.createConsumerAddress(addressForm);
        setMessage({ type: 'success', text: 'Delivery address created successfully.' });
      }
      setShowAddressModal(false);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save address.' });
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      await api.deleteConsumerAddress(id);
      setMessage({ type: 'success', text: 'Address removed successfully.' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete address.' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.setDefaultConsumerAddress(id);
      setMessage({ type: 'success', text: 'Default delivery address updated.' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to set default address.' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-earth-200 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-forest-700 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading profile and saved addresses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification Alert */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-earth-100">
          <div>
            <h2 className="font-bold text-xl text-slate-900 font-serif">Account Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal contact details registered with Krishi Market PostgreSQL
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 text-forest-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
            <span>Active Consumer</span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address (Verified)</span>
              </label>
              <input
                type="email"
                readOnly
                value={email}
                className="w-full p-2.5 bg-slate-100/70 border border-slate-200 text-slate-500 rounded-xl text-xs sm:text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Address Management Section */}
      <div className="bg-white rounded-3xl border border-earth-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-earth-100">
          <div>
            <h2 className="font-bold text-xl text-slate-900 font-serif">Saved Delivery Addresses</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hyperlocal drop points for morning farm-to-table deliveries
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-earth-50/50 border border-dashed border-earth-200 p-6">
            <MapPin className="w-10 h-10 text-earth-400 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-slate-800">No delivery addresses found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your home or office address to receive dawn harvest deliveries from local growers.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-forest-800 text-white text-xs font-bold hover:bg-forest-900 cursor-pointer"
            >
              Add First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-2xl border transition-all ${
                  addr.isDefault
                    ? 'border-emerald-500/80 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/30'
                    : 'border-earth-200 bg-white hover:border-earth-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{addr.name}</h4>
                      <p className="text-[11px] text-slate-500">{addr.phone}</p>
                    </div>
                  </div>

                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                      <span>Primary Default</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-forest-800 hover:underline cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 mb-4">
                  <p className="font-medium text-slate-800">{addr.addressLine}</p>
                  <p>
                    {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.pincode}</span>
                  </p>
                  <div className="pt-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-earth-100 text-earth-800 text-[10px] font-medium">
                      Hub: {addr.hub}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-earth-100/80">
                  <button
                    onClick={() => handleOpenEditModal(addr)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-forest-800 hover:bg-earth-100 transition-colors cursor-pointer"
                    title="Edit address"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-earth-200 max-w-lg w-full p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-earth-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 font-serif">
                  {editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-earth-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address Line (Flat / Building / Street) *</label>
                <input
                  type="text"
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  placeholder="Apt 4B, Greenwood Regency, Koramangala"
                  className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    placeholder="560034"
                    className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hyperlocal Hub Area</label>
                <input
                  type="text"
                  value={addressForm.hub}
                  onChange={(e) => setAddressForm({ ...addressForm, hub: e.target.value })}
                  placeholder="e.g. Koramangala Hub"
                  className="w-full p-2.5 bg-earth-50/60 border border-earth-200 rounded-xl"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded accent-forest-700"
                  />
                  <span>Set as primary default delivery address</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-earth-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {addressSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
