import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { surplusService } from '../services/surplus.service';

export class SurplusController {
  /**
   * GET /api/surplus (Public / Consumer Marketplace)
   */
  async getPublicSurplusOffers(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { category, search, minDiscount, sortBy, page, limit } = req.query;

      const result = await surplusService.getPublicSurplusOffers({
        category: typeof category === 'string' ? category : undefined,
        search: typeof search === 'string' ? search : undefined,
        minDiscount: typeof minDiscount === 'string' ? minDiscount : undefined,
        sortBy: typeof sortBy === 'string' ? sortBy : undefined,
        page: typeof page === 'string' ? page : undefined,
        limit: typeof limit === 'string' ? limit : undefined,
      });

      res.status(200).json({
        success: true,
        count: result.offers.length,
        data: result.offers,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/surplus/:id (Public / Consumer single offer)
   */
  async getPublicSurplusOfferById(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const offerId = req.params.id as string;
      const offer = await surplusService.getPublicSurplusOfferById(offerId);

      res.status(200).json({
        success: true,
        data: offer,
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
   * GET /api/farmer/surplus
   * Return surplus offers belonging ONLY to the authenticated farmer.
   */
  async getFarmerSurplusOffers(
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

      const offers = await surplusService.getFarmerSurplusOffers(farmerId);

      res.status(200).json({
        success: true,
        count: offers.length,
        data: offers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/farmer/surplus/:id
   * Return a single surplus offer for the authenticated farmer.
   */
  async getFarmerSurplusOfferById(
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

      const offerId = req.params.id as string;
      const offer = await surplusService.getFarmerSurplusOfferById(farmerId, offerId);

      res.status(200).json({
        success: true,
        data: offer,
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
   * POST /api/farmer/surplus
   * Create a surplus flash discount offer (APPROVED farmers ONLY).
   */
  async createSurplusOffer(
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

      // Ignore any farmerId or offerPrice sent in client payload
      const { farmerId: _ignoredFarmerId, offerPrice: _ignoredPrice, ...payload } = req.body;

      const created = await surplusService.createSurplusOffer(farmerId, payload);

      res.status(201).json({
        success: true,
        message: 'Surplus flash offer published successfully.',
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
   * PATCH /api/farmer/surplus/:id
   * Modify an active surplus offer (APPROVED farmers ONLY).
   */
  async updateSurplusOffer(
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

      const offerId = req.params.id as string;
      const { farmerId: _ignored, offerPrice: _ignoredPrice, ...payload } = req.body;

      const updated = await surplusService.updateSurplusOffer(farmerId, offerId, payload);

      res.status(200).json({
        success: true,
        message: 'Surplus offer updated successfully.',
        data: updated,
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
   * DELETE /api/farmer/surplus/:id
   * Cancel an active surplus offer (APPROVED farmers ONLY).
   */
  async cancelSurplusOffer(
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

      const offerId = req.params.id as string;
      const cancelled = await surplusService.cancelSurplusOffer(farmerId, offerId);

      res.status(200).json({
        success: true,
        message: 'Surplus offer cancelled successfully.',
        data: cancelled,
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

export const surplusController = new SurplusController();
