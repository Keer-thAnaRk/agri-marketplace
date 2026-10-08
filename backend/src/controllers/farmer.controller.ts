import { Response, NextFunction } from 'express';
import { farmerService } from '../services/farmer.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export class FarmerController {
  async getFarmerStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const status = await farmerService.getFarmerStatus(userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      if (error.message.includes('No farmer profile found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getFarmerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.params.farmerId ? String(req.params.farmerId) : undefined;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === UserRole.ADMIN;

      let profile;
      if (farmerId) {
        profile = await farmerService.getFarmerProfile(farmerId, userId, isAdmin);
      } else {
        profile = await farmerService.getFarmerProfileByUserId(userId);
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message.includes('Access denied')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async updateFarmerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      // Check role
      if (req.user.role !== UserRole.FARMER) {
        res.status(403).json({
          success: false,
          error: 'Access denied: Must be an authenticated farmer.',
        });
        return;
      }

      // Cross-tenant protection: prevent passing another farmer's ID in params or body
      if (req.params.farmerId && req.user.farmerId && req.params.farmerId !== req.user.farmerId) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You cannot modify another farmer’s profile.',
        });
        return;
      }

      if (req.body.farmerId && req.user.farmerId && req.body.farmerId !== req.user.farmerId) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You cannot modify another farmer’s profile.',
        });
        return;
      }

      if (req.body.userId && req.body.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You cannot modify another farmer’s profile.',
        });
        return;
      }

      const updated = await farmerService.updateFarmerProfile(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Farmer profile updated successfully',
        data: updated,
      });
    } catch (error: any) {
      const msg = error.message || '';
      if (
        msg.includes('cannot be empty') ||
        msg.includes('Invalid pincode') ||
        msg.includes('non-negative') ||
        msg.includes('must be')
      ) {
        res.status(400).json({ success: false, error: msg });
        return;
      }

      if (msg.includes('No farmer profile found') || msg.includes('not found')) {
        res.status(404).json({ success: false, error: msg });
        return;
      }

      if (msg.includes('Access denied')) {
        res.status(403).json({ success: false, error: msg });
        return;
      }

      next(error);
    }
  }

  /**
   * GET /api/farmer/dashboard
   * Returns aggregated dashboard data for the authenticated approved farmer.
   */
  async getFarmerDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.user?.farmerId;
      if (!farmerId) {
        res.status(403).json({
          success: false,
          error: 'Access denied: Must be an authenticated farmer.',
        });
        return;
      }

      const dashboard = await farmerService.getFarmerDashboard(farmerId);

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}

export const farmerController = new FarmerController();
