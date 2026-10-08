'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { mapBackendFarmerToAdminRecord } from '@/lib/farmerAdminMapper';
import { AdminFarmerRecord } from '@/data/admin';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import {
  Users,
  UserCheck,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

function AdminFarmersContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'all' | 'pending' | 'approved' | 'rejected' | null;

  const [farmers, setFarmers] = useState<AdminFarmerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | null>(
    null
  );
  const activeTab: 'all' | 'pending' | 'approved' | 'rejected' =
    selectedTab ??
    (tabParam && ['all', 'pending', 'approved', 'rejected'].includes(tabParam)
      ? tabParam
      : 'all');

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchFarmers = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setRefreshTrigger((v) => v + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    api
      .getAllFarmers()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          const mapped = res.data.map(mapBackendFarmerToAdminRecord);
          setFarmers(mapped);
        } else {
          setFarmers([]);
        }
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('Failed to load farmers from PostgreSQL:', err);
        setLoadError('Unable to load farmers. Please try again.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Distinct locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set(
      farmers
        .map((f) => f.hub || f.city)
        .filter((val): val is string => Boolean(val && val.trim()))
    );
    return Array.from(locs).sort();
  }, [farmers]);

  // Distinct farming methods
  const uniqueMethods = useMemo(() => {
    const methods = new Set(
      farmers
        .map((f) => f.farmingMethod)
        .filter((val): val is string => Boolean(val && val.trim()))
    );
    return Array.from(methods).sort();
  }, [farmers]);

  // Filtered farmers
  const filteredFarmers = useMemo(() => {
    return farmers.filter((farmer) => {
      // Tab filter
      if (activeTab === 'pending' && farmer.verificationStatus !== 'pending') return false;
      if (activeTab === 'approved' && farmer.verificationStatus !== 'approved') return false;
      if (activeTab === 'rejected' && farmer.verificationStatus !== 'rejected') return false;

      // Location filter
      if (
        locationFilter !== 'ALL' &&
        farmer.hub !== locationFilter &&
        farmer.city !== locationFilter
      ) {
        return false;
      }

      // Farming method filter
      if (methodFilter !== 'ALL' && farmer.farmingMethod !== methodFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          farmer.name.toLowerCase().includes(q) ||
          farmer.farmName.toLowerCase().includes(q) ||
          farmer.email.toLowerCase().includes(q) ||
          farmer.location.toLowerCase().includes(q) ||
          farmer.phone.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [farmers, activeTab, locationFilter, methodFilter, searchQuery]);

  // Pagination slice
  const paginatedFarmers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFarmers.slice(start, start + itemsPerPage);
  }, [filteredFarmers, currentPage, itemsPerPage]);

  const pendingCount = useMemo(
    () => farmers.filter((f) => f.verificationStatus === 'pending').length,
    [farmers]
  );
  const approvedCount = useMemo(
    () => farmers.filter((f) => f.verificationStatus === 'approved').length,
    [farmers]
  );
  const rejectedCount = useMemo(
    () => farmers.filter((f) => f.verificationStatus === 'rejected').length,
    [farmers]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Farmer Directory & Verification Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review Pahani RTC land records, certs, and manage grower enrollment across peri-urban Bengaluru
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFarmers}
          disabled={isLoading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-forest-700' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Tabs: All, Pending, Approved, Rejected */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setSelectedTab('all');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-forest-700 text-forest-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Farmers ({farmers.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedTab('pending');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Verification</span>
          {pendingCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-extrabold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedTab('approved');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'approved'
              ? 'border-emerald-600 text-emerald-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Approved ({approvedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedTab('rejected');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'rejected'
              ? 'border-rose-600 text-rose-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Rejected ({rejectedCount})</span>
        </button>
      </div>

      {/* Filters Bar: Search, Location, Farming Method */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by farmer name, farm, email, location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Location Filter */}
        <div className="w-full md:w-48">
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Hubs & Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Method Filter */}
        <div className="w-full md:w-48">
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Cultivation Methods</option>
            {uniqueMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area: Loading / Error / Empty / Table */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 font-serif">
              Connecting to PostgreSQL...
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Loading real farmer accreditation and document records
            </p>
          </div>
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 shadow-2xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">Unable to load farmers</h3>
            <p className="text-xs text-slate-500 mt-1">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={fetchFarmers}
            className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : filteredFarmers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <AdminEmptyState
            icon={Users}
            title="No farmers found."
            description="No farmers found matching the selected filters or search query."
            actionText="Clear Filters"
            onAction={() => {
              setSelectedTab('all');
              setSearchQuery('');
              setLocationFilter('ALL');
              setMethodFilter('ALL');
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Profile</th>
                  <th className="py-3.5 px-4">Farmer Name</th>
                  <th className="py-3.5 px-4">Farm Name</th>
                  <th className="py-3.5 px-4">Location / Hub</th>
                  <th className="py-3.5 px-4">Farming Method</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedFarmers.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Profile */}
                    <td className="py-3.5 px-4">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <Image
                          src={f.avatar}
                          alt={f.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    </td>

                    {/* Farmer Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link
                        href={`/admin/farmers/${f.id}`}
                        className="hover:underline hover:text-forest-700"
                      >
                        {f.name}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-normal">{f.phone}</div>
                    </td>

                    {/* Farm Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{f.farmName}</div>
                      <div className="text-[11px] text-slate-400">{f.acreage} acres</div>
                    </td>

                    {/* Location / Hub */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{f.hub || f.city}</div>
                      <div className="text-[11px] text-slate-400">{f.location}</div>
                    </td>

                    {/* Farming Method */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {f.farmingMethod}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(f.registeredAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          f.verificationStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : f.verificationStatus === 'pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                        }`}
                      >
                        {f.verificationStatus === 'approved' && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                        {f.verificationStatus === 'pending' && (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        {f.verificationStatus === 'rejected' && (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span className="capitalize">{f.verificationStatus}</span>
                      </span>
                    </td>

                    {/* Actions: View & Review */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/farmers/${f.id}`}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </Link>

                        {f.verificationStatus === 'pending' && (
                          <Link
                            href={`/admin/farmers/${f.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminTablePagination
            currentPage={currentPage}
            totalItems={filteredFarmers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminFarmersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
          <div className="text-xs text-slate-500 font-medium">Loading farmer directory...</div>
        </div>
      }
    >
      <AdminFarmersContent />
    </Suspense>
  );
}
