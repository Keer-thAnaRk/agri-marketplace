import {
  VerificationStatus,
  UserRole,
  Prisma,
  ProductStatus,
  InventoryStatus,
  OrderStatus,
  PaymentStatus,
  DeliveryBatchStatus,
  InventoryLogType,
  DisputeStatus,
  SaleStatus,
  SurplusOfferStatus,
} from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  mapCategoryToFrontend,
  mapCategoryToPrisma,
  mapFarmingMethodToFrontend,
  mapFarmingMethodToPrisma,
  mapStatusToPrisma,
} from './product.service';
import { TIMELINE_METADATA, toPrismaOrderStatus } from './order.service';
import { saleService } from './sale.service';
import {
  toPrismaDeliveryBatchStatus,
  DELIVERY_BATCH_TIMELINE_META,
} from '../utils/delivery.utils';

export function formatAdminDeliveryBatchResponse(batch: any) {
  const orders = (batch.orders || []).map((o: any) => ({
    id: o.id,
    rawId: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    orderStatus: o.status,
    customerName: o.address?.name || o.consumer?.name || 'Customer',
    customerPhone: o.address?.phone || o.consumer?.phone || '',
    customerEmail: o.consumer?.email || '',
    deliveryAddress: o.address
      ? {
          addressLine: o.address.addressLine,
          hub: o.address.hub,
          city: o.address.city,
          pincode: o.address.pincode,
          state: o.address.state || 'Karnataka',
        }
      : {
          addressLine: 'Delivery Address Not Specified',
          hub: batch.hubArea,
          city: 'Bengaluru',
          pincode: '560001',
          state: 'Karnataka',
        },
    deliverySlot: {
      name: o.deliverySlotName || batch.deliverySlot,
      timeRange: o.deliverySlotRange || batch.deliverySlot,
    },
    total: Number(o.total),
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    items: (o.items || []).map((it: any) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      productImage:
        it.productImage ||
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      quantity: Number(it.quantity),
      unit: it.unit,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
      farmerId: it.farmerId,
      farmerName: it.farmerName || it.farmer?.user?.name || 'Farmer',
      farmName: it.farmName || it.farmer?.farmName || 'Local Farm',
    })),
  }));

  const orderNumbers = orders.map((o: any) => o.orderNumber);
  const ordersCount = orders.length;

  let totalKg = 0;
  if (batch.totalQuantity) {
    totalKg = Number(batch.totalQuantity);
  } else {
    for (const ord of orders) {
      for (const item of ord.items) {
        totalKg += Number(item.quantity) || 0;
      }
    }
  }

  const timeline = (batch.timelineSteps || []).map((step: any) => ({
    id: step.id,
    status: step.status,
    label: step.label,
    timestamp: step.timestamp
      ? new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Pending',
    rawTimestamp: step.timestamp ? new Date(step.timestamp).toISOString() : null,
    completed: step.isCompleted,
    isCompleted: step.isCompleted,
    current: step.isCurrent,
    isCurrent: step.isCurrent,
  }));

  return {
    id: batch.id,
    batchCode: batch.batchCode,
    hub: batch.hubArea,
    hubArea: batch.hubArea,
    deliverySlot: batch.deliverySlot,
    ordersCount,
    orderNumbers,
    orders,
    totalQuantity: `${totalKg} kg`,
    totalQuantityNumber: totalKg,
    riderName: batch.riderName || 'Unassigned Rider',
    riderPhone: batch.riderPhone || 'N/A',
    riderVehicle: batch.riderVehicle || 'EV Fleet Vehicle',
    estimatedDistanceKm: batch.estimatedDistanceKm ? Number(batch.estimatedDistanceKm) : 0,
    estimatedDuration: batch.estimatedDeliveryTime || '30 mins',
    estimatedDeliveryTime: batch.estimatedDeliveryTime || '30 mins',
    status: batch.status,
    rawStatus: batch.status,
    productsSummary: batch.productsSummary,
    createdAt:
      batch.createdAt instanceof Date ? batch.createdAt.toISOString() : String(batch.createdAt),
    updatedAt:
      batch.updatedAt instanceof Date ? batch.updatedAt.toISOString() : String(batch.updatedAt),
    timeline,
  };
}

export function formatAdminOrderResponse(order: any) {
  const items = (order.items || []).map((it: any) => ({
    id: it.id,
    productId: it.productId,
    productName: it.productName,
    productImage:
      it.productImage ||
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    farmerId: it.farmerId,
    farmerName: it.farmerName,
    farmName: it.farmName,
    unitPrice: Number(it.unitPrice),
    price: Number(it.unitPrice),
    quantity: Number(it.quantity),
    unit: it.unit,
    totalPrice: Number(it.totalPrice),
    farmerShare: Number(it.farmerShare || Number(it.totalPrice) * 0.75),
  }));

  const uniqueFarmers = Array.from(new Set(items.map((i: any) => i.farmerName).filter(Boolean)));
  const uniqueFarms = Array.from(new Set(items.map((i: any) => i.farmName).filter(Boolean)));
  const primaryFarmer = items[0];

  const farmerName = uniqueFarmers.join(', ') || primaryFarmer?.farmerName || 'Independent Grower';
  const farmName = uniqueFarms.join(', ') || primaryFarmer?.farmName || 'Local Farm';
  const farmerId = primaryFarmer?.farmerId || '';

  const customerName = order.address?.name || order.consumer?.name || 'Customer';
  const customerPhone = order.address?.phone || order.consumer?.phone || '';
  const customerEmail = order.consumer?.email || '';
  const customerId = order.consumerId;

  const deliveryAddress = order.address
    ? {
        id: order.address.id,
        name: order.address.name,
        phone: order.address.phone,
        addressLine: order.address.addressLine,
        city: order.address.city,
        state: order.address.state || 'Karnataka',
        pincode: order.address.pincode,
        hub: order.address.hub,
        isDefault: order.address.isDefault,
      }
    : {
        id: 'no-address',
        name: customerName,
        phone: customerPhone,
        addressLine: 'Pickup / Default Hub',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        hub: 'Bengaluru Central',
        isDefault: false,
      };

  const deliverySlot = {
    id: 'slot-default',
    name: order.deliverySlotName || 'Standard Delivery',
    timeRange: order.deliverySlotRange || '7:00 AM – 11:00 AM',
    description: 'Fresh morning harvest delivery',
  };

  const timeline = (order.timeline || []).map((step: any) => ({
    id: step.id,
    status: step.status,
    title: step.label,
    label: step.label,
    description: step.description,
    completed: step.isCompleted,
    isCompleted: step.isCompleted,
    current: step.isCurrent,
    isCurrent: step.isCurrent,
    timestamp: new Date(step.timestamp).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    rawTimestamp: step.timestamp,
  }));

  const paymentMethodStr =
    order.paymentMethod === 'CASH_ON_DELIVERY'
      ? 'Cash on Delivery'
      : order.paymentMethod === 'CARD'
      ? 'Card'
      : 'UPI';

  const deliveryBatch = order.deliveryBatch
    ? {
        id: order.deliveryBatch.id,
        batchCode: order.deliveryBatch.batchCode,
        hubArea: order.deliveryBatch.hubArea,
        deliverySlot: order.deliveryBatch.deliverySlot,
        status: order.deliveryBatch.status,
        riderName: order.deliveryBatch.riderName || null,
        riderPhone: order.deliveryBatch.riderPhone || null,
        riderVehicle: order.deliveryBatch.riderVehicle || null,
        estimatedDistanceKm: order.deliveryBatch.estimatedDistanceKm
          ? Number(order.deliveryBatch.estimatedDistanceKm)
          : null,
        estimatedDeliveryTime: order.deliveryBatch.estimatedDeliveryTime || null,
      }
    : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    deliverySlot,
    farmerId,
    farmerName,
    farmName,
    items,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    platformFee: Number(order.platformFee),
    farmerEarnings: Number(order.farmerEarnings),
    total: Number(order.total),
    paymentMethod: paymentMethodStr,
    rawPaymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status.toLowerCase(),
    orderStatus: order.status,
    deliveryBatchId: order.deliveryBatch?.batchCode || order.deliveryBatchId || null,
    deliveryBatch,
    estimatedDelivery: order.estimatedDelivery
      ? order.estimatedDelivery.toISOString()
      : `Today, ${order.deliverySlotRange || 'Morning'}`,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    createdAt:
      order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
    updatedAt:
      order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt),
    timeline,
  };
}

export function formatAdminProductResponse(product: any) {
  const farmName = product.farmer?.farmName || 'Unknown Farm';
  const farmerName = product.farmer?.user?.name || 'Unknown Farmer';
  const farmerId = product.farmerId;
  const location =
    product.farmer?.location ||
    `${product.farmer?.city || 'Bengaluru'}, ${product.farmer?.state || 'Karnataka'}`;
  const farmerVerificationStatus = product.farmer?.verificationStatus || 'PENDING';

  // Stock from InventoryItem if available, else from Product
  const inventoryItem = product.inventory;
  const stock = inventoryItem
    ? Number(inventoryItem.availableQuantity)
    : Number(product.availableQuantity || 0);
  const currentStock = inventoryItem ? Number(inventoryItem.currentStock) : stock;
  const reservedQuantity = inventoryItem
    ? Number(inventoryItem.reservedQuantity)
    : Number(product.reservedQuantity || 0);
  const soldQuantity = inventoryItem
    ? Number(inventoryItem.soldQuantity)
    : Number(product.soldQuantity || 0);
  const lowStockThreshold = inventoryItem
    ? Number(inventoryItem.threshold)
    : Number(product.lowStockThreshold || 10);
  const inventoryStatus = inventoryItem
    ? inventoryItem.status
    : stock <= 0
    ? 'OUT_OF_STOCK'
    : stock <= lowStockThreshold
    ? 'LOW_STOCK'
    : 'IN_STOCK';

  // Harvest / Traceability
  const latestBatch = product.harvestBatches?.[0];
  const harvestBatchId = latestBatch?.batchNumber || null;
  const harvestDate = latestBatch?.harvestDate
    ? new Date(latestBatch.harvestDate).toISOString().split('T')[0]
    : product.harvestDate
    ? new Date(product.harvestDate).toISOString().split('T')[0]
    : null;
  const traceUrl = latestBatch?.batchNumber ? `/trace/${latestBatch.batchNumber}` : null;

  // Surplus
  const activeSurplus = product.surplusOffers?.[0];
  const isSurplus = !!activeSurplus;
  const surplusDiscount = activeSurplus ? Number(activeSurplus.discountPercent) : 0;

  // Freshness calculation
  const shelfLifeDays = product.shelfLifeDays || 6;
  let freshnessScore = 95;
  if (latestBatch?.expectedFreshness) {
    freshnessScore = latestBatch.expectedFreshness;
  } else if (product.harvestDate) {
    const harvestTime = new Date(product.harvestDate).getTime();
    const now = Date.now();
    const diffHours = Math.max(0, (now - harvestTime) / (1000 * 60 * 60));
    const totalHours = Math.max(1, shelfLifeDays * 24);
    const remainingRatio = Math.max(0, Math.min(1, (totalHours - diffHours) / totalHours));
    freshnessScore = Math.round(remainingRatio * 100);
  }

  return {
    id: product.id,
    name: product.name,
    category: mapCategoryToFrontend(product.category),
    rawCategory: product.category,
    description: product.description || '',
    price: Number(product.price),
    unit: product.unit || '1 kg',
    unitShort: product.unitShort || 'kg',
    images:
      product.images && product.images.length > 0
        ? product.images
        : [
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
          ],
    shelfLifeDays,
    expectedFreshnessDuration:
      product.expectedFreshnessDuration || `${shelfLifeDays} days room temperature`,
    harvestDate,
    freshnessScore,
    isOrganic: product.isOrganic,
    farmingMethod: mapFarmingMethodToFrontend(product.farmingMethod),
    rawFarmingMethod: product.farmingMethod,
    status: product.status,
    inStock: product.inStock,
    stock,
    currentStock,
    reservedQuantity,
    soldQuantity,
    lowStockThreshold,
    inventoryStatus,
    inventoryExists: !!inventoryItem,
    farmerId,
    farmerName,
    farmName,
    location,
    farmerVerificationStatus,
    farmerCity: product.farmer?.city || '',
    farmerState: product.farmer?.state || '',
    farmerHub: product.farmer?.hub || '',
    harvestBatchId,
    traceUrl,
    isSurplus,
    surplusDiscount,
    nutritionHighlights: product.nutritionHighlights || [],
    createdAt:
      product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : String(product.createdAt),
    updatedAt:
      product.updatedAt instanceof Date
        ? product.updatedAt.toISOString()
        : String(product.updatedAt),
  };
}

