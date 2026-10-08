import {
  DeliveryBatchStatus,
  OrderStatus,
  InventoryLogType,
  Prisma,
} from '@prisma/client';
import { prisma } from '../db/prisma';
import { saleService } from './sale.service';
import {
  normalizeHubArea,
  normalizeDeliverySlot,
  calculateBatchLogistics,
  toPrismaDeliveryBatchStatus,
  toFrontendDeliveryBatchStatus,
  DELIVERY_BATCH_TIMELINE_META,
} from '../utils/delivery.utils';

export interface CreateDeliveryBatchInput {
  batchCode?: string;
  hubArea: string;
  deliverySlot: string;
  status?: string;
  riderName?: string | null;
  riderPhone?: string | null;
  riderVehicle?: string | null;
  estimatedDistanceKm?: number | null;
  estimatedDeliveryTime?: string | null;
  totalQuantity?: number | string | null;
  productsSummary?: string | null;
  orderIds?: string[];
}

export class DeliveryService {
  /**
   * Helper to format a DeliveryBatch record with sanitized summary and mapped relations
   */
  private formatBatch(batch: any, farmerId?: string) {
    const rawSummary = batch.productsSummary || '';
    const cleanSummary = rawSummary.replace(/\s*\[farmer:[^\]]+\]\s*/g, '').trim() || null;

    // Filter assigned orders and their items if farmerId is specified
    const assignedOrders = (batch.orders || []).map((o: any) => {
      const farmerItems = farmerId
        ? (o.items || []).filter((i: any) => i.farmerId === farmerId)
        : o.items || [];

      return {
        id: o.orderNumber,
        rawId: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.address?.name || o.consumer?.name || 'Customer',
        customerPhone: o.address?.phone || o.consumer?.phone || '',
        customerEmail: o.consumer?.email || '',
        deliveryAddress: o.address
          ? {
              addressLine: o.address.addressLine,
              area: o.address.hub,
              city: o.address.city,
              pincode: o.address.pincode,
              hub: o.address.hub,
            }
          : null,
        deliverySlot: {
          name: o.deliverySlotName,
          timeRange: o.deliverySlotRange,
        },
        items: farmerItems.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          farmerName: item.farmerName,
          farmName: item.farmName,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        totalQuantity: `${farmerItems.reduce((acc: number, i: any) => acc + Number(i.quantity), 0)} kg`,
        total: Number(o.total),
        deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
      };
    });

    const uniqueCustomers = Array.from(
      new Set(assignedOrders.map((o: any) => o.customerName))
    );
    const uniqueFarms = Array.from(
      new Set(
        assignedOrders.flatMap((o: any) => (o.items || []).map((i: any) => i.farmName || i.farmerName))
      )
    );

    // Format timeline steps
    const timeline = (batch.timelineSteps || []).map((step: any) => ({
      id: step.id,
      status: toFrontendDeliveryBatchStatus(step.status),
      rawStatus: step.status,
      label: step.label,
      timestamp: step.timestamp ? new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending',
      rawTimestamp: step.timestamp,
      completed: step.isCompleted,
      current: step.isCurrent,
    }));

