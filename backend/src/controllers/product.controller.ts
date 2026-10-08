import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { productService } from '../services/product.service';

export class ProductController {
  /**
   * GET /api/farmer/products
   * Returns products belonging ONLY to the authenticated farmer.
   */
  async getFarmerProducts(
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

      const products = await productService.getFarmerProducts(farmerId);

      res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/farmer/products/:id
   * Returns a single product only if it belongs to the authenticated farmer.
   */
  async getFarmerProductById(
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

      const productId = req.params.id as string;
      const product = await productService.getFarmerProductById(farmerId, productId);

      res.status(200).json({
        success: true,
        data: product,
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
   * POST /api/farmer/products
   * Creates a product for the authenticated farmer in PostgreSQL.
   * farmerId is derived strictly from the authenticated farmer's session token.
   */
  async createProduct(
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

      // Never trust farmerId sent in the request body
      const { farmerId: _ignored, ...productData } = req.body;

      const product = await productService.createProduct(farmerId, productData);

      res.status(201).json({
        success: true,
        message: 'Product listed and published successfully.',
        data: product,
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
   * PATCH /api/farmer/products/:id
   * Updates a product in PostgreSQL, ensuring only the owner can modify it.
   */
  async updateProduct(
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

      const productId = req.params.id as string;
      // Strip out any attempts to re-assign farmerId
      const { farmerId: _ignored, ...updateData } = req.body;

      const updatedProduct = await productService.updateProduct(
        farmerId,
        productId,
        updateData
      );

      res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        data: updatedProduct,
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
   * DELETE /api/farmer/products/:id
   * Deletes or deactivates a product owned by the authenticated farmer.
   */
  async deleteProduct(
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

      const productId = req.params.id as string;
      const result = await productService.deleteProduct(farmerId, productId);

      res.status(200).json({
        success: true,
        ...result,
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

export const productController = new ProductController();