export class AdminService {
  /**
   * Approves a pending farmer profile.
   * Sets verificationStatus = APPROVED, isVerified = true, approvedAt, records approving admin,
   * and creates a verification notification.
   */
  async approveFarmer(adminUserId: string, farmerId: string) {
    // 1. Verify admin permissions
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Access denied: Admin privileges required to approve farmers.');
    }

    // 2. Fetch farmer (supports farmer ID or user ID)
    const farmer = await prisma.farmer.findFirst({
      where: {
        OR: [{ id: farmerId }, { userId: farmerId }],
      },
      include: { user: true },
    });

    if (!farmer) {
      throw new Error(`Farmer with ID ${farmerId} not found.`);
    }

    // 3. Prevent self-approval (Farmers must not be able to approve themselves)
    if (farmer.userId === adminUserId) {
      throw new Error('Conflict of interest: Administrators cannot approve their own farmer profiles.');
    }

    const now = new Date();

    // 4. Update farmer & create notification in a transaction
    const updatedFarmer = await prisma.$transaction(
      async (tx) => {
        // Mark farmer documents as verified
        await tx.farmerDocument.updateMany({
          where: { farmerId: farmer.id },
          data: { isVerified: true },
        });

        // Update farmer verification state
        const approved = await tx.farmer.update({
          where: { id: farmer.id },
          data: {
            verificationStatus: VerificationStatus.APPROVED,
            isVerified: true,
            approvedAt: now,
            verifiedDate: now,
            approvedById: adminUserId,
            rejectionReason: null,
          },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            approvedBy: { select: { id: true, name: true, email: true } },
            verificationDocuments: true,
          },
        });

        // Create high-priority in-app notification for the farmer
        await tx.notification.create({
          data: {
            userId: farmer.userId,
            title: 'Farmer Profile Approved!',
            message:
              'Congratulations! Your farm profile and documents have been reviewed and approved by Krishi Market Administration. You now have full access to your Farmer Dashboard, products, and inventory.',
            type: 'VERIFICATION',
            isRead: false,
            link: '/farmer/dashboard',
          },
        });

        // Create alert notification for the approving admin
        await tx.notification.create({
          data: {
            userId: adminUserId,
            title: 'Farmer Profile Approved',
            message: `Farmer "${farmer.farmName}" has been successfully approved and certified.`,
            type: 'VERIFICATION',
            isRead: false,
            link: `/admin/farmers/${farmer.id}`,
          },
        });

        return approved;
      },
      { maxWait: 20000, timeout: 35000 }
    );

    return updatedFarmer;
  }

  /**
   * Rejects a farmer profile with a specific reason.
   * Sets verificationStatus = REJECTED, isVerified = false, stores rejectionReason,
   * and creates a verification notification.
   */
  async rejectFarmer(adminUserId: string, farmerId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason must be provided to reject a farmer verification request.');
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Access denied: Admin privileges required to reject farmers.');
    }

    const farmer = await prisma.farmer.findFirst({
      where: {
        OR: [{ id: farmerId }, { userId: farmerId }],
      },
      include: { user: true },
    });

    if (!farmer) {
      throw new Error(`Farmer with ID ${farmerId} not found.`);
    }

    if (farmer.userId === adminUserId) {
      throw new Error('Conflict of interest: Administrators cannot reject their own profiles.');
    }

    const trimmedReason = reason.trim();

    const updatedFarmer = await prisma.$transaction(
      async (tx) => {
        const rejected = await tx.farmer.update({
          where: { id: farmer.id },
          data: {
            verificationStatus: VerificationStatus.REJECTED,
            isVerified: false,
            rejectionReason: trimmedReason,
            approvedAt: null,
            approvedById: null,
          },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            verificationDocuments: true,
          },
        });

        await tx.notification.create({
          data: {
            userId: farmer.userId,
            title: 'Verification Status: Action Required',
            message: `Your farmer verification could not be approved for the following reason: "${trimmedReason}". Please review and update your information or upload valid documents.`,
            type: 'VERIFICATION',
            isRead: false,
            link: '/farmer/profile',
          },
        });

        // Create alert notification for the rejecting admin
        await tx.notification.create({
          data: {
            userId: adminUserId,
            title: 'Farmer Application Rejected',
            message: `Farmer "${farmer.farmName}" application was rejected. Reason: "${trimmedReason}".`,
            type: 'VERIFICATION',
            isRead: false,
            link: `/admin/farmers/${farmer.id}`,
          },
        });

        return rejected;
      },
      { maxWait: 20000, timeout: 35000 }
    );

    return updatedFarmer;
  }

  /**
   * Lists all farmers or filtered by verification status.
   */
  async getAllFarmers(status?: string) {
    const where: any = {};
    if (status && status !== 'all') {
      const normalized = status.toUpperCase();
      if (['PENDING', 'APPROVED', 'REJECTED'].includes(normalized)) {
        where.verificationStatus = normalized as VerificationStatus;
      }
    }
    return prisma.farmer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        verificationDocuments: true,
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  /**
   * Lists all farmers whose verification status is PENDING.
   */
  async getPendingFarmers() {
    return prisma.farmer.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        verificationDocuments: true,
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  /**
   * Fetches full profile details for any farmer (Admin view).
   */
  async getFarmerById(farmerId: string) {
    const farmer = await prisma.farmer.findFirst({
      where: {
        OR: [{ id: farmerId }, { userId: farmerId }],
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        verificationDocuments: true,
      },
    });

    if (!farmer) {
      throw new Error(`Farmer with ID ${farmerId} not found.`);
    }

    return farmer;
  }

  /**
   * Lists all products across all farmers (Admin view) with search and filters.
   */
  async getAllProducts(
    filters: {
      search?: string;
      category?: string;
      status?: string;
      farmingMethod?: string;
      organic?: string;
      farmerId?: string;
    } = {}
  ) {
    const where: Prisma.ProductWhereInput = {};

    if (filters.farmerId && filters.farmerId !== 'ALL') {
      where.farmerId = filters.farmerId;
    }

    if (filters.category && filters.category !== 'ALL') {
      where.category = mapCategoryToPrisma(filters.category);
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = mapStatusToPrisma(filters.status);
    }

    if (filters.farmingMethod && filters.farmingMethod !== 'ALL') {
      where.farmingMethod = mapFarmingMethodToPrisma(filters.farmingMethod);
    }

    if (filters.organic && filters.organic !== 'ALL') {
      if (filters.organic === 'ORGANIC' || filters.organic === 'true') {
        where.isOrganic = true;
      } else if (filters.organic === 'NON_ORGANIC' || filters.organic === 'false') {
        where.isOrganic = false;
      }
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { farmer: { farmName: { contains: q, mode: 'insensitive' } } },
        { farmer: { user: { name: { contains: q, mode: 'insensitive' } } } },
        { farmer: { location: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        farmer: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          },
        },
        inventory: true,
        harvestBatches: {
          take: 1,
          orderBy: { harvestDate: 'desc' },
        },
        surplusOffers: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(formatAdminProductResponse);
  }

  /**
   * Retrieves single product with full admin audit details (farmer, inventory, batch, surplus).
   */
  async getProductById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        farmer: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          },
        },
        inventory: true,
        harvestBatches: {
          take: 1,
          orderBy: { harvestDate: 'desc' },
          include: { traceabilityEvents: { orderBy: { orderIndex: 'asc' } } },
        },
        surplusOffers: {
          where: { status: 'ACTIVE' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    return formatAdminProductResponse(product);
  }

  /**
   * Updates product status (e.g. ACTIVE, OUT_OF_STOCK, DRAFT, EXPIRED) and synchronizes inventory.
   */
  async updateProductStatus(productId: string, status: string) {
    if (!status || typeof status !== 'string') {
      throw new Error('Product status is required and must be a valid string.');
    }

    const validStatuses = ['ACTIVE', 'DRAFT', 'OUT_OF_STOCK', 'EXPIRED'];
    const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (!validStatuses.includes(normalized)) {
      throw new Error(`Invalid product status "${status}". Allowed values: ${validStatuses.join(', ')}.`);
    }

    const statusEnum = normalized as ProductStatus;

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!existing) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const inStock = statusEnum === ProductStatus.ACTIVE && Number(existing.availableQuantity) > 0;

    const updated = await prisma.$transaction(
      async (tx) => {
        const prod = await tx.product.update({
          where: { id: productId },
          data: {
            status: statusEnum,
            inStock,
          },
          include: {
            farmer: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
              },
            },
            inventory: true,
            harvestBatches: {
              take: 1,
              orderBy: { harvestDate: 'desc' },
            },
            surplusOffers: {
              where: { status: 'ACTIVE' },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (prod.inventory) {
          let invStatus = prod.inventory.status;
          if (statusEnum === ProductStatus.OUT_OF_STOCK) {
            invStatus = InventoryStatus.OUT_OF_STOCK;
          } else if (statusEnum === ProductStatus.ACTIVE) {
            const avail = Number(prod.inventory.availableQuantity);
            const thresh = Number(prod.inventory.threshold);
            invStatus =
              avail <= 0
                ? InventoryStatus.OUT_OF_STOCK
                : avail <= thresh
                ? InventoryStatus.LOW_STOCK
                : InventoryStatus.IN_STOCK;
          }
          await tx.inventoryItem.update({
            where: { id: prod.inventory.id },
            data: { status: invStatus },
          });
        }

        if (statusEnum === ProductStatus.OUT_OF_STOCK) {
          const admins = await tx.user.findMany({
            where: { role: UserRole.ADMIN, isActive: true },
            select: { id: true },
          });
          for (const adm of admins) {
            await tx.notification.create({
              data: {
                userId: adm.id,
                title: 'Produce Out of Stock',
                message: `Produce item "${prod.name}" has been marked out of stock.`,
                type: 'INVENTORY',
                link: `/admin/products/${prod.id}`,
                isRead: false,
              },
            });
          }
        }

        return prod;
      },
      { maxWait: 20000, timeout: 35000 }
    );

    return formatAdminProductResponse(updated);
  }

  /**
   * Lists all orders across consumers and farmers (Admin view) with search and filters.
   */
  async getAllOrders(
    filters: {
      search?: string;
      status?: string;
      paymentStatus?: string;
      farmerId?: string;
      farmerName?: string;
    } = {}
  ) {
    const where: Prisma.OrderWhereInput = {};

    if (filters.status && filters.status !== 'ALL') {
      const s = filters.status.toUpperCase().replace(/\s+/g, '_');
      if (Object.values(OrderStatus).includes(s as OrderStatus)) {
        where.status = s as OrderStatus;
      }
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
      const ps = filters.paymentStatus.toUpperCase();
      if (Object.values(PaymentStatus).includes(ps as PaymentStatus)) {
        where.paymentStatus = ps as PaymentStatus;
      }
    }

    if (filters.farmerId && filters.farmerId !== 'ALL') {
      where.items = { some: { farmerId: filters.farmerId } };
    } else if (filters.farmerName && filters.farmerName !== 'ALL') {
      where.items = {
        some: { farmerName: { contains: filters.farmerName, mode: 'insensitive' } },
      };
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { consumer: { name: { contains: q, mode: 'insensitive' } } },
        { consumer: { email: { contains: q, mode: 'insensitive' } } },
        { address: { name: { contains: q, mode: 'insensitive' } } },
        { address: { hub: { contains: q, mode: 'insensitive' } } },
        { address: { addressLine: { contains: q, mode: 'insensitive' } } },
        { items: { some: { farmerName: { contains: q, mode: 'insensitive' } } } },
        { items: { some: { farmName: { contains: q, mode: 'insensitive' } } } },
        { items: { some: { productName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        consumer: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        address: true,
        deliveryBatch: true,
        items: {
          include: {
            farmer: { select: { id: true, farmName: true, user: { select: { name: true } } } },
          },
        },
        timeline: { orderBy: { timestamp: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(formatAdminOrderResponse);
  }

  /**
   * Retrieves single order with full admin audit details (items, customer, address, batch, timeline).
   */
  async getOrderById(orderIdOrNumber: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        consumer: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        address: true,
        deliveryBatch: true,
        items: {
          include: {
            farmer: { select: { id: true, farmName: true, user: { select: { name: true } } } },
          },
        },
        timeline: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!order) {
      throw new Error(`Order with ID or number "${orderIdOrNumber}" not found.`);
    }

    return formatAdminOrderResponse(order);
  }

  /**
   * Updates order workflow status (ADMIN privilege) and triggers stock or sales synchronization.
   */
  async updateOrderStatus(orderIdOrNumber: string, nextStatusRaw: string) {
    const nextStatus = toPrismaOrderStatus(nextStatusRaw);

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
        timeline: true,
      },
    });

    if (!order) {
      throw new Error(`Order "${orderIdOrNumber}" not found.`);
    }

    const currentStatus = order.status;

    if (currentStatus === nextStatus) {
      return this.getOrderById(order.id);
    }

    if (currentStatus === OrderStatus.CANCELLED) {
      throw new Error('Cannot update status of an already cancelled order.');
    }

    if (currentStatus === OrderStatus.DELIVERED) {
      throw new Error('Cannot change status once an order is delivered.');
    }

    const forwardOrder: OrderStatus[] = [
      OrderStatus.PLACED,
      OrderStatus.CONFIRMED,
      OrderStatus.HARVESTING,
      OrderStatus.PACKED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];

    if (nextStatus === OrderStatus.CANCELLED) {
      const canCancel = (
        [
          OrderStatus.PLACED,
          OrderStatus.CONFIRMED,
          OrderStatus.HARVESTING,
          OrderStatus.PACKED,
        ] as OrderStatus[]
      ).includes(currentStatus);

      if (!canCancel) {
        throw new Error(`Cannot cancel order once it is ${currentStatus}.`);
      }
    } else {
      const currentIndex = forwardOrder.indexOf(currentStatus);
      const nextIndex = forwardOrder.indexOf(nextStatus);

      if (currentIndex === -1 || nextIndex === -1 || nextIndex < currentIndex) {
        throw new Error(
          `Invalid status transition from "${currentStatus}" backwards to "${nextStatus}".`
        );
      }
    }

    const meta = TIMELINE_METADATA[nextStatus] || {
      label: nextStatus.replace(/_/g, ' '),
      description: `Order progressed to ${nextStatus.replace(/_/g, ' ')}`,
    };

    await prisma.$transaction(async (tx) => {
      // If transitioning to CANCELLED, restore reserved quantities
      if (nextStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (item.productId && item.product) {
            const qty = Number(item.quantity);
            await tx.product.update({
              where: { id: item.productId },
              data: {
                availableQuantity: { increment: qty },
                reservedQuantity: { decrement: qty },
                inStock: true,
              },
            });
            if (item.product.inventory) {
              await tx.inventoryItem.update({
                where: { id: item.product.inventory.id },
                data: {
                  availableQuantity: { increment: qty },
                  reservedQuantity: { decrement: qty },
                  status: InventoryStatus.IN_STOCK,
                },
              });
            }
          }
        }
      }

      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          deliveredAt: nextStatus === OrderStatus.DELIVERED ? new Date() : undefined,
        },
      });

      // Mark previous timeline steps as completed and not current
      await tx.orderTimelineStep.updateMany({
        where: { orderId: order.id },
        data: { isCurrent: false },
      });

      // Update or create timeline step
      const existingStep = order.timeline.find((t) => t.status === nextStatus);
      if (existingStep) {
        await tx.orderTimelineStep.update({
          where: { id: existingStep.id },
          data: { isCompleted: true, isCurrent: true, timestamp: new Date() },
        });
      } else {
        await tx.orderTimelineStep.create({
          data: {
            orderId: order.id,
            status: nextStatus,
            label: meta.label,
            description: meta.description,
            isCompleted: true,
            isCurrent: true,
            timestamp: new Date(),
          },
        });
      }

      // If delivered, trigger sales generation
      if (nextStatus === OrderStatus.DELIVERED) {
        await saleService.createSalesForDeliveredOrder(order.id, tx);
      }
    }, { maxWait: 20000, timeout: 35000 });

    return this.getOrderById(order.id);
  }

  /**
   * Lists all delivery batches across the platform (Admin view) with search and filters.
   */
  async getAllDeliveryBatches(
    filters: {
      search?: string;
      status?: string;
      hub?: string;
      hubArea?: string;
      slot?: string;
      deliverySlot?: string;
    } = {}
  ) {
    const where: Prisma.DeliveryBatchWhereInput = {};

    const statusVal = filters.status;
    if (statusVal && statusVal !== 'ALL') {
      try {
        const s = toPrismaDeliveryBatchStatus(statusVal);
        where.status = s;
      } catch {
        // Ignore unrecognized status
      }
    }

    const hubVal = filters.hub || filters.hubArea;
    if (hubVal && hubVal !== 'ALL') {
      where.hubArea = { contains: hubVal.trim(), mode: 'insensitive' };
    }

    const slotVal = filters.slot || filters.deliverySlot;
    if (slotVal && slotVal !== 'ALL') {
      where.deliverySlot = { contains: slotVal.trim(), mode: 'insensitive' };
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { batchCode: { contains: q, mode: 'insensitive' } },
        { hubArea: { contains: q, mode: 'insensitive' } },
        { riderName: { contains: q, mode: 'insensitive' } },
        { riderVehicle: { contains: q, mode: 'insensitive' } },
      ];
    }

    const batches = await prisma.deliveryBatch.findMany({
      where,
      include: {
        orders: {
          include: {
            consumer: { select: { id: true, name: true, phone: true, email: true } },
            address: true,
            items: {
              include: {
                farmer: { select: { id: true, farmName: true, user: { select: { name: true } } } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        timelineSteps: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return batches.map(formatAdminDeliveryBatchResponse);
  }

  /**
   * Retrieves a single delivery batch by ID or batchCode with all consolidated orders and timeline.
   */
  async getDeliveryBatchById(batchIdOrCode: string) {
    const batch = await prisma.deliveryBatch.findFirst({
      where: {
        OR: [{ id: batchIdOrCode }, { batchCode: batchIdOrCode }],
      },
      include: {
        orders: {
          include: {
            consumer: { select: { id: true, name: true, phone: true, email: true } },
            address: true,
            items: {
              include: {
                farmer: { select: { id: true, farmName: true, user: { select: { name: true } } } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        timelineSteps: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!batch) {
      const err = new Error(`Delivery batch "${batchIdOrCode}" not found.`);
      (err as any).status = 404;
      throw err;
    }

    return formatAdminDeliveryBatchResponse(batch);
  }

  /**
   * Updates delivery batch status (Admin privilege) with lifecycle validation and order synchronization.
   */
  async updateDeliveryBatchStatus(batchIdOrCode: string, nextStatusRaw: string) {
    const batch = await prisma.deliveryBatch.findFirst({
      where: {
        OR: [{ id: batchIdOrCode }, { batchCode: batchIdOrCode }],
      },
      include: {
        orders: {
          include: { items: true },
        },
        timelineSteps: true,
      },
    });

    if (!batch) {
      const err = new Error(`Delivery batch "${batchIdOrCode}" not found.`);
      (err as any).status = 404;
      throw err;
    }

    const nextStatus = toPrismaDeliveryBatchStatus(nextStatusRaw);

    if (batch.status === nextStatus) {
      return this.getDeliveryBatchById(batch.id);
    }

    if (batch.status === DeliveryBatchStatus.DELIVERED) {
      throw new Error('Cannot change status of a DELIVERED delivery batch. It is a terminal state.');
    }

    if (batch.status === DeliveryBatchStatus.CANCELLED) {
      throw new Error('Cannot change status of a CANCELLED delivery batch. It is a terminal state.');
    }

    const progressionOrder: DeliveryBatchStatus[] = [
      DeliveryBatchStatus.PENDING,
      DeliveryBatchStatus.PREPARING,
      DeliveryBatchStatus.READY,
      DeliveryBatchStatus.OUT_FOR_DELIVERY,
      DeliveryBatchStatus.DELIVERED,
    ];

    if (nextStatus !== DeliveryBatchStatus.CANCELLED) {
      const currentIdx = progressionOrder.indexOf(batch.status);
      const nextIdx = progressionOrder.indexOf(nextStatus);

      if (currentIdx === -1 || nextIdx === -1 || nextIdx < currentIdx) {
        throw new Error(
          `Invalid status transition: Cannot transition backwards from "${batch.status}" to "${nextStatus}".`
        );
      }
    }

    const timelineLabel =
      DELIVERY_BATCH_TIMELINE_META[nextStatus]?.label || nextStatus.replace(/_/g, ' ');

    await prisma.$transaction(
      async (tx) => {
        // 1. Update batch status
        await tx.deliveryBatch.update({
          where: { id: batch.id },
          data: { status: nextStatus },
        });

        // 2. Update timeline
        await tx.deliveryBatchTimelineStep.updateMany({
          where: { batchId: batch.id },
          data: { isCurrent: false },
        });

        const existingStep = batch.timelineSteps.find((s) => s.status === nextStatus);
        if (existingStep) {
          await tx.deliveryBatchTimelineStep.update({
            where: { id: existingStep.id },
            data: { isCompleted: true, isCurrent: true, timestamp: new Date() },
          });
        } else {
          await tx.deliveryBatchTimelineStep.create({
            data: {
              batchId: batch.id,
              status: nextStatus,
              label: timelineLabel,
              isCompleted: true,
              isCurrent: true,
              timestamp: new Date(),
            },
          });
        }

        // 3. Order synchronization
        if (nextStatus === DeliveryBatchStatus.OUT_FOR_DELIVERY) {
          const ordersToUpdate = await tx.order.findMany({
            where: {
              deliveryBatchId: batch.id,
              status: { notIn: [OrderStatus.CANCELLED, OrderStatus.DELIVERED] },
            },
          });

          for (const order of ordersToUpdate) {
            await tx.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.OUT_FOR_DELIVERY },
            });

            await tx.orderTimelineStep.updateMany({
              where: { orderId: order.id },
              data: { isCurrent: false },
            });

            await tx.orderTimelineStep.create({
              data: {
                orderId: order.id,
                status: OrderStatus.OUT_FOR_DELIVERY,
                label: 'Out for Local Delivery',
                description: `Dispatched with neighborhood delivery batch #${batch.batchCode}`,
                isCompleted: true,
                isCurrent: true,
              },
            });
          }
        } else if (nextStatus === DeliveryBatchStatus.DELIVERED) {
          const ordersToDeliver = await tx.order.findMany({
            where: {
              deliveryBatchId: batch.id,
              status: { not: OrderStatus.CANCELLED },
            },
            include: { items: true },
          });

          const deliveredAt = new Date();

          for (const order of ordersToDeliver) {
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.DELIVERED,
                deliveredAt,
              },
            });

            await tx.orderTimelineStep.updateMany({
              where: { orderId: order.id },
              data: { isCurrent: false },
            });

            await tx.orderTimelineStep.create({
              data: {
                orderId: order.id,
                status: OrderStatus.DELIVERED,
                label: 'Delivered to Doorstep',
                description: `Delivered fresh to doorstep via #${batch.batchCode}`,
                isCompleted: true,
                isCurrent: true,
              },
            });

            // Update inventory quantities: reserved -> sold
            for (const item of order.items) {
              if (item.productId) {
                const inv = await tx.inventoryItem.findUnique({
                  where: { productId: item.productId },
                });

                if (inv) {
                  const qty = Number(item.quantity);
                  const updatedInv = await tx.inventoryItem.update({
                    where: { id: inv.id },
                    data: {
                      reservedQuantity: { decrement: qty },
                      soldQuantity: { increment: qty },
                    },
                  });

                  await tx.product.update({
                    where: { id: item.productId },
                    data: {
                      reservedQuantity: { decrement: qty },
                      soldQuantity: { increment: qty },
                    },
                  });

                  await tx.inventoryLog.create({
                    data: {
                      inventoryItemId: inv.id,
                      type: InventoryLogType.ORDER_FULFILLED,
                      amount: new Prisma.Decimal(qty),
                      newQuantity: updatedInv.availableQuantity,
                      reason: `Delivered via batch #${batch.batchCode} (Order #${order.orderNumber})`,
                    },
                  });
                }
              }
            }

            // Generate sales record
            await saleService.createSalesForDeliveredOrder(order.id, tx);
          }
        } else if (nextStatus === DeliveryBatchStatus.CANCELLED) {
          await tx.order.updateMany({
            where: { deliveryBatchId: batch.id },
            data: { deliveryBatchId: null },
          });
        }
      },
      { maxWait: 20000, timeout: 35000 }
    );

    return this.getDeliveryBatchById(batch.id);
  }

  // ============================================================================
  // ADMIN DISPUTE MANAGEMENT METHODS
  // ============================================================================

  /**
   * List all platform customer produce quality disputes with search and filters
   */
  async getAllDisputes(filters: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  } = {}) {
    const where: Prisma.DisputeWhereInput = {};

    if (filters.status && filters.status.toUpperCase() !== 'ALL') {
      try {
        where.status = toPrismaDisputeStatus(filters.status);
      } catch {
        // Ignore unparseable status
      }
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      const orConditions: Prisma.DisputeWhereInput[] = [
        { id: { contains: q, mode: 'insensitive' } },
        { productName: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { resolution: { contains: q, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { order: { items: { some: { farmerName: { contains: q, mode: 'insensitive' } } } } },
        { order: { items: { some: { farmName: { contains: q, mode: 'insensitive' } } } } },
      ];
      if (q.toUpperCase().startsWith('DISP-')) {
        const dispSuffix = q.slice(5).trim();
        if (dispSuffix) {
          orConditions.push({ id: { contains: dispSuffix, mode: 'insensitive' } });
        }
      }
      where.OR = orConditions;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: {
          include: {
            items: true,
            consumer: { select: { id: true, name: true, email: true, phone: true } },
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? Number(filters.limit) : undefined,
      skip: filters.page && filters.limit ? (Number(filters.page) - 1) * Number(filters.limit) : undefined,
    });

    const totalCount = await prisma.dispute.count({ where });

    // Aggregate counts for metrics across the platform
    const allDisputes = await prisma.dispute.findMany({
      select: {
        status: true,
        amount: true,
      },
    });

    let openCount = 0;
    let reviewCount = 0;
    let resolvedCount = 0;
    let rejectedCount = 0;
    let totalDisputedAmount = 0;

    for (const d of allDisputes) {
      totalDisputedAmount += Number(d.amount);
      if (d.status === DisputeStatus.OPEN) openCount++;
      else if (d.status === DisputeStatus.UNDER_REVIEW) reviewCount++;
      else if (d.status === DisputeStatus.RESOLVED) resolvedCount++;
      else if (d.status === DisputeStatus.REJECTED) rejectedCount++;
    }

    return {
      success: true,
      count: disputes.length,
      totalCount,
      metrics: {
        totalDisputes: allDisputes.length,
        openCount,
        reviewCount,
        resolvedCount,
        rejectedCount,
        totalDisputedAmount: Math.round(totalDisputedAmount * 100) / 100,
      },
      data: disputes.map((d) => formatAdminDisputeResponse(d)),
    };
  }

  /**
   * Retrieve a single dispute record with full relations
   */
  async getDisputeById(disputeIdOrNumber: string) {
    const raw = disputeIdOrNumber.trim();
    const dispute = await prisma.dispute.findFirst({
      where: {
        OR: [
          { id: raw },
          { id: { endsWith: raw.replace(/^DISP-/i, '').toLowerCase() } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: {
          include: {
            items: true,
            consumer: { select: { id: true, name: true, email: true, phone: true } },
            address: true,
          },
        },
      },
    });

    if (!dispute) {
      const err = new Error(`Dispute "${disputeIdOrNumber}" not found.`);
      (err as any).status = 404;
      throw err;
    }

    return {
      success: true,
      data: formatAdminDisputeResponse(dispute),
    };
  }

  /**
   * Update dispute progression status (OPEN -> UNDER_REVIEW -> RESOLVED | REJECTED)
   */
  async updateDisputeStatus(
    disputeIdOrNumber: string,
    input: { status?: string; resolution?: string; resolutionNote?: string; notes?: string }
  ) {
    if (!input.status) {
      const err = new Error('Missing required field: status.');
      (err as any).status = 400;
      throw err;
    }

    let nextStatus: DisputeStatus;
    try {
      nextStatus = toPrismaDisputeStatus(input.status);
    } catch (e: any) {
      const err = new Error(e.message || 'Invalid dispute status.');
      (err as any).status = 400;
      throw err;
    }

    const raw = disputeIdOrNumber.trim();
    const dispute = await prisma.dispute.findFirst({
      where: {
        OR: [
          { id: raw },
          { id: { endsWith: raw.replace(/^DISP-/i, '').toLowerCase() } },
        ],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            items: {
              select: {
                farmerId: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      const err = new Error(`Dispute "${disputeIdOrNumber}" not found.`);
      (err as any).status = 404;
      throw err;
    }

    // State transition rules:
    // Terminal states cannot transition back or to each other
    if (dispute.status === DisputeStatus.RESOLVED && nextStatus !== DisputeStatus.RESOLVED) {
      const err = new Error('Cannot change status of a RESOLVED dispute. Case is permanently closed.');
      (err as any).status = 400;
      throw err;
    }

    if (dispute.status === DisputeStatus.REJECTED && nextStatus !== DisputeStatus.REJECTED) {
      const err = new Error('Cannot change status of a REJECTED dispute. Case is permanently closed.');
      (err as any).status = 400;
      throw err;
    }

    const resolutionText = (input.resolution || input.resolutionNote || input.notes || '').trim();

    // Check mandatory resolution / rejection reason
    if (nextStatus === DisputeStatus.RESOLVED && !resolutionText) {
      const err = new Error('Resolution description is required when resolving a dispute.');
      (err as any).status = 400;
      throw err;
    }

    if (nextStatus === DisputeStatus.REJECTED && !resolutionText) {
      const err = new Error('Rejection reason/notes are required when rejecting a dispute.');
      (err as any).status = 400;
      throw err;
    }

    const updatedDispute = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: nextStatus,
            resolution: resolutionText || dispute.resolution,
          },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            order: {
              include: {
                items: true,
                consumer: { select: { id: true, name: true, email: true, phone: true } },
                address: true,
              },
            },
          },
        });

        // Notify consumer
        const titleStatus = nextStatus === DisputeStatus.UNDER_REVIEW
          ? 'Under Review'
          : nextStatus === DisputeStatus.RESOLVED
          ? 'Resolved'
          : 'Rejected';

        if (dispute.userId) {
          await tx.notification.create({
            data: {
              userId: dispute.userId,
              title: `Dispute Case Update: ${titleStatus}`,
              message: `Your dispute for order #${dispute.order.orderNumber} (${dispute.productName}) is now ${titleStatus}.${resolutionText ? ` Details: ${resolutionText}` : ''}`,
              type: 'DISPUTE',
              link: `/orders/${dispute.order.orderNumber}`,
            },
          });
        }

        // Notify grower if identified
        const firstFarmerId = dispute.order.items?.[0]?.farmerId;
        if (firstFarmerId) {
          const farmerRecord = await tx.farmer.findUnique({
            where: { id: firstFarmerId },
            select: { userId: true },
          });
          if (farmerRecord?.userId && farmerRecord.userId !== dispute.userId) {
            await tx.notification.create({
              data: {
                userId: farmerRecord.userId,
                title: `Dispute Case Update: ${titleStatus}`,
                message: `Dispute case on order #${dispute.order.orderNumber} (${dispute.productName}) is now ${titleStatus}.${resolutionText ? ` Notes: ${resolutionText}` : ''}`,
                type: 'DISPUTE',
                link: `/farmer/orders/${dispute.order.orderNumber}`,
              },
            });
          }
        }

        // Notify admins of dispute status update
        const admins = await tx.user.findMany({
          where: { role: UserRole.ADMIN, isActive: true },
          select: { id: true },
        });
        for (const adm of admins) {
          await tx.notification.create({
            data: {
              userId: adm.id,
              title: `Dispute Case Update: ${titleStatus}`,
              message: `Dispute case on order #${dispute.order.orderNumber} is now ${titleStatus}.${resolutionText ? ` Note: ${resolutionText}` : ''}`,
              type: 'DISPUTE',
              link: `/admin/disputes/${dispute.id}`,
            },
          });
        }

        return updated;
      },
      { maxWait: 20000, timeout: 35000 }
    );

    return {
      success: true,
      message: `Dispute successfully updated to ${toDisplayDisputeStatus(updatedDispute.status)}.`,
      data: formatAdminDisputeResponse(updatedDispute),
    };
  }

  // ============================================================================
  // ADMIN REVIEW MANAGEMENT METHODS
  // ============================================================================

  /**
   * List all platform customer reviews with search, rating filter, and relations
   */
  async getAllReviews(filters: {
    search?: string;
    rating?: number;
    farmerId?: string;
    productId?: string;
    limit?: number;
    page?: number;
  } = {}) {
    const where: Prisma.ReviewWhereInput = {};

    if (filters.rating && !isNaN(Number(filters.rating))) {
      where.rating = Number(filters.rating);
    }

    if (filters.farmerId) {
      where.farmerId = filters.farmerId;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { farmer: { farmName: { contains: q, mode: 'insensitive' } } },
        { farmer: { user: { name: { contains: q, mode: 'insensitive' } } } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        farmer: {
          select: {
            id: true,
            farmName: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? Number(filters.limit) : undefined,
      skip: filters.page && filters.limit ? (Number(filters.page) - 1) * Number(filters.limit) : undefined,
    });

    const totalCount = await prisma.review.count({ where });

    // Review metrics across all reviews
    const allReviews = await prisma.review.findMany({
      select: { rating: true, verifiedPurchase: true },
    });
    const totalReviews = allReviews.length;
    let sumRating = 0;
    let fiveStarCount = 0;
    let verifiedCount = 0;
    for (const r of allReviews) {
      sumRating += r.rating;
      if (r.rating === 5) fiveStarCount++;
      if (r.verifiedPurchase) verifiedCount++;
    }
    const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    const sanitized = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      verifiedPurchase: r.verifiedPurchase,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      customer: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        phone: r.user.phone || 'Not available',
      },
      farmer: {
        id: r.farmer.id,
        farmName: r.farmer.farmName,
        farmerName: r.farmer.user?.name || 'Assigned Grower',
      },
      product: r.product
        ? {
            id: r.product.id,
            name: r.product.name,
            category: r.product.category,
            price: Number(r.product.price),
            image: r.product.images?.[0] || null,
          }
        : null,
    }));

    return {
      success: true,
      count: sanitized.length,
      totalCount,
      metrics: {
        totalReviews,
        averageRating,
        fiveStarCount,
        verifiedPurchasesCount: verifiedCount,
      },
      data: sanitized,
    };
  }

  // ============================================================================
  // ADMIN DASHBOARD & ANALYTICS METHODS
  // ============================================================================

  /**
   * Retrieve platform operational dashboard metrics, trends, and recent records
   */
  async getDashboardData(timeRange: string = '6M') {
    const { buckets, startDate } = getTimeBuckets(timeRange);

    // 1. Concurrent counts and database aggregations
    const [
      totalFarmers,
      pendingFarmers,
      approvedFarmers,
      rejectedFarmers,
      totalConsumers,
      totalProducts,
      activeProducts,
      draftProducts,
      outOfStockProducts,
      expiredProducts,
      totalOrders,
      placedOrders,
      confirmedOrders,
      harvestingOrders,
      packedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      orderTotals,
      saleStatusAggregations,
      totalDisputes,
      openDisputes,
      underReviewDisputes,
      resolvedDisputes,
      rejectedDisputes,
      totalBatches,
      pendingBatches,
      preparingBatches,
      readyBatches,
      outForDeliveryBatches,
      deliveredBatches,
      cancelledBatches,
      categoryGroups,
      ordersInRange,
      salesInRange,
      farmersInRange,
      recentFarmersDb,
      pendingFarmersDb,
      recentOrdersDb,
      recentDisputesDb,
      recentNotificationsDb,
      recentSalesDb,
    ] = await Promise.all([
      // Farmer counts
      prisma.farmer.count(),
      prisma.farmer.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      prisma.farmer.count({ where: { verificationStatus: VerificationStatus.APPROVED } }),
      prisma.farmer.count({ where: { verificationStatus: VerificationStatus.REJECTED } }),
      // Consumer count
      prisma.user.count({ where: { role: UserRole.CONSUMER } }),
      // Product counts
      prisma.product.count(),
      prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      prisma.product.count({ where: { status: ProductStatus.DRAFT } }),
      prisma.product.count({
        where: {
          OR: [
            { status: ProductStatus.OUT_OF_STOCK },
            { inStock: false },
            { availableQuantity: { lte: 0 } },
          ],
        },
      }),
      prisma.product.count({ where: { status: ProductStatus.EXPIRED } }),
      // Order counts
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PLACED } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { status: OrderStatus.HARVESTING } }),
      prisma.order.count({ where: { status: OrderStatus.PACKED } }),
      prisma.order.count({ where: { status: OrderStatus.OUT_FOR_DELIVERY } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      // Order totals
      prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: {
          total: true,
          subtotal: true,
          deliveryFee: true,
          platformFee: true,
          farmerEarnings: true,
        },
      }),
      // Sales status aggregations
      prisma.sale.groupBy({
        by: ['status'],
        _sum: { revenue: true },
        _count: { id: true },
      }),
      // Dispute counts
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      prisma.dispute.count({ where: { status: DisputeStatus.UNDER_REVIEW } }),
      prisma.dispute.count({ where: { status: DisputeStatus.RESOLVED } }),
      prisma.dispute.count({ where: { status: DisputeStatus.REJECTED } }),
      // Delivery batch counts
      prisma.deliveryBatch.count(),
      prisma.deliveryBatch.count({ where: { status: DeliveryBatchStatus.PENDING } }),
      prisma.deliveryBatch.count({ where: { status: DeliveryBatchStatus.PREPARING } }),
      prisma.deliveryBatch.count({ where: { status: DeliveryBatchStatus.READY } }),
      prisma.deliveryBatch.count({ where: { status: DeliveryBatchStatus.OUT_FOR_DELIVERY } }),
      prisma.deliveryBatch.count({ where: { status: DeliveryBatchStatus.DELIVERED } }),
      prisma.deliveryBatch.count({ where: { status: DeliveryBatchStatus.CANCELLED } }),
      // Product category distribution
      prisma.product.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      // Trend queries (bounded by startDate)
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true, total: true, status: true, consumerId: true },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true, revenue: true, status: true },
      }),
      prisma.farmer.findMany({
        where: { registeredAt: { gte: startDate } },
        select: { id: true, registeredAt: true, approvedAt: true, verificationStatus: true },
      }),
      // Recent records
      prisma.farmer.findMany({
        take: 4,
        orderBy: { registeredAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
      prisma.farmer.findMany({
        where: { verificationStatus: VerificationStatus.PENDING },
        take: 4,
        orderBy: { registeredAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          verificationDocuments: { select: { id: true, type: true, title: true } },
        },
      }),
      prisma.order.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: {
          consumer: { select: { id: true, name: true, email: true } },
          items: { select: { id: true, productName: true, quantity: true } },
        },
      }),
      prisma.dispute.findMany({
        where: { status: { not: DisputeStatus.RESOLVED } },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.notification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.sale.findMany({
        where: { status: SaleStatus.PAID_OUT },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          farmer: { include: { user: { select: { name: true } } } },
        },
      }),
    ]);

    // Active orders in flight
    const activeOrders = placedOrders + confirmedOrders + harvestingOrders + packedOrders + outForDeliveryOrders;

    // Financial totals
    const totalRevenue = Number(orderTotals._sum.total || 0);
    const totalFarmerEarnings = Number(orderTotals._sum.farmerEarnings || 0);

    let pendingPayouts = 0;
    let totalPaidOut = 0;
    let refundedAmount = 0;
    let totalSalesCount = 0;

    for (const group of saleStatusAggregations) {
      totalSalesCount += group._count.id;
      const rev = Number(group._sum.revenue || 0);
      if (group.status === SaleStatus.PENDING_PAYOUT) pendingPayouts += rev;
      else if (group.status === SaleStatus.PAID_OUT) totalPaidOut += rev;
      else if (group.status === SaleStatus.REFUNDED) refundedAmount += rev;
    }

    // Rate calculations
    const nonCancelledOrders = totalOrders - cancelledOrders;
    const fulfillmentRate = nonCancelledOrders > 0
      ? Math.round((deliveredOrders / nonCancelledOrders) * 1000) / 10
      : 100;

    const nonCancelledBatches = totalBatches - cancelledBatches;
    const onTimeRate = nonCancelledBatches > 0
      ? Math.round((deliveredBatches / nonCancelledBatches) * 1000) / 10
      : 100;

    // Category distribution
    const totalCategoryCount = categoryGroups.reduce((acc, g) => acc + g._count.id, 0);
    const categoryColors: Record<string, string> = {
      VEGETABLES: '#1B4332',
      FRUITS: '#2D6A4F',
      HERBS: '#40916C',
      DAIRY: '#52B788',
      GRAINS: '#74C69D',
      PULSES: '#95D5B2',
      ORGANIC_SPECIALTY: '#B7E4C7',
      EGGS: '#D8F3DC',
      SPICES: '#D97706',
      OTHER: '#64748B',
    };
    const categoryNames: Record<string, string> = {
      VEGETABLES: 'Vegetables',
      FRUITS: 'Fruits',
      HERBS: 'Greens & Herbs',
      DAIRY: 'Dairy & Eggs',
      GRAINS: 'Grains & Pulses',
      PULSES: 'Pulses',
      ORGANIC_SPECIALTY: 'Specialty Organic',
      EGGS: 'Eggs',
      SPICES: 'Spices',
      OTHER: 'Other',
    };

    const categoryDistribution = categoryGroups.map((g) => ({
      name: categoryNames[g.category] || g.category,
      count: g._count.id,
      value: totalCategoryCount > 0 ? Math.round((g._count.id / totalCategoryCount) * 100) : 0,
      color: categoryColors[g.category] || '#64748B',
    }));

    // Time series charts
    const revenueOverTime = buckets.map((bucket) => {
      let rev = 0;
      let ords = 0;
      let payouts = 0;

      for (const o of ordersInRange) {
        if (o.createdAt >= bucket.start && o.createdAt <= bucket.end && o.status !== OrderStatus.CANCELLED) {
          rev += Number(o.total);
          ords++;
        }
      }

      for (const s of salesInRange) {
        if (s.createdAt >= bucket.start && s.createdAt <= bucket.end) {
          payouts += Number(s.revenue);
        }
      }

      return {
        month: bucket.label,
        revenue: Math.round(rev),
        orders: ords,
        payouts: Math.round(payouts),
      };
    });

    const farmerRegistrations = buckets.map((bucket) => {
      let registered = 0;
      let approved = 0;

      for (const f of farmersInRange) {
        if (f.registeredAt >= bucket.start && f.registeredAt <= bucket.end) {
          registered++;
        }
        if (f.approvedAt && f.approvedAt >= bucket.start && f.approvedAt <= bucket.end) {
          approved++;
        }
      }

      return {
        month: bucket.label,
        registered,
        approved,
      };
    });

    // Activities
    const activities: any[] = [];
    for (const s of recentSalesDb) {
      activities.push({
        id: `sale-${s.id}`,
        type: 'PAYOUT_PROCESSED',
        title: 'Farmer Payout Settled',
        description: `Settled ₹${s.revenue} to ${s.farmer?.user?.name || s.farmer?.farmName} for ${s.productName}.`,
        timestamp: s.payoutDate ? new Date(s.payoutDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date(s.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric' }),
        actor: 'Krishi Automated Finance Bot',
        badge: { label: 'Finance', variant: 'emerald' },
        createdAt: s.updatedAt,
      });
    }

    for (const n of recentNotificationsDb) {
      let badgeVariant = 'blue';
      let badgeLabel = 'System';
      if (n.type === 'VERIFICATION') {
        badgeVariant = 'amber';
        badgeLabel = 'Verification';
      } else if (n.type === 'DISPUTE') {
        badgeVariant = 'rose';
        badgeLabel = 'Mediation';
      } else if (n.type === 'ORDER') {
        badgeVariant = 'emerald';
        badgeLabel = 'Order';
      } else if (n.type === 'DELIVERY') {
        badgeVariant = 'blue';
        badgeLabel = 'Logistics';
      }

      activities.push({
        id: `notif-${n.id}`,
        type: n.type,
        title: n.title,
        description: n.message,
        timestamp: new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        actor: n.user?.name || 'Platform Governance',
        badge: { label: badgeLabel, variant: badgeVariant },
        createdAt: n.createdAt,
      });
    }

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivities = activities.slice(0, 5);

    // Format recent farmers
    const recentFarmers = recentFarmersDb.map((f) => ({
      id: f.id,
      name: f.user?.name || f.farmName,
      avatar: f.user?.avatar || f.coverImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      farmName: f.farmName,
      hub: f.hub,
      location: f.location || f.farmLocation,
      verificationStatus: f.verificationStatus.toLowerCase(),
      registeredAt: f.registeredAt.toISOString(),
    }));

    const pendingFarmersQueue = pendingFarmersDb.map((pf) => ({
      id: pf.id,
      name: pf.user?.name || pf.farmName,
      farmName: pf.farmName,
      location: pf.location || pf.farmLocation,
      hub: pf.hub,
      documents: pf.verificationDocuments,
      documentsCount: pf.verificationDocuments.length,
      registeredAt: pf.registeredAt.toISOString(),
    }));

    // Format recent orders
    const recentOrders = recentOrdersDb.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      customerName: o.consumer?.name || 'Customer',
      customerEmail: o.consumer?.email || '',
      items: o.items,
      itemCount: o.items.length,
      total: Number(o.total),
      date: o.createdAt.toISOString(),
    }));

    // Format recent disputes
    const recentDisputes = recentDisputesDb.map((d) => ({
      id: d.id,
      disputeNumber: d.id.startsWith('DISP-') ? d.id : `DISP-${d.id.slice(-4).toUpperCase()}`,
      orderId: d.orderId,
      customerName: d.user?.name || 'Customer',
      productName: d.productName,
      reason: d.reason,
      amount: Number(d.amount),
      status: toDisplayDisputeStatus(d.status),
      rawStatus: d.status,
      date: d.createdAt.toISOString(),
    }));

    // Platform metrics object matching AdminPlatformMetrics interface
    const metrics = {
      totalFarmers,
      pendingVerification: pendingFarmers,
      approvedFarmers,
      rejectedFarmers,
      totalConsumers,
      totalProducts,
      activeOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingPayouts: Math.round(pendingPayouts * 100) / 100,
      totalPaidOut: Math.round(totalPaidOut * 100) / 100,
      gmvMonthly: Math.round(totalRevenue * 100) / 100,
      fulfillmentRate,
      onTimeRate,
    };

    return {
      success: true,
      data: {
        farmerStats: {
          total: totalFarmers,
          pending: pendingFarmers,
          approved: approvedFarmers,
          rejected: rejectedFarmers,
        },
        consumerStats: {
          total: totalConsumers,
        },
        productStats: {
          total: totalProducts,
          active: activeProducts,
          draft: draftProducts,
          outOfStock: outOfStockProducts,
          expired: expiredProducts,
        },
        orderStats: {
          total: totalOrders,
          placed: placedOrders,
          confirmed: confirmedOrders,
          harvesting: harvestingOrders,
          packed: packedOrders,
          outForDelivery: outForDeliveryOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          active: activeOrders,
        },
        revenueStats: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalFarmerEarnings: Math.round(totalFarmerEarnings * 100) / 100,
          pendingPayouts: Math.round(pendingPayouts * 100) / 100,
          paidPayouts: Math.round(totalPaidOut * 100) / 100,
          refundedAmount: Math.round(refundedAmount * 100) / 100,
          totalSales: totalSalesCount,
        },
        disputeStats: {
          total: totalDisputes,
          open: openDisputes,
          underReview: underReviewDisputes,
          resolved: resolvedDisputes,
          rejected: rejectedDisputes,
        },
        deliveryStats: {
          total: totalBatches,
          pending: pendingBatches,
          preparing: preparingBatches,
          ready: readyBatches,
          outForDelivery: outForDeliveryBatches,
          delivered: deliveredBatches,
          cancelled: cancelledBatches,
        },
        metrics,
        charts: {
          revenueOverTime,
          ordersOverTime: revenueOverTime.map((r) => ({ month: r.month, orders: r.orders })),
          farmerRegistrations,
          categoryDistribution,
        },
        recentFarmers,
        pendingFarmers: pendingFarmersQueue,
        recentOrders,
        recentDisputes,
        recentActivities,
      },
    };
  }

  /**
   * Retrieve platform analytics data for charts (revenue, orders, categories, registrations, consumer growth, delivery performance)
   */
  /**
   * Retrieve platform analytics and reports data calculated from PostgreSQL
   * Covers all 16 KPIs, Sales, Orders, Revenue trend, Products, Categories, Farmers, Inventory, Surplus, Delivery, Customers, Disputes & Reviews.
   */
  async getAnalyticsData(timeRange: string = '6M', customStart?: string, customEnd?: string) {
    const { buckets, startDate, endDate } = getTimeBuckets(timeRange, customStart, customEnd);

    const [
      // 1. User & Consumer counts
      totalUsers,
      totalConsumers,
      // 2. Farmer counts
      totalFarmers,
      approvedFarmers,
      pendingFarmers,
      rejectedFarmers,
      farmersWithActiveProducts,
      // 3. Product counts
      totalProducts,
      activeProducts,
      // 4. Order counts & status breakdown
      totalOrders,
      orderStatusGroups,
      orderTotalsAgg,
      // 5. Sales aggregations & status breakdown
      saleStatusGroups,
      saleTotalsAgg,
      // 6. Inventory aggregations
      inventoryStatusGroups,
      inventorySumsAgg,
      // 7. Surplus offers aggregations
      surplusStatusGroups,
      surplusSumsAgg,
      // 8. Delivery batches aggregations
      deliveryStatusGroups,
      deliveryAvgDistAgg,
      // 9. Dispute & review health
      disputeStatusGroups,
      reviewStatsAgg,
      verifiedReviewsCount,
      // 10. Top products & Top farmers
      topProductsGroups,
      topFarmersGroups,
      // 11. Category distribution
      categoryProductGroups,
      categorySalesGroups,
      // 12. Consumers with orders
      distinctConsumersWithOrders,
      // 13. Scoped to time range for charts
      ordersInRange,
      salesInRange,
      farmersInRange,
      consumersInRange,
      batchesInRange,
    ] = await Promise.all([
      // 1. User & Consumer counts
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.CONSUMER } }),
      // 2. Farmer counts
      prisma.farmer.count(),
      prisma.farmer.count({ where: { verificationStatus: VerificationStatus.APPROVED } }),
      prisma.farmer.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      prisma.farmer.count({ where: { verificationStatus: VerificationStatus.REJECTED } }),
      prisma.farmer.count({ where: { products: { some: { status: ProductStatus.ACTIVE } } } }),
      // 3. Product counts
      prisma.product.count(),
      prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      // 4. Order counts & breakdown
      prisma.order.count(),
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.order.aggregate({
        _sum: {
          total: true,
          farmerEarnings: true,
          platformFee: true,
          deliveryFee: true,
        },
      }),
      // 5. Sales aggregations
      prisma.sale.groupBy({ by: ['status'], _count: { id: true }, _sum: { revenue: true } }),
      prisma.sale.aggregate({ _sum: { revenue: true } }),
      // 6. Inventory aggregations
      prisma.inventoryItem.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.inventoryItem.aggregate({
        _sum: {
          currentStock: true,
          availableQuantity: true,
          reservedQuantity: true,
          soldQuantity: true,
        },
      }),
      // 7. Surplus offers
      prisma.surplusOffer.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.surplusOffer.aggregate({ _sum: { availableQuantity: true } }),
      // 8. Delivery batches
      prisma.deliveryBatch.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.deliveryBatch.aggregate({ _avg: { estimatedDistanceKm: true } }),
      // 9. Dispute & review health
      prisma.dispute.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),
      prisma.review.count({ where: { verifiedPurchase: true } }),
      // 10. Top products & Top farmers
      prisma.orderItem.groupBy({
        by: ['productName'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _sum: { quantity: true, totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
      prisma.orderItem.groupBy({
        by: ['farmerName', 'farmName'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _sum: { quantity: true, totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
      // 11. Category distribution
      prisma.product.groupBy({ by: ['category'], _count: { id: true } }),
      prisma.sale.groupBy({ by: ['category'], _sum: { revenue: true }, _count: { id: true } }),
      // 12. Consumers with orders
      prisma.order.findMany({
        distinct: ['consumerId'],
        select: { consumerId: true },
      }),
      // 13. Scoped to time range for charts
      prisma.order.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { id: true, createdAt: true, total: true, farmerEarnings: true, platformFee: true, deliveryFee: true, status: true, consumerId: true },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { id: true, createdAt: true, revenue: true, status: true },
      }),
      prisma.farmer.findMany({
        where: { registeredAt: { gte: startDate, lte: endDate } },
        select: { id: true, registeredAt: true, approvedAt: true, verificationStatus: true },
      }),
      prisma.user.findMany({
        where: { role: UserRole.CONSUMER, createdAt: { gte: startDate, lte: endDate } },
        select: { id: true, createdAt: true },
      }),
      prisma.deliveryBatch.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { id: true, createdAt: true, status: true },
      }),
    ]);

    // Order status map
    const orderStatusMap: Record<string, number> = {};
    for (const g of orderStatusGroups) {
      orderStatusMap[g.status] = g._count.id;
    }
    const deliveredOrders = orderStatusMap[OrderStatus.DELIVERED] || 0;
    const cancelledOrders = orderStatusMap[OrderStatus.CANCELLED] || 0;
    const pendingOrders = totalOrders - deliveredOrders - cancelledOrders;
    const nonCancelledOrders = totalOrders - cancelledOrders;
    const completionRate = nonCancelledOrders > 0
      ? Math.round((deliveredOrders / nonCancelledOrders) * 1000) / 10
      : 100;

    // Financial calculations
    const grossOrderValue = Math.round(Number(orderTotalsAgg._sum.total || 0) * 100) / 100;
    const farmerEarnings = Math.round(Number(orderTotalsAgg._sum.farmerEarnings || 0) * 100) / 100;
    const platformFeeOnly = Number(orderTotalsAgg._sum.platformFee || 0);
    const deliveryFeeOnly = Number(orderTotalsAgg._sum.deliveryFee || 0);
    const platformRevenue = Math.round((platformFeeOnly + deliveryFeeOnly) * 100) / 100;

    // Sales status map
    const saleStatusCountMap: Record<string, number> = {};
    const saleStatusAmountMap: Record<string, number> = {};
    let totalSalesCount = 0;
    for (const g of saleStatusGroups) {
      saleStatusCountMap[g.status] = g._count.id;
      saleStatusAmountMap[g.status] = Number(g._sum.revenue || 0);
      totalSalesCount += g._count.id;
    }
    const completedSalesCount = saleStatusCountMap[SaleStatus.COMPLETED] || 0;
    const pendingPayoutsCount = saleStatusCountMap[SaleStatus.PENDING_PAYOUT] || 0;
    const paidOutSalesCount = saleStatusCountMap[SaleStatus.PAID_OUT] || 0;
    const refundedSalesCount = saleStatusCountMap[SaleStatus.REFUNDED] || 0;
    const pendingPayoutsAmount = Math.round((saleStatusAmountMap[SaleStatus.PENDING_PAYOUT] || 0) * 100) / 100;
    const paidOutAmount = Math.round((saleStatusAmountMap[SaleStatus.PAID_OUT] || 0) * 100) / 100;
    const refundedAmount = Math.round((saleStatusAmountMap[SaleStatus.REFUNDED] || 0) * 100) / 100;

    // Delivery batches map
    const deliveryStatusMap: Record<string, number> = {};
    let totalBatches = 0;
    for (const g of deliveryStatusGroups) {
      deliveryStatusMap[g.status] = g._count.id;
      totalBatches += g._count.id;
    }
    const deliveredBatches = deliveryStatusMap[DeliveryBatchStatus.DELIVERED] || 0;
    const cancelledBatches = deliveryStatusMap[DeliveryBatchStatus.CANCELLED] || 0;
    const activeBatches = (deliveryStatusMap[DeliveryBatchStatus.PENDING] || 0) +
      (deliveryStatusMap[DeliveryBatchStatus.PREPARING] || 0) +
      (deliveryStatusMap[DeliveryBatchStatus.READY] || 0) +
      (deliveryStatusMap[DeliveryBatchStatus.OUT_FOR_DELIVERY] || 0);
    const nonCancelledBatches = totalBatches - cancelledBatches;
    const deliveryCompletionRate = nonCancelledBatches > 0
      ? Math.round((deliveredBatches / nonCancelledBatches) * 1000) / 10
      : 100;
    const avgDistanceKm = Math.round(Number(deliveryAvgDistAgg._avg.estimatedDistanceKm || 0) * 10) / 10;
    const ordersPerBatch = totalBatches > 0 ? Math.round((totalOrders / totalBatches) * 10) / 10 : 0;

    // Inventory status map
    const inventoryStatusMap: Record<string, number> = {};
    let totalInventoryItems = 0;
    for (const g of inventoryStatusGroups) {
      inventoryStatusMap[g.status] = g._count.id;
      totalInventoryItems += g._count.id;
    }
    const currentStock = Math.round(Number(inventorySumsAgg._sum.currentStock || 0) * 100) / 100;
    const availableQuantity = Math.round(Number(inventorySumsAgg._sum.availableQuantity || 0) * 100) / 100;
    const reservedQuantity = Math.round(Number(inventorySumsAgg._sum.reservedQuantity || 0) * 100) / 100;
    const soldQuantity = Math.round(Number(inventorySumsAgg._sum.soldQuantity || 0) * 100) / 100;

    // Surplus offer status map
    const surplusStatusMap: Record<string, number> = {};
    let totalSurplusOffers = 0;
    for (const g of surplusStatusGroups) {
      surplusStatusMap[g.status] = g._count.id;
      totalSurplusOffers += g._count.id;
    }
    const activeSurplusOffers = surplusStatusMap[SurplusOfferStatus.ACTIVE] || 0;
    const claimedSurplusOffers = surplusStatusMap[SurplusOfferStatus.CLAIMED] || 0;
    const expiredSurplusOffers = surplusStatusMap[SurplusOfferStatus.EXPIRED] || 0;
    const cancelledSurplusOffers = surplusStatusMap[SurplusOfferStatus.CANCELLED] || 0;
    const totalSurplusAvailableQty = Math.round(Number(surplusSumsAgg._sum.availableQuantity || 0) * 100) / 100;

    // Disputes map
    const disputeStatusMap: Record<string, number> = {};
    let totalDisputes = 0;
    for (const g of disputeStatusGroups) {
      disputeStatusMap[g.status] = g._count.id;
      totalDisputes += g._count.id;
    }
    const openDisputes = disputeStatusMap[DisputeStatus.OPEN] || 0;

    // Category distribution
    const totalCategoryCount = categoryProductGroups.reduce((acc, g) => acc + g._count.id, 0);
    const categoryColors: Record<string, string> = {
      VEGETABLES: '#1B4332',
      FRUITS: '#2D6A4F',
      HERBS: '#40916C',
      DAIRY: '#52B788',
      GRAINS: '#74C69D',
      PULSES: '#95D5B2',
      ORGANIC_SPECIALTY: '#B7E4C7',
      EGGS: '#D8F3DC',
      SPICES: '#D97706',
      OTHER: '#64748B',
    };
    const categoryNames: Record<string, string> = {
      VEGETABLES: 'Vegetables',
      FRUITS: 'Fruits',
      HERBS: 'Greens & Herbs',
      DAIRY: 'Dairy & Eggs',
      GRAINS: 'Grains & Pulses',
      PULSES: 'Pulses',
      ORGANIC_SPECIALTY: 'Specialty Organic',
      EGGS: 'Eggs',
      SPICES: 'Spices',
      OTHER: 'Other',
    };

    const categoryDistribution = categoryProductGroups.map((g) => ({
      category: g.category,
      name: categoryNames[g.category] || g.category,
      count: g._count.id,
      value: totalCategoryCount > 0 ? Math.round((g._count.id / totalCategoryCount) * 100) : 0,
      color: categoryColors[g.category] || '#64748B',
    }));

    // Customer intelligence
    const consumersWithOrdersCount = distinctConsumersWithOrders.length;
    const aov = totalOrders > 0 ? Math.round(grossOrderValue / totalOrders) : 0;

    // Top products
    const topProducts = topProductsGroups.map((p) => ({
      productName: p.productName,
      quantitySold: Number(p._sum.quantity || 0),
      revenue: Math.round(Number(p._sum.totalPrice || 0)),
      ordersCount: p._count.id,
    }));
    const totalUnitsSold = topProducts.reduce((acc, p) => acc + p.quantitySold, 0);

    // Top farmers
    const topFarmers = topFarmersGroups.map((f) => ({
      farmerName: f.farmerName,
      farmName: f.farmName,
      totalSales: Math.round(Number(f._sum.totalPrice || 0)),
      volumeSold: Number(f._sum.quantity || 0),
      ordersCount: f._count.id,
    }));

    // Time series: Revenue Over Time
    const revenueOverTime = buckets.map((bucket) => {
      let gmv = 0;
      let fEarnings = 0;
      let pRevenue = 0;
      let ords = 0;
      let payouts = 0;

      for (const o of ordersInRange) {
        if (o.createdAt >= bucket.start && o.createdAt <= bucket.end && o.status !== OrderStatus.CANCELLED) {
          gmv += Number(o.total);
          fEarnings += Number(o.farmerEarnings);
          pRevenue += Number(o.platformFee || 0) + Number(o.deliveryFee || 0);
          ords++;
        }
      }

      for (const s of salesInRange) {
        if (s.createdAt >= bucket.start && s.createdAt <= bucket.end) {
          payouts += Number(s.revenue);
        }
      }

      return {
        month: bucket.label,
        label: bucket.label,
        periodStart: bucket.start.toISOString(),
        periodEnd: bucket.end.toISOString(),
        revenue: Math.round(gmv),
        gmv: Math.round(gmv),
        farmerEarnings: Math.round(fEarnings || payouts),
        platformRevenue: Math.round(pRevenue),
        payouts: Math.round(payouts),
        orders: ords,
      };
    });

    const ordersOverTime = revenueOverTime.map((r) => ({
      month: r.month,
      orders: r.orders,
    }));

    // Farmer Registrations
    const farmerRegistrations = buckets.map((bucket) => {
      let registered = 0;
      let approved = 0;

      for (const f of farmersInRange) {
        if (f.registeredAt >= bucket.start && f.registeredAt <= bucket.end) {
          registered++;
        }
        if (f.approvedAt && f.approvedAt >= bucket.start && f.approvedAt <= bucket.end) {
          approved++;
        }
      }

      return {
        month: bucket.label,
        registered,
        approved,
      };
    });

    // Consumer Growth
    let runningConsumers = totalConsumers - consumersInRange.length;
    const consumerGrowth = buckets.map((bucket) => {
      const newInBucket = consumersInRange.filter(
        (c) => c.createdAt >= bucket.start && c.createdAt <= bucket.end
      ).length;
      runningConsumers += newInBucket;

      const activeBuyers = new Set(
        ordersInRange
          .filter((o) => o.createdAt >= bucket.start && o.createdAt <= bucket.end)
          .map((o) => o.consumerId)
      ).size;

      return {
        month: bucket.label,
        consumers: Math.max(runningConsumers, newInBucket),
        activeDaily: activeBuyers,
      };
    });

    // Delivery performance for last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const deliveryPerformance: Array<{ day: string; onTime: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
      const endD = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
      const dayLabel = dayNames[d.getDay()];

      const batchesOnDay = batchesInRange.filter(
        (b) => b.createdAt >= d && b.createdAt <= endD
      );

      let rate = 100;
      if (batchesOnDay.length > 0) {
        const dCount = batchesOnDay.filter((b) => b.status === DeliveryBatchStatus.DELIVERED).length;
        const nonCanc = batchesOnDay.filter((b) => b.status !== DeliveryBatchStatus.CANCELLED).length;
        rate = nonCanc > 0 ? Math.round((dCount / nonCanc) * 100) : 100;
      }

      deliveryPerformance.push({
        day: dayLabel,
        onTime: rate,
      });
    }

    return {
      success: true,
      data: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        // 1. Overview KPIs (Section 3)
        kpis: {
          totalUsers,
          totalFarmers,
          approvedFarmers,
          pendingFarmers,
          rejectedFarmers,
          totalConsumers,
          totalProducts,
          activeProducts,
          totalOrders,
          completedOrders: deliveredOrders,
          cancelledOrders,
          totalSales: grossOrderValue,
          grossOrderValue,
          farmerEarnings,
          platformRevenue,
          activeDeliveryBatches: activeBatches,
          activeSurplusOffers,
          openDisputes,
        },
        // 2. Sales Analytics (Section 4)
        salesAnalytics: {
          totalSales: totalSalesCount,
          totalGmv: grossOrderValue,
          grossOrderValue,
          completedSales: completedSalesCount,
          pendingPayouts: pendingPayoutsAmount,
          paidOutSales: paidOutAmount,
          refundedSales: refundedAmount,
          farmerEarnings,
          platformRevenue,
          statusBreakdown: {
            completed: completedSalesCount,
            pendingPayout: pendingPayoutsCount,
            paidOut: paidOutSalesCount,
            refunded: refundedSalesCount,
            COMPLETED: completedSalesCount,
            PENDING_PAYOUT: pendingPayoutsCount,
            PAID_OUT: paidOutSalesCount,
            REFUNDED: refundedSalesCount,
          },
        },
        // 3. Order Analytics (Section 5)
        orderAnalytics: {
          totalOrders,
          deliveredOrders,
          cancelledOrders,
          pendingOrders,
          completionRate,
          deliveryCompletionRate: completionRate,
          statusBreakdown: {
            placed: orderStatusMap[OrderStatus.PLACED] || 0,
            confirmed: orderStatusMap[OrderStatus.CONFIRMED] || 0,
            harvesting: orderStatusMap[OrderStatus.HARVESTING] || 0,
            packed: orderStatusMap[OrderStatus.PACKED] || 0,
            outForDelivery: orderStatusMap[OrderStatus.OUT_FOR_DELIVERY] || 0,
            delivered: deliveredOrders,
            cancelled: cancelledOrders,
            PLACED: orderStatusMap[OrderStatus.PLACED] || 0,
            CONFIRMED: orderStatusMap[OrderStatus.CONFIRMED] || 0,
            HARVESTING: orderStatusMap[OrderStatus.HARVESTING] || 0,
            PACKED: orderStatusMap[OrderStatus.PACKED] || 0,
            OUT_FOR_DELIVERY: orderStatusMap[OrderStatus.OUT_FOR_DELIVERY] || 0,
            DELIVERED: deliveredOrders,
            CANCELLED: cancelledOrders,
          },
        },
        // 4. Revenue Trend (Section 6)
        revenueTrend: revenueOverTime,
        // 5. Product Performance (Section 7)
        productPerformance: {
          topProducts,
          totalUnitsSold,
        },
        // 6. Category Analytics (Section 8)
        categoryAnalytics: categoryDistribution,
        // 7. Farmer Performance (Section 9)
        farmerPerformance: {
          totalFarmers,
          approvedFarmers,
          pendingFarmers,
          rejectedFarmers,
          farmersWithActiveProducts,
          farmerEarnings,
          topFarmers,
        },
        // 8. Inventory Analytics (Section 10)
        inventoryAnalytics: {
          totalItems: totalInventoryItems,
          inStock: inventoryStatusMap[InventoryStatus.IN_STOCK] || 0,
          lowStock: inventoryStatusMap[InventoryStatus.LOW_STOCK] || 0,
          outOfStock: inventoryStatusMap[InventoryStatus.OUT_OF_STOCK] || 0,
          expired: inventoryStatusMap[InventoryStatus.EXPIRED] || 0,
          currentStock,
          availableQuantity,
          reservedQuantity,
          soldQuantity,
        },
        // 9. Surplus Analytics (Section 11)
        surplusAnalytics: {
          totalOffers: totalSurplusOffers,
          activeOffers: activeSurplusOffers,
          claimedOffers: claimedSurplusOffers,
          expiredOffers: expiredSurplusOffers,
          cancelledOffers: cancelledSurplusOffers,
          totalAvailableQuantity: totalSurplusAvailableQty,
        },
        // 10. Delivery Analytics (Section 12)
        deliveryAnalytics: {
          totalBatches,
          activeBatches,
          pending: deliveryStatusMap[DeliveryBatchStatus.PENDING] || 0,
          preparing: deliveryStatusMap[DeliveryBatchStatus.PREPARING] || 0,
          ready: deliveryStatusMap[DeliveryBatchStatus.READY] || 0,
          outForDelivery: deliveryStatusMap[DeliveryBatchStatus.OUT_FOR_DELIVERY] || 0,
          delivered: deliveredBatches,
          cancelled: cancelledBatches,
          completionRate: deliveryCompletionRate,
          averageEstimatedDistance: avgDistanceKm,
          averageDistanceKm: avgDistanceKm,
          ordersPerBatch,
          statusBreakdown: {
            PENDING: deliveryStatusMap[DeliveryBatchStatus.PENDING] || 0,
            PREPARING: deliveryStatusMap[DeliveryBatchStatus.PREPARING] || 0,
            READY: deliveryStatusMap[DeliveryBatchStatus.READY] || 0,
            OUT_FOR_DELIVERY: deliveryStatusMap[DeliveryBatchStatus.OUT_FOR_DELIVERY] || 0,
            DELIVERED: deliveredBatches,
            CANCELLED: cancelledBatches,
          },
        },
        // 11. Customer Analytics (Section 13)
        customerAnalytics: {
          totalConsumers,
          consumersWithOrders: consumersWithOrdersCount,
          orderCount: totalOrders,
          averageOrderValue: aov,
        },
        // 12. Dispute & Review Health (Section 14)
        healthAnalytics: {
          disputes: {
            total: totalDisputes,
            open: openDisputes,
            underReview: disputeStatusMap[DisputeStatus.UNDER_REVIEW] || 0,
            resolved: disputeStatusMap[DisputeStatus.RESOLVED] || 0,
            rejected: disputeStatusMap[DisputeStatus.REJECTED] || 0,
          },
          reviews: {
            totalReviews: Number(reviewStatsAgg._count.id || 0),
            averageRating: Math.round(Number(reviewStatsAgg._avg.rating || 0) * 10) / 10,
            verifiedPurchasesCount: verifiedReviewsCount,
          },
        },
        // Backward-compatible fields
        revenueOverTime,
        ordersOverTime,
        farmerRegistrations,
        categoryDistribution,
        consumerGrowth,
        deliveryPerformance,
      },
    };
  }

  /**
   * Lists all users across the platform with search, role, status filtering, and pagination.
   * Strictly sanitizes sensitive credentials (never returns passwordHash).
   */
  async getAllUsers(options: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (options.role && options.role !== 'ALL') {
      const roleUpper = options.role.toUpperCase();
      if (['ADMIN', 'FARMER', 'CONSUMER'].includes(roleUpper)) {
        where.role = roleUpper as UserRole;
      }
    }

    if (options.status && options.status !== 'ALL') {
      if (options.status.toLowerCase() === 'active') {
        where.isActive = true;
      } else if (options.status.toLowerCase() === 'inactive') {
        where.isActive = false;
      }
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          farmer: {
            select: {
              id: true,
              farmName: true,
              hub: true,
              city: true,
              verificationStatus: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
            },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetches full profile details for a specific user (Admin view).
   * Strictly sanitizes sensitive credentials (never returns passwordHash).
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        farmer: {
          select: {
            id: true,
            farmName: true,
            location: true,
            city: true,
            state: true,
            hub: true,
            farmingMethod: true,
            acreage: true,
            verificationStatus: true,
            isVerified: true,
            approvedAt: true,
          },
        },
        addresses: {
          select: {
            id: true,
            name: true,
            phone: true,
            addressLine: true,
            city: true,
            state: true,
            pincode: true,
            hub: true,
            isDefault: true,
          },
        },
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            disputes: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    return user;
  }

  /**
   * Updates only the active status (activate / deactivate) of a user account.
   * Enforces self-protection: Administrators cannot deactivate their own accounts.
   * Strictly ignores and prevents modification of role, passwordHash, or verification fields.
   */
  async updateUserStatus(adminUserId: string, targetUserId: string, isActive: boolean) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new Error(`User with ID ${targetUserId} not found.`);
    }

    if (adminUserId === targetUserId) {
      throw new Error('Self-protection: Administrators cannot deactivate their own accounts.');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isActive: Boolean(isActive),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}

interface TimeBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export function getTimeBuckets(
  timeRange: string = '6M',
  customStart?: string,
  customEnd?: string
): { buckets: TimeBucket[]; startDate: Date; endDate: Date } {
  const now = new Date();
  const buckets: TimeBucket[] = [];
  const normalized = (timeRange || '6M').toUpperCase().trim();

  if (customStart && customEnd) {
    const s = new Date(customStart);
    const e = new Date(customEnd);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && s <= e) {
      const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 31) {
        for (let i = 0; i <= diffDays; i++) {
          const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i, 0, 0, 0, 0);
          const endD = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i, 23, 59, 59, 999);
          if (d <= e) {
            const label = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            buckets.push({ key, label, start: d, end: endD });
          }
        }
      } else {
        let cur = new Date(s.getFullYear(), s.getMonth(), 1);
        while (cur <= e) {
          const endD = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
          const label = cur.toLocaleString('en-US', { month: 'short' });
          const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
          buckets.push({ key, label, start: cur, end: endD });
          cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }
      }
      return { buckets, startDate: s, endDate: e };
    }
  }

  if (normalized === '7D' || normalized === '7DAYS' || normalized === '1W') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
      const label = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      buckets.push({ key, label, start: d, end });
    }
  } else if (normalized === '1M' || normalized === '30D' || normalized === '30DAYS') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
      const label = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      buckets.push({ key, label, start: d, end });
    }
  } else {
    let monthsCount = 6;
    if (normalized === '3M' || normalized === '90D') monthsCount = 3;
    else if (normalized === '1Y' || normalized === '12M') monthsCount = 12;

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = d.toLocaleString('en-US', { month: 'short' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, label, start: d, end });
    }
  }

  const startDate = buckets.length > 0 ? buckets[0].start : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const endDate = buckets.length > 0 ? buckets[buckets.length - 1].end : now;
  return { buckets, startDate, endDate };
}

