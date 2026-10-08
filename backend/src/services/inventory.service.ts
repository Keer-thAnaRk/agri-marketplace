import {
  Prisma,
  InventoryStatus,
  InventoryLogType,
  ProductStatus,
} from '@prisma/client';
import { prisma } from '../db/prisma';
import { mapCategoryToFrontend } from './product.service';

export interface UpdateStockInput {
  delta?: number;
  quantity?: number;
  availableQuantity?: number;
  reason?: string;
  type?: string;
  threshold?: number;
}

export function mapInventoryStatusToPrisma(status?: string): InventoryStatus {
  if (!status) return InventoryStatus.IN_STOCK;
  const s = status.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'IN_STOCK') return InventoryStatus.IN_STOCK;
  if (s === 'LOW_STOCK') return InventoryStatus.LOW_STOCK;
  if (s === 'OUT_OF_STOCK') return InventoryStatus.OUT_OF_STOCK;
  if (s === 'EXPIRED') return InventoryStatus.EXPIRED;
  return InventoryStatus.IN_STOCK;
}

export function mapInventoryStatusToFrontend(
  status: InventoryStatus
): 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expired' {
  switch (status) {
    case InventoryStatus.IN_STOCK:
      return 'In Stock';
    case InventoryStatus.LOW_STOCK:
      return 'Low Stock';
    case InventoryStatus.OUT_OF_STOCK:
      return 'Out of Stock';
    case InventoryStatus.EXPIRED:
      return 'Expired';
    default:
      return 'In Stock';
  }
}

export function mapLogTypeToPrisma(
  type?: string,
  reason?: string,
  delta?: number
): InventoryLogType {
  if (type) {
    const t = type.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (t === 'ADD') return InventoryLogType.ADD;
    if (t === 'REMOVE') return InventoryLogType.REMOVE;
    if (t === 'ADJUSTMENT') return InventoryLogType.ADJUSTMENT;
    if (t === 'HARVEST_INCOMING') return InventoryLogType.HARVEST_INCOMING;
    if (t === 'SPOILAGE_DISCARD') return InventoryLogType.SPOILAGE_DISCARD;
    if (t === 'ORDER_RESERVED') return InventoryLogType.ORDER_RESERVED;
    if (t === 'ORDER_FULFILLED') return InventoryLogType.ORDER_FULFILLED;
  }
  const r = (reason || '').toLowerCase();
  if (
    r.includes('discard') ||
    r.includes('blemish') ||
    r.includes('spoil') ||
    r.includes('damage') ||
    r.includes('soft')
  ) {
    return InventoryLogType.SPOILAGE_DISCARD;
  }
  if (r.includes('harvest') || r.includes('picking') || r.includes('greenhouse')) {
    return InventoryLogType.HARVEST_INCOMING;
  }
  if (delta !== undefined) {
    if (delta > 0) return InventoryLogType.ADD;
    if (delta < 0) return InventoryLogType.REMOVE;
  }
  return InventoryLogType.ADJUSTMENT;
}

