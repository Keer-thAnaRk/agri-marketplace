import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { saleService } from '../services/sale.service';
import { SaleStatus } from '@prisma/client';

export class SaleController {
  /**
   * GET /api/farmer/sales
   * Returns sales belonging strictly to the authenticated farmer.
   */
  async getFarmerSales(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const farmerId = req.user?.farmerId;
      if (!farmerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Must be an authenticated farmer.',
        });
      }

      const { status, category, productName, startDate, endDate, limit, page } = req.query;

      const result = await saleService.getFarmerSales(farmerId, {
        status: status as string | undefined,
        category: category as string | undefined,
        productName: productName as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/farmer/sales/summary
   * Returns PostgreSQL-backed aggregated metrics for the authenticated farmer.
   */
  async getFarmerSalesSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const farmerId = req.user?.farmerId;
      if (!farmerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Must be an authenticated farmer.',
        });
      }

      const result = await saleService.getFarmerSalesSummary(farmerId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/sales/:saleId/payout
   * Admin-only: marks a sale as PAID_OUT with transactionReference and payoutDate.
   */
  async markSaleAsPaid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const saleId = Array.isArray(req.params.saleId) ? req.params.saleId[0] : req.params.saleId;
      const { transactionReference, payoutDate } = req.body || {};

      if (!saleId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: saleId.',
        });
      }

      const result = await saleService.markSaleAsPaid(saleId, {
        transactionReference,
        payoutDate,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/admin/sales
   * Admin-only: list all platform sales and payouts with search, filters, and metrics.
   */
  async getAdminSales(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, farmerId, category, search, q, startDate, endDate, limit, page } = req.query;

      const result = await saleService.getAdminSales({
        status: status as string | undefined,
        farmerId: farmerId as string | undefined,
        category: category as string | undefined,
        search: (search || q) as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/sales/:saleId
   * Admin-only: retrieve full details of a specific sale record by ID or saleCode.
   */
  async getSaleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const saleId = Array.isArray(req.params.saleId) ? req.params.saleId[0] : req.params.saleId;
      if (!saleId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: saleId.',
        });
      }

      const result = await saleService.getSaleById(saleId);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }
}

export const saleController = new SaleController();
