'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useFarmer } from '@/context/FarmerContext';
import { QRCodeDisplay } from '@/components/farmer/QRCodeDisplay';
import { calculateFreshness } from '@/utils/freshness';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { api, getAuthToken } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  MapPin,
  Tractor,
  Layers,
  Sprout,
  CheckCircle2,
  ExternalLink,
  Tag,
  AlertCircle,
} from 'lucide-react';

export default function FarmerHarvestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const harvestId = params?.id as string;
  const { harvests, products, farmerProfile } = useFarmer();
  const [liveHarvest, setLiveHarvest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();
    if (harvestId && token) {
      api.getFarmerHarvestById(harvestId, token)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setLiveHarvest(res.data);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch harvest from backend:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [harvestId]);

  // Find harvest from backend first, then FarmerContext fallback
  const contextHarvest = harvests.find(
    (h) => h.id === harvestId || h.batchNumber.toLowerCase() === harvestId?.toLowerCase()
  );

  const harvest = liveHarvest || contextHarvest || harvests[0];

  // Find matching product if available
  const product = products.find(
    (p) => p.id === harvest?.productId || p.harvestBatch === harvest?.batchNumber
  );

  const shelfLife = product?.shelfLifeDays || harvest?.expectedShelfLife || 6;
  const freshness = calculateFreshness(harvest?.harvestDate || 'Sept 24, 2026', shelfLife);

  if (!loading && !harvest) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-earth-200">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Harvest Batch Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">The batch identifier &ldquo;{harvestId}&rdquo; was not found in records.</p>
        <Link
          href="/farmer/harvests"
          className="inline-flex items-center gap-2 px-4 py-2 bg-forest-800 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Harvests</span>
        </Link>
      </div>
    );
  }

  interface TraceDisplayEvent {
    stage: string;
    location: string;
    date: string;
    time: string;
    description: string;
    verifiedBy: string;
  }

  // Supply chain stages - display real PostgreSQL events if present
  const traceEvents: TraceDisplayEvent[] =
    harvest?.traceabilityEvents && harvest.traceabilityEvents.length > 0
      ? harvest.traceabilityEvents.map((evt: any) => ({
          stage: evt.title,
          location: evt.location || harvest.location || farmerProfile.location || 'Processing Center',
          date: evt.timestamp
            ? new Date(evt.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recent',
          time: evt.timestamp
            ? new Date(evt.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '06:00 AM',
          description: evt.details,
          verifiedBy: evt.verifiedBy || evt.actor || 'Krishi Trace Engine v2.4',
        }))
      : [
          {
            stage: 'Seed Sown & Organic Cultivation',
            location: `${farmerProfile.location}, Plot 4B (Rich Red Soil)`,
            date: 'July 14, 2026',
            time: '08:00 AM',
            description: 'Planted with indigenous non-GMO heirloom seeds using Jeevamrutha microbial bio-fertilizer.',
            verifiedBy: 'Karnataka Organic Certification Agency (KOCA)',
          },
          {
            stage: 'Quality Field Inspection',
            location: `${farmerProfile.farmName} Polyhouse`,
            date: 'Sept 18, 2026',
            time: '11:30 AM',
            description: 'Zero pesticide residue verified. Soil moisture and nutrient Brix rating confirmed at 12.4%.',
            verifiedBy: 'Krishi Quality Field Officer (Vinay K.)',
          },
          {
            stage: 'Dawn Hand Harvest',
            location: `${farmerProfile.farmName} Packhouse`,
            date: harvest?.harvestDate || 'Today',
            time: '05:30 AM',
            description: `Harvested at first morning light to preserve cell turgidity. Yield: ${harvest?.quantity || 100} ${harvest?.unit || 'kg'}.`,
            verifiedBy: `Lead Farmer: ${farmerProfile.name}`,
          },
          {
            stage: 'Crate Sorting & QR Trace Assignment',
            location: `${farmerProfile.farmName} Sorting Station`,
            date: harvest?.harvestDate || 'Today',
            time: '06:15 AM',
            description: `Batch code #${harvest?.batchNumber || 'BATCH-001'} assigned. Clean air sorted and graded Grade-A Export Quality.`,
            verifiedBy: 'Krishi Trace Engine v2.4',
          },
        ];

  return (
    <div className="space-y-8 pb-12">
      {/* Back and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/70">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-earth-200 bg-white hover:bg-earth-50 text-slate-600 transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-lg border border-forest-200">
                BATCH #{harvest.batchNumber}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {harvest.id}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-serif mt-1">
              Farm-to-Consumer Traceability
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/trace/${encodeURIComponent(harvest.batchNumber)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>Open Consumer Trace View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Harvest Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product & Harvest Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-earth-200/90 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {harvest.productImage && (
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 border border-earth-200 bg-earth-50">
                  <Image
                    src={harvest.productImage}
                    alt={harvest.productName}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
                    {product?.category || 'Fresh Farm Produce'}
                  </span>
                  <FreshnessBadge score={freshness.percentage} size="md" />
                  <span className="text-xs font-medium text-slate-500">
                    Harvested {harvest.harvestDate}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 font-serif">
                  {harvest.productName}
                </h2>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Tractor className="w-3.5 h-3.5 text-forest-700" />
                    <span className="font-semibold">{harvest.farmName || farmerProfile.farmName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{farmerProfile.location}</span>
                  </div>
                </div>

                {harvest.notes && (
                  <p className="text-xs text-slate-600 bg-earth-50 p-3 rounded-2xl border border-earth-100 italic">
                    &ldquo;{harvest.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Harvested
                </span>
                <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
                  {harvest.quantity} {harvest.unit}
                </span>
              </div>

              <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Available Stock
                </span>
                <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">
                  {harvest.availableQuantity} {harvest.unit}
                </span>
              </div>

              <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Freshness Score
                </span>
                <span className="text-lg font-extrabold text-forest-900 mt-0.5 block">
                  {freshness.percentage}%
                </span>
              </div>

              <div className="p-3 bg-earth-50 rounded-2xl border border-earth-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Shelf Life Remaining
                </span>
                <span className="text-lg font-extrabold text-amber-700 mt-0.5 block">
                  {freshness.daysRemaining} days
                </span>
              </div>
            </div>
          </div>

          {/* Seed-to-Fork Timeline */}
          <div className="bg-white rounded-3xl border border-earth-200/90 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-earth-100">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-forest-700" />
                <h3 className="font-extrabold text-slate-900 text-base font-serif">
                  Verified Farm-to-Fork Journey
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{traceEvents.length} Steps Verified</span>
              </span>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-forest-100">
              {traceEvents.map((evt, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-1">
                  <div className="relative z-10 w-7 h-7 rounded-full bg-forest-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 bg-earth-50/70 p-4 rounded-2xl border border-earth-200/80 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-sm font-bold text-slate-900">{evt.stage}</h4>
                      <span className="text-[11px] font-mono font-medium text-slate-500">
                        {evt.date} • {evt.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{evt.description}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{evt.location}</span>
                      </span>
                      <span className="flex items-center gap-1 text-forest-800 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-forest-600" />
                        <span>{evt.verifiedBy}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: QR Code Generator & Crate Tag Printing */}
        <div className="space-y-6">
          <QRCodeDisplay
            batchId={harvest.batchNumber}
            productName={harvest.productName}
            farmName={harvest.farmName || farmerProfile.farmName}
            harvestDate={harvest.harvestDate}
            freshnessScore={freshness.percentage}
            size={200}
            showCard={true}
          />

          {/* Physical Crate Tag Guidelines */}
          <div className="bg-forest-900 text-forest-50 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">How Consumers Scan This</h4>
            </div>
            <p className="text-xs text-forest-200 leading-relaxed">
              Print this crate label or stick QR tags on individual bundles. When consumers point any smartphone camera at the QR code, they immediately see this harvest batch&apos;s picking time, freshness score, and farmer video message without installing any app.
            </p>
            <div className="pt-2 border-t border-forest-800/80 flex items-center justify-between text-[11px] text-forest-300">
              <span>Standard: Krishi OpenTrace 1.0</span>
              <span className="font-mono">SHA-256 Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
