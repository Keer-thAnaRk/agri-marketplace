import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  InventoryStatus,
  InventoryLogType,
  Prisma,
} from '@prisma/client';
import { prisma } from '../db/prisma';
import { saleService } from './sale.service';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items?: CreateOrderItemInput[];
  addressId?: string;
  deliveryAddress?: {
    name?: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
    hub?: string;
    isDefault?: boolean;
  };
  deliverySlot?: {
    name?: string;
    timeRange?: string;
    slotName?: string;
    slotRange?: string;
  };
  paymentMethod?: string;
  paymentStatus?: string;
}

export const TIMELINE_METADATA: Record<OrderStatus, { label: string; description: string }> = {
  PLACED: {
    label: 'Order Placed',
    description: 'Order confirmed and routed to local farmer hubs',
  },
  CONFIRMED: {
    label: 'Farmer Confirmed',
    description: 'Farmer is notified to accept harvest schedule',
  },
  HARVESTING: {
    label: 'Harvesting Fresh',
    description: 'Produce harvested at scheduled slot',
  },
  PACKED: {
    label: 'Eco-Packed & Sanitized',
    description: 'Packed in breathable kraft containers',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Local Delivery',
    description: 'Krishi eco-rider assigned to route',
  },
  DELIVERED: {
    label: 'Delivered to Doorstep',
    description: 'Delivery handover and crate return completed',
  },
  CANCELLED: {
    label: 'Order Cancelled',
    description: 'Order was cancelled and inventory restored',
  },
};

export function toPrismaOrderStatus(status: string): OrderStatus {
  const s = status.toUpperCase().replace(/\s+/g, '_').trim();
  switch (s) {
    case 'PLACED':
    case 'PENDING':
      return OrderStatus.PLACED;
    case 'CONFIRMED':
      return OrderStatus.CONFIRMED;
    case 'HARVESTING':
    case 'PREPARING':
      return OrderStatus.HARVESTING;
    case 'PACKED':
    case 'READY':
      return OrderStatus.PACKED;
    case 'OUT_FOR_DELIVERY':
    case 'OUT_FOR_DELIVERED':
      return OrderStatus.OUT_FOR_DELIVERY;
    case 'DELIVERED':
    case 'COMPLETED':
      return OrderStatus.DELIVERED;
    case 'CANCELLED':
    case 'CANCELED':
      return OrderStatus.CANCELLED;
    default:
      if (Object.values(OrderStatus).includes(s as OrderStatus)) {
        return s as OrderStatus;
      }
      throw new Error(`Unknown or invalid order status: "${status}"`);
  }
}

export function toFarmerOrderStatus(status: OrderStatus): 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled' {
  switch (status) {
    case OrderStatus.PLACED:
      return 'Pending';
    case OrderStatus.CONFIRMED:
      return 'Confirmed';
    case OrderStatus.HARVESTING:
      return 'Preparing';
    case OrderStatus.PACKED:
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'Ready';
    case OrderStatus.DELIVERED:
      return 'Completed';
    case OrderStatus.CANCELLED:
      return 'Cancelled';
  }
}

export function toConsumerOrderStatus(status: OrderStatus): string {
  return status.toLowerCase();
}

export function mapPaymentMethod(method?: string): PaymentMethod {
  if (!method) return PaymentMethod.UPI;
  const m = method.toUpperCase().replace(/\s+/g, '_').trim();
  if (m === 'CASH_ON_DELIVERY' || m.includes('CASH')) return PaymentMethod.CASH_ON_DELIVERY;
  if (m === 'CARD' || m.includes('CARD') || m.includes('NETBANKING')) return PaymentMethod.CARD;
  return PaymentMethod.UPI;
}

export class OrderService {
  /**
   * Generates a unique order number in format KM-YYYYMMDD-XXXX
   */
  generateOrderNumber(): string {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `KM-${datePrefix}-${randomPart}`;
  }

