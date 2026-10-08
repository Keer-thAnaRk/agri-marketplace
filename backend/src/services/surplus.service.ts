import { Prisma, SurplusOfferStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { calculateFreshness } from '../utils/freshness';

export interface CreateSurplusInput {
  productId: string;
  batchId?: string;
  availableQuantity: number;
  discountPercent: number;
  expiryDate?: string | Date;
  expiryHours?: number;
  reason: string;
}

export interface UpdateSurplusInput {
  availableQuantity?: number;
  discountPercent?: number;
  expiryDate?: string | Date;
  reason?: string;
  status?: string;
}

/** Server-authoritative offer price from stored original + discount. Never trust a client price. */
export function computeSurplusOfferPrice(originalPrice: number, discountPercent: number): number {
  const original = Number(originalPrice);
  const discount = Number(discountPercent);
  if (!Number.isFinite(original) || original <= 0) return 1;
  const safeDiscount = Number.isFinite(discount) ? Math.min(90, Math.max(0, discount)) : 0;
  const raw = original * (1 - safeDiscount / 100);
  const rounded = Math.round(raw * 100) / 100;
  return Math.max(1, Number.isFinite(rounded) ? rounded : 1);
}

export function mapSurplusStatusToFrontend(
  status: SurplusOfferStatus
): 'Active' | 'Claimed' | 'Expired' | 'Cancelled' {
  switch (status) {
    case SurplusOfferStatus.ACTIVE:
      return 'Active';
    case SurplusOfferStatus.CLAIMED:
      return 'Claimed';
    case SurplusOfferStatus.EXPIRED:
      return 'Expired';
    case SurplusOfferStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Active';
  }
}

export function mapSurplusStatusToPrisma(status?: string): SurplusOfferStatus {
  if (!status) return SurplusOfferStatus.ACTIVE;
  const s = status.trim().toUpperCase();
  if (s === 'ACTIVE') return SurplusOfferStatus.ACTIVE;
  if (s === 'CLAIMED') return SurplusOfferStatus.CLAIMED;
  if (s === 'EXPIRED') return SurplusOfferStatus.EXPIRED;
  if (s === 'CANCELLED') return SurplusOfferStatus.CANCELLED;
  return SurplusOfferStatus.ACTIVE;
}

export function formatSurplusOfferResponse(offer: any) {
  const product = offer.product;
  const batch = offer.batch;
  const availableQty = Math.max(0, Number(offer.availableQuantity));
  const originalPrice = Number(offer.originalPrice);
  const offerPrice = computeSurplusOfferPrice(originalPrice, offer.discountPercent);

  const expiryTime = new Date(offer.expiryDate).getTime();
  const now = Date.now();
  const msRemaining = expiryTime - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  const harvestDate = batch?.harvestDate || product?.harvestDate || null;
  const shelfLife = batch?.expectedShelfLifeDays || product?.shelfLifeDays || 6;
  const freshness = calculateFreshness(harvestDate, shelfLife);

  return {
    id: offer.id,
    offerId: offer.offerCode,
    offerCode: offer.offerCode,
    productId: offer.productId,
    productName: product?.name || 'Produce Lot',
    productImage:
      product?.images?.[0] ||
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    batchId: offer.batchId,
    batchNumber: batch?.batchNumber || null,
    availableQuantity: availableQty,
    unit: offer.unit || product?.unitShort || 'kg',
    originalPrice,
    discountPercent: offer.discountPercent,
    offerPrice,
    expiryDate: offer.expiryDate ? new Date(offer.expiryDate).toISOString() : new Date().toISOString(),
    daysRemaining,
    freshnessPercentage: freshness.percentage,
    reason: offer.reason,
    status: mapSurplusStatusToFrontend(offer.status),
    rawStatus: offer.status,
    farmerId: offer.farmerId,
    createdAt: offer.createdAt ? new Date(offer.createdAt).toISOString() : new Date().toISOString(),
  };
}

export class SurplusService {
  /**
   * Helper: Automatically mark active offers whose expiryDate has passed as EXPIRED.
   */
  async expireOverdueOffers(): Promise<void> {
    await prisma.surplusOffer.updateMany({
      where: {
        status: SurplusOfferStatus.ACTIVE,
        expiryDate: { lt: new Date() },
      },
      data: {
        status: SurplusOfferStatus.EXPIRED,
      },
    });
  }

  /**
   * Generate sequential/unique offer code: SO-YYYY-XXXX
   */
  async generateOfferCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.surplusOffer.count({
      where: {
        offerCode: { startsWith: `SO-${year}-` },
      },
    });

    let nextNum = count + 1;
    let candidate = `SO-${year}-${String(nextNum).padStart(4, '0')}`;

    const exists = await prisma.surplusOffer.findUnique({
      where: { offerCode: candidate },
    });

    if (exists) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      candidate = `SO-${year}-${rand}`;
    }

    return candidate;
  }

  /**
   * GET /api/surplus (Public / Consumer Marketplace)
   * Returns active, non-expired surplus offers from verified farmers in PostgreSQL.
   */
  async getPublicSurplusOffers(filters: {
    category?: string;
    search?: string;
    minDiscount?: number | string;
    sortBy?: string;
    page?: number | string;
    limit?: number | string;
  } = {}) {
    await this.expireOverdueOffers();

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));

    const where: Prisma.SurplusOfferWhereInput = {
      status: SurplusOfferStatus.ACTIVE,
      expiryDate: { gt: new Date() },
      availableQuantity: { gt: 0 },
      farmer: {
        isVerified: true,
        verificationStatus: 'APPROVED',
        user: { isActive: true },
      },
      product: {
        status: 'ACTIVE',
      },
    };

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { offerCode: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
        { farmer: { farmName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (filters.minDiscount && !isNaN(Number(filters.minDiscount))) {
      where.discountPercent = { gte: Number(filters.minDiscount) };
    }

    let orderBy: Prisma.SurplusOfferOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.sortBy === 'discount_high' || filters.sortBy === 'highest_discount') {
      orderBy = { discountPercent: 'desc' };
    } else if (filters.sortBy === 'price_low') {
      orderBy = { offerPrice: 'asc' };
    } else if (filters.sortBy === 'expiry_soon' || filters.sortBy === 'expiring_soon') {
      orderBy = { expiryDate: 'asc' };
    }

    const [total, offers] = await Promise.all([
      prisma.surplusOffer.count({ where }),
      prisma.surplusOffer.findMany({
        where,
        include: {
          product: true,
          batch: true,
          farmer: {
            include: {
              user: {
                select: { name: true, avatar: true },
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      offers: offers.map((o) => {
        const formatted = formatSurplusOfferResponse(o);
        return {
          ...formatted,
          farmerName: o.farmer.user?.name || o.farmer.farmName,
          farmName: o.farmer.farmName,
          farmLocation: o.farmer.location || `${o.farmer.city}, ${o.farmer.state}`,
        };
      }),
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
   * GET /api/surplus/:id (Public / Consumer single offer detail)
   */
  async getPublicSurplusOfferById(offerId: string) {
    await this.expireOverdueOffers();

    const offer = await prisma.surplusOffer.findFirst({
      where: {
        OR: [{ id: offerId }, { offerCode: offerId }],
        status: SurplusOfferStatus.ACTIVE,
        expiryDate: { gt: new Date() },
      },
      include: {
        product: true,
        batch: true,
        farmer: {
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!offer) {
      throw {
        status: 404,
        message: `Active surplus offer "${offerId}" not found or has expired.`,
      };
    }

    const formatted = formatSurplusOfferResponse(offer);
    return {
      ...formatted,
      farmerName: offer.farmer.user?.name || offer.farmer.farmName,
      farmName: offer.farmer.farmName,
      farmLocation: offer.farmer.location || `${offer.farmer.city}, ${offer.farmer.state}`,
    };
  }

  /**
   * GET /api/farmer/surplus
   * Return ONLY surplus offers belonging to the authenticated farmer.
   */
  async getFarmerSurplusOffers(farmerId: string) {
    // 1. Mark expired offers
    await this.expireOverdueOffers();

    // 2. Query scoped offers
    const offers = await prisma.surplusOffer.findMany({
      where: { farmerId },
      include: {
        product: true,
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return offers.map(formatSurplusOfferResponse);
  }

  /**
   * GET /api/farmer/surplus/:id
   * Return single surplus offer for the owning farmer.
   */
  async getFarmerSurplusOfferById(farmerId: string, offerId: string) {
    await this.expireOverdueOffers();

    const offer = await prisma.surplusOffer.findFirst({
      where: {
        farmerId,
        OR: [{ id: offerId }, { offerCode: offerId }],
      },
      include: {
        product: true,
        batch: true,
      },
    });

    if (!offer) {
      throw {
        status: 404,
        message: `Surplus offer "${offerId}" not found.`,
      };
    }

    return formatSurplusOfferResponse(offer);
  }

  /**
   * POST /api/farmer/surplus
   * Creates a surplus flash offer in PostgreSQL for an approved farmer.
   */
  async createSurplusOffer(farmerId: string, input: CreateSurplusInput) {
    // 1. Validate quantity
    const quantity = Number(input.availableQuantity);
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      throw {
        status: 400,
        message: 'Surplus quantity must be a positive number greater than 0.',
      };
    }

    // 2. Validate discount percentage
    const discount = Number(input.discountPercent);
    if (isNaN(discount) || discount < 5 || discount > 90) {
      throw {
        status: 400,
        message: 'Discount percentage must be an integer between 5% and 90%.',
      };
    }

    // 3. Validate reason
    const reason = (input.reason || '').trim();
    if (!reason) {
      throw {
        status: 400,
        message: 'Surplus reason is required to justify consumer flash discounting.',
      };
    }

    // 4. Validate & calculate expiry date
    let resolvedExpiry: Date;
    if (input.expiryDate) {
      resolvedExpiry = new Date(input.expiryDate);
      if (isNaN(resolvedExpiry.getTime())) {
        throw { status: 400, message: 'Invalid expiry date format.' };
      }
      if (resolvedExpiry.getTime() <= Date.now()) {
        throw { status: 400, message: 'Expiry date must be in the future.' };
      }
    } else if (input.expiryHours && input.expiryHours > 0) {
      resolvedExpiry = new Date(Date.now() + input.expiryHours * 3600 * 1000);
    } else {
      // Default: 24 hours
      resolvedExpiry = new Date(Date.now() + 24 * 3600 * 1000);
    }

    // 5. Product verification & ownership
    if (!input.productId) {
      throw { status: 400, message: 'Product ID is required.' };
    }

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      throw { status: 404, message: 'Product not found.' };
    }

    if (product.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: Product does not belong to your farm.',
      };
    }

    // 6. Inventory Safety Check: offered quantity <= available stock
    const invItem = product.inventory;
    const availableStock = invItem
      ? Number(invItem.availableQuantity)
      : Number(product.availableQuantity);

    if (quantity > availableStock) {
      throw {
        status: 400,
        message: `Offered surplus quantity (${quantity}) cannot exceed available stock (${availableStock}).`,
      };
    }

    // 7. Harvest Batch verification if batchId is provided
    let verifiedBatch: any = null;
    if (input.batchId) {
      verifiedBatch = await prisma.harvestBatch.findUnique({
        where: { id: input.batchId },
      });

      if (!verifiedBatch) {
        throw { status: 404, message: 'Harvest batch not found.' };
      }

      if (verifiedBatch.farmerId !== farmerId) {
        throw {
          status: 403,
          message: 'Access denied: Harvest batch does not belong to your farm.',
        };
      }

      if (verifiedBatch.productId !== input.productId) {
        throw {
          status: 400,
          message: 'Harvest batch does not belong to the selected product.',
        };
      }

      const batchAvailable = Number(verifiedBatch.availableQuantity);
      if (quantity > batchAvailable) {
        throw {
          status: 400,
          message: `Offered surplus quantity (${quantity}) cannot exceed available batch quantity (${batchAvailable}).`,
        };
      }
    }

    // 8. Server-side price calculation (NEVER trust offerPrice from frontend)
    const originalPrice = Number(product.price);
    const offerPrice = computeSurplusOfferPrice(originalPrice, discount);

    // 9. Generate unique offerCode
    const offerCode = await this.generateOfferCode();

    // 10. Persist SurplusOffer in PostgreSQL
    const created = await prisma.surplusOffer.create({
      data: {
        offerCode,
        farmerId,
        productId: input.productId,
        batchId: input.batchId || null,
        availableQuantity: new Prisma.Decimal(quantity),
        unit: product.unitShort || product.unit || 'kg',
        originalPrice: new Prisma.Decimal(originalPrice),
        discountPercent: Math.round(discount),
        offerPrice: new Prisma.Decimal(offerPrice),
        expiryDate: resolvedExpiry,
        reason,
        status: SurplusOfferStatus.ACTIVE,
      },
      include: {
        product: true,
        batch: true,
      },
    });

    return formatSurplusOfferResponse(created);
  }

  /**
   * PATCH /api/farmer/surplus/:id
   * Modify an active surplus offer belonging to the authenticated farmer.
   */
  async updateSurplusOffer(
    farmerId: string,
    offerId: string,
    input: UpdateSurplusInput
  ) {
    await this.expireOverdueOffers();

    const offer = await prisma.surplusOffer.findFirst({
      where: {
        OR: [{ id: offerId }, { offerCode: offerId }],
      },
      include: {
        product: { include: { inventory: true } },
        batch: true,
      },
    });

    if (!offer) {
      throw { status: 404, message: `Surplus offer "${offerId}" not found.` };
    }

    if (offer.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: Surplus offer does not belong to your farm.',
      };
    }

    const updateData: any = {};

    // 1. Status update (e.g. CLAIMED, CANCELLED)
    if (input.status) {
      updateData.status = mapSurplusStatusToPrisma(input.status);
    }

    // 2. Quantity update with inventory safety check
    if (input.availableQuantity !== undefined) {
      const newQty = Number(input.availableQuantity);
      if (isNaN(newQty) || newQty <= 0) {
        throw { status: 400, message: 'Available quantity must be greater than 0.' };
      }

      const invItem = offer.product.inventory;
      const stock = invItem
        ? Number(invItem.availableQuantity)
        : Number(offer.product.availableQuantity);

      if (newQty > stock) {
        throw {
          status: 400,
          message: `Updated surplus quantity (${newQty}) cannot exceed available stock (${stock}).`,
        };
      }

      if (offer.batch) {
        const batchStock = Number(offer.batch.availableQuantity);
        if (newQty > batchStock) {
          throw {
            status: 400,
            message: `Updated surplus quantity (${newQty}) cannot exceed batch stock (${batchStock}).`,
          };
        }
      }

      updateData.availableQuantity = new Prisma.Decimal(newQty);
    }

    // 3. Discount percent update & server-side offerPrice recalculation
    if (input.discountPercent !== undefined) {
      const discount = Number(input.discountPercent);
      if (isNaN(discount) || discount < 5 || discount > 90) {
        throw {
          status: 400,
          message: 'Discount percentage must be between 5% and 90%.',
        };
      }

      const originalPrice = Number(offer.originalPrice);
      const newOfferPrice = computeSurplusOfferPrice(originalPrice, discount);

      updateData.discountPercent = Math.round(discount);
      updateData.offerPrice = new Prisma.Decimal(newOfferPrice);
    }

    // 4. Expiry date update
    if (input.expiryDate) {
      const nextExpiry = new Date(input.expiryDate);
      if (isNaN(nextExpiry.getTime())) {
        throw { status: 400, message: 'Invalid expiry date format.' };
      }
      if (nextExpiry.getTime() <= Date.now()) {
        throw { status: 400, message: 'Expiry date must be in the future.' };
      }
      updateData.expiryDate = nextExpiry;
    }

    // 5. Reason update
    if (input.reason !== undefined) {
      const reason = input.reason.trim();
      if (!reason) {
        throw { status: 400, message: 'Reason cannot be empty.' };
      }
      updateData.reason = reason;
    }

    const updated = await prisma.surplusOffer.update({
      where: { id: offer.id },
      data: updateData,
      include: {
        product: true,
        batch: true,
      },
    });

    return formatSurplusOfferResponse(updated);
  }

  /**
   * DELETE /api/farmer/surplus/:id
   * Cancels an active surplus offer for the owning farmer.
   */
  async cancelSurplusOffer(farmerId: string, offerId: string) {
    const offer = await prisma.surplusOffer.findFirst({
      where: {
        OR: [{ id: offerId }, { offerCode: offerId }],
      },
    });

    if (!offer) {
      throw { status: 404, message: `Surplus offer "${offerId}" not found.` };
    }

    if (offer.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: Surplus offer does not belong to your farm.',
      };
    }

    const cancelled = await prisma.surplusOffer.update({
      where: { id: offer.id },
      data: { status: SurplusOfferStatus.CANCELLED },
      include: {
        product: true,
        batch: true,
      },
    });

    return formatSurplusOfferResponse(cancelled);
  }
}

export const surplusService = new SurplusService();
