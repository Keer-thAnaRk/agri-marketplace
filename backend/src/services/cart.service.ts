import { prisma } from '../db/prisma';
import { ProductStatus, VerificationStatus, Prisma } from '@prisma/client';
import { calculateFreshness } from '../utils/freshness';

export interface CartItemResponse {
  id: string;
  productId: string;
  name: string;
  category: string;
  description: string;
  image: string;
  images: string[];
  unit: string;
  unitShort: string;
  price: number;
  quantity: number;
  itemTotal: number;
  availableQuantity: number;
  inStock: boolean;
  isAvailable: boolean;
  status: ProductStatus;
  farmerId: string;
  farmerName: string;
  farmName: string;
  farmLocation: string;
  farmDistanceKm: number;
  freshnessScore: number;
  freshnessStatus: string;
  freshnessLabel: string;
  isOrganic: boolean;
  farmingMethod: string;
  shelfLifeDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  items: CartItemResponse[];
  cartCount: number;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  farmerEarnings: number;
  total: number;
  hasUnavailableItems: boolean;
}

export class CartService {
  /**
   * Retrieves the authenticated consumer's cart with live database pricing and stock availability.
   */
  async getCart(userId: string): Promise<CartResponse> {
    const rawCartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            farmer: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatar: true,
                    isActive: true,
                  },
                },
              },
            },
            inventory: true,
            harvestBatches: {
              where: { status: 'AVAILABLE' },
              orderBy: { harvestDate: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let subtotal = 0;
    let hasUnavailableItems = false;

    const formattedItems: CartItemResponse[] = rawCartItems.map((item) => {
      const p = item.product;
      const farmer = p.farmer;
      const price = Number(p.price);
      const requestedQty = Number(item.quantity);
      const availableStock = Math.min(
        Number(p.availableQuantity),
        p.inventory ? Number(p.inventory.availableQuantity) : Number(p.availableQuantity)
      );

      const isFarmerApproved =
        farmer &&
        farmer.verificationStatus === VerificationStatus.APPROVED &&
        farmer.isVerified &&
        farmer.user?.isActive;

      const isProductActive = p.status === ProductStatus.ACTIVE && p.inStock;
      const isStockSufficient = availableStock >= requestedQty && availableStock > 0;
      const isAvailable = Boolean(isFarmerApproved && isProductActive && isStockSufficient);

      if (!isAvailable) {
        hasUnavailableItems = true;
      }

      const itemTotal = isAvailable ? price * requestedQty : 0;
      if (isAvailable) {
        subtotal += itemTotal;
      }

      const latestBatch = p.harvestBatches?.[0];
      const harvestDateRef = latestBatch?.harvestDate || p.harvestDate || p.createdAt;
      const shelfLifeDays = latestBatch?.expectedShelfLifeDays || p.shelfLifeDays || 6;
      const freshness = calculateFreshness(harvestDateRef, shelfLifeDays);

      return {
        id: item.id,
        productId: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        image:
          p.images && p.images.length > 0
            ? p.images[0]
            : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        images: p.images || [],
        unit: p.unit,
        unitShort: p.unitShort || p.unit,
        price,
        quantity: requestedQty,
        itemTotal,
        availableQuantity: Math.max(0, availableStock),
        inStock: p.inStock && availableStock > 0,
        isAvailable,
        status: p.status,
        farmerId: p.farmerId,
        farmerName: farmer.user?.name || 'Local Cultivator',
        farmName: farmer.farmName,
        farmLocation: farmer.location || `${farmer.city}, ${farmer.state}`,
        farmDistanceKm: Number(farmer.distanceKm || p.farmDistanceKm || 2.5),
        freshnessScore: freshness.percentage,
        freshnessStatus: freshness.status,
        freshnessLabel: freshness.label,
        isOrganic: p.isOrganic,
        farmingMethod: p.farmingMethod,
        shelfLifeDays: p.shelfLifeDays,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    const deliveryFee = subtotal > 0 ? (subtotal > 499 ? 0 : 35) : 0;
    const platformFee = subtotal > 0 ? Math.round(subtotal * 0.1) : 0;
    const farmerEarnings = subtotal > 0 ? Math.round(subtotal * 0.75) : 0;
    const total = subtotal + deliveryFee + platformFee;
    const cartCount = formattedItems.reduce((acc, it) => acc + (it.isAvailable ? it.quantity : 0), 0);

    return {
      items: formattedItems,
      cartCount,
      itemCount: formattedItems.length,
      subtotal,
      deliveryFee,
      platformFee,
      farmerEarnings,
      total,
      hasUnavailableItems,
    };
  }

  /**
   * Adds an item to the consumer's cart or increments existing quantity with atomic verification.
   */
  async addToCart(userId: string, productId: string, quantity: number) {
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      const err = new Error('A valid product ID is required.');
      (err as any).status = 400;
      throw err;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      const err = new Error('Quantity must be a positive number greater than 0.');
      (err as any).status = 400;
      throw err;
    }

    // Authoritative check on Product + Farmer + Inventory
    const product = await prisma.product.findUnique({
      where: { id: productId.trim() },
      include: {
        farmer: {
          include: {
            user: true,
          },
        },
        inventory: true,
      },
    });

    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    if (
      product.status !== ProductStatus.ACTIVE ||
      !product.inStock ||
      !product.farmer ||
      product.farmer.verificationStatus !== VerificationStatus.APPROVED ||
      !product.farmer.isVerified ||
      !product.farmer.user?.isActive
    ) {
      const err = new Error('This product is currently inactive or unavailable for purchase.');
      (err as any).status = 400;
      throw err;
    }

    const availableStock = Math.min(
      Number(product.availableQuantity),
      product.inventory ? Number(product.inventory.availableQuantity) : Number(product.availableQuantity)
    );

    if (availableStock <= 0) {
      const err = new Error('Product is currently out of stock.');
      (err as any).status = 400;
      throw err;
    }

    const lineKey = `product:${product.id}`;

    // Check existing cart item for this user & product
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_lineKey: {
          userId,
          lineKey,
        },
      },
    });

    const targetQuantity = (existingCartItem ? Number(existingCartItem.quantity) : 0) + qty;

    if (targetQuantity > availableStock) {
      const err = new Error(
        `Cannot add ${qty} units. Maximum available stock is ${availableStock} (you currently have ${
          existingCartItem ? Number(existingCartItem.quantity) : 0
        } in cart).`
      );
      (err as any).status = 400;
      throw err;
    }

    // Upsert cart item atomically
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_lineKey: {
          userId,
          lineKey,
        },
      },
      update: {
        quantity: new Prisma.Decimal(targetQuantity),
      },
      create: {
        userId,
        productId: product.id,
        lineKey,
        quantity: new Prisma.Decimal(qty),
      },
    });

    return {
      cartItem,
      message: `Added ${product.name} to cart.`,
    };
  }

  /**
   * Updates cart item quantity for a specific product.
   */
  async updateCartItemQuantity(userId: string, productId: string, quantity: number) {
    if (!productId || typeof productId !== 'string') {
      const err = new Error('Product ID is required.');
      (err as any).status = 400;
      throw err;
    }

    const qty = Number(quantity);
    if (isNaN(qty)) {
      const err = new Error('Quantity must be a valid number.');
      (err as any).status = 400;
      throw err;
    }

    // If quantity is 0 or less, remove item from cart
    if (qty <= 0) {
      return this.removeFromCart(userId, productId);
    }

    // Authoritative check on Product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        farmer: {
          include: {
            user: true,
          },
        },
        inventory: true,
      },
    });

    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    if (
      product.status !== ProductStatus.ACTIVE ||
      !product.farmer ||
      product.farmer.verificationStatus !== VerificationStatus.APPROVED ||
      !product.farmer.isVerified ||
      !product.farmer.user?.isActive
    ) {
      const err = new Error('This product is no longer active on the marketplace.');
      (err as any).status = 400;
      throw err;
    }

    const availableStock = Math.min(
      Number(product.availableQuantity),
      product.inventory ? Number(product.inventory.availableQuantity) : Number(product.availableQuantity)
    );

    if (qty > availableStock) {
      const err = new Error(
        `Requested quantity (${qty}) exceeds available stock (${availableStock}).`
      );
      (err as any).status = 400;
      throw err;
    }

    const lineKey = `product:${product.id}`;
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_lineKey: {
          userId,
          lineKey,
        },
      },
    });

    if (!existingCartItem) {
      const err = new Error('Item not found in your cart.');
      (err as any).status = 404;
      throw err;
    }

    const updated = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: new Prisma.Decimal(qty) },
    });

    return {
      cartItem: updated,
      message: 'Cart quantity updated successfully.',
    };
  }

  /**
   * Removes an item from the consumer's cart by productId or cartItemId.
   */
  async removeFromCart(userId: string, identifier: string) {
    if (!identifier || typeof identifier !== 'string') {
      const err = new Error('Product ID or Cart Item ID is required.');
      (err as any).status = 400;
      throw err;
    }

    // Try finding by productId or by id
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        OR: [{ productId: identifier.trim() }, { id: identifier.trim() }],
      },
    });

    if (!cartItem) {
      const err = new Error('Item not found in your cart.');
      (err as any).status = 404;
      throw err;
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    return {
      success: true,
      message: 'Item removed from your cart.',
    };
  }

  /**
   * Clears the entire cart for the authenticated consumer.
   */
  async clearCart(userId: string) {
    const { count } = await prisma.cartItem.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      message: 'Cart cleared successfully.',
      count,
    };
  }
}

export const cartService = new CartService();
