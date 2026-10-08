'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMarketplace } from '@/context/MarketplaceContext';
import { DELIVERY_SLOTS } from '@/data/mockData';
import { DeliveryAddress, DeliverySlot } from '@/types';
import { api, getAuthToken } from '@/lib/api';
import {
  MapPin,
  Clock,
  CreditCard,
  CheckCircle2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Banknote,
  AlertCircle,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    subtotal,
    deliveryFee,
    platformFee,
    total,
    activeLocation,
    placeOrder,
  } = useMarketplace();

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('custom');
  const [address, setAddress] = useState<DeliveryAddress>({
    id: 'addr-custom',
    name: 'Ananya Sharma',
    phone: '+91 98451 99012',
    addressLine: 'Apt 402, Green Glen Layout, Outer Ring Road, Bellandur',
    city: 'Bengaluru',
    pincode: activeLocation.pincode || '560102',
    hub: activeLocation.area || 'HSR Layout',
  });

  // Slot State
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot>(DELIVERY_SLOTS[0]);

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash on Delivery'>('UPI');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved addresses for authenticated consumer
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getConsumerAddresses(token)
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setSavedAddresses(res.data);
            const defaultAddr = res.data.find((a: any) => a.isDefault) || res.data[0];
            setSelectedAddressId(defaultAddr.id);
            setAddress({
              id: defaultAddr.id,
              name: defaultAddr.name,
              phone: defaultAddr.phone,
              addressLine: defaultAddr.addressLine,
              city: defaultAddr.city,
              pincode: defaultAddr.pincode,
              hub: defaultAddr.hub,
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSelectSavedAddress = (saved: any) => {
    setSelectedAddressId(saved.id);
    setAddress({
      id: saved.id,
      name: saved.name,
      phone: saved.phone,
      addressLine: saved.addressLine,
      city: saved.city,
      pincode: saved.pincode,
      hub: saved.hub,
    });
  };

  const handleNewAddressSelect = () => {
    setSelectedAddressId('custom');
    setAddress({
      id: 'addr-custom',
      name: '',
      phone: '',
      addressLine: '',
      city: 'Bengaluru',
      pincode: activeLocation.pincode || '560102',
      hub: activeLocation.area || 'HSR Layout',
    });
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Your basket is empty</h2>
        <p className="text-sm text-slate-600">Please add farm-fresh produce to your basket before checkout.</p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 px-6 py-3 bg-forest-800 text-white rounded-xl font-semibold text-sm"
        >
          <span>Browse Marketplace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPlacing(true);

    try {
      const targetAddress = selectedAddressId === 'custom'
        ? { ...address, id: 'addr-custom' }
        : address;

      const newOrder = await placeOrder(targetAddress, selectedSlot, paymentMethod);
      setIsPlacing(false);
      router.push(`/orders/${newOrder.id}`);
    } catch (err: any) {
      setIsPlacing(false);
      setErrorMessage(err.message || 'Failed to place order. Please check your inventory or address details.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center gap-4 pb-6 border-b border-earth-200 mb-8">
        <Link
          href="/cart"
          className="p-2 rounded-xl border border-earth-200 hover:bg-earth-100 transition-colors text-slate-600"
          aria-label="Back to basket"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Checkout & Farm Delivery
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete your order directly with local Bengaluru growers
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <div className="font-bold">Checkout Warning</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Address, Slot, Payment (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* SECTION 1: DELIVERY ADDRESS */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
                <MapPin className="w-4 h-4" />
                <span>Step 1: Delivery Address (Bengaluru)</span>
              </div>
              {savedAddresses.length > 0 && selectedAddressId !== 'custom' && (
                <button
                  type="button"
                  onClick={handleNewAddressSelect}
                  className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 hover:text-forest-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use Another Address</span>
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {savedAddresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {savedAddresses.map((sa) => {
                  const isSelected = selectedAddressId === sa.id;
                  return (
                    <div
                      key={sa.id}
                      onClick={() => handleSelectSavedAddress(sa)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-forest-700 bg-forest-50/60 shadow-xs ring-1 ring-forest-700/20'
                          : 'border-earth-200 bg-white hover:border-earth-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{sa.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-forest-700" />}
                      </div>
                      <div className="text-[11px] text-slate-500 mb-1">{sa.phone}</div>
                      <p className="text-xs text-slate-700 leading-snug line-clamp-2">{sa.addressLine}</p>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {sa.city} – {sa.pincode}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Address Form (if custom address or no saved addresses) */}
            {(selectedAddressId === 'custom' || savedAddresses.length === 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    placeholder="e.g. Ananya Sharma"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Phone Number (For OTP & Rider Delivery) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    placeholder="+91 98450 00000"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Complete Flat, Apartment, Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.addressLine}
                    onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    placeholder="Apartment name, Flat number, Building, Street"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Bengaluru, Karnataka"
                    className="w-full px-3.5 py-2.5 bg-earth-100 border border-earth-200 rounded-xl text-sm text-slate-600 cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-earth-50 border border-earth-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
                    placeholder="560102"
                  />
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: DELIVERY SLOT */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
              <Clock className="w-4 h-4" />
              <span>Step 2: Choose Delivery Slot</span>
            </div>
            <p className="text-xs text-slate-500">
              Crops are harvested shortly before each delivery window to preserve nutrient density and crispness.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {DELIVERY_SLOTS.map((slot) => {
                const isSelected = selectedSlot.id === slot.id;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-forest-700 bg-forest-50/70 shadow-xs ring-1 ring-forest-700/20'
                        : 'border-earth-200 bg-white hover:border-earth-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-900">{slot.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-forest-700" />
                      )}
                    </div>
                    <div className="text-sm font-bold text-forest-900 mb-1">{slot.timeRange}</div>
                    <p className="text-[11px] text-slate-500 leading-snug">{slot.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: PAYMENT METHOD */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-earth-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700">
                <CreditCard className="w-4 h-4" />
                <span>Step 3: Payment Method</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-forest-700 bg-forest-50/60 shadow-xs font-bold ring-1 ring-forest-700/20'
                    : 'border-earth-200 hover:border-earth-300 font-medium'
                }`}
              >
                <Smartphone className="w-5 h-5 text-forest-700 mb-2" />
                <div className="text-sm text-slate-900">UPI Instant</div>
                <div className="text-[11px] text-slate-500">GPay, PhonePe, Paytm</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === 'Card'
                    ? 'border-forest-700 bg-forest-50/60 shadow-xs font-bold ring-1 ring-forest-700/20'
                    : 'border-earth-200 hover:border-earth-300 font-medium'
                }`}
              >
                <CreditCard className="w-5 h-5 text-forest-700 mb-2" />
                <div className="text-sm text-slate-900">Card / NetBanking</div>
                <div className="text-[11px] text-slate-500">Visa, Mastercard, RuPay</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Cash on Delivery')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-forest-700 bg-forest-50/60 shadow-xs font-bold ring-1 ring-forest-700/20'
                    : 'border-earth-200 hover:border-earth-300 font-medium'
                }`}
              >
                <Banknote className="w-5 h-5 text-forest-700 mb-2" />
                <div className="text-sm text-slate-900">Pay on Handover</div>
                <div className="text-[11px] text-slate-500">Cash or UPI at doorstep</div>
              </button>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 space-y-2 text-xs">
                <div className="font-semibold text-slate-800">Select preferred UPI handler:</div>
                <div className="flex gap-2">
                  {(['gpay', 'phonepe', 'paytm'] as const).map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setUpiApp(app)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize ${
                        upiApp === app
                          ? 'bg-forest-800 text-white border-forest-800'
                          : 'bg-white border-earth-300 text-slate-700'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right: Order Summary Sidebar (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-earth-200 shadow-xs space-y-5 sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-earth-100">
            Order Review ({cart.length} produce {cart.length === 1 ? 'type' : 'types'})
          </h2>

          <div className="max-h-60 overflow-y-auto divide-y divide-earth-100 pr-1 space-y-2">
            {cart.map((item) => (
              <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-earth-200 bg-earth-50">
                    <Image
                      src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80'}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block truncate">{item.product.name}</span>
                    <span className="text-[11px] text-forest-700 block truncate font-medium">
                      {item.product.farmName || item.product.farmerName || 'Local Farm'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.quantity} {item.product.unit || 'kg'} × ₹{item.product.price}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-slate-900 shrink-0">
                  ₹{item.product.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-earth-100">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="font-bold text-slate-900">
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Fee (10%)</span>
              <span className="font-bold text-slate-900">₹{platformFee}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-forest-950 pt-2 border-t border-earth-200">
              <span>Total Payable</span>
              <span className="text-xl text-forest-950">₹{total}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPlacing}
            className="w-full py-4 px-6 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-forest-800/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {isPlacing ? (
              <span>Placing Order with Farmers...</span>
            ) : (
              <>
                <span>Place Order (₹{total})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            By placing order, you agree to receive SMS/WhatsApp updates and contactless delivery confirmation.
          </p>
        </div>
      </form>
    </div>
  );
}
