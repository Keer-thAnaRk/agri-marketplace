import {
  Prisma,
  ProductCategory,
  ProductStatus,
  FarmingMethod,
  InventoryStatus,
} from '@prisma/client';
import { prisma } from '../db/prisma';

export interface CreateProductInput {
  name: string;
  category?: string;
  description?: string;
  price: number;
  unit?: string;
  unitShort?: string;
  images?: string[];
  shelfLifeDays?: number;
  expectedFreshnessDuration?: string;
  harvestDate?: string | Date;
  farmDistanceKm?: number;
  isOrganic?: boolean;
  farmingMethod?: string;
  status?: string;
  inStock?: boolean;
  availableQuantity?: number;
  stock?: number;
  reservedQuantity?: number;
  soldQuantity?: number;
  lowStockThreshold?: number;
  nutritionHighlights?: string[];
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  unit?: string;
  unitShort?: string;
  images?: string[];
  shelfLifeDays?: number;
  expectedFreshnessDuration?: string;
  harvestDate?: string | Date;
  farmDistanceKm?: number;
  isOrganic?: boolean;
  farmingMethod?: string;
  status?: string;
  inStock?: boolean;
  availableQuantity?: number;
  reservedQuantity?: number;
  soldQuantity?: number;
  lowStockThreshold?: number;
  nutritionHighlights?: string[];
}

export function mapCategoryToPrisma(cat?: string): ProductCategory {
  if (!cat) return ProductCategory.VEGETABLES;
  const normalized = cat.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized.includes('VEG')) return ProductCategory.VEGETABLES;
  if (normalized.includes('FRUIT')) return ProductCategory.FRUITS;
  if (normalized.includes('DAIRY') || normalized.includes('MILK')) return ProductCategory.DAIRY;
  if (normalized.includes('GRAIN')) return ProductCategory.GRAINS;
  if (
    normalized.includes('PULSE') ||
    normalized.includes('DAL') ||
    normalized.includes('LENTIL')
  )
    return ProductCategory.PULSES;
  if (normalized.includes('EGG')) return ProductCategory.EGGS;
  if (normalized.includes('HERB')) return ProductCategory.HERBS;
  if (normalized.includes('SPICE')) return ProductCategory.SPICES;
  if (normalized.includes('ORGANIC')) return ProductCategory.ORGANIC_SPECIALTY;
  return ProductCategory.OTHER;
}

export function mapCategoryToFrontend(cat: ProductCategory): string {
  switch (cat) {
    case ProductCategory.VEGETABLES:
      return 'Vegetables';
    case ProductCategory.FRUITS:
      return 'Fruits';
    case ProductCategory.DAIRY:
      return 'Dairy';
    case ProductCategory.GRAINS:
      return 'Grains';
    case ProductCategory.PULSES:
      return 'Pulses';
    case ProductCategory.EGGS:
      return 'Eggs';
    case ProductCategory.HERBS:
      return 'Herbs';
    case ProductCategory.SPICES:
      return 'Spices';
    case ProductCategory.ORGANIC_SPECIALTY:
      return 'Organic Products';
    case ProductCategory.OTHER:
    default:
      return 'Other';
  }
}

export function mapStatusToPrisma(status?: string): ProductStatus {
  if (!status) return ProductStatus.ACTIVE;
  const s = status.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'ACTIVE') return ProductStatus.ACTIVE;
  if (s === 'DRAFT') return ProductStatus.DRAFT;
  if (s.includes('OUT') || s === 'OUT_OF_STOCK') return ProductStatus.OUT_OF_STOCK;
  if (s === 'EXPIRED') return ProductStatus.EXPIRED;
  return ProductStatus.ACTIVE;
}

export function mapStatusToFrontend(
  status: ProductStatus
): 'Active' | 'Draft' | 'Out of Stock' | 'Expired' {
  switch (status) {
    case ProductStatus.ACTIVE:
      return 'Active';
    case ProductStatus.DRAFT:
      return 'Draft';
    case ProductStatus.OUT_OF_STOCK:
      return 'Out of Stock';
    case ProductStatus.EXPIRED:
      return 'Expired';
    default:
      return 'Active';
  }
}