export function toPrismaDisputeStatus(raw: string): DisputeStatus {
  const norm = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (norm === 'OPEN') return DisputeStatus.OPEN;
  if (norm === 'UNDER_REVIEW' || norm === 'UNDERREVIEW') return DisputeStatus.UNDER_REVIEW;
  if (norm === 'RESOLVED') return DisputeStatus.RESOLVED;
  if (norm === 'REJECTED') return DisputeStatus.REJECTED;
  throw new Error(`Invalid dispute status "${raw}". Must be one of: OPEN, UNDER_REVIEW, RESOLVED, REJECTED.`);
}

export function toDisplayDisputeStatus(status: DisputeStatus): 'Open' | 'Under Review' | 'Resolved' | 'Rejected' {
  switch (status) {
    case DisputeStatus.OPEN:
      return 'Open';
    case DisputeStatus.UNDER_REVIEW:
      return 'Under Review';
    case DisputeStatus.RESOLVED:
      return 'Resolved';
    case DisputeStatus.REJECTED:
      return 'Rejected';
    default:
      return 'Open';
  }
}

export function formatAdminDisputeResponse(dispute: any) {
  const dispNumber = dispute.id.startsWith('DISP-')
    ? dispute.id
    : `DISP-${dispute.id.slice(-4).toUpperCase()}`;

  const matchingItem = dispute.order?.items?.find((i: any) =>
    i.productName?.toLowerCase().includes(dispute.productName?.toLowerCase())
  );
  const firstItem = dispute.order?.items?.[0];

  const farmerId = matchingItem?.farmerId || firstItem?.farmerId || 'N/A';
  const farmerName = matchingItem?.farmerName || firstItem?.farmerName || 'Assigned Grower';
  const farmName = matchingItem?.farmName || firstItem?.farmName || 'Krishi Partner Farm';

  const dateFormatted = new Date(dispute.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const displayStatus = toDisplayDisputeStatus(dispute.status);

  // Dynamic timeline construction
  const timeline: Array<{
    stage: string;
    note: string;
    timestamp: string;
    actor: string;
  }> = [
    {
      stage: 'Dispute Filed',
      note: dispute.description ? `${dispute.reason}: ${dispute.description}` : dispute.reason,
      timestamp: new Date(dispute.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actor: `${dispute.user?.name || 'Customer'} (Customer)`,
    },
  ];

  if (dispute.status === DisputeStatus.UNDER_REVIEW || dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.REJECTED) {
    timeline.push({
      stage: 'Under Review',
      note: 'Administrative review initiated by Governance Lead.',
      timestamp: new Date(dispute.updatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actor: 'Governance Lead',
    });
  }

  if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.REJECTED) {
    timeline.push({
      stage: displayStatus,
      note: dispute.resolution || (dispute.status === DisputeStatus.RESOLVED ? 'Credit issued / claim resolved.' : 'Dispute claim rejected.'),
      timestamp: new Date(dispute.updatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actor: 'Governance Lead',
    });
  }

  return {
    id: dispute.id,
    disputeNumber: dispNumber,
    orderId: dispute.orderId,
    orderNumber: dispute.order?.orderNumber || 'N/A',
    customerId: dispute.userId,
    customerName: dispute.user?.name || 'Customer',
    customerEmail: dispute.user?.email || 'N/A',
    customerPhone: dispute.user?.phone || 'Not available',
    farmerId,
    farmerName,
    farmName,
    productName: dispute.productName,
    amount: Number(dispute.amount),
    reason: dispute.reason,
    description: dispute.description,
    status: displayStatus,
    rawStatus: dispute.status,
    resolutionNote: dispute.resolution || null,
    resolution: dispute.resolution || null,
    date: dateFormatted,
    createdAt: dispute.createdAt instanceof Date ? dispute.createdAt.toISOString() : dispute.createdAt,
    updatedAt: dispute.updatedAt instanceof Date ? dispute.updatedAt.toISOString() : dispute.updatedAt,
    order: dispute.order
      ? {
          id: dispute.order.id,
          orderNumber: dispute.order.orderNumber,
          status: dispute.order.status,
          paymentStatus: dispute.order.paymentStatus,
          total: Number(dispute.order.total),
          date: dispute.order.createdAt ? new Date(dispute.order.createdAt).toISOString() : null,
          consumer: dispute.order.consumer || (dispute.user ? {
            id: dispute.user.id,
            name: dispute.user.name,
            email: dispute.user.email,
            phone: dispute.user.phone,
          } : undefined),
          items: dispute.order.items || [],
          address: dispute.order.address || null,
        }
      : null,
    timeline,
  };
}

export const adminService = new AdminService();