  /**
   * 1. CREATE ORDER (Atomic Inventory Reservation, Price Snapshot & Cart Clearing)
   */
  async createOrder(consumerId: string, input: CreateOrderInput) {
    // 1. Validate Consumer Existence & Status
    const consumer = await prisma.user.findUnique({
      where: { id: consumerId },
      include: {
        farmer: true,
      },
    });
    if (!consumer) {
      const err = new Error('Consumer account not found.');
      (err as any).status = 404;
      throw err;
    }
    if (!consumer.isActive) {
      const err = new Error('Account has been deactivated.');
      (err as any).status = 403;
      throw err;
    }

    // 2. Resolve items: from input payload or consumer cart in database
    let candidateItems: CreateOrderItemInput[] = Array.isArray(input.items) ? input.items : [];
    if (candidateItems.length === 0) {
      const cartRows = await prisma.cartItem.findMany({
        where: { userId: consumerId },
      });
      if (!cartRows || cartRows.length === 0) {
        const err = new Error('An order must contain at least one item.');
        (err as any).status = 400;
        throw err;
      }
      candidateItems = cartRows.map((c): CreateOrderItemInput => ({
        productId: c.productId,
        quantity: Number(c.quantity),
      }));
    }

    if (candidateItems.length === 0) {
      const err = new Error('An order must contain at least one item.');
      (err as any).status = 400;
      throw err;
    }

    // Validate item shapes
    for (const item of candidateItems) {
      if (!item.productId) {
        const err = new Error('Each item must specify a valid productId.');
        (err as any).status = 400;
        throw err;
      }
      const qty = Number(item.quantity);
      if (!qty || isNaN(qty) || qty <= 0) {
        const err = new Error('Item quantity must be a positive number.');
        (err as any).status = 400;
        throw err;
      }
    }

    // 3. Atomically validate stock, address, create order, snapshots, logs, and clear cart
    return await prisma.$transaction(
      async (tx) => {
        // Address resolution & IDOR check
        let addressRecord: any = null;

        if (input.addressId) {
          addressRecord = await tx.consumerAddress.findUnique({
            where: { id: input.addressId },
          });

          if (!addressRecord) {
            const err = new Error(`Delivery address with ID "${input.addressId}" not found.`);
            (err as any).status = 404;
            throw err;
          }

          if (addressRecord.userId !== consumerId) {
            const err = new Error('Access denied: Selected delivery address does not belong to your account.');
            (err as any).status = 403;
            throw err;
          }
        } else if (input.deliveryAddress) {
          const addr = input.deliveryAddress;
          if (!addr.name?.trim()) {
            const err = new Error('Recipient name is required in delivery address.');
            (err as any).status = 400;
            throw err;
          }
          if (!addr.phone?.trim()) {
            const err = new Error('Contact phone number is required in delivery address.');
            (err as any).status = 400;
            throw err;
          }
          if (!addr.addressLine?.trim()) {
            const err = new Error('Address line is required in delivery address.');
            (err as any).status = 400;
            throw err;
          }
          if (!addr.pincode?.trim()) {
            const err = new Error('Pincode is required in delivery address.');
            (err as any).status = 400;
            throw err;
          }

          const existingCount = await tx.consumerAddress.count({
            where: { userId: consumerId },
          });
          const shouldBeDefault = Boolean(addr.isDefault) || existingCount === 0;

          if (shouldBeDefault) {
            await tx.consumerAddress.updateMany({
              where: { userId: consumerId },
              data: { isDefault: false },
            });
          }

          addressRecord = await tx.consumerAddress.create({
            data: {
              userId: consumerId,
              name: addr.name.trim(),
              phone: addr.phone.trim(),
              addressLine: addr.addressLine.trim(),
              city: addr.city?.trim() || 'Bengaluru',
              state: addr.state?.trim() || 'Karnataka',
              pincode: addr.pincode.trim(),
              hub: addr.hub?.trim() || `${addr.city?.trim() || 'Bengaluru'} Hub`,
              isDefault: shouldBeDefault,
            },
          });
        } else {
          // Fallback to consumer default address
          addressRecord = await tx.consumerAddress.findFirst({
            where: { userId: consumerId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          });

          if (!addressRecord) {
            const err = new Error('Please provide a valid delivery address.');
            (err as any).status = 400;
            throw err;
          }
        }

        // Fetch all referenced products with inventory and farmer details
        const productIds = candidateItems.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          include: {
            inventory: true,
            farmer: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        });

        const productMap = new Map<string, typeof products[0]>();
        for (const p of products) {
          productMap.set(p.id, p);
        }

        // Check each item exists, is active, farmer is verified, and has sufficient stock
        const orderItemsSnapshot: {
          product: typeof products[0];
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }[] = [];

        for (const reqItem of candidateItems) {
          const product = productMap.get(reqItem.productId);
          if (!product) {
            const err = new Error(`Product "${reqItem.productId}" not found.`);
            (err as any).status = 404;
            throw err;
          }
          if (product.status !== ProductStatus.ACTIVE) {
            const err = new Error(`Product "${product.name}" is currently inactive or not available for sale.`);
            (err as any).status = 400;
            throw err;
          }
          if (!product.farmer || product.farmer.verificationStatus !== 'APPROVED') {
            const err = new Error(`Product "${product.name}" is from an unapproved grower.`);
            (err as any).status = 400;
            throw err;
          }

          const available = Number(
            product.inventory?.availableQuantity ?? product.availableQuantity
          );
          const reqQty = Number(reqItem.quantity);

          if (available < reqQty) {
            const err = new Error(
              `Insufficient inventory for "${product.name}". Available: ${available}, requested: ${reqQty}.`
            );
            (err as any).status = 400;
            throw err;
          }

          // Authoritative Server-Side Pricing (NEVER trust frontend price)
          const unitPrice = Number(product.price);
          const totalPrice = Math.round(unitPrice * reqQty * 100) / 100;

          orderItemsSnapshot.push({
            product,
            quantity: reqQty,
            unitPrice,
            totalPrice,
          });
        }

        // Server-side calculation of financial split
        const subtotal = orderItemsSnapshot.reduce((sum, it) => sum + it.totalPrice, 0);
        const deliveryFee = subtotal > 499 ? 0 : 35;
        const platformFee = Math.round(subtotal * 0.1); // 10%
        const farmerEarnings = Math.round(subtotal * 0.75); // 75% direct farmer share
        const total = subtotal + deliveryFee + platformFee;

        const paymentMethod = mapPaymentMethod(input.paymentMethod);
        // Payment status must initially be PENDING in Step 4
        const paymentStatus = PaymentStatus.PENDING;

        const deliverySlotName =
          input.deliverySlot?.name || input.deliverySlot?.slotName || 'Morning Slot';
        const deliverySlotRange =
          input.deliverySlot?.timeRange || input.deliverySlot?.slotRange || '8:00 AM – 11:00 AM';

        // Unique order number generation with collision retry
        let orderNumber = this.generateOrderNumber();
        let existingOrder = await tx.order.findUnique({ where: { orderNumber } });
        while (existingOrder) {
          orderNumber = this.generateOrderNumber();
          existingOrder = await tx.order.findUnique({ where: { orderNumber } });
        }

        // Create Order
        const order = await tx.order.create({
          data: {
            orderNumber,
            consumerId,
            addressId: addressRecord.id,
            deliverySlotName,
            deliverySlotRange,
            status: OrderStatus.PLACED,
            subtotal,
            deliveryFee,
            platformFee,
            farmerEarnings,
            total,
            paymentMethod,
            paymentStatus,
            timeline: {
              create: [
                {
                  status: OrderStatus.PLACED,
                  label: TIMELINE_METADATA.PLACED.label,
                  description: TIMELINE_METADATA.PLACED.description,
                  isCompleted: true,
                  isCurrent: true,
                  timestamp: new Date(),
                },
              ],
            },
          },
        });

        const farmerUserIdsToNotify = new Set<string>();

        // Create OrderItems & Atomically Reserve Inventory
        for (const item of orderItemsSnapshot) {
          const { product, quantity, unitPrice, totalPrice } = item;

          if (product.farmer?.user?.id) {
            farmerUserIdsToNotify.add(product.farmer.user.id);
          }

          // 1. OrderItem historical snapshot
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              farmerId: product.farmerId,
              productName: product.name,
              productImage:
                product.images[0] ||
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
              farmerName: product.farmer.user.name,
              farmName: product.farmer.farmName,
              unitPrice,
              quantity,
              unit: product.unit,
              totalPrice,
            },
          });

          // 2. InventoryItem updates (Atomic database decrement preventing race conditions)
          if (product.inventory) {
            const updateCount = await tx.inventoryItem.updateMany({
              where: {
                id: product.inventory.id,
                availableQuantity: { gte: quantity },
              },
              data: {
                availableQuantity: { decrement: quantity },
                reservedQuantity: { increment: quantity },
                lastUpdated: new Date(),
              },
            });

            if (updateCount.count === 0) {
              const err = new Error(
                `Insufficient inventory for "${product.name}". Another order just consumed the available stock.`
              );
              (err as any).status = 400;
              throw err;
            }

            // Sync Product model atomically
            await tx.product.updateMany({
              where: {
                id: product.id,
                availableQuantity: { gte: quantity },
              },
              data: {
                availableQuantity: { decrement: quantity },
                reservedQuantity: { increment: quantity },
              },
            });

            // Update inStock and status
            const freshInv = await tx.inventoryItem.findUnique({
              where: { id: product.inventory.id },
            });
            if (freshInv) {
              const freshAvail = Number(freshInv.availableQuantity);
              let newStatus: InventoryStatus = InventoryStatus.IN_STOCK;
              if (freshAvail <= 0) newStatus = InventoryStatus.OUT_OF_STOCK;
              else if (freshAvail <= Number(freshInv.threshold)) newStatus = InventoryStatus.LOW_STOCK;

              await tx.inventoryItem.update({
                where: { id: freshInv.id },
                data: { status: newStatus },
              });

              await tx.product.update({
                where: { id: product.id },
                data: { inStock: freshAvail > 0 },
              });

              // 4. Inventory Audit Log
              await tx.inventoryLog.create({
                data: {
                  inventoryItemId: product.inventory.id,
                  type: InventoryLogType.ORDER_RESERVED,
                  amount: quantity,
                  newQuantity: freshAvail,
                  reason: `Order #${orderNumber} Reserved`,
                },
              });
            }
          } else {
            // Product stock update without separate inventory record
            const prodUpdate = await tx.product.updateMany({
              where: {
                id: product.id,
                availableQuantity: { gte: quantity },
              },
              data: {
                availableQuantity: { decrement: quantity },
                reservedQuantity: { increment: quantity },
              },
            });

            if (prodUpdate.count === 0) {
              const err = new Error(
                `Insufficient inventory for "${product.name}". Another order just consumed the available stock.`
              );
              (err as any).status = 400;
              throw err;
            }

            const freshProd = await tx.product.findUnique({
              where: { id: product.id },
            });
            if (freshProd) {
              await tx.product.update({
                where: { id: product.id },
                data: { inStock: Number(freshProd.availableQuantity) > 0 },
              });
            }
          }
        }