export function mapFarmingMethodToPrisma(method?: string): FarmingMethod {
  if (!method) return FarmingMethod.ORGANIC;
  const m = method.toUpperCase();
  if (m.includes('ZBNF') || m.includes('NATURAL')) return FarmingMethod.NATURAL_ZBNF;
  if (m.includes('HYDRO')) return FarmingMethod.HYDROPONIC;
  if (m.includes('REGEN')) return FarmingMethod.REGENERATIVE;
  if (m.includes('PEST') || m.includes('FREE')) return FarmingMethod.PESTICIDE_FREE;
  if (m.includes('TRAD')) return FarmingMethod.TRADITIONAL;
  if (m.includes('CONV')) return FarmingMethod.CONVENTIONAL;
  if (m.includes('MIX')) return FarmingMethod.MIXED;
  return FarmingMethod.ORGANIC;
}

export function mapFarmingMethodToFrontend(method: FarmingMethod): string {
  switch (method) {
    case FarmingMethod.ORGANIC:
      return 'Organic';
    case FarmingMethod.NATURAL_ZBNF:
      return 'Natural (ZBNF)';
    case FarmingMethod.HYDROPONIC:
      return 'Hydroponic';
    case FarmingMethod.REGENERATIVE:
      return 'Regenerative';
    case FarmingMethod.PESTICIDE_FREE:
      return 'Pesticide-Free';
    case FarmingMethod.TRADITIONAL:
      return 'Traditional';
    case FarmingMethod.CONVENTIONAL:
      return 'Conventional';
    case FarmingMethod.MIXED:
      return 'Mixed';
    default:
      return 'Organic';
  }
}

