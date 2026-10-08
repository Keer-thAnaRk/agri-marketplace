'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFarmer } from '@/context/FarmerContext';
import { FarmerProduct, ProductStatus } from '@/types';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { StockBadge } from '@/components/farmer/StockBadge';
import { ConfirmationModal } from '@/components/farmer/ConfirmationModal';
import { HarvestTraceabilityTimeline } from '@/components/farmer/HarvestTimeline';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Filter,
  Layers,
  Leaf,
} from 'lucide-react';

export default function MyProductsPage() {
  const { products, deleteProduct, toggleProductStatus } = useFarmer();

  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Draft' | 'Out of Stock'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [productToDelete, setProductToDelete] = useState<FarmerProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<FarmerProduct | null>(null);

  // Filter and search
  const filteredProducts = products.filter((p) => {
    // Tab filter
    if (activeFilter === 'Active' && (p.status !== 'Active' || !p.inStock)) return false;
    if (activeFilter === 'Draft' && p.status !== 'Draft') return false;
    if (activeFilter === 'Out of Stock' && (p.status !== 'Out of Stock' && p.availableQuantity > 0)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.harvestBatch && p.harvestBatch.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            My Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your harvest listings, consumer prices, and crop availability
          </p>
        </div>

        <Link
          href="/farmer/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Product</span>
        </Link>
      </div>

      {/* Controls: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-earth-200/80 shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Active', 'Draft', 'Out of Stock'] as const).map((tab) => {
            const count = products.filter((p) => {
              if (tab === 'All') return true;
              if (tab === 'Active') return p.status === 'Active' && p.inStock;
              if (tab === 'Draft') return p.status === 'Draft';
              if (tab === 'Out of Stock') return p.status === 'Out of Stock' || p.availableQuantity === 0;
              return false;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === tab
                    ? 'bg-forest-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-earth-100 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === tab
                      ? 'bg-emerald-400 text-forest-950 font-extrabold'
                      : 'bg-earth-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-earth-50 border border-earth-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:bg-white font-medium"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-earth-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-earth-200 bg-earth-50/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Image</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4">Harvest Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100 font-medium text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching &ldquo;{activeFilter}&rdquo; filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const imageSrc =
                    p.images[0] ||
                    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80';

                  return (
                    <tr key={p.id} className="hover:bg-earth-50/60 transition-colors">
                      {/* Image */}
                      <td className="py-3.5 px-4">
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-earth-200 bg-earth-100">
                          <Image
                            src={imageSrc}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm leading-snug">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {p.isOrganic ? '100% Organic' : p.farmingMethod} • Batch: {p.harvestBatch || 'N/A'}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-earth-100 text-slate-700 font-semibold text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-forest-950 text-sm">
                          ₹{p.price}{' '}
                          <span className="text-[11px] text-slate-400 font-normal">
                            /{p.unitShort}
                          </span>
                        </div>
                      </td>

                      {/* Available Qty */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            p.availableQuantity === 0
                              ? 'text-rose-600'
                              : p.availableQuantity <= (p.lowStockThreshold || 10)
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.availableQuantity} {p.unitShort}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({p.soldQuantity} sold)
                        </span>
                      </td>

                      {/* Harvest Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {p.harvestDate}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleProductStatus(p.id)}
                          title="Click to toggle Active/Draft status"
                          className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                            p.status === 'Active' && p.inStock
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : p.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === 'Active' && p.inStock
                                ? 'bg-emerald-600'
                                : p.status === 'Draft'
                                ? 'bg-slate-500'
                                : 'bg-rose-600'
                            }`}
                          />
                          <span>{p.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View detail modal */}
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-2 rounded-xl text-slate-400 hover:text-forest-900 hover:bg-earth-100 transition-colors cursor-pointer"
                            title="View product details & traceability"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <Link
                            href={`/farmer/products/${p.id}/edit`}
                            className="p-2 rounded-xl text-slate-400 hover:text-sky-700 hover:bg-sky-50 transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={productToDelete !== null}
        title="Delete Produce Listing?"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This will remove the listing from consumer marketplace catalogs and live inventory.`}
        confirmLabel="Yes, Delete Product"
        cancelLabel="Keep Product"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProductToDelete(null)}
      />

      {/* View Product & Traceability Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-earth-200 animate-in zoom-in-95 duration-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-earth-200">
                  <Image
                    src={viewingProduct.images[0]}
                    alt={viewingProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">
                    {viewingProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {viewingProduct.category} • ₹{viewingProduct.price}/{viewingProduct.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-earth-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-earth-50 p-4 rounded-2xl border border-earth-100">
              {viewingProduct.description}
            </p>

            {/* Traceability Flow Section 17 */}
            <HarvestTraceabilityTimeline
              farmName={viewingProduct.farmName}
              batchNumber={viewingProduct.harvestBatch || 'TOM-2409-A'}
              harvestDate={viewingProduct.harvestDate}
              quantityHarvested="100 kg"
              availableQuantity={`${viewingProduct.availableQuantity} ${viewingProduct.unitShort}`}
              freshnessScore={viewingProduct.freshnessScore || 92}
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2.5 rounded-xl bg-forest-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
