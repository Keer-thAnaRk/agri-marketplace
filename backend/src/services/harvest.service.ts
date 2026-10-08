import QRCode from 'qrcode';
import {
  Prisma,
  HarvestStatus,
  TraceabilityStep,
  FarmingMethod,
  InventoryStatus,
  InventoryLogType,
  ProductStatus,
} from '@prisma/client';
import { prisma } from '../db/prisma';
import { calculateFreshness } from '../utils/freshness';
import {
  mapCategoryToFrontend,
  mapFarmingMethodToFrontend,
  mapFarmingMethodToPrisma,
} from './product.service';

export interface CreateHarvestInput {
  productId: string;
  productName?: string;
  quantity: number;
  availableQuantity?: number;
  unit?: string;
  harvestDate?: string | Date;
  batchNumber?: string;
  farmingMethod?: string;
  location?: string;
  expectedShelfLifeDays?: number;
  expectedFreshness?: number;
  notes?: string;
}

export interface CreateTraceEventInput {
  step: string;
  title: string;
  location?: string;
  timestamp?: string | Date;
  details: string;
  verifiedBy?: string;
  actor?: string;
  orderIndex?: number;
}

export function mapHarvestStatusToPrisma(status?: string): HarvestStatus {
  if (!status) return HarvestStatus.AVAILABLE;
  const s = status.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'AVAILABLE') return HarvestStatus.AVAILABLE;
  if (s === 'LOW_STOCK') return HarvestStatus.LOW_STOCK;
  if (s === 'SOLD_OUT') return HarvestStatus.SOLD_OUT;
  if (s === 'SURPLUS') return HarvestStatus.SURPLUS;
  if (s === 'EXPIRED') return HarvestStatus.EXPIRED;
  if (s === 'DEPLETED') return HarvestStatus.DEPLETED;
  return HarvestStatus.AVAILABLE;
}

export function mapHarvestStatusToFrontend(
  status: HarvestStatus
): 'Available' | 'Low Stock' | 'Sold Out' | 'Surplus' | 'Expired' | 'Depleted' {
  switch (status) {
    case HarvestStatus.AVAILABLE:
      return 'Available';
    case HarvestStatus.LOW_STOCK:
      return 'Low Stock';
    case HarvestStatus.SOLD_OUT:
      return 'Sold Out';
    case HarvestStatus.SURPLUS:
      return 'Surplus';
    case HarvestStatus.EXPIRED:
      return 'Expired';
    case HarvestStatus.DEPLETED:
      return 'Depleted';
    default:
      return 'Available';
  }
}

export function mapTraceStepToPrisma(step?: string): TraceabilityStep {
  if (!step) return TraceabilityStep.FARM_ORIGIN;
  const s = step.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (s.includes('ORIGIN') || s.includes('FARM') || s.includes('SEED')) {
    return TraceabilityStep.FARM_ORIGIN;
  }
  if (s.includes('HARVEST')) return TraceabilityStep.HARVEST;
  if (s.includes('PACK')) return TraceabilityStep.PACK;
  if (s.includes('DISPATCH') || s.includes('SHIP')) return TraceabilityStep.DISPATCH;
  if (s.includes('DELIVER')) return TraceabilityStep.DELIVERY;
  return TraceabilityStep.FARM_ORIGIN;
}

