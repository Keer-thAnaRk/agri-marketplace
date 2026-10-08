import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from '../services/marketplace.service';

export class MarketplaceController {
  /**
   * GET /api/products
   * Public marketplace product catalog with search, filtering, and sorting.
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        search,
        category,
        farmingMethod,
        isOrganic,
        minPrice,
        maxPrice,
        farmerId,
        inStock,
        sortBy,
        page,
        limit,
      } = req.query;

      const result = await marketplaceService.getProducts({
        search: search as string | undefined,
        category: category as string | undefined,
        farmingMethod: farmingMethod as string | undefined,
        isOrganic: isOrganic as string | boolean | undefined,
        minPrice: minPrice as string | number | undefined,
        maxPrice: maxPrice as string | number | undefined,
        farmerId: farmerId as string | undefined,
        inStock: inStock as string | boolean | undefined,
        sortBy: sortBy as string | undefined,
        page: page as string | number | undefined,
        limit: limit as string | number | undefined,
      });

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   * Public single product details with farmer info and harvest traceability.
   */
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id as string;
      const product = await marketplaceService.getProductById(productId);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/farmers
   * Public directory of verified, approved farmers.
   */
  async getFarmers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, farmingMethod, city, hub, page, limit } = req.query;

      const result = await marketplaceService.getFarmers({
        search: search as string | undefined,
        farmingMethod: farmingMethod as string | undefined,
        city: city as string | undefined,
        hub: hub as string | undefined,
        page: page as string | number | undefined,
        limit: limit as string | number | undefined,
      });

      res.status(200).json({
        success: true,
        data: result.farmers,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/farmers/:id
   * Public farmer profile with full farm bio and active produce list.
   */
  async getFarmerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.params.id as string;
      const farmer = await marketplaceService.getFarmerById(farmerId);

      res.status(200).json({
        success: true,
        data: farmer,
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
}

export const marketplaceController = new MarketplaceController();
