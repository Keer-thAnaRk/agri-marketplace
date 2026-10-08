'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminProductRecord } from '@/data/admin';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Sprout,
  ShieldCheck,
  Tag,
  QrCode,
  Percent,
  ExternalLink,
  MapPin,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Boxes,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80';

export default function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.productId;

  const [product, setProduct] = useState<AdminProductRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    setStatusMessage(null);
    try {
      const res = await api.updateAdminProductStatus(productId, newStatus);
      if (res.success && res.data) {
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                status: res.data.status,
                stock: res.data.stock,
                inventoryStatus: res.data.inventoryStatus,
              }
            : null
        );
        setStatusMessage({
          type: 'success',
          text: `Product status successfully updated to ${newStatus.replace(/_/g, ' ')} in PostgreSQL.`,
        });
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update product status.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    api
      .getAdminProductById(productId)
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          setProduct(res.data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Unable to load product details.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [productId, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="w-32 h-3 bg-slate-200 rounded" />
            <div className="w-64 h-6 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-forest-600" />
          <span className="text-xs font-medium">Loading produce audit details from PostgreSQL...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Product Not Found</h1>
        </div>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{error || 'The requested product could not be found in the database.'}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setRefreshTrigger((prev) => prev + 1);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Retry
            </button>
            <Link
              href="/admin/products"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage =
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : FALLBACK_IMAGE;

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Produce Quality Audit
              </span>
              <span className="font-mono text-[11px] text-slate-500">ID: {product.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              {product.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-2">
              Moderation:
            </span>
            <select
              value={product.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs focus:ring-2 focus:ring-forest-600 cursor-pointer disabled:opacity-50"
            >
              <option value="ACTIVE">ACTIVE (In Market)</option>
              <option value="OUT_OF_STOCK">OUT OF STOCK</option>
              <option value="DRAFT">DRAFT (Unpublished)</option>
              <option value="EXPIRED">EXPIRED (Archived)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            disabled={isLoading || isUpdatingStatus}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isUpdatingStatus ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href={`/products/${product.id}`}
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <span>Live Consumer View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feedback Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 Cols): Product Info, Pricing & Inventory, Harvest & Traceability */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Product Information */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sprout className="w-4 h-4 text-forest-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Produce Information
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                <Image
                  src={primaryImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>

              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md">
                    {product.category}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">{product.name}</h3>
                  <p className="text-xs text-slate-500">Unit: {product.unit}</p>
                </div>

                {product.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {product.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cultivation: {product.farmingMethod}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200/60">
                    Freshness Index: {product.freshnessScore}%
                  </span>
                  {product.shelfLifeDays && (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 font-semibold border border-amber-200/60 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Shelf Life: {product.shelfLifeDays} Days</span>
                    </span>
                  )}
                </div>

                {product.nutritionHighlights && product.nutritionHighlights.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      Nutrition Highlights:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.nutritionHighlights.map((n, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-medium"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Tag className="w-4 h-4 text-forest-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Pricing & Live Inventory
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Consumer Price
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">
                  ₹{product.price}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">per {product.unit}</span>
              </div>

              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Farmer Net (75%)
                </span>
                <span className="text-xl font-black text-emerald-800 mt-0.5 block">
                  ₹{(product.price * 0.75).toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Direct credit</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Platform Fee (25%)
                </span>
                <span className="text-xl font-black text-slate-700 mt-0.5 block">
                  ₹{(product.price * 0.25).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">Logistics & governance</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Available Stock
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">
                  {product.stock}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">units ready</span>
              </div>
            </div>

            {/* Detailed PostgreSQL Inventory Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Boxes className="w-3.5 h-3.5 text-slate-500" />
                <span>InventoryItem Status & Stock Counts</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Total Stock</span>
                  <span className="font-bold text-slate-900">
                    {product.currentStock ?? product.stock} {product.unit}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Reserved Qty</span>
                  <span className="font-bold text-slate-900">
                    {product.reservedQuantity ?? 0} {product.unit}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Sold Qty</span>
                  <span className="font-bold text-slate-900">
                    {product.soldQuantity ?? 0} {product.unit}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Low Stock Alert</span>
                  <span className="font-bold text-slate-900">
                    {product.lowStockThreshold ?? 10} {product.unit}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  Inventory Item Source:{' '}
                  <span className="font-medium text-slate-700">
                    {product.inventoryExists ? 'PostgreSQL InventoryItem Record' : 'Direct Product Summary'}
                  </span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    product.inventoryStatus === 'IN_STOCK'
                      ? 'bg-emerald-50 text-emerald-800'
                      : product.inventoryStatus === 'LOW_STOCK'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {product.inventoryStatus || (product.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Harvest, Freshness & QR Traceability */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-forest-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                  Harvest Batch & QR Traceability
                </h2>
              </div>
              <span className="text-xs font-bold text-forest-700 font-mono">
                {product.harvestBatchId || 'NO-BATCH-LINKED'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Harvest Date:</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {product.harvestDate || 'Fresh Farm Harvest'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {product.harvestBatchId ? 'Verified from Harvest Batch' : 'Calculated harvest reference'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Freshness Score:</span>
                </div>
                <div className="font-bold text-emerald-700 text-sm">
                  {product.freshnessScore}% Peak Grade
                </div>
                <div className="text-[10px] text-emerald-600">Calculated via farm sensor & slot telemetry</div>
              </div>
            </div>

            {/* Trace link */}
            {product.traceUrl ? (
              <div className="p-3 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-between">
                <div className="text-xs text-forest-900 font-medium">
                  Public provenance ledger verified for this batch.
                </div>
                <Link
                  href={product.traceUrl}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                >
                  <span>Open Trace QR</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                No active public QR trace batch currently registered for this product.
              </div>
            )}
          </div>

          {/* Section 4: Surplus Engine Information */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Percent className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Surplus Engine Status
              </h2>
            </div>

            {product.isSurplus ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-900">
                    Active Surplus Deal ({product.surplusDiscount}% Discount)
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Discounted to prevent harvest food waste. Listed on public surplus hub.
                  </div>
                </div>
                <span className="font-mono text-sm font-extrabold text-amber-900">
                  ₹{(product.price * (1 - (product.surplusDiscount || 0) / 100)).toFixed(1)} / {product.unit}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                This item is not currently listed on the dynamic surplus discount radar.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (4 Cols): Farmer Information */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Producer Origin
              </span>
              <h2 className="text-base font-bold text-slate-900 font-serif">Grower Information</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Grower Name</span>
                <span className="font-bold text-slate-900 text-sm">{product.farmerName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Farm Name</span>
                <span className="font-semibold text-slate-800">{product.farmName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="text-slate-700 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{product.location}</span>
                </span>
              </div>

              {product.farmerVerificationStatus && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Verification Status</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                      product.farmerVerificationStatus === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : product.farmerVerificationStatus === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {product.farmerVerificationStatus}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <Link
                  href={`/admin/farmers/${product.farmerId}`}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>View Farmer Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