export function formatProductResponse(product: any) {
  const farmName = product.farmer?.farmName || '';
  const farmerName = product.farmer?.user?.name || '';
  const farmLocation = product.farmer?.location || '';
  const farmDistanceKm = product.farmDistanceKm
    ? Number(product.farmDistanceKm)
    : product.farmer?.distanceKm
    ? Number(product.farmer.distanceKm)
    : 2.5;

  const price = Number(product.price);
  const availableQuantity = Number(product.availableQuantity);
  const reservedQuantity = Number(product.reservedQuantity || 0);
  const soldQuantity = Number(product.soldQuantity || 0);
  const lowStockThreshold = Number(product.lowStockThreshold || 10);
  const rating = Number(product.rating || 5.0);
  const shelfLifeDays = product.shelfLifeDays || 6;

  // Freshness score computed from harvestDate and shelfLifeDays
  let freshnessScore = 95;
  let harvestedAgo = 'Harvested recently';
  if (product.harvestDate) {
    const harvestTime = new Date(product.harvestDate).getTime();
    const now = Date.now();
    const diffHours = Math.max(0, (now - harvestTime) / (1000 * 60 * 60));
    const totalHours = Math.max(1, shelfLifeDays * 24);
    const remainingRatio = Math.max(0, Math.min(1, (totalHours - diffHours) / totalHours));
    freshnessScore = Math.round(remainingRatio * 100);

    if (diffHours < 1) {
      harvestedAgo = 'Harvested just now';
    } else if (diffHours < 24) {
      harvestedAgo = `Harvested ${Math.round(diffHours)} hours ago`;
    } else {
      const days = Math.round(diffHours / 24);
      harvestedAgo = `Harvested ${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  return {
    id: product.id,
    farmerId: product.farmerId,
    name: product.name,
    category: mapCategoryToFrontend(product.category),
    rawCategory: product.category,
    description: product.description,
    price,
    unit: product.unit,
    unitShort: product.unitShort,
    images:
      product.images && product.images.length > 0
        ? product.images
        : [
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
          ],
    shelfLifeDays,
    expectedFreshnessDuration:
      product.expectedFreshnessDuration || `${shelfLifeDays} days room temperature`,
    harvestDate: product.harvestDate
      ? product.harvestDate instanceof Date
        ? product.harvestDate.toISOString()
        : String(product.harvestDate)
      : new Date().toISOString(),
    harvestedAgo,
    freshnessScore,
    farmDistanceKm,
    isOrganic: product.isOrganic,
    farmingMethod: mapFarmingMethodToFrontend(product.farmingMethod),
    rawFarmingMethod: product.farmingMethod,
    status: mapStatusToFrontend(product.status),
    rawStatus: product.status,
    inStock: product.inStock && availableQuantity > 0,
    availableQuantity,
    reservedQuantity,
    soldQuantity,
    lowStockThreshold,
    rating,
    reviewsCount: product.reviewsCount || 0,
    nutritionHighlights: product.nutritionHighlights || [],
    farmerName,
    farmName,
    farmLocation,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export class ProductService {
  /**
   * Retrieves products belonging strictly to the authenticated farmer.
   */
  async getFarmerProducts(farmerId: string) {
    const products = await prisma.product.findMany({
      where: { farmerId },
      include: {
        farmer: {
          select: {
            id: true,
            farmName: true,
            location: true,
            distanceKm: true,
            user: { select: { name: true, avatar: true } },
          },
        },
        inventory: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(formatProductResponse);
  }

  /**
   * Retrieves a single product belonging to the authenticated farmer.
   * Throws 404 if product does not exist or belongs to another farmer.
   */
  async getFarmerProductById(farmerId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        farmer: {
          select: {
            id: true,
            farmName: true,
            location: true,
            distanceKm: true,
            user: { select: { name: true, avatar: true } },
          },
        },
        inventory: true,
      },
    });

    if (!product || product.farmerId !== farmerId) {
      throw { status: 404, message: `Product with ID ${productId} not found.` };
    }

    return formatProductResponse(product);
  }

  /**
   * Creates a new product and matching inventory item for the authenticated farmer.
   */
  async createProduct(farmerId: string, input: CreateProductInput) {
    // Validate required fields
    if (!input.name || !input.name.trim()) {
      throw { status: 400, message: 'Product name is required.' };
    }
    if (input.price === undefined || input.price === null || Number(input.price) <= 0) {
      throw { status: 400, message: 'A valid positive price in INR is required.' };
    }

    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      select: {
        id: true,
        farmName: true,
        location: true,
        distanceKm: true,
        farmingMethod: true,
        farmDescription: true,
        user: { select: { name: true } },
      },
    });

    if (!farmer) {
      throw { status: 404, message: `Farmer record ${farmerId} not found.` };
    }

    const rawStock = input.availableQuantity !== undefined ? input.availableQuantity : input.stock;
    const availableQty =
      rawStock !== undefined && !isNaN(Number(rawStock))
        ? Math.max(0, Number(rawStock))
        : 0;

    const threshold =
      input.lowStockThreshold !== undefined && !isNaN(Number(input.lowStockThreshold))
        ? Math.max(0, Number(input.lowStockThreshold))
        : 10;

    const shelfLife =
      input.shelfLifeDays !== undefined && !isNaN(Number(input.shelfLifeDays))
        ? Math.max(1, Number(input.shelfLifeDays))
        : 6;

    const categoryEnum = mapCategoryToPrisma(input.category);
    const statusEnum = mapStatusToPrisma(input.status);
    const methodEnum = input.farmingMethod
      ? mapFarmingMethodToPrisma(input.farmingMethod)
      : farmer.farmingMethod;

    let harvestDateParsed: Date | null = null;
    if (input.harvestDate) {
      const parsed = new Date(input.harvestDate);
      if (!isNaN(parsed.getTime())) {
        harvestDateParsed = parsed;
      }
    }
    if (!harvestDateParsed) {
      harvestDateParsed = new Date();
    }

    const images =
      input.images && input.images.length > 0
        ? input.images
        : [
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
          ];

    const description =
      input.description && input.description.trim()
        ? input.description.trim()
        : `${input.name} naturally harvested at ${farmer.farmName}.`;

    const unit = input.unit || '1 kg';
    const unitShort = input.unitShort || 'kg';
    const isOrganic = input.isOrganic !== undefined ? Boolean(input.isOrganic) : true;
    const inStock =
      input.inStock !== undefined
        ? Boolean(input.inStock) && availableQty > 0
        : availableQty > 0 && statusEnum === ProductStatus.ACTIVE;

    // Use transaction to create Product and synchronize InventoryItem
    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          farmerId,
          name: input.name.trim(),
          category: categoryEnum,
          description,
          price: new Prisma.Decimal(input.price),
          unit,
          unitShort,
          images,
          shelfLifeDays: shelfLife,
          expectedFreshnessDuration:
            input.expectedFreshnessDuration || `${shelfLife} days room temperature`,
          harvestDate: harvestDateParsed,
          farmDistanceKm: input.farmDistanceKm
            ? new Prisma.Decimal(input.farmDistanceKm)
            : farmer.distanceKm || new Prisma.Decimal(2.5),
          isOrganic,
          farmingMethod: methodEnum,
          status: statusEnum,
          inStock,
          availableQuantity: new Prisma.Decimal(availableQty),
          reservedQuantity: new Prisma.Decimal(0),
          soldQuantity: new Prisma.Decimal(0),
          lowStockThreshold: new Prisma.Decimal(threshold),
          rating: new Prisma.Decimal(5.0),
          reviewsCount: 0,
          nutritionHighlights: input.nutritionHighlights || [],
        },
        include: {
          farmer: {
            select: {
              id: true,
              farmName: true,
              location: true,
              distanceKm: true,
              user: { select: { name: true, avatar: true } },
            },
          },
        },
      });

      // Synchronize initial InventoryItem
      await tx.inventoryItem.create({
        data: {
          productId: product.id,
          farmerId,
          currentStock: new Prisma.Decimal(availableQty),
          availableQuantity: new Prisma.Decimal(availableQty),
          reservedQuantity: new Prisma.Decimal(0),
          soldQuantity: new Prisma.Decimal(0),
          threshold: new Prisma.Decimal(threshold),
          status:
            availableQty <= 0
              ? InventoryStatus.OUT_OF_STOCK
              : availableQty <= threshold
              ? InventoryStatus.LOW_STOCK
              : InventoryStatus.IN_STOCK,
        },
      });

      // Increment farmer's totalProductsCount
      await tx.farmer.update({
        where: { id: farmerId },
        data: { totalProductsCount: { increment: 1 } },
      });

      return product;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return formatProductResponse(createdProduct);
  }

  /**
   * Updates an existing product for the authenticated farmer.
   * Enforces data isolation and synchronizes inventory records.
   */
  async updateProduct(farmerId: string, productId: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!existing) {
      throw { status: 404, message: `Product with ID ${productId} not found.` };
    }

    if (existing.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: You are not authorized to edit this product.',
      };
    }

    const updateData: Prisma.ProductUpdateInput = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw { status: 400, message: 'Product name cannot be empty.' };
      }
      updateData.name = input.name.trim();
    }

    if (input.category !== undefined) {
      updateData.category = mapCategoryToPrisma(input.category);
    }

    if (input.description !== undefined) {
      updateData.description = input.description.trim();
    }

    if (input.price !== undefined) {
      if (Number(input.price) <= 0) {
        throw { status: 400, message: 'Price must be greater than zero.' };
      }
      updateData.price = new Prisma.Decimal(input.price);
    }

    if (input.unit !== undefined) updateData.unit = input.unit;
    if (input.unitShort !== undefined) updateData.unitShort = input.unitShort;
    if (input.images !== undefined) updateData.images = input.images;
    if (input.shelfLifeDays !== undefined)
      updateData.shelfLifeDays = Math.max(1, Number(input.shelfLifeDays));
    if (input.expectedFreshnessDuration !== undefined)
      updateData.expectedFreshnessDuration = input.expectedFreshnessDuration;

    if (input.harvestDate !== undefined) {
      const parsed = new Date(input.harvestDate);
      if (!isNaN(parsed.getTime())) {
        updateData.harvestDate = parsed;
      }
    }

    if (input.farmingMethod !== undefined) {
      updateData.farmingMethod = mapFarmingMethodToPrisma(input.farmingMethod);
    }

    if (input.isOrganic !== undefined) {
      updateData.isOrganic = Boolean(input.isOrganic);
    }

    if (input.status !== undefined) {
      updateData.status = mapStatusToPrisma(input.status);
    }

    let newAvailableQty: number | undefined;
    if (input.availableQuantity !== undefined) {
      newAvailableQty = Math.max(0, Number(input.availableQuantity));
      updateData.availableQuantity = new Prisma.Decimal(newAvailableQty);
    }

    if (input.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = new Prisma.Decimal(Math.max(0, Number(input.lowStockThreshold)));
    }

    if (input.nutritionHighlights !== undefined) {
      updateData.nutritionHighlights = input.nutritionHighlights;
    }

    // Recalculate inStock
    const targetQty =
      newAvailableQty !== undefined ? newAvailableQty : Number(existing.availableQuantity);
    const targetStatus =
      updateData.status !== undefined ? updateData.status : existing.status;

    if (input.inStock !== undefined) {
      updateData.inStock = Boolean(input.inStock) && targetQty > 0;
    } else {
      updateData.inStock = targetQty > 0 && targetStatus === ProductStatus.ACTIVE;
    }

    // Execute update with inventory synchronization in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          farmer: {
            select: {
              id: true,
              farmName: true,
              location: true,
              distanceKm: true,
              user: { select: { name: true, avatar: true } },
            },
          },
          inventory: true,
        },
      });

      // Synchronize inventory item if stock or thresholds changed
      if (prod.inventory) {
        const invUpdateData: Prisma.InventoryItemUpdateInput = {};
        if (newAvailableQty !== undefined) {
          invUpdateData.availableQuantity = new Prisma.Decimal(newAvailableQty);
          invUpdateData.currentStock = new Prisma.Decimal(
            newAvailableQty + Number(prod.inventory.reservedQuantity)
          );
          const thresh = Number(prod.inventory.threshold);
          invUpdateData.status =
            newAvailableQty <= 0
              ? InventoryStatus.OUT_OF_STOCK
              : newAvailableQty <= thresh
              ? InventoryStatus.LOW_STOCK
              : InventoryStatus.IN_STOCK;
        }

        if (input.lowStockThreshold !== undefined) {
          invUpdateData.threshold = new Prisma.Decimal(Math.max(0, Number(input.lowStockThreshold)));
        }

        if (Object.keys(invUpdateData).length > 0) {
          await tx.inventoryItem.update({
            where: { id: prod.inventory.id },
            data: invUpdateData,
          });
        }
      }

      return prod;
    });

    return formatProductResponse(updated);
  }

  /**
   * Deletes or safely deactivates a product.
   * If product is referenced in order items, sets status to DRAFT and inStock to false.
   */
  async deleteProduct(farmerId: string, productId: string) {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: { select: { orderItems: true } },
      },
    });

    if (!existing) {
      throw { status: 404, message: `Product with ID ${productId} not found.` };
    }

    if (existing.farmerId !== farmerId) {
      throw {
        status: 403,
        message: 'Access denied: You are not authorized to delete this product.',
      };
    }

    const hasOrderHistory = existing._count.orderItems > 0;

    if (hasOrderHistory) {
      // Safe deactivation to preserve historical order integrity
      const deactivated = await prisma.product.update({
        where: { id: productId },
        data: {
          status: ProductStatus.DRAFT,
          inStock: false,
        },
        include: {
          farmer: {
            select: {
              id: true,
              farmName: true,
              location: true,
              distanceKm: true,
              user: { select: { name: true, avatar: true } },
            },
          },
        },
      });

      return {
        deleted: false,
        deactivated: true,
        message: 'Product has order history and was safely deactivated instead of deleted.',
        product: formatProductResponse(deactivated),
      };
    }

    // Hard delete
    await prisma.$transaction(async (tx) => {
      // InventoryItem has cascade delete on productId, but clean up explicitly if needed
      await tx.inventoryItem.deleteMany({ where: { productId } });
      await tx.product.delete({ where: { id: productId } });

      await tx.farmer.update({
        where: { id: farmerId },
        data: {
          totalProductsCount: { decrement: 1 },
        },
      });
    });

    return {
      deleted: true,
      deactivated: false,
      message: 'Product deleted permanently from catalog.',
    };
  }
}

export const productService = new ProductService();
