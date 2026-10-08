import { prisma } from '../db/prisma';
import {
  ProductCategory,
  FarmingMethod,
  ProductStatus,
  VerificationStatus,
  Prisma,
} from '@prisma/client';
import { calculateFreshness } from '../utils/freshness';

export interface ProductFilterParams {
  search?: string;
  category?: string;
  farmingMethod?: string;
  isOrganic?: string | boolean;
  minPrice?: string | number;
  maxPrice?: string | number;
  farmerId?: string;
  inStock?: string | boolean;
  sortBy?: string;
  page?: string | number;
  limit?: string | number;
}

export interface FarmerFilterParams {
  search?: string;
  farmingMethod?: string;
  city?: string;
  hub?: string;
  page?: string | number;
  limit?: string | number;
}

// Helpers for Category and Method Enums
function parseCategory(cat?: string): ProductCategory | undefined {
  if (!cat || cat === 'all' || cat === 'ALL') return undefined;
  const upper = cat.trim().toUpperCase().replace(/[\s-]/g, '_');
  if (upper in ProductCategory) {
    return ProductCategory[upper as keyof typeof ProductCategory];
  }
  // Soft matching
  if (upper.includes('VEG')) return ProductCategory.VEGETABLES;
  if (upper.includes('FRUIT')) return ProductCategory.FRUITS;
  if (upper.includes('DAIRY')) return ProductCategory.DAIRY;
  if (upper.includes('GRAIN')) return ProductCategory.GRAINS;
  if (upper.includes('PULSE')) return ProductCategory.PULSES;
  if (upper.includes('EGG')) return ProductCategory.EGGS;
  if (upper.includes('HERB')) return ProductCategory.HERBS;
  if (upper.includes('SPICE')) return ProductCategory.SPICES;
  if (upper.includes('SPECIALTY') || upper.includes('ORGANIC')) return ProductCategory.ORGANIC_SPECIALTY;
  return undefined;
}

function parseFarmingMethod(method?: string): FarmingMethod | undefined {
  if (!method || method === 'all' || method === 'ALL') return undefined;
  const upper = method.trim().toUpperCase().replace(/[\s()-]/g, '_');
  if (upper in FarmingMethod) {
    return FarmingMethod[upper as keyof typeof FarmingMethod];
  }
  if (upper.includes('ZBNF') || upper.includes('NATURAL')) return FarmingMethod.NATURAL_ZBNF;
  if (upper.includes('ORGANIC')) return FarmingMethod.ORGANIC;
  if (upper.includes('HYDRO')) return FarmingMethod.HYDROPONIC;
  if (upper.includes('REGEN')) return FarmingMethod.REGENERATIVE;
  if (upper.includes('PESTICIDE')) return FarmingMethod.PESTICIDE_FREE;
  if (upper.includes('TRAD')) return FarmingMethod.TRADITIONAL;
  if (upper.includes('CONV')) return FarmingMethod.CONVENTIONAL;
  if (upper.includes('MIX')) return FarmingMethod.MIXED;
  return undefined;
}

export class MarketplaceService {
  /**
   * Retrieves public marketplace products.
   * Strict visibility rules: Product.status = ACTIVE, inStock = true, availableQuantity > 0,
   * and farmer.verificationStatus = APPROVED.
   */
  async getProducts(params: ProductFilterParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      inStock: true,
      availableQuantity: { gt: 0 },
      farmer: {
        isVerified: true,
        verificationStatus: VerificationStatus.APPROVED,
        user: {
          isActive: true,
        },
      },
    };

    // Category filter
    const parsedCat = parseCategory(params.category);
    if (parsedCat) {
      where.category = parsedCat;
    }

    // Farming method filter
    const parsedMethod = parseFarmingMethod(params.farmingMethod);
    if (parsedMethod) {
      where.farmingMethod = parsedMethod;
    }

    // Organic filter
    if (params.isOrganic !== undefined) {
      const isOrg = params.isOrganic === true || params.isOrganic === 'true' || params.isOrganic === '1';
      where.isOrganic = isOrg;
    }

