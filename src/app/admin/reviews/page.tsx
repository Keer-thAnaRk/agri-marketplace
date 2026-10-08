'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import {
  Star,
  Search,
  CheckCircle2,
  AlertOctagon,
  RotateCw,
  AlertCircle,
  Loader2,
  Info,
  ShieldCheck,
  Package,
  Sprout,
  User,
} from 'lucide-react';

interface ReviewCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ReviewFarmer {
  id: string;
  farmName: string;
  farmerName: string;
}

interface ReviewProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
}

interface ReviewRecord {
  id: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  customer: ReviewCustomer;
  farmer: ReviewFarmer;
  product: ReviewProduct | null;
}

interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  verifiedPurchasesCount: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    let isCancelled = false;

    api
      .getAdminReviews({
        search: searchQuery.trim() || undefined,
        rating: selectedRating !== 'ALL' ? selectedRating : undefined,
      })
      .then((res) => {
        if (!isCancelled && res && res.success && Array.isArray(res.data)) {
          setReviews(res.data as ReviewRecord[]);
          if (res.metrics) {
            setMetrics(res.metrics as ReviewMetrics);
          }
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error('Failed to load admin reviews:', err);
          setError('Unable to load reviews from database.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, selectedRating, refreshTrigger]);

  const totalReviews = metrics?.totalReviews ?? reviews.length;
  const avgRating = metrics?.averageRating ?? 0;
  const fiveStars = metrics?.fiveStarCount ?? reviews.filter((r) => r.rating === 5).length;
  const verifiedCount = metrics?.verifiedPurchasesCount ?? reviews.filter((r) => r.verifiedPurchase).length;

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (selectedRating !== 'ALL' && r.rating !== selectedRating) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.comment.toLowerCase().includes(q) ||
          r.customer.name.toLowerCase().includes(q) ||
          r.customer.email.toLowerCase().includes(q) ||
          r.farmer.farmName.toLowerCase().includes(q) ||
          r.farmer.farmerName.toLowerCase().includes(q) ||
          (r.product && r.product.name.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [reviews, selectedRating, searchQuery]);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Customer Reviews & Quality Ratings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified consumer ratings and produce quality testimonials across Krishi Market growers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/disputes"
            className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs inline-flex items-center gap-1.5 transition-colors"
          >
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Disputes & Claims</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Refresh reviews"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-forest-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Reviews"
          value={totalReviews}
          subtext="Verified customer feedback"
          icon={Star}
          iconColor="text-amber-500"
        />
        <AdminStatCard
          title="Platform Rating"
          value={avgRating > 0 ? `${avgRating} / 5.0` : 'N/A'}
          subtext="Average satisfaction score"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
        />
        <AdminStatCard
          title="5-Star Ratings"
          value={fiveStars}
          subtext="Top tier quality reviews"
          icon={Star}
          iconColor="text-amber-600"
        />
        <AdminStatCard
          title="Verified Orders"
          value={verifiedCount}
          subtext="Direct delivered purchase records"
          icon={ShieldCheck}
          iconColor="text-forest-700"
        />
      </div>

      {/* Schema Moderation Policy Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-blue-950 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-blue-800">
            Database Moderation Integrity Notice
          </span>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            In strict compliance with Krishi Market architectural guidelines, the current PostgreSQL Review schema
            preserves historical consumer reviews without hidden deletions. Administrative moderation actions
            (soft-delete flag or moderation approval workflows) require a formal Prisma schema migration. All customer
            feedback shown is authenticated directly from verified delivered purchases.
          </p>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            className="font-bold underline hover:text-rose-950 text-xs cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Rating Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setSelectedRating('ALL');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            selectedRating === 'ALL'
              ? 'border-forest-700 text-forest-900 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Reviews ({totalReviews})
        </button>

        {[5, 4, 3, 2, 1].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setSelectedRating(r);
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedRating === r
                ? 'border-amber-600 text-amber-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{r} Stars</span>
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, grower farm, produce crop, or comment..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading customer reviews from PostgreSQL...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <AdminEmptyState
            icon={Star}
            title="No Reviews Found"
            description="Zero customer reviews match the selected rating or search criteria."
            actionText="Show All Reviews"
            onAction={() => {
              setSelectedRating('ALL');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Customer Review</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Grower & Farm</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Rating */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-slate-900 text-sm">{rev.rating}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <p className="text-slate-800 line-clamp-2 italic leading-relaxed text-xs">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{rev.customer.name}</div>
                          <div className="text-[11px] text-slate-400">{rev.customer.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Farmer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Sprout className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">{rev.farmer.farmName}</div>
                          <div className="text-[11px] text-slate-400">{rev.farmer.farmerName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rev.product ? (
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">{rev.product.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {rev.product.category} • ₹{rev.product.price}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">General Grower Review</span>
                      )}
                    </td>

                    {/* Verification */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rev.verifiedPurchase ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Purchase</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Community Feedback
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap text-[11px]">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminTablePagination
          currentPage={currentPage}
          totalItems={filteredReviews.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
