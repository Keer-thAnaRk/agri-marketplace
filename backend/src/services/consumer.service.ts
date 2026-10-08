import { prisma } from '../db/prisma';
import { UserRole, OrderStatus, DisputeStatus, Prisma, NotificationType } from '@prisma/client';

export interface CreateAddressInput {
  name: string;
  phone: string;
  addressLine: string;
  city?: string;
  state?: string;
  pincode: string;
  hub?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  name?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  hub?: string;
  isDefault?: boolean;
}

export interface CreateReviewInput {
  rating?: number | string;
  comment?: string;
  verifiedPurchase?: boolean;
}

export interface UpdateReviewInput {
  rating?: number | string;
  comment?: string;
}

export interface CreateDisputeInput {
  reason?: string;
  amount?: number | string;
  description?: string;
}

function normalizeComment(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

async function recomputeReviewAggregates(productId: string | null, farmerId: string) {
  const productReviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });

  const farmerReviews = await prisma.review.findMany({
    where: { farmerId },
    select: { rating: true },
  });

  const productAverage = productReviews.length > 0
    ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
    : 5;
  const farmerAverage = farmerReviews.length > 0
    ? farmerReviews.reduce((sum, review) => sum + review.rating, 0) / farmerReviews.length
    : 5;

  await Promise.all([
    productId
      ? prisma.product.update({
          where: { id: productId },
          data: {
            rating: new Prisma.Decimal(productAverage.toFixed(2)),
            reviewsCount: productReviews.length,
          },
        })
      : Promise.resolve(),
    prisma.farmer.update({
      where: { id: farmerId },
      data: {
        rating: new Prisma.Decimal(farmerAverage.toFixed(2)),
        reviewCount: farmerReviews.length,
      },
    }),
  ]);
}