    // Farmer filter
    if (params.farmerId && params.farmerId !== 'all') {
      where.farmerId = params.farmerId.trim();
    }

    // Price range filters
    const minP = Number(params.minPrice);
    const maxP = Number(params.maxPrice);
    if (!isNaN(minP) && minP >= 0) {
      where.price = { ...(where.price as Prisma.DecimalFilter), gte: new Prisma.Decimal(minP) };
    }
    if (!isNaN(maxP) && maxP > 0) {
      where.price = { ...(where.price as Prisma.DecimalFilter), lte: new Prisma.Decimal(maxP) };
    }

    // Search query across product name, description, farm name, grower name
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { farmer: { farmName: { contains: q, mode: 'insensitive' } } },
        { farmer: { user: { name: { contains: q, mode: 'insensitive' } } } },
        { farmer: { location: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { rating: 'desc' };
    const sort = params.sortBy || 'recommended';

    if (sort === 'price_low' || sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_high' || sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'rating' || sort === 'recommended' || sort === 'popular') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'freshest') {
      orderBy = { harvestDate: 'desc' };
    }

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          farmer: {
            select: {
              id: true,
              farmName: true,
              farmLocation: true,
              location: true,
              city: true,
              state: true,
              distanceKm: true,
              farmingMethod: true,
              rating: true,
              reviewCount: true,
              isVerified: true,
              coverImage: true,
              user: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          harvestBatches: {
            where: { status: 'AVAILABLE' },
            orderBy: { harvestDate: 'desc' },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const formattedProducts = rawProducts.map((p) => {
      const latestBatch = p.harvestBatches[0];
      const harvestDateRef = latestBatch?.harvestDate || p.harvestDate || p.createdAt;
      const shelfLifeDays = latestBatch?.expectedShelfLifeDays || p.shelfLifeDays || 6;
      const freshness = calculateFreshness(harvestDateRef, shelfLifeDays);

      return {
        id: p.id,
        farmerId: p.farmerId,
        farmerName: p.farmer.user?.name || 'Local Cultivator',
        farmName: p.farmer.farmName,
        farmerAvatar:
          p.farmer.user?.avatar ||
          'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
        farmLocation: p.farmer.location || `${p.farmer.city}, ${p.farmer.state}`,
        farmDistanceKm: Number(p.farmer.distanceKm || p.farmDistanceKm || 2.5),
        name: p.name,
        category: p.category,
        description: p.description,
        price: Number(p.price),
        unit: p.unit,
        unitShort: p.unitShort || p.unit,
        images:
          p.images && p.images.length > 0
            ? p.images
            : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
        shelfLifeDays: p.shelfLifeDays,
        expectedFreshnessDuration: p.expectedFreshnessDuration || `${p.shelfLifeDays} days room temperature`,
        harvestDate: harvestDateRef ? new Date(harvestDateRef).toISOString() : new Date().toISOString(),
        freshnessScore: freshness.percentage,
        freshnessStatus: freshness.status,
        freshnessLabel: freshness.label,
        isOrganic: p.isOrganic,
        farmingMethod: p.farmingMethod,
        inStock: p.inStock && Number(p.availableQuantity) > 0,
        availableQuantity: Number(p.availableQuantity),
        rating: Number(p.rating),
        reviewsCount: p.reviewsCount,
        nutritionHighlights: p.nutritionHighlights || [],
        createdAt: p.createdAt.toISOString(),
      };
    });

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Retrieves single public product detail.
   * Throws 404 if not found or if farmer/product is not active and approved.
   */
  async getProductById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        farmer: {
          select: {
            id: true,
            farmName: true,
            farmLocation: true,
            location: true,
            city: true,
            state: true,
            pincode: true,
            hub: true,
            distanceKm: true,
            farmingMethod: true,
            yearsFarming: true,
            acreage: true,
            mainCrops: true,
            farmDescription: true,
            story: true,
            soilPractices: true,
            waterSource: true,
            certifications: true,
            coverImage: true,
            gallery: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
            verificationStatus: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                isActive: true,
              },
            },
          },
        },
        harvestBatches: {
          where: { status: 'AVAILABLE' },
          orderBy: { harvestDate: 'desc' },
          take: 3,
          include: {
            traceabilityEvents: {
              orderBy: [{ orderIndex: 'asc' }, { timestamp: 'asc' }],
            },
          },
        },
      },
    });

