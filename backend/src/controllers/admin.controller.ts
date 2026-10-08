import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class AdminController {
  async approveFarmer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = String(req.params.farmerId);
      const adminUserId = req.user!.id;

      const approvedFarmer = await adminService.approveFarmer(adminUserId, farmerId);

      res.status(200).json({
        success: true,
        message: `Farmer "${approvedFarmer.farmName}" has been successfully approved.`,
        data: approvedFarmer,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message.includes('Conflict of interest') || error.message.includes('Access denied')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async rejectFarmer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = String(req.params.farmerId);
      const { reason } = req.body;
      const adminUserId = req.user!.id;

      if (!reason || !reason.trim()) {
        res.status(400).json({
          success: false,
          error: 'A reason for rejection is required in the request body.',
        });
        return;
      }

      const rejectedFarmer = await adminService.rejectFarmer(adminUserId, farmerId, reason);

      res.status(200).json({
        success: true,
        message: `Farmer "${rejectedFarmer.farmName}" application has been rejected.`,
        data: rejectedFarmer,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message.includes('Conflict of interest') || error.message.includes('Access denied')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getAllFarmers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const farmers = await adminService.getAllFarmers(status);

      res.status(200).json({
        success: true,
        count: farmers.length,
        data: farmers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingFarmers(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingFarmers = await adminService.getPendingFarmers();

      res.status(200).json({
        success: true,
        count: pendingFarmers.length,
        data: pendingFarmers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFarmerById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = String(req.params.farmerId);
      const farmer = await adminService.getFarmerById(farmerId);

      res.status(200).json({
        success: true,
        data: farmer,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getAllProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        category: req.query.category as string | undefined,
        status: req.query.status as string | undefined,
        farmingMethod: req.query.farmingMethod as string | undefined,
        organic: req.query.organic as string | undefined,
        farmerId: req.query.farmerId as string | undefined,
      };

      const products = await adminService.getAllProducts(filters);

      res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = String(req.params.productId);
      const product = await adminService.getProductById(productId);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateProductStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = String(req.params.productId);
      const { status } = req.body;

      if (!status || !status.trim()) {
        res.status(400).json({ success: false, error: 'Product status is required.' });
        return;
      }

      const updated = await adminService.updateProductStatus(productId, status);

      res.status(200).json({
        success: true,
        message: `Product status updated to ${status}.`,
        data: updated,
      });
    } catch (error: any) {
      if (error.message?.includes('Invalid product status') || error.message?.includes('status is required')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getAllOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        paymentStatus: req.query.paymentStatus as string | undefined,
        farmerId: req.query.farmerId as string | undefined,
        farmerName: req.query.farmerName as string | undefined,
      };

      const orders = await adminService.getAllOrders(filters);

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.orderId);
      const order = await adminService.getOrderById(orderId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateOrderStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.orderId);
      const { status } = req.body;

      if (!status || !status.trim()) {
        res.status(400).json({ success: false, error: 'Order status is required.' });
        return;
      }

      const updated = await adminService.updateOrderStatus(orderId, status);

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}.`,
        data: updated,
      });
    } catch (error: any) {
      if (
        error.message?.includes('Invalid status transition') ||
        error.message?.includes('Cannot update status') ||
        error.message?.includes('Cannot change status') ||
        error.message?.includes('Cannot cancel order') ||
        error.message?.includes('Unknown or invalid')
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  // ============================================================================
  // ADMIN DELIVERY BATCH MANAGEMENT HANDLERS
  // ============================================================================

  async getAllDeliveryBatches(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        hub: (req.query.hub || req.query.hubArea) as string | undefined,
        slot: (req.query.slot || req.query.deliverySlot) as string | undefined,
      };

      const batches = await adminService.getAllDeliveryBatches(filters);

      res.status(200).json({
        success: true,
        count: batches.length,
        data: batches,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeliveryBatchById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const batchId = String(req.params.batchId);
      const batch = await adminService.getDeliveryBatchById(batchId);

      res.status(200).json({
        success: true,
        data: batch,
      });
    } catch (error: any) {
      if (error.message?.includes('not found') || error.status === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateDeliveryBatchStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const batchId = String(req.params.batchId);
      const { status } = req.body;

      if (!status || !status.trim()) {
        res.status(400).json({ success: false, error: 'Delivery batch status is required.' });
        return;
      }

      const updated = await adminService.updateDeliveryBatchStatus(batchId, status);

      res.status(200).json({
        success: true,
        message: `Delivery batch status updated to "${updated.status}".`,
        data: updated,
      });
    } catch (error: any) {
      if (
        error.message?.includes('Invalid status transition') ||
        error.message?.includes('Cannot change status') ||
        error.message?.includes('terminal state') ||
        error.message?.includes('Invalid delivery batch status')
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('not found') || error.status === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  // ============================================================================
  // ADMIN DISPUTE MANAGEMENT CONTROLLERS
  // ============================================================================

  async getAllDisputes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, q, startDate, endDate, limit, page } = req.query;

      const result = await adminService.getAllDisputes({
        status: status as string | undefined,
        search: (search || q) as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDisputeById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const disputeId = Array.isArray(req.params.disputeId) ? req.params.disputeId[0] : req.params.disputeId;
      if (!disputeId) {
        res.status(400).json({ success: false, error: 'Dispute ID is required.' });
        return;
      }

      const result = await adminService.getDisputeById(disputeId);
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message?.includes('not found') || error.status === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateDisputeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const disputeId = Array.isArray(req.params.disputeId) ? req.params.disputeId[0] : req.params.disputeId;
      const { status, resolution, resolutionNote, notes } = req.body || {};

      if (!disputeId) {
        res.status(400).json({ success: false, error: 'Dispute ID is required.' });
        return;
      }

      if (!status || !status.trim()) {
        res.status(400).json({ success: false, error: 'Dispute status is required.' });
        return;
      }

      const result = await adminService.updateDisputeStatus(disputeId, {
        status,
        resolution,
        resolutionNote,
        notes,
      });

      res.status(200).json(result);
    } catch (error: any) {
      if (
        error.message?.includes('Invalid dispute status') ||
        error.message?.includes('Resolution description is required') ||
        error.message?.includes('Rejection reason/notes are required') ||
        error.message?.includes('Cannot change status') ||
        error.status === 400
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('not found') || error.status === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async resolveDispute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const disputeId = Array.isArray(req.params.disputeId) ? req.params.disputeId[0] : req.params.disputeId;
      const { resolution, resolutionNote, notes } = req.body || {};
      if (!disputeId) {
        res.status(400).json({ success: false, error: 'Dispute ID is required.' });
        return;
      }
      const resolutionText = (resolution || resolutionNote || notes || '').trim();
      if (!resolutionText) {
        res.status(400).json({ success: false, error: 'Resolution description is required when resolving a dispute.' });
        return;
      }
      const result = await adminService.updateDisputeStatus(disputeId, {
        status: 'RESOLVED',
        resolution: resolutionText,
      });
      res.status(200).json(result);
    } catch (error: any) {
      if (
        error.message?.includes('Invalid dispute status') ||
        error.message?.includes('Resolution description is required') ||
        error.message?.includes('Cannot change status') ||
        error.status === 400
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('not found') || error.status === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async rejectDispute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const disputeId = Array.isArray(req.params.disputeId) ? req.params.disputeId[0] : req.params.disputeId;
      const { resolution, resolutionNote, reason, notes } = req.body || {};
      if (!disputeId) {
        res.status(400).json({ success: false, error: 'Dispute ID is required.' });
        return;
      }
      const rejectionText = (resolution || resolutionNote || reason || notes || '').trim();
      if (!rejectionText) {
        res.status(400).json({ success: false, error: 'Rejection reason/notes are required when rejecting a dispute.' });
        return;
      }
      const result = await adminService.updateDisputeStatus(disputeId, {
        status: 'REJECTED',
        resolution: rejectionText,
      });
      res.status(200).json(result);
    } catch (error: any) {
      if (
        error.message?.includes('Invalid dispute status') ||
        error.message?.includes('Rejection reason/notes are required') ||
        error.message?.includes('Cannot change status') ||
        error.status === 400
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('not found') || error.status === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  // ============================================================================
  // ADMIN REVIEW MANAGEMENT CONTROLLERS
  // ============================================================================

  async getAllReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, rating, farmerId, productId, page, limit } = req.query;
      const result = await adminService.getAllReviews({
        search: typeof search === 'string' ? search : undefined,
        rating: rating ? Number(rating) : undefined,
        farmerId: typeof farmerId === 'string' ? farmerId : undefined,
        productId: typeof productId === 'string' ? productId : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const timeRange = typeof req.query.timeRange === 'string' ? req.query.timeRange : '6M';
      const result = await adminService.getDashboardData(timeRange);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAnalyticsData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const timeRange = typeof req.query.timeRange === 'string' ? req.query.timeRange : '6M';
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : (typeof req.query.customStart === 'string' ? req.query.customStart : undefined);
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : (typeof req.query.customEnd === 'string' ? req.query.customEnd : undefined);
      const result = await adminService.getAnalyticsData(timeRange, startDate, endDate);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // USER MANAGEMENT (Strictly ADMIN Role)
  // ============================================================================

  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = {
        search: req.query.search as string | undefined,
        role: req.query.role as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      };

      const result = await adminService.getAllUsers(options);

      res.status(200).json({
        success: true,
        data: result.users,
        users: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const user = await adminService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params.userId);
      const adminUserId = req.user!.id;

      let activeVal: boolean | undefined = undefined;
      if (typeof req.body.isActive === 'boolean') {
        activeVal = req.body.isActive;
      } else if (typeof req.body.status === 'string') {
        if (req.body.status.toLowerCase() === 'active') activeVal = true;
        else if (req.body.status.toLowerCase() === 'inactive') activeVal = false;
      }

      if (typeof activeVal !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'Field "isActive" (boolean) or "status" ("active" | "inactive") is required in the request body.',
        });
        return;
      }

      const updatedUser = await adminService.updateUserStatus(adminUserId, userId, activeVal);

      res.status(200).json({
        success: true,
        message: `User account has been ${activeVal ? 'activated' : 'deactivated'} successfully.`,
        data: updatedUser,
      });
    } catch (error: any) {
      if (error.message?.includes('Self-protection') || error.message?.includes('Administrators cannot deactivate')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}

export const adminController = new AdminController();
