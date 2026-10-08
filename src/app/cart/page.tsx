'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/context/MarketplaceContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { PriceBreakdown } from '@/components/marketplace/PriceBreakdown';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartCount,
    subtotal,
    deliveryFee,
    platformFee,
    farmerEarnings,
    total,
  } = useMarketplace();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          type="cart"
          title="Your harvest basket is empty"
          description="Explore freshly picked produce directly from local verified farmers in Bengaluru."
          actionText="Browse Fresh Produce"
          actionHref="/explore"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between pb-6 border-b border-earth-200 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Your Harvest Basket
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {cartCount} {cartCount === 1 ? 'item' : 'items'} straight from verified Bengaluru farmers
          </p>
        </div>
        <Link
          href="/explore"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items List (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-earth-200/80 shadow-xs divide-y divide-earth-100 overflow-hidden">
            {cart.map((item) => {
              const itemTotal = item.product.price * item.quantity;
              return (
                <div
                  key={item.product.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  {/* Thumbnail & Name */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-earth-100 shrink-0 border border-earth-200">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-bold text-slate-900 text-sm sm:text-base hover:text-forest-800 line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <div className="text-xs text-slate-500">
                        Farmer:{' '}
                        <Link
                          href={`/farmers/${item.product.farmerId}`}
                          className="font-semibold text-forest-800 hover:underline"
                        >
                          {item.product.farmerName}
                        </Link>
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        ₹{item.product.price}{' '}
                        <span className="text-slate-400 font-normal">/ {item.product.unitShort}</span>
                      </div>

                      <div className="pt-0.5">
                        {item.product.inStock && item.product.availableQuantity >= item.quantity ? (
                          <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            In Stock ({item.product.availableQuantity} available)
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            {item.product.availableQuantity <= 0
                              ? 'Out of Stock'
                              : `Only ${item.product.availableQuantity} left in stock`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Item Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-earth-100">
                    {/* Quantity Stepper */}
                    <div className="inline-flex items-center border border-earth-200 rounded-xl bg-earth-50 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-slate-600 hover:bg-earth-200 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-slate-600 hover:bg-earth-200 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-forest-950">₹{itemTotal}</div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Social Impact Callout */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="font-bold">You&apos;re supporting local farmers with this order.</strong>{' '}
              By cutting industrial brokers, <strong>₹{farmerEarnings}</strong> goes straight to your local Bengaluru growers today.
            </div>
          </div>

          {/* Price Breakdown Component */}
          <PriceBreakdown totalAmount={subtotal} showTitle={true} compact={false} />
        </div>

        {/* Right: Order Summary (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-earth-200 shadow-xs space-y-5 sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 border-b border-earth-100 pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Produce Subtotal</span>
              <span className="font-bold text-slate-900">₹{subtotal}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Eco-Friendly Local Delivery</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  <span className="font-bold text-slate-900">₹{deliveryFee}</span>
                )}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                Platform & Quality Audit
                <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              </span>
              <span className="font-bold text-slate-900">₹{platformFee}</span>
            </div>

            {deliveryFee > 0 && (
              <p className="text-[11px] text-forest-700 bg-forest-50 p-2 rounded-lg font-medium">
                Add ₹{Math.max(0, 500 - subtotal)} more for FREE doorstep delivery!
              </p>
            )}

            <div className="pt-3 border-t border-earth-200 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Total Payable</span>
              <span className="text-2xl font-extrabold text-forest-950">₹{total}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full py-4 px-6 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-forest-800/20 transition-all cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              Safe Harvest Guarantee
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-forest-700" />
              Cold Chain Maintained
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