    if (
      !product ||
      product.status !== ProductStatus.ACTIVE ||
      !product.farmer ||
      product.farmer.verificationStatus !== VerificationStatus.APPROVED ||
      !product.farmer.isVerified ||
      !product.farmer.user?.isActive
    ) {
      const err = new Error('Product not found or currently unavailable on marketplace.');
      (err as any).status = 404;
      throw err;
    }

    const latestBatch = product.harvestBatches[0];
    const harvestDateRef = latestBatch?.harvestDate || product.harvestDate || null;
    const shelfLifeDays = latestBatch?.expectedShelfLifeDays || product.shelfLifeDays || 6;
    const freshness = calculateFreshness(harvestDateRef, shelfLifeDays);
    const mappedTraceability = latestBatch
      ? latestBatch.traceabilityEvents.map((t) => ({
          id: t.id,
          step: String(t.step || '')
            .toLowerCase()
            .replace('farm_origin', 'farm'),
          title: t.title,
          location: t.location,
          timestamp: t.timestamp.toISOString(),
          details: t.details,
          completed: t.completed,
          verifiedBy: t.verifiedBy,
          actor: t.actor,
          orderIndex: t.orderIndex,
        }))
      : [];

    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Number((reviews.reduce((sum, review) => sum + Number(review.rating), 0) / totalReviews).toFixed(1))
      : Number(product.rating || 0);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating as keyof typeof ratingDistribution] += 1;
      }
    });

    const mappedReviews = reviews.map((review) => ({
      id: review.id,
      userId: review.userId,
      userName: review.user?.name || 'Verified consumer',
      userAvatar: review.user?.avatar || '',
      rating: review.rating,
      comment: review.comment,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt.toISOString(),
    }));

    return {
      id: product.id,
      farmerId: product.farmerId,
      name: product.name,
      category: product.category,
      description: product.description,
      price: Number(product.price),
      unit: product.unit,
      unitShort: product.unitShort || product.unit,
      images:
        product.images && product.images.length > 0
          ? product.images
          : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
      shelfLifeDays: product.shelfLifeDays,
      expectedFreshnessDuration: product.expectedFreshnessDuration || `${product.shelfLifeDays} days room temperature`,
      harvestDate: harvestDateRef ? new Date(harvestDateRef).toISOString() : null,
      harvestDateIso: harvestDateRef ? new Date(harvestDateRef).toISOString() : null,
      freshnessScore: freshness.percentage,
      freshnessStatus: freshness.status,
      freshnessLabel: freshness.label,
      daysRemaining: freshness.daysRemaining,
      hoursAgo: freshness.hoursAgo,
      isApproachingExpiry: freshness.isApproachingExpiry,
      isOrganic: product.isOrganic,
      farmingMethod: product.farmingMethod,
      inStock: product.inStock && Number(product.availableQuantity) > 0,
      availableQuantity: Number(product.availableQuantity),
      rating: Number(product.rating || averageRating || 0),
      averageRating,
      reviewsCount: totalReviews || product.reviewsCount || 0,
      ratingDistribution,
      reviews: mappedReviews,
      nutritionHighlights: product.nutritionHighlights || [],
      farmer: {
        id: product.farmer.id,
        name: product.farmer.user?.name || 'Local Cultivator',
        avatar:
          product.farmer.user?.avatar ||
          'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
        farmName: product.farmer.farmName,
        farmLocation: product.farmer.farmLocation,
        location: product.farmer.location || `${product.farmer.city}, ${product.farmer.state}`,
        city: product.farmer.city,
        state: product.farmer.state,
        pincode: product.farmer.pincode,
        hub: product.farmer.hub,
        distanceKm: Number(product.farmer.distanceKm || product.farmDistanceKm || 2.5),
        farmingMethod: product.farmer.farmingMethod,
        yearsFarming: product.farmer.yearsFarming,
        acreage: Number(product.farmer.acreage || 5.0),
        mainCrops: product.farmer.mainCrops || [],
        farmDescription: product.farmer.farmDescription,
        story: product.farmer.story,
        soilPractices: product.farmer.soilPractices || [],
        waterSource: product.farmer.waterSource,
        certifications: product.farmer.certifications || [],
        coverImage: product.farmer.coverImage,
        gallery: product.farmer.gallery || [],
        rating: Number(product.farmer.rating),
        reviewCount: product.farmer.reviewCount,
        isVerified: product.farmer.isVerified,
      },
      harvestBatch: latestBatch
        ? {
            id: latestBatch.id,
            batchNumber: latestBatch.batchNumber,
            harvestDate: latestBatch.harvestDate.toISOString(),
            quantity: Number(latestBatch.quantity),
            quantityKg: Number(latestBatch.quantity),
            unit: latestBatch.unit,
            farmingMethod: latestBatch.farmingMethod,
            expectedShelfLifeDays: latestBatch.expectedShelfLifeDays,
            expectedFreshness: latestBatch.expectedFreshness,
            qrCodeUrl: latestBatch.qrCodeUrl,
            freshnessScore: freshness.percentage,
            traceability: mappedTraceability,
          }
        : null,
      traceability: mappedTraceability,
      traceabilityAvailable: Boolean(latestBatch),
      farmerName: product.farmer.user?.name || 'Local Cultivator',
      farmName: product.farmer.farmName,
      farmLocation: product.farmer.location || `${product.farmer.city}, ${product.farmer.state}`,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  /**
   * Lists verified public farmers directory.
   */
  async getFarmers(params: FarmerFilterParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FarmerWhereInput = {
      isVerified: true,
      verificationStatus: VerificationStatus.APPROVED,
      user: {
        isActive: true,
      },
    };

    if (params.farmingMethod && params.farmingMethod !== 'all') {
      const parsedMethod = parseFarmingMethod(params.farmingMethod);
      if (parsedMethod) where.farmingMethod = parsedMethod;
    }

    if (params.city && params.city !== 'all') {
      where.city = { contains: params.city.trim(), mode: 'insensitive' };
    }

    if (params.hub && params.hub !== 'all') {
      where.hub = { contains: params.hub.trim(), mode: 'insensitive' };
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { farmName: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { location: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { hub: { contains: q, mode: 'insensitive' } },
        { mainCrops: { hasSome: [q] } },
      ];
    }

    const [total, rawFarmers] = await Promise.all([
      prisma.farmer.count({ where }),
      prisma.farmer.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
          products: {
            where: {
              status: ProductStatus.ACTIVE,
              inStock: true,
              availableQuantity: { gt: 0 },
            },
            select: { id: true },
          },
        },
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const formattedFarmers = rawFarmers.map((f) => ({
      id: f.id,
      name: f.user?.name || 'Local Cultivator',
      avatar:
        f.user?.avatar ||
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
      farmName: f.farmName,
      farmLocation: f.farmLocation,
      location: f.location || `${f.city}, ${f.state}`,
      city: f.city,
      state: f.state,
      pincode: f.pincode,
      hub: f.hub,
      distanceKm: Number(f.distanceKm || 2.5),
      farmingMethod: f.farmingMethod,
      yearsFarming: f.yearsFarming,
      acreage: Number(f.acreage || 5.0),
      mainCrops: f.mainCrops || [],
      farmDescription: f.farmDescription,
      story: f.story,
      soilPractices: f.soilPractices || [],
      waterSource: f.waterSource,
      certifications: f.certifications || [],
      coverImage:
        f.coverImage ||
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
      gallery: f.gallery || [],
      rating: Number(f.rating),
      reviewCount: f.reviewCount,
      totalProductsCount: f.products.length,
      isVerified: f.isVerified,
      joinedDate: f.approvedAt ? new Date(f.approvedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Verified Member',
    }));

    return {
      farmers: formattedFarmers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Retrieves public farmer profile with active marketplace products.
   * Throws 404 if farmer is not verified and approved.
   */
  async getFarmerById(farmerId: string) {
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isActive: true,
          },
        },
        products: {
          where: {
            status: ProductStatus.ACTIVE,
            inStock: true,
            availableQuantity: { gt: 0 },
          },
          include: {
            harvestBatches: {
              where: { status: 'AVAILABLE' },
              orderBy: { harvestDate: 'desc' },
              take: 1,
            },
          },
          orderBy: { rating: 'desc' },
        },
      },
    });

    if (
      !farmer ||
      farmer.verificationStatus !== VerificationStatus.APPROVED ||
      !farmer.isVerified ||
      !farmer.user?.isActive
    ) {
      const err = new Error('Farmer profile not found or not approved for public marketplace.');
      (err as any).status = 404;
      throw err;
    }

    const formattedProducts = farmer.products.map((p) => {
      const latestBatch = p.harvestBatches[0];
      const harvestDateRef = latestBatch?.harvestDate || p.harvestDate || p.createdAt;
      const shelfLifeDays = latestBatch?.expectedShelfLifeDays || p.shelfLifeDays || 6;
      const freshness = calculateFreshness(harvestDateRef, shelfLifeDays);

      return {
        id: p.id,
        farmerId: p.farmerId,
        farmerName: farmer.user?.name || 'Local Cultivator',
        farmName: farmer.farmName,
        farmerAvatar:
          farmer.user?.avatar ||
          'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
        farmLocation: farmer.location || `${farmer.city}, ${farmer.state}`,
        farmDistanceKm: Number(farmer.distanceKm || p.farmDistanceKm || 2.5),
        name: p.name,
        category: p.category,
        description: p.description,
        price: Number(p.price),
        unit: p.unit,
        unitShort: p.unitShort || p.unit,
        images:
          p.images && p.images.length > 0
            ? p.images
            : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
        shelfLifeDays: p.shelfLifeDays,
        expectedFreshnessDuration: p.expectedFreshnessDuration || `${p.shelfLifeDays} days room temperature`,
        harvestDate: harvestDateRef ? new Date(harvestDateRef).toISOString() : new Date().toISOString(),
        freshnessScore: freshness.percentage,
        freshnessStatus: freshness.status,
        freshnessLabel: freshness.label,
        isOrganic: p.isOrganic,
        farmingMethod: p.farmingMethod,
        inStock: p.inStock && Number(p.availableQuantity) > 0,
        availableQuantity: Number(p.availableQuantity),
        rating: Number(p.rating),
        reviewsCount: p.reviewsCount,
        nutritionHighlights: p.nutritionHighlights || [],
      };
    });

    return {
      id: farmer.id,
      name: farmer.user?.name || 'Local Cultivator',
      avatar:
        farmer.user?.avatar ||
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
      farmName: farmer.farmName,
      farmLocation: farmer.farmLocation,
      location: farmer.location || `${farmer.city}, ${farmer.state}`,
      city: farmer.city,
      state: farmer.state,
      pincode: farmer.pincode,
      hub: farmer.hub,
      distanceKm: Number(farmer.distanceKm || 2.5),
      farmingMethod: farmer.farmingMethod,
      yearsFarming: farmer.yearsFarming,
      acreage: Number(farmer.acreage || 5.0),
      mainCrops: farmer.mainCrops || [],
      farmDescription: farmer.farmDescription,
      story: farmer.story,
      soilPractices: farmer.soilPractices || [],
      waterSource: farmer.waterSource,
      certifications: farmer.certifications || [],
      coverImage:
        farmer.coverImage ||
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
      gallery: farmer.gallery || [],
      rating: Number(farmer.rating),
      reviewCount: farmer.reviewCount,
      isVerified: farmer.isVerified,
      joinedDate: farmer.approvedAt ? new Date(farmer.approvedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Verified Member',
      products: formattedProducts,
    };
  }
}

export const marketplaceService = new MarketplaceService();