export function validateTraceEventInput(input: any): {
  step: TraceabilityStep;
  title: string;
  details: string;
  location?: string;
  timestamp: Date;
  verifiedBy?: string;
  actor?: string;
  orderIndex?: number;
} {
  if (!input || typeof input !== 'object') {
    throw { status: 400, message: 'Event data is required.' };
  }

  // 1. Step validation
  if (!input.step || typeof input.step !== 'string' || !input.step.trim()) {
    throw { status: 400, message: 'Traceability step is required.' };
  }

  const rawStep = input.step.trim().toUpperCase().replace(/[\s-]+/g, '_');
  let step: TraceabilityStep;
  if (rawStep === 'FARM_ORIGIN' || rawStep === 'FARM' || rawStep === 'SEED' || rawStep === 'ORIGIN') {
    step = TraceabilityStep.FARM_ORIGIN;
  } else if (rawStep === 'HARVEST') {
    step = TraceabilityStep.HARVEST;
  } else if (rawStep === 'PACK' || rawStep === 'PACKING' || rawStep === 'PACKAGE') {
    step = TraceabilityStep.PACK;
  } else if (rawStep === 'DISPATCH' || rawStep === 'DISPATCHED' || rawStep === 'SHIPPED' || rawStep === 'SHIP') {
    step = TraceabilityStep.DISPATCH;
  } else if (rawStep === 'DELIVERY' || rawStep === 'DELIVERED') {
    step = TraceabilityStep.DELIVERY;
  } else {
    throw {
      status: 400,
      message: `Invalid traceability step: "${input.step}". Must be one of: FARM_ORIGIN, HARVEST, PACK, DISPATCH, DELIVERY.`,
    };
  }

  // 2. Title validation
  if (!input.title || typeof input.title !== 'string' || !input.title.trim()) {
    throw { status: 400, message: 'Traceability event title is required.' };
  }

  // 3. Details validation
  if (!input.details || typeof input.details !== 'string' || !input.details.trim()) {
    throw { status: 400, message: 'Traceability event details are required.' };
  }

  // 4. Timestamp validation
  let timestamp: Date = new Date();
  if (input.timestamp !== undefined && input.timestamp !== null) {
    const parsed = new Date(input.timestamp);
    if (isNaN(parsed.getTime())) {
      throw { status: 400, message: 'Invalid timestamp format provided.' };
    }
    timestamp = parsed;
  }

  // 5. OrderIndex validation
  let orderIndex: number | undefined = undefined;
  if (input.orderIndex !== undefined && input.orderIndex !== null) {
    const idx = Number(input.orderIndex);
    if (isNaN(idx) || idx < 0 || !Number.isInteger(idx)) {
      throw { status: 400, message: 'orderIndex must be a non-negative integer.' };
    }
    orderIndex = idx;
  }

  return {
    step,
    title: input.title.trim(),
    details: input.details.trim(),
    location: input.location && typeof input.location === 'string' ? input.location.trim() : undefined,
    timestamp,
    verifiedBy: input.verifiedBy && typeof input.verifiedBy === 'string' ? input.verifiedBy.trim() : undefined,
    actor: input.actor && typeof input.actor === 'string' ? input.actor.trim() : undefined,
    orderIndex,
  };
}

export function mapTraceStepToFrontend(
  step: TraceabilityStep
): 'farm' | 'harvest' | 'pack' | 'dispatch' | 'delivery' {
  switch (step) {
    case TraceabilityStep.FARM_ORIGIN:
      return 'farm';
    case TraceabilityStep.HARVEST:
      return 'harvest';
    case TraceabilityStep.PACK:
      return 'pack';
    case TraceabilityStep.DISPATCH:
      return 'dispatch';
    case TraceabilityStep.DELIVERY:
      return 'delivery';
    default:
      return 'farm';
  }
}