export function formatLastUpdated(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatInventoryResponse(item: any) {
  const product = item.product;
  const currentStock = Number(item.currentStock);
  const availableQuantity = Number(item.availableQuantity);
  const reservedQuantity = Number(item.reservedQuantity || 0);
  const soldQuantity = Number(item.soldQuantity || 0);
  const threshold = Number(item.threshold || product?.lowStockThreshold || 10);
  const price = product ? Number(product.price) : 0;
  const lastUpdatedDate = item.lastUpdated || item.updatedAt || new Date();

  return {
    id: item.id,
    productId: item.productId,
    productName: product?.name || 'Produce Item',
    productImage:
      product?.images?.[0] ||
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    category: product ? mapCategoryToFrontend(product.category) : 'Vegetables',
    unit: product?.unit || '1 kg',
    unitShort: product?.unitShort || 'kg',
    price,
    currentStock,
    availableQuantity,
    reservedQuantity,
    soldQuantity,
    threshold,
    status: mapInventoryStatusToFrontend(item.status),
    rawStatus: item.status,
    lastUpdated: formatLastUpdated(lastUpdatedDate),
    lastUpdatedIso: lastUpdatedDate.toISOString(),
    harvestBatch: product?.harvestBatch || undefined,
    harvestDate: product?.harvestDate ? new Date(product.harvestDate).toISOString() : undefined,
    shelfLifeDays: product?.shelfLifeDays || 6,
    logs: item.logs?.map((l: any) => ({
      id: l.id,
      type: l.type,
      amount: Number(l.amount),
      newQuantity: Number(l.newQuantity),
      reason: l.reason,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

export class InventoryService {
  /**
   * Retrieves inventory belonging ONLY to the authenticated farmer.
   * Ensures that any products lacking an InventoryItem have one initialized.
   */
  async getFarmerInventory(farmerId: string) {
    // 1. Find all products for this farmer that might be missing an inventory item
    const uninitializedProducts = await prisma.product.findMany({
      where: {
        farmerId,
        inventory: null,
      },
      select: {
        id: true,
        availableQuantity: true,
        lowStockThreshold: true,
      },
    });

    if (uninitializedProducts.length > 0) {
      await prisma.$transaction(
        uninitializedProducts.map((p) => {
          const qty = Number(p.availableQuantity);
          const thresh = Number(p.lowStockThreshold || 10);
          const status =
            qty <= 0
              ? InventoryStatus.OUT_OF_STOCK
              : qty <= thresh
              ? InventoryStatus.LOW_STOCK
              : InventoryStatus.IN_STOCK;

          return prisma.inventoryItem.upsert({
            where: { productId: p.id },
            update: {},
            create: {
              productId: p.id,
              farmerId,
              currentStock: p.availableQuantity,
              availableQuantity: p.availableQuantity,
              reservedQuantity: new Prisma.Decimal(0),
              soldQuantity: new Prisma.Decimal(0),
              threshold: new Prisma.Decimal(thresh),
              status,
            },
          });
        })
      );
    }

    // 2. Fetch full inventory items with products and recent audit logs
    const items = await prisma.inventoryItem.findMany({
      where: { farmerId },
      include: {
        product: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { lastUpdated: 'desc' },
    });

    return items.map(formatInventoryResponse);
  }

  /**
   * Retrieves single inventory record for a product owned by the authenticated farmer.
   */
  async getInventoryByProductId(farmerId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw { status: 404, message: `Product with ID ${productId} not found.` };
    }

    if (product.farmerId !== farmerId) {
      throw {
        status: 404,
        message: `Inventory item for product ${productId} not found.`,
      };
    }

    // Upsert to guarantee InventoryItem exists without duplicate error
    const item = await prisma.inventoryItem.upsert({
      where: { productId },
      update: {},
      create: {
        productId,
        farmerId,
        currentStock: product.availableQuantity,
        availableQuantity: product.availableQuantity,
        reservedQuantity: new Prisma.Decimal(0),
        soldQuantity: new Prisma.Decimal(0),
        threshold: product.lowStockThreshold || new Prisma.Decimal(10),
        status:
          Number(product.availableQuantity) <= 0
            ? InventoryStatus.OUT_OF_STOCK
            : Number(product.availableQuantity) <= Number(product.lowStockThreshold || 10)
            ? InventoryStatus.LOW_STOCK
            : InventoryStatus.IN_STOCK,
      },
      include: {
        product: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return formatInventoryResponse(item);
  }

  /**
   * Updates inventory stock level for an authenticated, approved farmer.
   * Recalculates currentStock, availableQuantity, and status.
   * Records an audit log in InventoryLog.
   * Keeps Product.availableQuantity and Product.inStock synchronized.
   */
  async updateStock(farmerId: string, productId: string, input: UpdateStockInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product) {
      throw { status: 404, message: `Product with ID ${productId} not found.` };
    }

    if (product.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: You are not authorized to modify inventory for another farmer.',
      };
    }

    // Ensure inventory item exists
    let inventory = product.inventory;
    if (!inventory) {
      inventory = await prisma.inventoryItem.create({
        data: {
          productId,
          farmerId,
          currentStock: product.availableQuantity,
          availableQuantity: product.availableQuantity,
          reservedQuantity: new Prisma.Decimal(0),
          soldQuantity: new Prisma.Decimal(0),
          threshold: product.lowStockThreshold || new Prisma.Decimal(10),
          status:
            Number(product.availableQuantity) <= 0
              ? InventoryStatus.OUT_OF_STOCK
              : Number(product.availableQuantity) <= Number(product.lowStockThreshold || 10)
              ? InventoryStatus.LOW_STOCK
              : InventoryStatus.IN_STOCK,
        },
      });
    }

    const currentAvailable = Number(inventory.availableQuantity);
    const reservedQuantity = Number(inventory.reservedQuantity || 0);
    const threshold =
      input.threshold !== undefined && !isNaN(Number(input.threshold))
        ? Math.max(0, Number(input.threshold))
        : Number(inventory.threshold);

    let newAvailable: number;
    let deltaAmount: number;

    const targetQty =
      input.quantity !== undefined
        ? input.quantity
        : input.availableQuantity !== undefined
        ? input.availableQuantity
        : undefined;

    if (targetQty !== undefined) {
      const q = Number(targetQty);
      if (isNaN(q) || q < 0) {
        throw { status: 400, message: 'Stock quantity cannot be negative or invalid.' };
      }
      newAvailable = q;
      deltaAmount = newAvailable - currentAvailable;
    } else if (input.delta !== undefined) {
      const d = Number(input.delta);
      if (isNaN(d)) {
        throw { status: 400, message: 'Delta amount must be a valid number.' };
      }
      if (currentAvailable + d < 0) {
        throw {
          status: 400,
          message: `Cannot reduce stock below zero. Current available: ${currentAvailable}, requested change: ${d}`,
        };
      }
      newAvailable = currentAvailable + d;
      deltaAmount = d;
    } else {
      throw {
        status: 400,
        message: 'Either quantity or delta must be provided to update stock.',
      };
    }

    const newCurrentStock = newAvailable + reservedQuantity;

    // Determine status based on thresholds
    let newStatus: InventoryStatus;
    if (newAvailable <= 0) {
      newStatus = InventoryStatus.OUT_OF_STOCK;
    } else if (newAvailable <= threshold) {
      newStatus = InventoryStatus.LOW_STOCK;
    } else {
      newStatus = InventoryStatus.IN_STOCK;
    }

    // Determine audit log type
    const logType = mapLogTypeToPrisma(input.type, input.reason, deltaAmount);
    const reasonText = input.reason?.trim() || (deltaAmount >= 0 ? 'Stock addition' : 'Stock reduction');

    // Atomic transaction for InventoryItem, InventoryLog, and Product synchronization
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update InventoryItem
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventory.id },
        data: {
          currentStock: new Prisma.Decimal(newCurrentStock),
          availableQuantity: new Prisma.Decimal(newAvailable),
          threshold: new Prisma.Decimal(threshold),
          status: newStatus,
          lastUpdated: new Date(),
        },
      });

      // 2. Create InventoryLog record
      const log = await tx.inventoryLog.create({
        data: {
          inventoryItemId: inventory.id,
          type: logType,
          amount: new Prisma.Decimal(Math.abs(deltaAmount)),
          newQuantity: new Prisma.Decimal(newAvailable),
          reason: reasonText,
          createdAt: new Date(),
        },
      });

      // 3. Synchronize Product availableQuantity and inStock
      const inStock = newAvailable > 0 && product.status === ProductStatus.ACTIVE;
      await tx.product.update({
        where: { id: productId },
        data: {
          availableQuantity: new Prisma.Decimal(newAvailable),
          inStock,
          lowStockThreshold: new Prisma.Decimal(threshold),
        },
      });

      return {
        ...updatedItem,
        product,
        logs: [log],
      };
    });

    return formatInventoryResponse(result);
  }
}

export const inventoryService = new InventoryService();