        // 5. Clear purchased items from Consumer Cart
        await tx.cartItem.deleteMany({
          where: {
            userId: consumerId,
            productId: { in: candidateItems.map((i) => i.productId) },
          },
        });

        // 6. Create Notifications
        // Consumer Notification
        await tx.notification.create({
          data: {
            userId: consumerId,
            title: 'Order Placed Successfully',
            message: `Your order #${orderNumber} for ₹${total} has been placed successfully.`,
            type: 'ORDER',
            link: `/orders/${order.id}`,
          },
        });

        // Farmer Notifications
        for (const farmerUserId of farmerUserIdsToNotify) {
          await tx.notification.create({
            data: {
              userId: farmerUserId,
              title: 'New Order Received',
              message: `You have received a new harvest order #${orderNumber}.`,
              type: 'ORDER',
              link: `/farmer/orders/${order.id}`,
            },
          });
        }

        // Return formatted full order
        const createdOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            items: true,
            timeline: {
              orderBy: { timestamp: 'asc' },
            },
            address: true,
            consumer: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        });

        return this.formatConsumerOrder(createdOrder);
      },
      { maxWait: 20000, timeout: 35000 }
    );
  }

  /**
   * 2. CONSUMER ORDER HISTORY (With filtering, search & pagination)
   */
  async getConsumerOrders(
    consumerId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    }
  ) {
    const page = Math.max(1, Number(options?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options?.limit) || 20));

    const where: Prisma.OrderWhereInput = {
      consumerId,
    };

    if (options?.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (options?.status && options.status.trim() && options.status.toLowerCase() !== 'all') {
      const st = options.status.trim().toLowerCase();
      if (st === 'active') {
        where.status = {
          in: [
            OrderStatus.PLACED,
            OrderStatus.CONFIRMED,
            OrderStatus.HARVESTING,
            OrderStatus.PACKED,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        };
      } else if (st === 'completed' || st === 'delivered') {
        where.status = OrderStatus.DELIVERED;
      } else if (st === 'cancelled' || st === 'canceled') {
        where.status = OrderStatus.CANCELLED;
      } else {
        try {
          where.status = toPrismaOrderStatus(st);
        } catch {
          // If status string is unrecognized, ignore
        }
      }
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: true,
          timeline: {
            orderBy: { timestamp: 'asc' },
          },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders: orders.map((o) => this.formatConsumerOrder(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * 3. CONSUMER CANCEL ORDER
   * Allows consumer to cancel an order in PLACED or CONFIRMED state.
   * Atomically restores reserved stock back to available stock.
   */
  async cancelConsumerOrder(
    consumerId: string,
    orderIdOrNumber: string,
    reason?: string,
    isAdmin = false
  ) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
                farmer: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        timeline: true,
      },
    });

    if (!order) {
      const err = new Error(`Order "${orderIdOrNumber}" not found.`);
      (err as any).status = 404;
      throw err;
    }

    if (!isAdmin && order.consumerId !== consumerId) {
      const err = new Error('Access denied: You do not have permission to cancel this order.');
      (err as any).status = 403;
      throw err;
    }

    // Cancellation eligibility rules: Only PLACED or CONFIRMED
    if (order.status === OrderStatus.CANCELLED) {
      const err = new Error('This order is already cancelled.');
      (err as any).status = 400;
      throw err;
    }

    if (order.status === OrderStatus.DELIVERED) {
      const err = new Error('Delivered orders cannot be cancelled.');
      (err as any).status = 400;
      throw err;
    }

    if (
      order.status === OrderStatus.HARVESTING ||
      order.status === OrderStatus.PACKED ||
      order.status === OrderStatus.OUT_FOR_DELIVERY
    ) {
      const err = new Error(
        `Order #${order.orderNumber} cannot be cancelled as it is currently in "${order.status.replace(/_/g, ' ')}" stage. Please contact support.`
      );
      (err as any).status = 400;
      throw err;
    }

    return await prisma.$transaction(
      async (tx) => {
        // 1. Restore Inventory Atomically for each item
        for (const item of order.items) {
          const qty = Number(item.quantity);
          if (item.product?.inventory) {
            const inv = item.product.inventory;
            const currentAvail = Number(inv.availableQuantity);
            const currentRes = Number(inv.reservedQuantity);
            const newAvail = currentAvail + qty;
            const newRes = Math.max(0, currentRes - qty);

            let newStatus: InventoryStatus = InventoryStatus.IN_STOCK;
            if (newAvail <= 0) newStatus = InventoryStatus.OUT_OF_STOCK;
            else if (newAvail <= Number(inv.threshold)) newStatus = InventoryStatus.LOW_STOCK;

            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: {
                availableQuantity: newAvail,
                reservedQuantity: newRes,
                status: newStatus,
                lastUpdated: new Date(),
              },
            });

            await tx.product.update({
              where: { id: item.product.id },
              data: {
                availableQuantity: newAvail,
                reservedQuantity: newRes,
                inStock: newAvail > 0,
              },
            });

            await tx.inventoryLog.create({
              data: {
                inventoryItemId: inv.id,
                type: InventoryLogType.ADJUSTMENT,
                amount: qty,
                newQuantity: newAvail,
                reason: `Order #${order.orderNumber} Cancelled - Restored Stock${reason ? ` (${reason})` : ''}`,
              },
            });
          } else if (item.productId) {
            const prod = await tx.product.findUnique({ where: { id: item.productId } });
            if (prod) {
              const currentAvail = Number(prod.availableQuantity);
              const currentRes = Number(prod.reservedQuantity);
              const newAvail = currentAvail + qty;
              const newRes = Math.max(0, currentRes - qty);

              await tx.product.update({
                where: { id: prod.id },
                data: {
                  availableQuantity: newAvail,
                  reservedQuantity: newRes,
                  inStock: newAvail > 0,
                },
              });
            }
          }
        }

        // 2. Update Order Status
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });

        // 3. Update Timeline
        await tx.orderTimelineStep.updateMany({
          where: { orderId: order.id },
          data: { isCurrent: false },
        });

        const cancelMeta = TIMELINE_METADATA.CANCELLED;
        await tx.orderTimelineStep.create({
          data: {
            orderId: order.id,
            status: OrderStatus.CANCELLED,
            label: cancelMeta.label,
            description: reason ? `Cancelled: ${reason}` : cancelMeta.description,
            isCompleted: true,
            isCurrent: true,
            timestamp: new Date(),
          },
        });

        // 4. Create Notifications
        // Consumer Notification
        await tx.notification.create({
          data: {
            userId: order.consumerId,
            title: 'Order Cancelled',
            message: `Your order #${order.orderNumber} has been cancelled successfully and reserved items were released.`,
            type: 'ORDER',
            link: `/orders/${order.id}`,
          },
        });

        // Farmer Notifications
        const farmerUserIds = new Set<string>();
        for (const item of order.items) {
          if (item.product?.farmer?.user?.id) {
            farmerUserIds.add(item.product.farmer.user.id);
          }
        }

        for (const fUserId of farmerUserIds) {
          await tx.notification.create({
            data: {
              userId: fUserId,
              title: 'Order Cancelled',
              message: `Order #${order.orderNumber} containing your items was cancelled by the customer. Stock has been restored.`,
              type: 'ORDER',
              link: `/farmer/orders/${order.id}`,
            },
          });
        }

        // Fetch refreshed order
        const refreshedOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            items: true,
            timeline: {
              orderBy: { timestamp: 'asc' },
            },
            address: true,
            consumer: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        });

        return this.formatConsumerOrder(refreshedOrder);
      },
      { maxWait: 20000, timeout: 35000 }
    );
  }

  /**
   * 4. CONSUMER SINGLE ORDER DETAILS
   */
  async getConsumerOrderById(consumerId: string, orderIdOrNumber: string, isAdmin = false) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        items: true,
        timeline: {
          orderBy: { timestamp: 'asc' },
        },
        address: true,
        consumer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!order) return null;

    if (!isAdmin && order.consumerId !== consumerId) {
      return null; // Enforce strict tenant isolation
    }

    return this.formatConsumerOrder(order);
  }

  /**
   * 5. FARMER ORDERS (Multi-tenant filtered)
   */
  async getFarmerOrders(farmerId: string) {
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: { farmerId },
        },
      },
      include: {
        items: true,
        timeline: {
          orderBy: { timestamp: 'asc' },
        },
        address: true,
        consumer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.formatFarmerOrder(o, farmerId));
  }

  /**
   * 5. FARMER SINGLE ORDER DETAILS
   */
  async getFarmerOrderById(farmerId: string, orderIdOrNumber: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
        items: {
          some: { farmerId },
        },
      },
      include: {
        items: true,
        timeline: {
          orderBy: { timestamp: 'asc' },
        },
        address: true,
        consumer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!order) return null;

    return this.formatFarmerOrder(order, farmerId);
  }

  /**
   * 6. FARMER ORDER STATUS UPDATE
   * Enforces approved state, valid transition lifecycle, and atomic inventory update.
   */
  async updateFarmerOrderStatus(farmerId: string, orderIdOrNumber: string, nextStatusRaw: string) {
    const nextStatus = toPrismaOrderStatus(nextStatusRaw);

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
        items: {
          some: { farmerId },
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
          },
        },
        timeline: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found or access denied for this farmer.`);
    }

    const currentStatus = order.status;

    // Idempotent
    if (currentStatus === nextStatus) {
      return await this.getFarmerOrderById(farmerId, order.id);
    }

    // Progression lifecycle rules
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
      // Cancellation allowed before out_for_delivery / delivered
      const canCancel = (
        [
          OrderStatus.PLACED,
          OrderStatus.CONFIRMED,
          OrderStatus.HARVESTING,
          OrderStatus.PACKED,
        ] as OrderStatus[]
      ).includes(currentStatus);

      if (!canCancel) {
        throw new Error(
          `Cannot cancel order in ${currentStatus} status.`
        );
      }
    } else {
      const currIdx = forwardOrder.indexOf(currentStatus);
      const nextIdx = forwardOrder.indexOf(nextStatus);

      if (currIdx === -1 || nextIdx === -1 || nextIdx <= currIdx) {
        throw new Error(
          `Invalid status transition from "${currentStatus}" to "${nextStatus}".`
        );
      }
    }

    // Perform atomic status change and inventory adjustments
    await prisma.$transaction(async (tx) => {
      // 1. Inventory adjustments based on terminal transitions
      if (nextStatus === OrderStatus.DELIVERED) {
        for (const item of order.items) {
          if (item.product?.inventory) {
            const qty = Number(item.quantity);
            const currentReserved = Number(item.product.inventory.reservedQuantity);
            const currentSold = Number(item.product.inventory.soldQuantity);

            const newReserved = Math.max(0, currentReserved - qty);
            const newSold = currentSold + qty;

            await tx.inventoryItem.update({
              where: { id: item.product.inventory.id },
              data: {
                reservedQuantity: newReserved,
                soldQuantity: newSold,
                lastUpdated: new Date(),
              },
            });

            await tx.product.update({
              where: { id: item.product.id },
              data: {
                reservedQuantity: newReserved,
                soldQuantity: newSold,
              },
            });

            await tx.inventoryLog.create({
              data: {
                inventoryItemId: item.product.inventory.id,
                type: InventoryLogType.ORDER_FULFILLED,
                amount: qty,
                newQuantity: item.product.inventory.availableQuantity,
                reason: `Order #${order.orderNumber} Fulfilled & Delivered`,
              },
            });
          }
        }
      } else if (nextStatus === OrderStatus.CANCELLED) {
        // Return reserved inventory back to available
        for (const item of order.items) {
          if (item.product?.inventory) {
            const qty = Number(item.quantity);
            const currentReserved = Number(item.product.inventory.reservedQuantity);
            const currentAvailable = Number(item.product.inventory.availableQuantity);

            const newReserved = Math.max(0, currentReserved - qty);
            const newAvailable = currentAvailable + qty;

            let newStatus: InventoryStatus = InventoryStatus.IN_STOCK;
            if (newAvailable <= 0) newStatus = InventoryStatus.OUT_OF_STOCK;
            else if (newAvailable <= Number(item.product.inventory.threshold))
              newStatus = InventoryStatus.LOW_STOCK;


            await tx.inventoryItem.update({
              where: { id: item.product.inventory.id },
              data: {
                availableQuantity: newAvailable,
                reservedQuantity: newReserved,
                status: newStatus,
                lastUpdated: new Date(),
              },
            });

            await tx.product.update({
              where: { id: item.product.id },
              data: {
                availableQuantity: newAvailable,
                reservedQuantity: newReserved,
                inStock: newAvailable > 0,
              },
            });

            await tx.inventoryLog.create({
              data: {
                inventoryItemId: item.product.inventory.id,
                type: InventoryLogType.ADJUSTMENT,
                amount: qty,
                newQuantity: newAvailable,
                reason: `Order #${order.orderNumber} Cancelled - Restored Stock`,
              },
            });
          }
        }
      }

      // 2. Update Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          deliveredAt: nextStatus === OrderStatus.DELIVERED ? new Date() : undefined,
        },
      });

      // 3. Update Timeline Steps
      // Mark prior steps as completed and not current
      await tx.orderTimelineStep.updateMany({
        where: { orderId: order.id },
        data: {
          isCurrent: false,
          isCompleted: true,
        },
      });

      const meta = TIMELINE_METADATA[nextStatus] || {
        label: nextStatus,
        description: `Status updated to ${nextStatus}`,
      };

      // Upsert the step for the new status
      const existingStep = await tx.orderTimelineStep.findFirst({
        where: {
          orderId: order.id,
          status: nextStatus,
        },
      });

      if (existingStep) {
        await tx.orderTimelineStep.update({
          where: { id: existingStep.id },
          data: {
            isCompleted: true,
            isCurrent: true,
            timestamp: new Date(),
          },
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

      // 4. Create Sales records if DELIVERED
      if (nextStatus === OrderStatus.DELIVERED) {
        await saleService.createSalesForDeliveredOrder(order.id, tx);
      }
    },
    { maxWait: 20000, timeout: 35000 }
  );

    return await this.getFarmerOrderById(farmerId, order.id);

  }

  /**
   * Helper: Formats Order for Consumer Frontend
   */
  private formatConsumerOrder(order: any) {
    const formattedTimeline = (order.timeline || []).map((step: any) => ({
      status: toConsumerOrderStatus(step.status),
      label: step.label,
      description: step.description,
      isCompleted: step.isCompleted,
      completed: step.isCompleted,
      isCurrent: step.isCurrent,
      current: step.isCurrent,
      timestamp: new Date(step.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      }),
    }));

    return {
      id: order.orderNumber, // Use orderNumber as display id (e.g. KM-20260927-1042)
      rawId: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: toConsumerOrderStatus(order.status),
      orderStatus: order.status,
      customerId: order.consumerId,
      customerName: order.address?.name || order.consumer?.name || 'Consumer',
      customerPhone: order.address?.phone || order.consumer?.phone || '',
      deliveryAddress: order.address
        ? {
            id: order.address.id,
            name: order.address.name,
            phone: order.address.phone,
            addressLine: order.address.addressLine,
            city: order.address.city,
            pincode: order.address.pincode,
            hub: order.address.hub,
            isDefault: order.address.isDefault,
          }
        : null,
      deliverySlot: {
        id: 'slot-morning',
        name: order.deliverySlotName,
        timeRange: order.deliverySlotRange,
        description: 'Morning fresh harvest slot',
      },
      items: (order.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        productImage: it.productImage,
        farmerId: it.farmerId,
        farmerName: it.farmerName,
        farmName: it.farmName,
        price: Number(it.unitPrice),
        unitPrice: Number(it.unitPrice),
        quantity: Number(it.quantity),
        unit: it.unit,
        totalPrice: Number(it.totalPrice),
      })),
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      platformFee: Number(order.platformFee),
      farmerEarnings: Number(order.farmerEarnings),
      total: Number(order.total),
      paymentMethod:
        order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
          ? 'Cash on Delivery'
          : order.paymentMethod === PaymentMethod.CARD
          ? 'Card'
          : 'UPI',
      paymentStatus: order.paymentStatus === PaymentStatus.PAID ? 'Paid' : 'Pending',
      estimatedDelivery: `Today, ${order.deliverySlotRange}`,
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      deliveryBatchId: order.deliveryBatchId || null,
      timeline: formattedTimeline,
    };
  }

  /**
   * Helper: Formats Order for Farmer Frontend (Strictly scoped to this farmer)
   */
  private formatFarmerOrder(order: any, farmerId: string) {
    // FILTER: Farmer can ONLY see their own items!
    const farmerItems = (order.items || []).filter((it: any) => it.farmerId === farmerId);

    const productsSummary =
      farmerItems.map((i: any) => i.productName).join(', ') || 'Produce';
    const totalQtyNum = farmerItems.reduce(
      (sum: number, i: any) => sum + Number(i.quantity),
      0
    );
    const farmerAmount = farmerItems.reduce(
      (sum: number, i: any) => sum + Number(i.totalPrice),
      0
    );

    const formattedTimeline = (order.timeline || []).map((step: any) => ({
      status: toConsumerOrderStatus(step.status),
      label: step.label,
      timestamp: new Date(step.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      }),
      completed: step.isCompleted,
      isCompleted: step.isCompleted,
      current: step.isCurrent,
      isCurrent: step.isCurrent,
    }));

    return {
      id: order.orderNumber, // e.g. KM-1024 or KM-20260927-1042
      rawId: order.id,
      orderNumber: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      customerName: order.address?.name || order.consumer?.name || 'Customer',
      customerPhone: order.address?.phone || order.consumer?.phone || '',
      deliveryAddress: order.address
        ? {
            id: order.address.id,
            name: order.address.name,
            phone: order.address.phone,
            addressLine: order.address.addressLine,
            city: order.address.city,
            pincode: order.address.pincode,
            hub: order.address.hub,
            isDefault: order.address.isDefault,
          }
        : null,
      deliverySlot: {
        id: 'slot-morning',
        name: order.deliverySlotName,
        timeRange: order.deliverySlotRange,
        description: 'Morning fresh harvest slot',
      },
      items: farmerItems.map((it: any) => ({
        productId: it.productId,
        productName: it.productName,
        productImage: it.productImage,
        farmerId: it.farmerId,
        farmerName: it.farmerName,
        farmName: it.farmName,
        price: Number(it.unitPrice),
        quantity: Number(it.quantity),
        unit: it.unit,
        totalPrice: Number(it.totalPrice),
      })),
      productsSummary,
      totalQuantity: `${totalQtyNum} kg`,
      amount: farmerAmount,
      totalAmount: Number(order.total),
      status: toFarmerOrderStatus(order.status),
      orderStatus: order.status,
      paymentMethod:
        order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
          ? 'Cash on Delivery'
          : order.paymentMethod === PaymentMethod.CARD
          ? 'Card'
          : 'UPI',
      paymentStatus: order.paymentStatus === PaymentStatus.PAID ? 'Paid' : 'Pending',
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
      deliveryBatchId: order.deliveryBatchId || null,
      timeline: formattedTimeline,
    };
  }
}

export const orderService = new OrderService();
