'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/context/MarketplaceContext';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { OrganicBadge } from '@/components/ui/OrganicBadge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { RatingStars } from '@/components/ui/RatingStars';
import { TraceabilityTimeline } from '@/components/marketplace/TraceabilityTimeline';
import { PriceBreakdown } from '@/components/marketplace/PriceBreakdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import {
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Heart,
  Share2,
  Calendar,
  CheckCircle2,
  Sparkles,
  Tractor,
  MessageSquare,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const { products, farmers, addToCart, showToast, savedFarmerIds, toggleSaveFarmer } =
    useMarketplace();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [liveProduct, setLiveProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find product from context first
  const contextProduct = products.find((p) => p.id === productId);

  useEffect(() => {
    let isMounted = true;
    api
      .getPublicProductById(productId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setLiveProduct(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch single product by id:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const product = liveProduct || contextProduct;
  const farmer = product?.farmer || (product ? farmers.find((f) => f.id === product.farmerId) : null);
  const displayReviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const averageRating = Number(product?.averageRating ?? product?.rating ?? 0);
  const reviewCount = Number(product?.reviewsCount ?? displayReviews.length ?? 0);

  if (isLoading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-earth-200 rounded w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 h-96 bg-earth-200 rounded-3xl" />
            <div className="lg:col-span-6 space-y-4">
              <div className="h-8 bg-earth-200 rounded w-3/4" />
              <div className="h-6 bg-earth-200 rounded w-1/2" />
              <div className="h-24 bg-earth-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          type="products"
          title="Product not found"
          description="This harvest batch might have been sold out or completed."
          actionText="Back to Marketplace"
          actionHref="/explore"
        />
      </div>
    );
  }

  const farmerProductCount = products.filter((p) => p.farmerId === product.farmerId).length;
  const isFarmerSaved = farmer ? savedFarmerIds.includes(farmer.id) : false;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/cart');
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/" className="hover:text-forest-800">
          Home
        </Link>
        <span>/</span>
        <Link href="/explore" className="hover:text-forest-800">
          Explore
        </Link>
        <span>/</span>
        <Link
          href={`/explore?category=${encodeURIComponent(product.category)}`}
          className="hover:text-forest-800"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-slate-800 truncate font-semibold">{product.name}</span>
      </nav>

      {/* Main Product Showcase (Image Gallery + Buy Box) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Images (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-earth-100 border border-earth-200/80 shadow-md">
            <Image
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <FreshnessBadge score={product.freshnessScore} size="md" />
              <OrganicBadge method={product.farmingMethod} isOrganic={product.isOrganic} size="md" />
            </div>

            <button
              onClick={handleShare}
              className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:text-forest-800 hover:bg-white shadow-xs transition-colors"
              title="Share harvest link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnails if multiple images */}
          {product.images?.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-forest-700 shadow-xs ring-2 ring-forest-600/30'
                      : 'border-earth-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}

          {/* Freshness & Harvest Highlight Box */}
          <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
              <Clock className="w-4 h-4 text-forest-700" />
              <span>Harvested: {product.harvestDate} ({product.harvestedAgo})</span>
            </div>
            <p className="text-xs text-forest-800/80 leading-relaxed">
              Delivered within hours of cutting. Freshness score calculated at {product.freshnessScore}/100 with optimal shelf life of {product.shelfLifeDays} days.
            </p>
          </div>
        </div>

        {/* Right: Buy Box & Product Info (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-100/70 px-2.5 py-0.5 rounded-md">
                {product.category}
              </span>
              <RatingStars rating={product.rating} reviewCount={product.reviewsCount} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif leading-tight mb-2">
              {product.name}
            </h1>

            {/* Farmer Attribution Link */}
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <span>Grown by</span>
              <Link
                href={`/farmers/${product.farmerId}`}
                className="font-bold text-forest-800 hover:underline inline-flex items-center gap-1"
              >
                <span>{product.farmerName}</span>
                {farmer?.isVerified && <VerifiedBadge size="sm" />}
              </Link>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-forest-700 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {product.farmDistanceKm} km away
              </span>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-2 py-3 border-y border-earth-200/80">
              <span className="text-3xl font-extrabold text-forest-950">₹{product.price}</span>
              <span className="text-sm font-semibold text-slate-500">per {product.unit}</span>

              <div className="ml-auto">
                {product.inStock ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    In Stock ({product.availableQuantity} available)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    Sold Out for Today
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              About this harvest
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Nutrition highlights if present */}
          {product.nutritionHighlights && (
            <div className="flex flex-wrap gap-2 pt-1">
              {product.nutritionHighlights.map((n: string, i: number) => (
                <span
                  key={i}
                  className="text-xs font-semibold px-3 py-1 rounded-lg bg-earth-50 text-slate-800 border border-earth-200"
                >
                  ✓ {n}
                </span>
              ))}
            </div>
          )}

          {/* Quantity selector & CTA buttons */}
          <div className="space-y-3 pt-4 border-t border-earth-200/80">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Quantity:
              </span>
              <div className="inline-flex items-center border border-earth-300 rounded-xl bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-slate-600 hover:bg-earth-100 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-slate-600 hover:bg-earth-100 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Subtotal: <strong className="text-forest-950 font-bold">₹{product.price * quantity}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="py-3.5 px-5 rounded-2xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Basket</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="py-3.5 px-5 rounded-2xl bg-harvest-gold hover:bg-amber-400 active:scale-98 text-forest-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Guaranteed Delivery Notice */}
          <div className="p-3.5 rounded-2xl bg-earth-50 border border-earth-200/80 text-xs text-slate-600 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-forest-700 shrink-0" />
            <div>
              <strong>Order now for next delivery slot.</strong> Delivered chilled in recyclable kraft packaging.
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT JOURNEY TRACEABILITY TIMELINE */}
      <section className="pt-8 border-t border-earth-200">
        <TraceabilityTimeline
          steps={product.traceability}
          productName={product.name}
          farmName={product.farmName}
        />
      </section>

      {/* ABOUT THE FARMER CARD */}
      {farmer && (
        <section className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-700 mb-4">
            <Tractor className="w-4 h-4" />
            <span>Cultivator Profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-forest-200 shadow-sm">
                <Image src={farmer.avatar} alt={farmer.name} fill className="object-cover" sizes="80px" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900 font-serif">{farmer.name}</h3>
                  {farmer.isVerified && <VerifiedBadge size="sm" />}
                </div>
                <div className="text-xs font-medium text-forest-800">
                  {farmer.farmName} • {farmer.location}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>Method: <strong className="text-slate-800 font-semibold">{farmer.farmingMethod}</strong></span>
                  <span>•</span>
                  <span>{farmer.yearsFarming} yrs farming</span>
                  <span>•</span>
                  <span>{farmerProductCount} products listed</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 pt-1 leading-relaxed">
                  {farmer.story}
                </p>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2.5 justify-center md:items-end">
              <Link
                href={`/farmers/${farmer.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 text-white hover:bg-forest-900 text-xs font-bold transition-all shadow-xs"
              >
                <span>View Full Farm Story & Crops</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => toggleSaveFarmer(farmer.id)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-earth-100 hover:bg-earth-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 ${isFarmerSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isFarmerSaved ? 'Favorited' : 'Save Farmer'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* PRICE TRANSPARENCY ACCORDION */}
      <section>
        <PriceBreakdown totalAmount={product.price} showTitle={true} compact={false} />
      </section>

      {/* CUSTOMER REVIEWS */}
      <section className="bg-white rounded-3xl border border-earth-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-earth-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-forest-700" />
            <h3 className="text-xl font-bold text-slate-900">Verified Consumer Reviews</h3>
          </div>
          <RatingStars rating={averageRating} reviewCount={reviewCount} size="md" />
        </div>

        <div className="space-y-4 divide-y divide-earth-100">
          {displayReviews.length > 0 ? (
            displayReviews.slice(0, 6).map((review: any) => (
              <div key={review.id} className="pt-4 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-earth-200 bg-earth-100">
                      {review.userAvatar ? (
                        <Image src={review.userAvatar} alt={review.userName || 'Reviewer'} fill className="object-cover" sizes="32px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                          {review.userName?.slice(0, 2).toUpperCase() || 'C'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{review.userName || 'Verified consumer'}</div>
                      <div className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <RatingStars rating={Number(review.rating) || 0} />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  &ldquo;{review.comment || 'No comment provided.'}&rdquo;
                </p>
                {review.verifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Purchase
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="py-6 text-sm text-slate-600">
              No reviews yet for this product. Be the first verified customer to leave feedback.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