export function formatHarvestResponse(batch: any) {
  const product = batch.product;
  const farmer = batch.farmer;
  const quantity = Number(batch.quantity);
  const availableQuantity = Number(batch.availableQuantity);
  const shelfLife = batch.expectedShelfLifeDays || product?.shelfLifeDays || 6;
  const freshness = calculateFreshness(batch.harvestDate, shelfLife);

  return {
    id: batch.id,
    harvestId: batch.id,
    productId: batch.productId,
    productName: product?.name || 'Produce Batch',
    productImage:
      product?.images?.[0] ||
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    farmerId: batch.farmerId,
    farmId: batch.farmerId,
    farmName: farmer?.farmName || 'Organic Farm',
    farmerName: farmer?.user?.name || '',
    farmerAvatar: farmer?.user?.avatar || '',
    batchNumber: batch.batchNumber,
    harvestDate: batch.harvestDate
      ? new Date(batch.harvestDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Today',
    harvestDateIso: batch.harvestDate ? new Date(batch.harvestDate).toISOString() : new Date().toISOString(),
    quantity,
    harvestedQuantity: quantity,
    availableQuantity,
    unit: batch.unit,
    farmingMethod: mapFarmingMethodToFrontend(batch.farmingMethod),
    rawFarmingMethod: batch.farmingMethod,
    expectedShelfLife: shelfLife,
    expectedFreshness: batch.expectedFreshness || freshness.percentage,
    freshnessScore: freshness.percentage,
    freshnessStatus: freshness.status,
    daysRemaining: freshness.daysRemaining,
    status: mapHarvestStatusToFrontend(batch.status),
    rawStatus: batch.status,
    qrCodeUrl: batch.qrCodeUrl,
    notes: batch.notes || '',
    createdAt: batch.createdAt ? new Date(batch.createdAt).toISOString() : new Date().toISOString(),
    traceabilityEvents: batch.traceabilityEvents?.map((evt: any) => ({
      eventId: evt.id,
      id: evt.id,
      batchId: evt.batchId,
      step: mapTraceStepToFrontend(evt.step),
      rawStep: evt.step,
      title: evt.title,
      location: evt.location,
      timestamp: evt.timestamp ? new Date(evt.timestamp).toISOString() : new Date().toISOString(),
      details: evt.details,
      completed: evt.completed,
      verifiedBy: evt.verifiedBy,
      actor: evt.actor,
      orderIndex: evt.orderIndex,
    })),
  };
}

export class HarvestService {
  /**
   * Generates a unique batch identifier (e.g. HAR-YYYYMMDD-XXXX).
   */
  private generateBatchNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HAR-${dateStr}-${rand}`;
  }

  /**
   * Generates a QR Code as a Data URL for the public traceability page.
   */
  async generateQRCode(batchNumber: string): Promise<string> {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const traceUrl = `${baseUrl}/trace/${encodeURIComponent(batchNumber)}`;
    return QRCode.toDataURL(traceUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#143621',
        light: '#FFFFFF',
      },
    });
  }

  /**
   * Retrieves all harvest batches for the authenticated farmer.
   */
  async getFarmerHarvests(farmerId: string) {
    const harvests = await prisma.harvestBatch.findMany({
      where: { farmerId },
      include: {
        product: true,
        farmer: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
        traceabilityEvents: {
          orderBy: [{ orderIndex: 'asc' }, { timestamp: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return harvests.map(formatHarvestResponse);
  }

  /**
   * Retrieves a single harvest batch for the authenticated farmer by ID or batchNumber.
   */
  async getFarmerHarvestById(farmerId: string, harvestIdOrBatchNumber: string) {
    const batch = await prisma.harvestBatch.findFirst({
      where: {
        OR: [{ id: harvestIdOrBatchNumber }, { batchNumber: harvestIdOrBatchNumber }],
      },
      include: {
        product: true,
        farmer: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
        traceabilityEvents: {
          orderBy: [{ orderIndex: 'asc' }, { timestamp: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!batch) {
      throw {
        status: 404,
        message: `Harvest batch "${harvestIdOrBatchNumber}" not found.`,
      };
    }

    if (batch.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: You cannot view another farmer’s harvest batch.',
      };
    }

    if (!batch.qrCodeUrl) {
      const qrCodeUrl = await this.generateQRCode(batch.batchNumber);
      await prisma.harvestBatch.update({
        where: { id: batch.id },
        data: { qrCodeUrl },
      });
      batch.qrCodeUrl = qrCodeUrl;
    }

    return formatHarvestResponse(batch);
  }

  /**
   * Retrieves traceability events for a batch owned by the authenticated farmer.
   */
  async getTraceabilityEvents(farmerId: string, batchId: string) {
    const batch = await prisma.harvestBatch.findFirst({
      where: {
        OR: [{ id: batchId }, { batchNumber: batchId }],
      },
      include: {
        traceabilityEvents: {
          orderBy: [{ orderIndex: 'asc' }, { timestamp: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!batch) {
      throw {
        status: 404,
        message: `Harvest batch "${batchId}" not found.`,
      };
    }

    if (batch.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: You cannot view another farmer’s traceability events.',
      };
    }

    return batch.traceabilityEvents.map((evt) => ({
      eventId: evt.id,
      id: evt.id,
      batchId: evt.batchId,
      step: mapTraceStepToFrontend(evt.step),
      rawStep: evt.step,
      title: evt.title,
      location: evt.location,
      timestamp: evt.timestamp ? new Date(evt.timestamp).toISOString() : new Date().toISOString(),
      details: evt.details,
      completed: evt.completed,
      verifiedBy: evt.verifiedBy,
      actor: evt.actor,
      orderIndex: evt.orderIndex,
    }));
  }

  /**
   * Creates a new harvest batch, initial traceability events, generates QR code,
   * and synchronizes inventory and product stock in a single atomic transaction.
   */
  async createHarvest(farmerId: string, input: CreateHarvestInput) {
    // 1. Validation
    if (!input.productId) {
      throw { status: 400, message: 'Product ID is required for harvest batch.' };
    }
    const qty = Number(input.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw { status: 400, message: 'Harvest quantity must be greater than zero.' };
    }

    const availableQty =
      input.availableQuantity !== undefined ? Number(input.availableQuantity) : qty;
    if (isNaN(availableQty) || availableQty < 0) {
      throw { status: 400, message: 'Available quantity cannot be negative.' };
    }

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      include: { inventory: true },
    });

    if (!product) {
      throw { status: 404, message: `Product ${input.productId} not found.` };
    }

    if (product.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: You cannot record harvests for another farmer’s produce.',
      };
    }

    // Verify farmer profile
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      include: { user: { select: { name: true, avatar: true } } },
    });

    if (!farmer) {
      throw { status: 404, message: `Farmer record ${farmerId} not found.` };
    }

    // Parse harvest date
    let harvestDate: Date = new Date();
    if (input.harvestDate) {
      const parsed = new Date(input.harvestDate);
      if (!isNaN(parsed.getTime())) {
        harvestDate = parsed;
      }
    }

    // Unique batch number
    let batchNumber = input.batchNumber?.trim();
    if (!batchNumber) {
      batchNumber = this.generateBatchNumber();
    }

    // Ensure batch number uniqueness
    const existing = await prisma.harvestBatch.findUnique({ where: { batchNumber } });
    if (existing) {
      batchNumber = `${batchNumber}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Generate QR Code data URL pointing to public trace endpoint
    const qrCodeUrl = await this.generateQRCode(batchNumber);

    const shelfLifeDays = input.expectedShelfLifeDays || product.shelfLifeDays || 6;
    const freshness = calculateFreshness(harvestDate, shelfLifeDays);
    const expectedFreshness = input.expectedFreshness || freshness.percentage;

    // Determine initial status
    let status: HarvestStatus = HarvestStatus.AVAILABLE;
    if (freshness.isExpired) {
      status = HarvestStatus.EXPIRED;
    } else if (availableQty <= 0) {
      status = HarvestStatus.SOLD_OUT;
    } else if (availableQty <= 15) {
      status = HarvestStatus.LOW_STOCK;
    }

    const unit = input.unit || product.unitShort || 'kg';
    const methodEnum = input.farmingMethod
      ? mapFarmingMethodToPrisma(input.farmingMethod)
      : product.farmingMethod || farmer.farmingMethod;

    const locationText = input.location || farmer.location || farmer.farmLocation || 'Farm Origin';

    // 2. Atomic Database Transaction: HarvestBatch + Events + Inventory + Product
    const result = await prisma.$transaction(async (tx) => {
      // Create HarvestBatch
      const createdBatch = await tx.harvestBatch.create({
        data: {
          batchNumber,
          farmerId,
          productId: product.id,
          harvestDate,
          quantity: new Prisma.Decimal(qty),
          availableQuantity: new Prisma.Decimal(availableQty),
          unit,
          farmingMethod: methodEnum,
          location: locationText,
          expectedShelfLifeDays: shelfLifeDays,
          expectedFreshness,
          status,
          qrCodeUrl,
          notes: input.notes?.trim() || null,
        },
      });

      // Initial Step 1: FARM_ORIGIN Traceability Event
      await tx.traceabilityEvent.create({
        data: {
          batchId: createdBatch.id,
          step: TraceabilityStep.FARM_ORIGIN,
          title: 'Indigenous Seed Sowing & Organic Cultivation',
          location: `${farmer.farmName} • ${locationText}`,
          timestamp: new Date(harvestDate.getTime() - 60 * 24 * 60 * 60 * 1000), // ~60 days prior sowing
          details: `Planted using certified heirloom non-hybrid seeds. Soil enriched using traditional Jeevamrutha culture at ${farmer.farmName}.`,
          verifiedBy: 'Krishi Farm Verification Team',
          actor: farmer.user.name,
          orderIndex: 1,
          completed: true,
        },
      });

      // Initial Step 2: HARVEST Traceability Event
      await tx.traceabilityEvent.create({
        data: {
          batchId: createdBatch.id,
          step: TraceabilityStep.HARVEST,
          title: 'Dawn Hand Harvest',
          location: `${farmer.farmName} Packhouse`,
          timestamp: harvestDate,
          details: `Harvested at first light for peak cellular moisture and nutrition. Yield: ${qty} ${unit}. Verified Grade-A freshness.`,
          verifiedBy: `Lead Farmer: ${farmer.user.name}`,
          actor: farmer.user.name,
          orderIndex: 2,
          completed: true,
        },
      });

      // Synchronize InventoryItem: find or create
      let invItem = await tx.inventoryItem.findUnique({
        where: { productId: product.id },
      });

      if (!invItem) {
        invItem = await tx.inventoryItem.create({
          data: {
            productId: product.id,
            farmerId,
            currentStock: new Prisma.Decimal(availableQty),
            availableQuantity: new Prisma.Decimal(availableQty),
            reservedQuantity: new Prisma.Decimal(0),
            soldQuantity: new Prisma.Decimal(0),
            threshold: product.lowStockThreshold || new Prisma.Decimal(10),
            status:
              availableQty <= 0
                ? InventoryStatus.OUT_OF_STOCK
                : availableQty <= Number(product.lowStockThreshold || 10)
                ? InventoryStatus.LOW_STOCK
                : InventoryStatus.IN_STOCK,
          },
        });
      } else {
        const newAvailable = Number(invItem.availableQuantity) + availableQty;
        const newCurrent = Number(invItem.currentStock) + availableQty;
        const thresh = Number(invItem.threshold);
        const invStatus =
          newAvailable <= 0
            ? InventoryStatus.OUT_OF_STOCK
            : newAvailable <= thresh
            ? InventoryStatus.LOW_STOCK
            : InventoryStatus.IN_STOCK;

        invItem = await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: {
            availableQuantity: new Prisma.Decimal(newAvailable),
            currentStock: new Prisma.Decimal(newCurrent),
            status: invStatus,
            lastUpdated: new Date(),
          },
        });
      }

      // Record InventoryLog for incoming harvest stock
      await tx.inventoryLog.create({
        data: {
          inventoryItemId: invItem.id,
          type: InventoryLogType.HARVEST_INCOMING,
          amount: new Prisma.Decimal(availableQty),
          newQuantity: invItem.availableQuantity,
          reason: `Fresh harvest batch ${batchNumber} added to packhouse inventory`,
          createdAt: new Date(),
        },
      });

      // Synchronize Product model
      const updatedProductAvailable = Number(product.availableQuantity) + availableQty;
      await tx.product.update({
        where: { id: product.id },
        data: {
          availableQuantity: new Prisma.Decimal(updatedProductAvailable),
          inStock: true,
          harvestDate,
          shelfLifeDays,
        },
      });

      // Fetch complete batch with relations to return
      return tx.harvestBatch.findUnique({
        where: { id: createdBatch.id },
        include: {
          product: true,
          farmer: {
            include: {
              user: { select: { name: true, avatar: true } },
            },
          },
          traceabilityEvents: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return formatHarvestResponse(result);
  }

  /**
   * Adds a traceability event to a harvest batch owned by the authenticated farmer.
   */
  async addTraceabilityEvent(
    farmerId: string,
    batchId: string,
    input: CreateTraceEventInput
  ) {
    const validated = validateTraceEventInput(input);

    const batch = await prisma.harvestBatch.findFirst({
      where: {
        OR: [{ id: batchId }, { batchNumber: batchId }],
      },
      include: {
        traceabilityEvents: { orderBy: { orderIndex: 'desc' }, take: 1 },
      },
    });

    if (!batch) {
      throw {
        status: 404,
        message: `Harvest batch "${batchId}" not found.`,
      };
    }

    if (batch.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: You cannot add events to another farmer’s harvest batch.',
      };
    }

    const lastIndex = batch.traceabilityEvents[0]?.orderIndex || 0;
    const orderIndex = validated.orderIndex !== undefined ? validated.orderIndex : lastIndex + 1;

    const event = await prisma.traceabilityEvent.create({
      data: {
        batchId: batch.id,
        step: validated.step,
        title: validated.title,
        location: validated.location || batch.location || 'Processing Center',
        timestamp: validated.timestamp,
        details: validated.details,
        verifiedBy: validated.verifiedBy || null,
        actor: validated.actor || null,
        orderIndex,
        completed: true,
      },
    });

    return {
      eventId: event.id,
      id: event.id,
      batchId: event.batchId,
      step: mapTraceStepToFrontend(event.step),
      rawStep: event.step,
      title: event.title,
      location: event.location,
      timestamp: event.timestamp.toISOString(),
      details: event.details,
      completed: event.completed,
      verifiedBy: event.verifiedBy,
      actor: event.actor,
      orderIndex: event.orderIndex,
    };
  }

  /**
   * Public traceability query endpoint.
   * Scannable by consumers via QR code. Exposes safe public data only.
   */
  async getPublicTrace(batchId: string) {
    const lookup = (batchId || '').trim();
    if (!lookup) {
      throw {
        status: 404,
        message: 'Traceability record for batch not found.',
      };
    }

    const batch = await prisma.harvestBatch.findFirst({
      where: {
        OR: [{ batchNumber: lookup }, { id: lookup }],
      },
      include: {
        product: true,
        farmer: {
          select: {
            id: true,
            farmName: true,
            location: true,
            city: true,
            state: true,
            farmingMethod: true,
            yearsFarming: true,
            certifications: true,
            soilPractices: true,
            waterSource: true,
            isVerified: true,
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        traceabilityEvents: {
          orderBy: [{ orderIndex: 'asc' }, { timestamp: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!batch) {
      throw {
        status: 404,
        message: `Traceability record for batch "${batchId}" not found.`,
      };
    }

    if (!batch.qrCodeUrl) {
      const qrCodeUrl = await this.generateQRCode(batch.batchNumber);
      await prisma.harvestBatch.update({
        where: { id: batch.id },
        data: { qrCodeUrl },
      });
      batch.qrCodeUrl = qrCodeUrl;
    }

    const shelfLife = batch.expectedShelfLifeDays || batch.product?.shelfLifeDays || 6;
    const freshness = calculateFreshness(batch.harvestDate, shelfLife);
    const productImages = batch.product?.images || [];
    const farmLocation = batch.farmer.location || `${batch.farmer.city}, ${batch.farmer.state}`;

    return {
      batchNumber: batch.batchNumber,
      batchId: batch.id,
      id: batch.id,
      productId: batch.productId,
      productName: batch.product?.name || 'Farm Produce',
      productImage: productImages[0] || null,
      category: batch.product ? mapCategoryToFrontend(batch.product.category) : 'Vegetables',
      farmName: batch.farmer.farmName,
      farmerName: batch.farmer.user.name,
      farmerAvatar: batch.farmer.user.avatar || '',
      farmLocation,
      farmingMethod: mapFarmingMethodToFrontend(batch.farmingMethod),
      location: batch.location || farmLocation,
      certifications: batch.farmer.certifications || [],
      soilPractices: batch.farmer.soilPractices || [],
      waterSource: batch.farmer.waterSource || null,
      product: {
        id: batch.productId,
        name: batch.product?.name || 'Farm Produce',
        category: batch.product ? mapCategoryToFrontend(batch.product.category) : 'Vegetables',
        images: productImages,
      },
      farm: {
        id: batch.farmer.id,
        farmName: batch.farmer.farmName,
        location: farmLocation,
        city: batch.farmer.city,
        state: batch.farmer.state,
        farmingMethod: mapFarmingMethodToFrontend(batch.farmer.farmingMethod),
        yearsFarming: batch.farmer.yearsFarming,
        isVerified: batch.farmer.isVerified,
        farmerName: batch.farmer.user.name,
        farmerAvatar: batch.farmer.user.avatar || '',
      },
      harvestDate: batch.harvestDate
        ? new Date(batch.harvestDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : null,
      harvestDateIso: batch.harvestDate ? new Date(batch.harvestDate).toISOString() : null,
      quantity: Number(batch.quantity),
      availableQuantity: Number(batch.availableQuantity),
      unit: batch.unit,
      expectedShelfLifeDays: shelfLife,
      expectedFreshness: batch.expectedFreshness,
      freshness: {
        percentage: freshness.percentage,
        status: freshness.status,
        daysRemaining: freshness.daysRemaining,
        hoursAgo: freshness.hoursAgo,
        label: freshness.label,
        isApproachingExpiry: freshness.isApproachingExpiry,
        isExpired: freshness.isExpired,
      },
      qrTracePath: `/trace/${encodeURIComponent(batch.batchNumber)}`,
      status: mapHarvestStatusToFrontend(batch.status),
      qrCodeUrl: batch.qrCodeUrl,
      notes: batch.notes,
      traceabilityEvents: batch.traceabilityEvents.map((evt) => ({
        eventId: evt.id,
        id: evt.id,
        step: mapTraceStepToFrontend(evt.step),
        rawStep: evt.step,
        title: evt.title,
        location: evt.location,
        timestamp: evt.timestamp.toISOString(),
        details: evt.details,
        verifiedBy: evt.verifiedBy,
        actor: evt.actor,
        orderIndex: evt.orderIndex,
        completed: evt.completed,
      })),
    };
  }
}

export const harvestService = new HarvestService();
