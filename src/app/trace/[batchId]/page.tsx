'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { calculateFreshness } from '@/utils/freshness';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Tractor,
  Sprout,
  Heart,
  Share2,
  ExternalLink,
  Award,
  Sparkles,
  Droplet,
  Sun,
  ArrowRight,
  Info,
  ChevronRight,
  QrCode,
  AlertCircle,
  PackageCheck,
  Truck,
  RotateCw,
} from 'lucide-react';

interface TracePageProps {
  params: Promise<{ batchId: string }>;
}

export default function TraceConsumerPage({ params }: TracePageProps) {
  const resolvedParams = use(params);
  const rawBatchId = decodeURIComponent(resolvedParams.batchId);

  const [traceData, setTraceData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getPublicTrace(rawBatchId)
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setTraceData(res.data);
          } else {
            setError('Traceability record not found');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Traceability record not found');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawBatchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-earth-50/50 py-24 px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <RotateCw className="w-8 h-8 mx-auto text-forest-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          Retrieving authentic harvest provenance for #{rawBatchId}...
        </p>
      </div>
    );
  }

  if (error || !traceData) {
    return (
      <div className="min-h-screen bg-earth-50/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <EmptyState
            type="products"
            title="Traceability Record Not Found"
            description={`We could not find authenticated farm provenance for batch "${rawBatchId}". Please ensure the QR code or batch number is accurate.`}
            actionText="Return to Marketplace"
            actionHref="/explore"
          />
        </div>
      </div>
    );
  }

  const harvest = traceData;
  const farmer = traceData.farm || {
    id: traceData.farmerId,
    farmName: traceData.farmName,
    farmerName: traceData.farmerName,
    farmerAvatar: traceData.farmerAvatar,
    location: traceData.farmLocation,
    farmingMethod: traceData.farmingMethod,
  };

  const freshness = traceData.freshness || calculateFreshness(traceData.harvestDate, traceData.expectedShelfLifeDays || 6);
  const events = Array.isArray(traceData.traceabilityEvents) ? traceData.traceabilityEvents : [];

  const getStepIcon = (rawStep?: string) => {
    const s = String(rawStep || '').toUpperCase();
    if (s.includes('ORIGIN') || s.includes('SEED') || s.includes('FARM')) return Sprout;
    if (s.includes('HARVEST')) return Sun;
    if (s.includes('PACK')) return PackageCheck;
    if (s.includes('DISPATCH') || s.includes('SHIP')) return Truck;
    if (s.includes('DELIVER')) return CheckCircle2;
    return ShieldCheck;
  };

  return (
    <div className="min-h-screen bg-earth-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-forest-700 transition-colors">
              Krishi Market
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/explore" className="hover:text-forest-700 transition-colors">
              Marketplace
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-bold">Farm-to-Fork Traceability</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>100% Verified Farm Provenance</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl border border-earth-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-forest-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div className="space-y-3 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-forest-900 text-forest-50">
                  BATCH #{harvest.batchNumber}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  {harvest.farmingMethod || 'Organic Harvest'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif tracking-tight">
                {harvest.productName}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                You are viewing the authenticated agricultural provenance record for this harvest batch. Cultivated at{' '}
                <strong>{harvest.farmName}</strong> without synthetic chemicals and harvested for optimal nutrition.
              </p>
            </div>

            {/* Freshness Gauge Card */}
            <div className="bg-forest-950 text-white p-5 rounded-2xl border border-forest-800 text-center shrink-0 w-full md:w-auto shadow-md">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Freshness Score
              </div>
              <div className="text-4xl font-extrabold font-mono tracking-tight mt-1 text-white">
                {freshness.percentage}%
              </div>
              <div className="text-xs text-forest-200 font-semibold mt-1">
                Status: {freshness.status}
              </div>
              <div className="text-[11px] text-emerald-400 mt-2 font-mono">
                {freshness.daysRemaining} days remaining shelf life
              </div>
            </div>
          </div>
        </div>

        {/* Harvest Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-earth-200 p-4 space-y-1 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Harvest Date</div>
            <div className="text-base font-bold text-slate-900">{harvest.harvestDate}</div>
            <div className="text-xs text-slate-500">Pick Slot: Dawn sunrise</div>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-4 space-y-1 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Batch Quantity</div>
            <div className="text-base font-bold text-slate-900">
              {harvest.quantity} {harvest.unit}
            </div>
            <div className="text-xs text-slate-500">
              Available: {harvest.availableQuantity} {harvest.unit}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-4 space-y-1 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cultivation Method</div>
            <div className="text-base font-bold text-forest-900">{harvest.farmingMethod || 'Organic'}</div>
            <div className="text-xs text-emerald-700 font-medium">Verified by Krishi Quality Engine</div>
          </div>
        </div>

        {/* Cultivator & Farm Origin Card */}
        <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 pb-2 border-b border-earth-100">
            <Tractor className="w-4 h-4" />
            <span>Cultivator & Farm Origin</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-forest-200 bg-earth-50">
                <Image
                  src={
                    farmer.avatar ||
                    farmer.farmerAvatar ||
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={farmer.name || farmer.farmerName || 'Cultivator'}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  {farmer.name || farmer.farmerName || 'Verified Cultivator'}
                </h3>
                <p className="text-xs font-semibold text-forest-800">
                  {harvest.farmName} • {harvest.farmLocation}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Farming Practice: {harvest.farmingMethod}
                </p>
              </div>
            </div>

            {farmer.id && (
              <Link
                href={`/farmers/${farmer.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-2xs transition-colors"
              >
                <span>View Farm Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Eco practices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-forest-50/60 border border-forest-100 space-y-1">
              <strong className="text-forest-950 font-bold">Soil & Bio-Nutrients:</strong>
              <p className="text-slate-600">Enriched with natural Jeevamrutha microbial culture and green manure.</p>
            </div>
            <div className="p-3 rounded-xl bg-forest-50/60 border border-forest-100 space-y-1">
              <strong className="text-forest-950 font-bold">Water Source:</strong>
              <p className="text-slate-600">Solar rainwater harvesting and direct groundwater recharge wells.</p>
            </div>
          </div>
        </div>

        {/* Provenance Journey Milestones */}
        <div className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-earth-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-full">
                Authoritative Provenance Chain
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Seed-to-Doorstep Journey</h2>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {events.length} milestones logged
            </div>
          </div>

          {events.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Info className="w-6 h-6 mx-auto text-slate-400" />
              <p className="text-xs text-slate-500">
                Initial harvest recorded. Detailed packing and transit milestones will populate as produce moves through the local hub.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((item: any, idx: number) => {
                const IconComponent = getStepIcon(item.rawStep || item.step);
                const isCompleted = item.completed !== false;

                return (
                  <div key={idx} className="flex items-start gap-4 group relative">
                    {/* Step Icon Node */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                        isCompleted
                          ? 'bg-forest-700 border-forest-800 text-white shadow-sm'
                          : 'bg-white border-dashed border-earth-300 text-slate-300'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        <span className="text-xs font-mono text-slate-400">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString('en-IN') : ''}
                        </span>
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-1 text-xs text-forest-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-forest-600" />
                          <span>{item.location}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed pt-0.5">{item.details}</p>

                      {(item.verifiedBy || item.actor) && (
                        <div className="text-[11px] text-emerald-800 font-semibold pt-1">
                          ✓ Verified by: {item.verifiedBy || item.actor}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Link: View/Order Produce */}
        <div className="p-6 rounded-3xl bg-forest-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold">Want to taste this harvest fresh?</h3>
            <p className="text-xs text-forest-200">
              Browse available batches from {harvest.farmName} on the marketplace.
            </p>
          </div>
          {harvest.productId && (
            <Link
              href={`/products/${harvest.productId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-forest-950 font-bold text-xs shadow-md transition-all shrink-0"
            >
              <span>Order This Produce</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
