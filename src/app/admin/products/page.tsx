'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminProductRecord } from '@/data/admin';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { api } from '@/lib/api';
import {
  Sprout,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Loader2,
  Boxes,
  AlertTriangle,
} from 'lucide-react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK'>('ALL');
  const [organicFilter, setOrganicFilter] = useState('ALL');
  const [farmerFilter, setFarmerFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Load real products from PostgreSQL via Admin API
  useEffect(() => {
    let isCancelled = false;
    api
      .getAdminProducts()
      .then((res) => {
        if (!isCancelled && res.success && Array.isArray(res.data)) {
          setProducts(res.data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Unable to load products. Please try again.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  // Overall catalog metrics
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === 'ACTIVE').length;
    const outOfStock = products.filter((p) => p.status === 'OUT_OF_STOCK' || p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock < 15).length;
    return { total, active, outOfStock, lowStock };
  }, [products]);

  // Extract unique filter options from real data
  const uniqueCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]
  );
  const uniqueFarmers = useMemo(
    () => Array.from(new Set(products.map((p) => p.farmerName).filter(Boolean))),
    [products]
  );

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (stockFilter === 'IN_STOCK' && p.stock <= 0) return false;
      if (stockFilter === 'OUT_OF_STOCK' && p.stock > 0) return false;
      if (stockFilter === 'LOW_STOCK' && (p.stock <= 0 || p.stock >= 15)) return false;
      if (organicFilter === 'ORGANIC' && !p.isOrganic) return false;
      if (organicFilter === 'NON_ORGANIC' && p.isOrganic) return false;
      if (farmerFilter !== 'ALL' && p.farmerName !== farmerFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.farmerName && p.farmerName.toLowerCase().includes(q)) ||
          (p.farmName && p.farmName.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [products, categoryFilter, statusFilter, stockFilter, organicFilter, farmerFilter, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const toggleProductStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'OUT_OF_STOCK' : 'ACTIVE';
    setActionLoadingId(id);
    try {
      const res = await api.updateAdminProductStatus(id, newStatus);
      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: res.data.status, stock: res.data.stock } : p
          )
        );
        setStatusMessage({
          type: 'success',
          text: `Product status updated to ${newStatus.replace(/_/g, ' ')}.`,
        });
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update product status.';
      setStatusMessage({
        type: 'error',
        text: message,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Produce Moderation & Quality Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit crop listings, farm origins, pricing, and organic certification badges across Bangalore
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Products"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Produce Catalog"
          value={stats.total}
          subtext="Listed across all registered farms"
          icon={Boxes}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <AdminStatCard
          title="Active in Market"
          value={stats.active}
          subtext="Available for consumer checkout"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <AdminStatCard
          title="Out of Stock"
          value={stats.outOfStock}
          subtext="Depleted or flagged unavailable"
          icon={XCircle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <AdminStatCard
          title="Low Stock Alerts"
          value={stats.lowStock}
          subtext="Below threshold (< 15 units)"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Toast Alert */}
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
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

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors self-start sm:self-auto shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters Bar: Search, Category, Status, Stock, Organic, Farmer */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search crops, produce varieties, or farm names..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active in Market</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Stock Level Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK');
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt; 0)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            <option value="LOW_STOCK">Low Stock (&lt; 15)</option>
          </select>

          {/* Organic Status */}
          <select
            value={organicFilter}
            onChange={(e) => {
              setOrganicFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer"
          >
            <option value="ALL">All Organic Types</option>
            <option value="ORGANIC">Certified Organic / ZBNF</option>
            <option value="NON_ORGANIC">Conventional</option>
          </select>

          {/* Farmer */}
          <select
            value={farmerFilter}
            onChange={(e) => {
              setFarmerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-forest-600 cursor-pointer truncate"
          >
            <option value="ALL">All Farmers</option>
            {uniqueFarmers.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium pb-2">
              <Loader2 className="w-4 h-4 animate-spin text-forest-600" />
              <span>Loading produce catalog from PostgreSQL...</span>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100/70 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <AdminEmptyState
            icon={Sprout}
            title="No Products Found"
            description="No produce items match the current filters or query."
            actionText="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
              setStockFilter('ALL');
              setOrganicFilter('ALL');
              setFarmerFilter('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Farmer / Origin</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Organic Status</th>
                  <th className="py-3.5 px-4">Product Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedProducts.map((p) => {
                  const imageUrl =
                    p.images && p.images.length > 0 && p.images[0] ? p.images[0] : FALLBACK_IMAGE;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Image & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <Image
                              src={imageUrl}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="font-bold text-slate-900 hover:text-forest-700 hover:underline block truncate"
                            >
                              {p.name}
                            </Link>
                            <div className="text-[11px] text-slate-400">{p.unit}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {p.category}
                      </td>

                      {/* Farmer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.farmerName}</div>
                        <div className="text-[11px] text-slate-400 truncate">{p.farmName}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">₹{p.price}</div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          ₹{(p.price * 0.75).toFixed(1)} to farmer
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            p.stock === 0
                              ? 'text-rose-600'
                              : p.stock < 15
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>

                      {/* Organic Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isOrganic
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.isOrganic && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                          <span>{p.farmingMethod}</span>
                        </span>
                      </td>

                      {/* Product Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800'
                              : p.status === 'OUT_OF_STOCK'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleProductStatus(p.id, p.status)}
                            disabled={actionLoadingId === p.id}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                            title={p.status === 'ACTIVE' ? 'Set Out of Stock' : 'Set Active'}
                          >
                            {actionLoadingId === p.id ? (
                              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                            ) : p.status === 'ACTIVE' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <AdminTablePagination
          currentPage={currentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
