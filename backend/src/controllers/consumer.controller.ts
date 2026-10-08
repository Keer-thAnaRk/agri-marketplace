import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { consumerService } from '../services/consumer.service';

export class ConsumerController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const profile = await consumerService.getProfile(userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      if (error.status === 404 || error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.status === 403 || error.message?.includes('deactivated')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { name, phone, avatar } = req.body || {};
      const updated = await consumerService.updateProfile(userId, { name, phone, avatar });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      if (error.status === 400 || error.message?.includes('Name cannot be empty')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const addresses = await consumerService.getAddresses(userId);
      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { name, phone, addressLine, city, state, pincode, hub, isDefault } = req.body || {};
      const address = await consumerService.createAddress(userId, {
        name,
        phone,
        addressLine,
        city,
        state,
        pincode,
        hub,
        isDefault,
      });

      res.status(201).json({
        success: true,
        message: 'Delivery address added successfully.',
        data: address,
      });
    } catch (error: any) {
      if (error.status === 400) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!addressId) {
        res.status(400).json({ success: false, error: 'Address ID is required.' });
        return;
      }

      const updated = await consumerService.updateAddress(userId, addressId, req.body || {});
      res.status(200).json({
        success: true,
        message: 'Delivery address updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      if (error.status === 400) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      if (error.status === 404 || error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.status === 403 || error.message?.includes('Access denied')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!addressId) {
        res.status(400).json({ success: false, error: 'Address ID is required.' });
        return;
      }

      const result = await consumerService.deleteAddress(userId, addressId);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.status === 404 || error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.status === 403 || error.message?.includes('Access denied')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async setDefaultAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!addressId) {
        res.status(400).json({ success: false, error: 'Address ID is required.' });
        return;
      }

      const updated = await consumerService.setDefaultAddress(userId, addressId);
      res.status(200).json({
        success: true,
        message: 'Address set as primary default.',
        data: updated,
      });
    } catch (error: any) {
      if (error.status === 404 || error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.status === 403 || error.message?.includes('Access denied')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getProductReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
      if (!productId) {
        res.status(400).json({ success: false, error: 'Product ID is required.' });
        return;
      }

      const result = await consumerService.getProductReviews(productId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.status === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getMyReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const reviews = await consumerService.getConsumerReviews(userId);
      res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
      if (!productId) {
        res.status(400).json({ success: false, error: 'Product ID is required.' });
        return;
      }

      const review = await consumerService.createReview(userId, productId, req.body || {});
      res.status(201).json({
        success: true,
        message: 'Review submitted successfully.',
        data: review,
      });
    } catch (error: any) {
      const status = error.status || 400;
      if (status === 400 || status === 403 || status === 404 || status === 409) {
        res.status(status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
      if (!reviewId) {
        res.status(400).json({ success: false, error: 'Review ID is required.' });
        return;
      }

      const updated = await consumerService.updateReview(userId, reviewId, req.body || {});
      res.status(200).json({
        success: true,
        message: 'Review updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      const status = error.status || 400;
      if (status === 400 || status === 403 || status === 404) {
        res.status(status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
      if (!reviewId) {
        res.status(400).json({ success: false, error: 'Review ID is required.' });
        return;
      }

      const result = await consumerService.deleteReview(userId, reviewId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      const status = error.status || 400;
      if (status === 400 || status === 403 || status === 404) {
        res.status(status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getMyDisputes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const disputes = await consumerService.getConsumerDisputes(userId);
      res.status(200).json({ success: true, data: disputes });
    } catch (error) {
      next(error);
    }
  }

  async getDisputeById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const disputeId = Array.isArray(req.params.disputeId) ? req.params.disputeId[0] : req.params.disputeId;
      if (!disputeId) {
        res.status(400).json({ success: false, error: 'Dispute ID is required.' });
        return;
      }

      const dispute = await consumerService.getConsumerDisputeById(userId, disputeId);
      res.status(200).json({ success: true, data: dispute });
    } catch (error: any) {
      const status = error.status || 400;
      if (status === 400 || status === 403 || status === 404) {
        res.status(status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async createDispute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
      if (!orderId) {
        res.status(400).json({ success: false, error: 'Order ID is required.' });
        return;
      }

      const dispute = await consumerService.createDispute(userId, orderId, req.body || {});
      res.status(201).json({
        success: true,
        message: 'Dispute submitted successfully.',
        data: dispute,
      });
    } catch (error: any) {
      const status = error.status || 400;
      if (status === 400 || status === 403 || status === 404) {
        res.status(status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}

export const consumerController = new ConsumerController();
