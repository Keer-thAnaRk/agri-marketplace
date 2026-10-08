import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { harvestService } from '../services/harvest.service';

export class HarvestController {
  /**
   * GET /api/farmer/harvests
   * Returns harvest batches belonging ONLY to the authenticated farmer.
   */
  async getFarmerHarvests(
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

      const harvests = await harvestService.getFarmerHarvests(farmerId);

      res.status(200).json({
        success: true,
        count: harvests.length,
        data: harvests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/farmer/harvests/:id or /api/farmer/harvests/:batchId
   * Returns a single harvest batch for the authenticated farmer.
   */
  async getFarmerHarvestById(
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

      const harvestId = (req.params.batchId || req.params.id) as string;
      const harvest = await harvestService.getFarmerHarvestById(farmerId, harvestId);

      res.status(200).json({
        success: true,
        data: harvest,
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
   * GET /api/farmer/harvests/:batchId/traceability
   * Returns traceability events for a batch owned by the authenticated farmer.
   */
  async getTraceabilityEvents(
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

      const batchId = (req.params.batchId || req.params.id) as string;
      const events = await harvestService.getTraceabilityEvents(farmerId, batchId);

      res.status(200).json({
        success: true,
        count: events.length,
        data: events,
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
   * POST /api/farmer/harvests
   * Records a fresh morning harvest batch for an approved farmer.
   */
  async createHarvest(
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

      // Ignore client provided farmerId
      const { farmerId: _ignored, ...harvestData } = req.body;

      const created = await harvestService.createHarvest(farmerId, harvestData);

      res.status(201).json({
        success: true,
        message: 'Harvest batch recorded and QR traceability generated successfully.',
        data: created,
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
   * POST /api/farmer/harvests/:batchId/traceability
   * POST /api/farmer/harvests/:id/events
   * Adds a traceability event to a harvest batch.
   */
  async addTraceabilityEvent(
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

      const batchId = (req.params.batchId || req.params.id) as string;
      const event = await harvestService.addTraceabilityEvent(
        farmerId,
        batchId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Traceability event added successfully.',
        data: event,
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
   * GET /api/trace/:batchId
   * Public traceability endpoint scannable by consumers via QR code.
   */
  async getPublicTrace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batchId = req.params.batchId as string;
      const trace = await harvestService.getPublicTrace(batchId);

      res.status(200).json({
        success: true,
        data: trace,
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

export const harvestController = new HarvestController();
