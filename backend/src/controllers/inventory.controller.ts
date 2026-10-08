import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';

export class InventoryController {
  /**
   * GET /api/farmer/inventory
   * Returns inventory belonging ONLY to the authenticated farmer.
   */
  async getFarmerInventory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const farmerId = req.user?.farmerId;
      if (!farmerId) {
        res.status(403).json({
          success: false,
          error: 'Access denied: Must be an authenticated farmer.',
        });
        return;
      }

      const items = await inventoryService.getFarmerInventory(farmerId);

      res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/farmer/inventory/:productId
   * Returns inventory for the authenticated farmer's product.
   */
  async getInventoryByProductId(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const farmerId = req.user?.farmerId;
      if (!farmerId) {
        res.status(403).json({
          success: false,
          error: 'Access denied: Must be an authenticated farmer.',
        });
        return;
      }

      const productId = req.params.productId as string;
      const item = await inventoryService.getInventoryByProductId(farmerId, productId);

      res.status(200).json({
        success: true,
        data: item,
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
   * PATCH /api/farmer/inventory/:productId
   * Updates inventory stock level for the authenticated, approved farmer.
   */
  async updateStock(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const farmerId = req.user?.farmerId;
      if (!farmerId) {
        res.status(403).json({
          success: false,
          error: 'Access denied: Must be an authenticated farmer.',
        });
        return;
      }

      const productId = req.params.productId as string;
      const updatedItem = await inventoryService.updateStock(
        farmerId,
        productId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Inventory stock level updated successfully.',
        data: updatedItem,
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

export const inventoryController = new InventoryController();
