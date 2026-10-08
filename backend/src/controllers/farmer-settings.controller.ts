import { Response, NextFunction } from 'express';
import { farmerSettingsService } from '../services/farmer-settings.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class FarmerSettingsController {
  /**
   * GET /api/farmer/settings
   * Returns settings and preferences for authenticated farmer.
   */
  async getFarmerSettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await farmerSettingsService.getFarmerSettings(userId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * PATCH /api/farmer/settings
   * Updates settings and preferences for authenticated farmer.
   */
  async updateFarmerSettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = await farmerSettingsService.updateFarmerSettings(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully.',
        data,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      const msg = error.message || '';
      if (msg.includes('Name cannot be empty') || msg.includes('cannot be empty')) {
        res.status(400).json({ success: false, error: msg });
        return;
      }
      if (msg.includes('Modification of protected field')) {
        res.status(403).json({ success: false, error: msg });
        return;
      }
      next(error);
    }
  }

  /**
   * PATCH /api/farmer/settings/password
   * Changes password for authenticated farmer.
   */
  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await farmerSettingsService.changePassword(userId, req.body);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      const msg = error.message || '';
      if (
        msg.includes('Current password is required') ||
        msg.includes('New password is required') ||
        msg.includes('Incorrect current password') ||
        msg.includes('at least 6 characters') ||
        msg.includes('cannot be identical')
      ) {
        res.status(400).json({ success: false, error: msg });
        return;
      }
      next(error);
    }
  }
}

export const farmerSettingsController = new FarmerSettingsController();