    return {
      id: batch.id,
      batchId: batch.batchCode,
      batchCode: batch.batchCode,
      area: batch.hubArea,
      hubArea: batch.hubArea,
      deliverySlot: batch.deliverySlot,
      status: toFrontendDeliveryBatchStatus(batch.status),
      rawStatus: batch.status,
      riderName: batch.riderName || null,
      riderPhone: batch.riderPhone || null,
      riderVehicle: batch.riderVehicle || null,
      estimatedDistanceKm: batch.estimatedDistanceKm ? Number(batch.estimatedDistanceKm) : 0,
      estimatedDeliveryTime: batch.estimatedDeliveryTime || null,
      totalQuantity: batch.totalQuantity ? `${Number(batch.totalQuantity)} kg` : '0 kg',
      productsSummary: cleanSummary,
      orderIds: assignedOrders.map((o: any) => o.orderNumber),
      orders: assignedOrders,
      customerCount: uniqueCustomers.length,
      customerNames: uniqueCustomers,
      farmerNames: uniqueFarms.length > 0 ? uniqueFarms : ['Local Organic Farm'],
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
      timeline,
    };
  }

  /**
   * Generates a unique batch code like DB-102 or DB-XXXX
   */
  private async generateBatchCode(): Promise<string> {
    const count = await prisma.deliveryBatch.count();
    const code = `DB-${100 + count + Math.floor(1 + Math.random() * 89)}`;
    const existing = await prisma.deliveryBatch.findUnique({ where: { batchCode: code } });
    if (!existing) return code;
    return `DB-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 89)}`;
  }

  /**
   * 1. CREATE DELIVERY BATCH
   */
  async createDeliveryBatch(farmerId: string, input: CreateDeliveryBatchInput) {
    if (!input.hubArea || !input.hubArea.trim()) {
      throw new Error('hubArea is required for delivery batch creation.');
    }
    if (!input.deliverySlot || !input.deliverySlot.trim()) {
      throw new Error('deliverySlot is required for delivery batch creation.');
    }

    const normHub = normalizeHubArea(input.hubArea);
    const normSlot = normalizeDeliverySlot(input.deliverySlot);
    const batchCode = input.batchCode?.trim() || (await this.generateBatchCode());

    let initialStatus: DeliveryBatchStatus = DeliveryBatchStatus.PENDING;
    if (input.status) {
      initialStatus = toPrismaDeliveryBatchStatus(input.status);
    }

    // Validate orders if provided
    let ordersToAssign: any[] = [];
    if (input.orderIds && input.orderIds.length > 0) {
      ordersToAssign = await prisma.order.findMany({
        where: {
          OR: [
            { id: { in: input.orderIds } },
            { orderNumber: { in: input.orderIds } },
          ],
        },
        include: {
          items: true,
          address: true,
          deliveryBatch: true,
        },
      });

      if (ordersToAssign.length !== input.orderIds.length) {
        throw new Error('One or more specified orders could not be found.');
      }

      for (const order of ordersToAssign) {
        // Farmer owns items?
        const ownsItems = order.items.some((i: any) => i.farmerId === farmerId);
        if (!ownsItems) {
          throw new Error(`Access denied: Farmer does not own items in order #${order.orderNumber}.`);
        }

        // Order cancelled or delivered?
        if (order.status === OrderStatus.CANCELLED) {
          throw new Error(`Order #${order.orderNumber} is CANCELLED and cannot be batched.`);
        }
        if (order.status === OrderStatus.DELIVERED) {
          throw new Error(`Order #${order.orderNumber} is already DELIVERED and cannot be batched.`);
        }

        // Already assigned to active batch?
        if (order.deliveryBatchId && order.deliveryBatch && order.deliveryBatch.status !== DeliveryBatchStatus.CANCELLED) {
          throw new Error(`Order #${order.orderNumber} is already assigned to active batch #${order.deliveryBatch.batchCode}.`);
        }

        // Hub match?
        const orderHub = normalizeHubArea(order.address?.hub || order.address?.addressLine);
        if (orderHub !== normHub) {
          throw new Error(`Hub mismatch: Order #${order.orderNumber} hub (${orderHub}) does not match batch hub (${normHub}).`);
        }

        // Slot match?
        const orderSlot = normalizeDeliverySlot(order.deliverySlotRange || order.deliverySlotName);
        if (orderSlot !== normSlot) {
          throw new Error(`Delivery slot mismatch: Order #${order.orderNumber} slot (${orderSlot}) does not match batch slot (${normSlot}).`);
        }
      }
    }

    // Calculate metrics
    const orderCount = ordersToAssign.length;
    const logistics = calculateBatchLogistics(normHub, orderCount);
    const estimatedDistanceKm = input.estimatedDistanceKm != null ? input.estimatedDistanceKm : logistics.estimatedDistanceKm;
    const estimatedDeliveryTime = input.estimatedDeliveryTime || logistics.estimatedDeliveryTime;

    let totalQuantity = input.totalQuantity ? Number(input.totalQuantity) : 0;
    if (ordersToAssign.length > 0 && !totalQuantity) {
      totalQuantity = ordersToAssign.reduce((sum, o) => {
        const farmerItems = o.items.filter((i: any) => i.farmerId === farmerId);
        return sum + farmerItems.reduce((acc: number, item: any) => acc + Number(item.quantity), 0);
      }, 0);
    }

    let productsSummary = input.productsSummary?.trim() || '';
    if (ordersToAssign.length > 0 && !productsSummary) {
      const names = Array.from(
        new Set(
          ordersToAssign.flatMap((o) =>
            o.items.filter((i: any) => i.farmerId === farmerId).map((i: any) => i.productName.split(' ')[0])
          )
        )
      );
      productsSummary = names.join(', ') || 'Fresh Organic Produce';
    }

    // Embed farmer ownership tag into summary
    const summaryWithTag = `${productsSummary} [farmer:${farmerId}]`.trim();

    // Execute Prisma Interactive Transaction
    const createdBatch = await prisma.$transaction(
      async (tx) => {
        const batch = await tx.deliveryBatch.create({
          data: {
            batchCode,
            hubArea: normHub,
            deliverySlot: input.deliverySlot,
            status: initialStatus,
            riderName: input.riderName || null,
            riderPhone: input.riderPhone || null,
            riderVehicle: input.riderVehicle || null,
            estimatedDistanceKm: new Prisma.Decimal(estimatedDistanceKm),
            estimatedDeliveryTime,
            totalQuantity: new Prisma.Decimal(totalQuantity),
            productsSummary: summaryWithTag,
            timelineSteps: {
              create: [
                {
                  status: initialStatus,
                  label: DELIVERY_BATCH_TIMELINE_META[initialStatus]?.label || 'Batch Formed',
                  isCompleted: true,
                  isCurrent: ordersToAssign.length === 0,
                },
                ...(ordersToAssign.length > 0
                  ? [
                      {
                        status: DeliveryBatchStatus.PREPARING,
                        label: 'Crops Consolidated',
                        isCompleted: true,
                        isCurrent: true,
                      },
                    ]
                  : []),
              ],
            },
          },
        });

        // Assign orders if any
        if (ordersToAssign.length > 0) {
          await tx.order.updateMany({
            where: { id: { in: ordersToAssign.map((o) => o.id) } },
            data: { deliveryBatchId: batch.id },
          });
        }

        return tx.deliveryBatch.findUnique({
          where: { id: batch.id },
          include: {
            orders: {
              include: {
                items: true,
                address: true,
                consumer: true,
              },
            },
            timelineSteps: {
              orderBy: { timestamp: 'asc' },
            },
          },
        });
      },
      { maxWait: 20000, timeout: 35000 }
    );

    return this.formatBatch(createdBatch, farmerId);
  }

  /**
   * 2. ASSIGN ORDERS TO BATCH
   */
  async assignOrdersToBatch(farmerId: string, batchIdOrCode: string, orderIds: string[]) {
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('orderIds must be a non-empty array of order IDs.');
    }

    // Fetch batch
    const batch = await prisma.deliveryBatch.findFirst({
      where: {
        OR: [{ id: batchIdOrCode }, { batchCode: batchIdOrCode }],
      },
      include: {
        orders: {
          include: { items: true },
        },
      },
    });

    if (!batch) {
      throw new Error(`Delivery batch "${batchIdOrCode}" not found.`);
    }

    // Verify farmer ownership
    const isOwner =
      batch.productsSummary?.includes(`[farmer:${farmerId}]`) ||
      batch.orders.some((o) => o.items.some((i) => i.farmerId === farmerId));

    if (!isOwner) {
      const err = new Error('Access denied: You do not own this delivery batch.');
      (err as any).status = 403;
      throw err;
    }

    // Cannot modify terminal batches
    if (batch.status === DeliveryBatchStatus.DELIVERED) {
      throw new Error('Cannot assign orders to a DELIVERED delivery batch.');
    }
    if (batch.status === DeliveryBatchStatus.CANCELLED) {
      throw new Error('Cannot assign orders to a CANCELLED delivery batch.');
    }

    const normHub = normalizeHubArea(batch.hubArea);
    const normSlot = normalizeDeliverySlot(batch.deliverySlot);

    // Fetch and validate each order
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { id: { in: orderIds } },
          { orderNumber: { in: orderIds } },
        ],
      },
      include: {
        items: true,
        address: true,
        deliveryBatch: true,
      },
    });

    if (orders.length !== orderIds.length) {
      throw new Error('One or more specified orders could not be found.');
    }

    for (const order of orders) {
      // 1. Farmer owns relevant order items
      const ownsItems = order.items.some((i) => i.farmerId === farmerId);
      if (!ownsItems) {
        const err = new Error(`Farmer does not own any items in order #${order.orderNumber}.`);
        (err as any).status = 403;
        throw err;
      }

      // 2. Order eligible for batching
      if (order.status === OrderStatus.CANCELLED) {
        throw new Error(`Order #${order.orderNumber} is CANCELLED and cannot be batched.`);
      }
      if (order.status === OrderStatus.DELIVERED) {
        throw new Error(`Order #${order.orderNumber} is DELIVERED and cannot be batched.`);
      }

      // 3. Not already assigned to another active batch
      if (order.deliveryBatchId && order.deliveryBatchId !== batch.id) {
        if (order.deliveryBatch && order.deliveryBatch.status !== DeliveryBatchStatus.CANCELLED) {
          throw new Error(`Order #${order.orderNumber} is already assigned to active delivery batch #${order.deliveryBatch.batchCode}.`);
        }
      }

      // 4. Hub matches
      const orderHub = normalizeHubArea(order.address?.hub || order.address?.addressLine);
      if (orderHub !== normHub) {
        throw new Error(`Hub mismatch: Order #${order.orderNumber} hub (${orderHub}) does not match batch hub (${normHub}).`);
      }

      // 5. Delivery slot matches
      const orderSlot = normalizeDeliverySlot(order.deliverySlotRange || order.deliverySlotName);
      if (orderSlot !== normSlot) {
        throw new Error(`Delivery slot mismatch: Order #${order.orderNumber} slot (${orderSlot}) does not match batch slot (${normSlot}).`);
      }
    }

    // Execute Prisma Transaction
    const updatedBatch = await prisma.$transaction(
      async (tx) => {
        // Assign orders to batch
        await tx.order.updateMany({
          where: { id: { in: orders.map((o) => o.id) } },
          data: { deliveryBatchId: batch.id },
        });

        // Fetch all assigned orders
        const allBatchOrders = await tx.order.findMany({
          where: { deliveryBatchId: batch.id },
          include: { items: true, address: true, consumer: true },
        });

        // Recalculate quantity & summary
        const newTotalQuantity = allBatchOrders.reduce((sum, o) => {
          return (
            sum +
            o.items
              .filter((i) => i.farmerId === farmerId)
              .reduce((acc, i) => acc + Number(i.quantity), 0)
          );
        }, 0);

        const cropNames = Array.from(
          new Set(
            allBatchOrders.flatMap((o) =>
              o.items.filter((i) => i.farmerId === farmerId).map((i) => i.productName.split(' ')[0])
            )
          )
        );
        const cleanSummary = cropNames.join(', ') || 'Consolidated Fresh Farm Produce';
        const newSummary = `${cleanSummary} [farmer:${farmerId}]`.trim();

        // Update logistics
        const logistics = calculateBatchLogistics(normHub, allBatchOrders.length);

        // Update batch
        await tx.deliveryBatch.update({
          where: { id: batch.id },
          data: {
            totalQuantity: new Prisma.Decimal(newTotalQuantity),
            productsSummary: newSummary,
            estimatedDistanceKm: new Prisma.Decimal(logistics.estimatedDistanceKm),
            estimatedDeliveryTime: logistics.estimatedDeliveryTime,
          },
        });

        // Add timeline step if not present
        const hasConsolidatedStep = await tx.deliveryBatchTimelineStep.findFirst({
          where: { batchId: batch.id, label: 'Crops Consolidated' },
        });

        if (!hasConsolidatedStep) {
          await tx.deliveryBatchTimelineStep.updateMany({
            where: { batchId: batch.id },
            data: { isCurrent: false },
          });

          await tx.deliveryBatchTimelineStep.create({
            data: {
              batchId: batch.id,
              status: DeliveryBatchStatus.PREPARING,
              label: 'Crops Consolidated',
              isCompleted: true,
              isCurrent: true,
            },
          });
        }

        return tx.deliveryBatch.findUnique({
          where: { id: batch.id },
          include: {
            orders: {
              include: { items: true, address: true, consumer: true },
            },
            timelineSteps: { orderBy: { timestamp: 'asc' } },
          },
        });
      },
      { maxWait: 20000, timeout: 35000 }
    );

    return this.formatBatch(updatedBatch, farmerId);
  }

  /**
   * 3. AUTOMATIC HYPERLOCAL BATCHING
   */
  async autoCreateDeliveryBatches(farmerId: string) {
    // 1. Find all active eligible orders containing items from this farmer
    const eligibleOrders = await prisma.order.findMany({
      where: {
        items: {
          some: { farmerId },
        },
        status: {
          in: [
            OrderStatus.PLACED,
            OrderStatus.CONFIRMED,
            OrderStatus.HARVESTING,
            OrderStatus.PACKED,
          ],
        },
        OR: [
          { deliveryBatchId: null },
          { deliveryBatch: { status: DeliveryBatchStatus.CANCELLED } },
        ],
      },
      include: {
        items: true,
        address: true,
        consumer: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (eligibleOrders.length === 0) {
      return {
        success: true,
        count: 0,
        batches: [],
        message: 'No orders are currently ready for batching.',
      };
    }

    // 2. Group orders by (normalizedHubArea, normalizedDeliverySlot)
    const clusterMap = new Map<string, typeof eligibleOrders>();

    for (const order of eligibleOrders) {
      const hub = normalizeHubArea(order.address?.hub || order.address?.addressLine);
      const slot = normalizeDeliverySlot(order.deliverySlotRange || order.deliverySlotName);
      const key = `${hub}__${slot}`;

      const existing = clusterMap.get(key) || [];
      existing.push(order);
      clusterMap.set(key, existing);
    }

    const createdBatches: any[] = [];

    // 3. Create a batch for each group inside transaction
    for (const [key, clusterOrders] of clusterMap.entries()) {
      const [hub, slot] = key.split('__');
      const batchCode = await this.generateBatchCode();
      const logistics = calculateBatchLogistics(hub, clusterOrders.length);

      const totalQuantity = clusterOrders.reduce((sum, o) => {
        return (
          sum +
          o.items
            .filter((i) => i.farmerId === farmerId)
            .reduce((acc, i) => acc + Number(i.quantity), 0)
        );
      }, 0);

      const cropNames = Array.from(
        new Set(
          clusterOrders.flatMap((o) =>
            o.items.filter((i) => i.farmerId === farmerId).map((i) => i.productName.split(' ')[0])
          )
        )
      );
      const cleanSummary = cropNames.join(', ') || 'Consolidated Cluster Harvest';
      const summaryWithTag = `${cleanSummary} [farmer:${farmerId}]`.trim();

      const batch = await prisma.$transaction(
        async (tx) => {
          const newBatch = await tx.deliveryBatch.create({
            data: {
              batchCode,
              hubArea: hub,
              deliverySlot: slot === 'Morning' ? '8:00 AM – 11:00 AM' : '12:00 PM – 3:30 PM',
              status: DeliveryBatchStatus.PREPARING,
              riderName: 'Manjunath G.',
              riderVehicle: 'Ather Cargo EV',
              estimatedDistanceKm: new Prisma.Decimal(logistics.estimatedDistanceKm),
              estimatedDeliveryTime: logistics.estimatedDeliveryTime,
              totalQuantity: new Prisma.Decimal(totalQuantity),
              productsSummary: summaryWithTag,
              timelineSteps: {
                create: [
                  {
                    status: DeliveryBatchStatus.PENDING,
                    label: 'Batch Formed',
                    isCompleted: true,
                    isCurrent: false,
                  },
                  {
                    status: DeliveryBatchStatus.PREPARING,
                    label: 'Crops Consolidated',
                    isCompleted: true,
                    isCurrent: true,
                  },
                ],
              },
            },
          });

          await tx.order.updateMany({
            where: { id: { in: clusterOrders.map((o) => o.id) } },
            data: { deliveryBatchId: newBatch.id },
          });

          return tx.deliveryBatch.findUnique({
            where: { id: newBatch.id },
            include: {
              orders: {
                include: { items: true, address: true, consumer: true },
              },
              timelineSteps: { orderBy: { timestamp: 'asc' } },
            },
          });
        },
        { maxWait: 20000, timeout: 35000 }
      );

      createdBatches.push(this.formatBatch(batch, farmerId));
    }

    return {
      success: true,
      count: createdBatches.length,
      batches: createdBatches,
    };
  }

  /**
   * 4. GET ALL FARMER BATCHES
   */
  async getFarmerDeliveryBatches(farmerId: string) {
    const batches = await prisma.deliveryBatch.findMany({
      where: {
        OR: [
          { productsSummary: { contains: `[farmer:${farmerId}]` } },
          {
            orders: {
              some: {
                items: {
                  some: { farmerId },
                },
              },
            },
          },
        ],
      },
      include: {
        orders: {
          include: {
            items: true,
            address: true,
            consumer: true,
          },
        },
        timelineSteps: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = batches.map((b) => this.formatBatch(b, farmerId));

    return {
      success: true,
      count: data.length,
      data,
      message: data.length === 0 ? 'No orders are currently ready for batching.' : undefined,
    };
  }

  /**
   * 4b. GET SINGLE BATCH BY ID
   */
  async getFarmerDeliveryBatchById(farmerId: string, batchIdOrCode: string) {
    const batch = await prisma.deliveryBatch.findFirst({
      where: {
        OR: [{ id: batchIdOrCode }, { batchCode: batchIdOrCode }],
      },
      include: {
        orders: {
          include: {
            items: true,
            address: true,
            consumer: true,
          },
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

    // Verify ownership
    const isOwner =
      batch.productsSummary?.includes(`[farmer:${farmerId}]`) ||
      batch.orders.some((o) => o.items.some((i) => i.farmerId === farmerId));

    if (!isOwner) {
      const err = new Error('Access denied: You do not have permission to view this delivery batch.');
      (err as any).status = 403;
      throw err;
    }

    return this.formatBatch(batch, farmerId);
  }

  /**
   * 5 & 6. UPDATE BATCH STATUS & ORDER SYNCHRONIZATION
   */
  async updateDeliveryBatchStatus(farmerId: string, batchIdOrCode: string, nextStatusRaw: string) {
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

    // Verify ownership
    const isOwner =
      batch.productsSummary?.includes(`[farmer:${farmerId}]`) ||
      batch.orders.some((o) => o.items.some((i) => i.farmerId === farmerId));

    if (!isOwner) {
      const err = new Error('Access denied: You do not have permission to modify this delivery batch.');
      (err as any).status = 403;
      throw err;
    }

    const nextStatus = toPrismaDeliveryBatchStatus(nextStatusRaw);

    // State machine progression check
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

      if (nextIdx < currentIdx) {
        throw new Error(
          `Invalid status transition: Cannot transition backwards from "${batch.status}" to "${nextStatus}".`
        );
      }
    }

    const timelineLabel = DELIVERY_BATCH_TIMELINE_META[nextStatus]?.label || nextStatus;

    // Prisma Transaction with Order Synchronization
    const updatedBatch = await prisma.$transaction(
      async (tx) => {
        // Update batch status
        await tx.deliveryBatch.update({
          where: { id: batch.id },
          data: { status: nextStatus },
        });

        // Update timeline
        await tx.deliveryBatchTimelineStep.updateMany({
          where: { batchId: batch.id },
          data: { isCurrent: false },
        });

        await tx.deliveryBatchTimelineStep.create({
          data: {
            batchId: batch.id,
            status: nextStatus,
            label: timelineLabel,
            isCompleted: true,
            isCurrent: true,
          },
        });

        // 6. ORDER SYNCHRONIZATION
        if (nextStatus === DeliveryBatchStatus.OUT_FOR_DELIVERY) {
          // Synchronize assigned eligible orders to OUT_FOR_DELIVERY
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
          // Synchronize assigned eligible orders to DELIVERED & populate deliveredAt
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

            // Inventory sold transition: reservedQuantity -> soldQuantity
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

            // Create Sales records for delivered order
            await saleService.createSalesForDeliveredOrder(order.id, tx);
          }
        } else if (nextStatus === DeliveryBatchStatus.CANCELLED) {
          // Cancelled batch handled safely: unassign orders so they can be re-batched
          await tx.order.updateMany({
            where: { deliveryBatchId: batch.id },
            data: { deliveryBatchId: null },
          });
        }

        return tx.deliveryBatch.findUnique({
          where: { id: batch.id },
          include: {
            orders: {
              include: { items: true, address: true, consumer: true },
            },
            timelineSteps: { orderBy: { timestamp: 'asc' } },
          },
        });
      },
      { maxWait: 20000, timeout: 35000 }
    );

    return this.formatBatch(updatedBatch, farmerId);
  }
}

export const deliveryService = new DeliveryService();