export class ConsumerService {
  /**
   * Retrieves profile of authenticated consumer with addresses.
   * passwordHash is strictly excluded.
   */
  async getProfile(userId: string) {
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
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!user) {
      const err = new Error('User profile not found.');
      (err as any).status = 404;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Account has been deactivated.');
      (err as any).status = 403;
      throw err;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      addresses: user.addresses,
      consumerAddresses: user.addresses,
    };
  }

  /**
   * Updates consumer profile (name, phone, avatar).
   * Parameter tampering for role, isActive, email, or passwordHash is completely ignored/blocked.
   */
  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; avatar?: string }
  ) {
    if (data.name !== undefined && !data.name.trim()) {
      const err = new Error('Name cannot be empty.');
      (err as any).status = 400;
      throw err;
    }

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.avatar !== undefined) updateData.avatar = data.avatar.trim();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

  /**
   * Lists all addresses belonging to the authenticated consumer.
   */
  async getAddresses(userId: string) {
    const addresses = await prisma.consumerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses;
  }

  /**
   * Adds a new address for the authenticated consumer.
   * Enforces default address rules via a Prisma transaction.
   */
  async createAddress(userId: string, input: CreateAddressInput) {
    const { name, phone, addressLine, city, state, pincode, hub, isDefault } = input;

    if (!name?.trim()) {
      const err = new Error('Recipient name is required.');
      (err as any).status = 400;
      throw err;
    }
    if (!phone?.trim()) {
      const err = new Error('Contact phone number is required.');
      (err as any).status = 400;
      throw err;
    }
    if (!addressLine?.trim()) {
      const err = new Error('Street address / address line is required.');
      (err as any).status = 400;
      throw err;
    }
    if (!pincode?.trim()) {
      const err = new Error('Postal pincode is required.');
      (err as any).status = 400;
      throw err;
    }

    const existingCount = await prisma.consumerAddress.count({
      where: { userId },
    });

    // If first address or isDefault requested, make it default
    const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

    return await prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.consumerAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const address = await tx.consumerAddress.create({
        data: {
          userId,
          name: name.trim(),
          phone: phone.trim(),
          addressLine: addressLine.trim(),
          city: city?.trim() || 'Bengaluru',
          state: state?.trim() || 'Karnataka',
          pincode: pincode.trim(),
          hub: hub?.trim() || `${city?.trim() || 'Bengaluru'} Hub`,
          isDefault: shouldBeDefault,
        },
      });

      return address;
    });
  }

  /**
   * Updates an existing address.
   * Strict IDOR protection: only the address owner can update.
   */
  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput
  ) {
    const existing = await prisma.consumerAddress.findUnique({
      where: { id: addressId },
    });

    if (!existing) {
      const err = new Error(`Address with ID "${addressId}" not found.`);
      (err as any).status = 404;
      throw err;
    }

    if (existing.userId !== userId) {
      const err = new Error('Access denied: You do not have permission to modify this address.');
      (err as any).status = 403;
      throw err;
    }

    const updateData: Record<string, any> = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) {
        const err = new Error('Recipient name cannot be empty.');
        (err as any).status = 400;
        throw err;
      }
      updateData.name = input.name.trim();
    }
    if (input.phone !== undefined) {
      if (!input.phone.trim()) {
        const err = new Error('Phone cannot be empty.');
        (err as any).status = 400;
        throw err;
      }
      updateData.phone = input.phone.trim();
    }
    if (input.addressLine !== undefined) {
      if (!input.addressLine.trim()) {
        const err = new Error('Address line cannot be empty.');
        (err as any).status = 400;
        throw err;
      }
      updateData.addressLine = input.addressLine.trim();
    }
    if (input.city !== undefined) updateData.city = input.city.trim();
    if (input.state !== undefined) updateData.state = input.state.trim();
    if (input.pincode !== undefined) {
      if (!input.pincode.trim()) {
        const err = new Error('Pincode cannot be empty.');
        (err as any).status = 400;
        throw err;
      }
      updateData.pincode = input.pincode.trim();
    }
    if (input.hub !== undefined) updateData.hub = input.hub.trim();

    const makeDefault = input.isDefault === true;

    return await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.consumerAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
        updateData.isDefault = true;
      } else if (input.isDefault === false && existing.isDefault) {
        // If unsetting default, make another address default if available
        updateData.isDefault = false;
      }

      const updated = await tx.consumerAddress.update({
        where: { id: addressId },
        data: updateData,
      });

      return updated;
    });
  }

  /**
   * Deletes an address.
   * Strict IDOR protection: only the address owner can delete.
   * If the deleted address was default, promotes the next available address to default.
   */
  async deleteAddress(userId: string, addressId: string) {
    const existing = await prisma.consumerAddress.findUnique({
      where: { id: addressId },
    });

    if (!existing) {
      const err = new Error(`Address with ID "${addressId}" not found.`);
      (err as any).status = 404;
      throw err;
    }

    if (existing.userId !== userId) {
      const err = new Error('Access denied: You do not have permission to delete this address.');
      (err as any).status = 403;
      throw err;
    }

    await prisma.$transaction(async (tx) => {
      await tx.consumerAddress.delete({
        where: { id: addressId },
      });

      if (existing.isDefault) {
        const nextAddress = await tx.consumerAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (nextAddress) {
          await tx.consumerAddress.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { success: true, message: 'Address deleted successfully.' };
  }

  /**
   * Sets an address as the default for the authenticated consumer.
   * Resets all other addresses for this user to isDefault: false.
   */
  async setDefaultAddress(userId: string, addressId: string) {
    const existing = await prisma.consumerAddress.findUnique({
      where: { id: addressId },
    });

    if (!existing) {
      const err = new Error(`Address with ID "${addressId}" not found.`);
      (err as any).status = 404;
      throw err;
    }

    if (existing.userId !== userId) {
      const err = new Error('Access denied: You do not have permission to modify this address.');
      (err as any).status = 403;
      throw err;
    }

    return await prisma.$transaction(async (tx) => {
      await tx.consumerAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      const updated = await tx.consumerAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      return updated;
    });
  }

  async getProductReviews(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const total = reviews.length;
    const averageRating = total > 0
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1))
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating as keyof typeof ratingDistribution] += 1;
      }
    });

    return {
      productId,
      averageRating,
      reviewsCount: total,
      ratingDistribution,
      reviews: reviews.map((review) => ({
        id: review.id,
        userId: review.userId,
        userName: review.user?.name || 'Verified consumer',
        userAvatar: review.user?.avatar || '',
        rating: review.rating,
        comment: review.comment,
        verifiedPurchase: review.verifiedPurchase,
        createdAt: review.createdAt,
      })),
    };
  }

  async getConsumerReviews(userId: string) {
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        farmer: {
          select: {
            id: true,
            farmName: true,
          },
        },
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      productName: review.product?.name || 'Farm product',
      farmerId: review.farmerId,
      farmerName: review.farmer?.farmName || 'Farm partner',
      rating: review.rating,
      comment: review.comment,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt,
    }));
  }

  async createReview(userId: string, productId: string, input: CreateReviewInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        farmer: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!product) {
      const err = new Error('Product not found.');
      (err as any).status = 404;
      throw err;
    }

    const parsedRating = Number(input.rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5 || !Number.isInteger(parsedRating)) {
      const err = new Error('Review rating must be an integer between 1 and 5.');
      (err as any).status = 400;
      throw err;
    }

    const comment = normalizeComment(input.comment);
    if (!comment || comment.length < 2) {
      const err = new Error('Review comment is required and must be at least 2 characters long.');
      (err as any).status = 400;
      throw err;
    }

    const existingReview = await prisma.review.findFirst({
      where: { userId, productId },
    });

    if (existingReview) {
      const err = new Error('You have already reviewed this product.');
      (err as any).status = 409;
      throw err;
    }

    const qualifyingOrder = await prisma.order.findFirst({
      where: {
        consumerId: userId,
        status: OrderStatus.DELIVERED,
        items: {
          some: {
            productId,
            farmerId: product.farmerId,
          },
        },
      },
      include: {
        items: {
          where: { productId, farmerId: product.farmerId },
          select: { id: true, productId: true, totalPrice: true },
        },
      },
    });

    if (!qualifyingOrder) {
      const err = new Error('Only consumers with a verified delivered order for this product may leave a review.');
      (err as any).status = 403;
      throw err;
    }

    const createdReview = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId,
          farmerId: product.farmerId,
          productId,
          rating: parsedRating,
          comment,
          verifiedPurchase: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      await recomputeReviewAggregates(productId, product.farmerId);
      return review;
    });

    await prisma.notification.create({
      data: {
        userId,
        title: 'Review submitted',
        message: `Your review for ${product.name} has been posted successfully.`,
        type: NotificationType.REVIEW,
        link: `/products/${productId}`,
      },
    });

    return {
      id: createdReview.id,
      userId: createdReview.userId,
      productId: createdReview.productId,
      farmerId: createdReview.farmerId,
      rating: createdReview.rating,
      comment: createdReview.comment,
      verifiedPurchase: createdReview.verifiedPurchase,
      createdAt: createdReview.createdAt,
      user: createdReview.user,
    };
  }

  async updateReview(userId: string, reviewId: string, input: UpdateReviewInput) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        farmerId: true,
        productId: true,
        rating: true,
        comment: true,
      },
    });

    if (!review) {
      const err = new Error('Review not found.');
      (err as any).status = 404;
      throw err;
    }

    if (review.userId !== userId) {
      const err = new Error('You do not have permission to edit this review.');
      (err as any).status = 403;
      throw err;
    }

    const nextRating = input.rating !== undefined ? Number(input.rating) : review.rating;
    if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5 || !Number.isInteger(nextRating)) {
      const err = new Error('Review rating must be an integer between 1 and 5.');
      (err as any).status = 400;
      throw err;
    }

    const nextComment = input.comment !== undefined ? normalizeComment(input.comment) : review.comment;
    if (!nextComment || nextComment.length < 2) {
      const err = new Error('Review comment is required and must be at least 2 characters long.');
      (err as any).status = 400;
      throw err;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: nextRating,
          comment: nextComment,
        },
      });

      await recomputeReviewAggregates(result.productId, result.farmerId);
      return result;
    });

    return updated;
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        farmerId: true,
        productId: true,
      },
    });

    if (!review) {
      const err = new Error('Review not found.');
      (err as any).status = 404;
      throw err;
    }

    if (review.userId !== userId) {
      const err = new Error('You do not have permission to delete this review.');
      (err as any).status = 403;
      throw err;
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: reviewId },
      });

      await recomputeReviewAggregates(review.productId, review.farmerId);
    });

    return { success: true, message: 'Review deleted successfully.' };
  }

  async getConsumerDisputes(userId: string) {
    const disputes = await prisma.dispute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                productName: true,
                productId: true,
                totalPrice: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    return disputes.map((dispute) => ({
      id: dispute.id,
      orderId: dispute.orderId,
      orderNumber: dispute.order?.orderNumber || '',
      status: dispute.status,
      reason: dispute.reason,
      amount: Number(dispute.amount),
      description: dispute.description,
      resolution: dispute.resolution,
      productName: dispute.productName,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    }));
  }

  async getConsumerDisputeById(userId: string, disputeId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                productName: true,
                productId: true,
                totalPrice: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      const err = new Error('Dispute not found.');
      (err as any).status = 404;
      throw err;
    }

    if (dispute.userId !== userId) {
      const err = new Error('Access denied: you can only view your own disputes.');
      (err as any).status = 403;
      throw err;
    }

    return {
      id: dispute.id,
      orderId: dispute.orderId,
      orderNumber: dispute.order?.orderNumber || '',
      status: dispute.status,
      reason: dispute.reason,
      amount: Number(dispute.amount),
      description: dispute.description,
      resolution: dispute.resolution,
      productName: dispute.productName,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  }

  async createDispute(userId: string, orderId: string, input: CreateDisputeInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            totalPrice: true,
          },
        },
      },
    });

    if (!order) {
      const err = new Error('Order not found.');
      (err as any).status = 404;
      throw err;
    }

    if (order.consumerId !== userId) {
      const err = new Error('Access denied: you can only dispute your own orders.');
      (err as any).status = 403;
      throw err;
    }

    if (order.status === OrderStatus.CANCELLED) {
      const err = new Error('Cancelled orders cannot be disputed.');
      (err as any).status = 400;
      throw err;
    }

    const reason = normalizeComment(input.reason);
    if (!reason) {
      const err = new Error('Dispute reason is required.');
      (err as any).status = 400;
      throw err;
    }

    const rawAmount = Number(input.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      const err = new Error('Dispute amount must be a positive number.');
      (err as any).status = 400;
      throw err;
    }

    const allowedMax = Number(order.total);
    if (rawAmount > allowedMax) {
      const err = new Error('Dispute amount cannot exceed the eligible order value.');
      (err as any).status = 400;
      throw err;
    }

    const description = normalizeComment(input.description);
    if (!description) {
      const err = new Error('Dispute description is required.');
      (err as any).status = 400;
      throw err;
    }

    const productName = order.items[0]?.productName || 'Order item';

    const dispute = await prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          orderId: order.id,
          userId,
          productName,
          reason,
          amount: new Prisma.Decimal(rawAmount.toFixed(2)),
          status: DisputeStatus.OPEN,
          description,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: 'Dispute filed',
          message: `Your dispute for order #${order.orderNumber} has been submitted for review.`,
          type: NotificationType.DISPUTE,
          link: `/orders/${order.id}`,
        },
      });

      return created;
    });

    return {
      id: dispute.id,
      orderId: dispute.orderId,
      userId: dispute.userId,
      productName: dispute.productName,
      reason: dispute.reason,
      amount: Number(dispute.amount),
      status: dispute.status,
      description: dispute.description,
      resolution: dispute.resolution,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  }
}

export const consumerService = new ConsumerService();
