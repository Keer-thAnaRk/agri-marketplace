'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { mapBackendFarmerToAdminRecord } from '@/lib/farmerAdminMapper';
import { AdminFarmerRecord, AdminDocument } from '@/data/admin';
import { AdminApproveModal } from '@/components/admin/AdminApproveModal';
import { AdminRejectModal } from '@/components/admin/AdminRejectModal';
import { AdminResubmitModal } from '@/components/admin/AdminResubmitModal';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  FileText,
  Eye,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Sprout,
  Tractor,
  Award,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export default function AdminFarmerDetailPage({
  params,
}: {
  params: Promise<{ farmerId: string }>;
}) {
  const resolvedParams = use(params);
  const farmerId = resolvedParams.farmerId;

  const [farmer, setFarmer] = useState<AdminFarmerRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals & Actions
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Document Preview
  const [selectedDocPreview, setSelectedDocPreview] = useState<AdminDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch farmer details from PostgreSQL
  const fetchFarmerDetails = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    api
      .getFarmerById(farmerId)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          const mapped = mapBackendFarmerToAdminRecord(res.data);
          setFarmer(mapped);
        } else {
          setLoadError('Farmer record not found.');
        }
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('Failed to load farmer details from PostgreSQL:', err);
        setLoadError('Unable to load farmer details. Please try again.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [farmerId, refreshTrigger]);

  // Handle Approve
  const handleApprove = async () => {
    if (!farmer) return;
    setIsApproving(true);
    try {
      const res = await api.approveFarmer(farmer.id);
      if (res && res.data) {
        const updated = mapBackendFarmerToAdminRecord(res.data);
        setFarmer(updated);
        setApproveModalOpen(false);
        showToast(`Farmer ${updated.name} has been approved.`);
      } else {
        showToast('Unable to approve farmer.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to approve farmer.';
      showToast(msg || 'Unable to approve farmer.');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Reject
  const handleReject = async (reason: string) => {
    if (!farmer) return;
    if (!reason || !reason.trim()) {
      showToast('A rejection reason is required.');
      return;
    }

    setIsRejecting(true);
    try {
      const res = await api.rejectFarmer(farmer.id, reason.trim());
      if (res && res.data) {
        const updated = mapBackendFarmerToAdminRecord(res.data);
        setFarmer(updated);
        setRejectModalOpen(false);
        showToast(`Farmer application has been rejected.`);
      } else {
        showToast('Unable to reject farmer.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reject farmer.';
      showToast(msg || 'Unable to reject farmer.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle Resubmit (Notice: Backend endpoint not implemented yet)
  const handleResubmit = () => {
    setResubmitModalOpen(false);
    showToast(
      'Document resubmission endpoint is not connected in the backend. Use Reject Farmer with specific notes instead.'
    );
  };

  // Safe document opener
  const handleOpenDocument = (doc: AdminDocument) => {
    if (doc.url && (doc.url.startsWith('http') || doc.url.startsWith('/'))) {
      window.open(doc.url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedDocPreview(doc);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-16 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 font-serif">
            Loading Grower Dossier...
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrieving verification records and submitted documents from PostgreSQL
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError || !farmer) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-10 shadow-2xs text-center space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-serif">Unable to load farmer</h2>
          <p className="text-xs text-slate-500 mt-1">
            {loadError || 'The requested farmer record could not be found.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            href="/admin/farmers"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory</span>
          </Link>
          <button
            type="button"
            onClick={fetchFarmerDetails}
            className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/farmers"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Grower Verification Dossier
              </span>
              <span className="font-mono text-[11px] text-slate-500">ID: {farmer.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
              {farmer.name}
            </h1>
          </div>
        </div>

        {/* Action Buttons: Approve, Reject, Request Resubmission */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setResubmitModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <span>Request Resubmission</span>
          </button>

          <button
            type="button"
            onClick={() => setRejectModalOpen(true)}
            disabled={isRejecting || isApproving}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Reject</span>
          </button>

          <button
            type="button"
            onClick={() => setApproveModalOpen(true)}
            disabled={isApproving || isRejecting}
            className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-600 active:bg-forest-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white" />
            )}
            <span>Approve Farmer</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: VERIFICATION STATUS BANNER */}
      {/* ========================================================================= */}
      <div
        className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          farmer.verificationStatus === 'approved'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : farmer.verificationStatus === 'pending'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              farmer.verificationStatus === 'approved'
                ? 'bg-emerald-600 text-white'
                : farmer.verificationStatus === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {farmer.verificationStatus === 'approved' && <ShieldCheck className="w-6 h-6" />}
            {farmer.verificationStatus === 'pending' && <Clock className="w-6 h-6" />}
            {farmer.verificationStatus === 'rejected' && <XCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider opacity-75">
              Current Verification Status
            </div>
            <div className="text-lg font-black capitalize">
              {farmer.verificationStatus === 'approved'
                ? 'Approved & Verified Grower'
                : farmer.verificationStatus === 'pending'
                ? 'Pending Governance Review'
                : 'Application Rejected'}
            </div>
            {farmer.rejectionReason && (
              <p className="text-xs mt-1 text-rose-800 font-medium">
                Reason: {farmer.rejectionReason}
              </p>
            )}
            {farmer.approvedAt && (
              <p className="text-xs mt-0.5 text-emerald-800">
                Approved on {new Date(farmer.approvedAt).toLocaleDateString()} by {farmer.approvedBy}
              </p>
            )}
          </div>
        </div>

        <div className="text-xs text-right sm:text-right w-full sm:w-auto font-medium">
          <div>Registered: {new Date(farmer.registeredAt).toLocaleDateString()}</div>
          <div className="text-[11px] opacity-70">Hub: {farmer.hub || farmer.city}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 Cols): Profile, Farm Information, Documents */}
        <div className="lg:col-span-8 space-y-8">
          {/* ========================================================================= */}
          {/* SECTION 1: PROFILE */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sprout className="w-4 h-4 text-forest-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Section 1: Farmer Profile & Contact
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                <Image
                  src={farmer.avatar}
                  alt={farmer.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>

              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{farmer.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{farmer.farmName}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{farmer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{farmer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {farmer.location}
                      {farmer.pincode ? ` - ${farmer.pincode}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Enrolled {new Date(farmer.registeredAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Hub Location:</span>
                  <span>{farmer.hub || farmer.city} ({farmer.city}, {farmer.state})</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: FARM INFORMATION */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Tractor className="w-4 h-4 text-forest-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Section 2: Farm & Cultivation Details
              </h2>
            </div>

            <div>
              <p className="text-xs text-slate-600 leading-relaxed">{farmer.description}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Method
                </span>
                <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                  {farmer.farmingMethod}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Experience
                </span>
                <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                  {farmer.yearsFarming} Years
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Acreage
                </span>
                <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                  {farmer.acreage} Acres
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Delivery Hub
                </span>
                <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                  {farmer.hub || farmer.city}
                </span>
              </div>
            </div>

            {/* Main Crops */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">Main Cultivated Crops:</span>
              <div className="flex flex-wrap gap-2">
                {farmer.mainCrops.length > 0 ? (
                  farmer.mainCrops.map((crop, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-forest-50 border border-forest-100 text-forest-800 text-xs font-semibold"
                    >
                      {crop}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No specific crops specified.</span>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">Accreditations & Certifications:</span>
              <div className="flex flex-wrap gap-2">
                {farmer.certifications.length > 0 ? (
                  farmer.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-900 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{cert}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No formal certifications uploaded yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: DOCUMENTS */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                  Section 3: Verification Documents
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {farmer.documents.length} {farmer.documents.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            {farmer.documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">No Documents Uploaded</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  This farmer has not uploaded any verification files (Aadhaar/PAN, Pahani RTC, or farm photo) yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {farmer.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 shadow-2xs">
                        <FileText className="w-5 h-5 text-forest-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {doc.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                            {doc.type}
                          </span>
                          {doc.verified ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Pending Review
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {doc.fileName} • {doc.fileSize} • MIME: {doc.mimeType || 'application/pdf'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Safe Document Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => setSelectedDocPreview(doc)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>

                      {doc.url && (
                        <button
                          type="button"
                          onClick={() => handleOpenDocument(doc)}
                          className="px-3 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Open document in new window"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                          <span>Open</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Document Inspection / Safe Preview Modal */}
            {selectedDocPreview && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">{selectedDocPreview.name}</span>
                    <span className="text-slate-400 block text-[11px]">
                      {selectedDocPreview.fileName} • Type: {selectedDocPreview.type} • MIME: {selectedDocPreview.mimeType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedDocPreview.url && (
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(selectedDocPreview)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Link</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedDocPreview(null)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 Cols): Verification History & Audit Timeline */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-serif">
                Verification Audit History
              </h2>
            </div>

            <div className="relative pl-5 border-l-2 border-slate-100 space-y-6 my-2">
              {farmer.history.map((entry) => (
                <div key={entry.id} className="relative">
                  {/* Dot */}
                  <span
                    className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                      entry.status === 'APPROVED'
                        ? 'bg-emerald-600 ring-emerald-200'
                        : entry.status === 'REJECTED'
                        ? 'bg-rose-600 ring-rose-200'
                        : entry.status === 'RESUBMISSION_REQUESTED'
                        ? 'bg-amber-600 ring-amber-200'
                        : 'bg-blue-600 ring-blue-200'
                    }`}
                  />

                  <div className="text-xs font-bold text-slate-900 capitalize">
                    {entry.status.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {new Date(entry.actionDate).toLocaleDateString()} • {entry.actedBy}
                  </div>
                  {entry.reason && (
                    <p className="text-[11px] text-rose-700 mt-1 bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                      <strong>Reason:</strong> {entry.reason}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      <AdminApproveModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={handleApprove}
        farmerName={farmer.name}
        farmName={farmer.farmName}
        isProcessing={isApproving}
      />

      <AdminRejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
        farmerName={farmer.name}
        farmName={farmer.farmName}
        isProcessing={isRejecting}
      />

      <AdminResubmitModal
        isOpen={resubmitModalOpen}
        onClose={() => setResubmitModalOpen(false)}
        onConfirm={handleResubmit}
        farmerName={farmer.name}
        farmName={farmer.farmName}
      />
    </div>
  );
}
