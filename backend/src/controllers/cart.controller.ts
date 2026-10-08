import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { cartService } from '../services/cart.service';

export class CartController {
  /**
   * GET /api/consumer/cart
   * Retrieves authenticated consumer's cart.
   */
  async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const cart = await cartService.getCart(userId);

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/consumer/cart
   * Adds product to cart or increments quantity.
   */
  async addToCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { productId, quantity } = req.body;
      const targetQuantity = quantity !== undefined && quantity !== null ? quantity : 1;

      const result = await cartService.addToCart(userId, productId, targetQuantity);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.cartItem,
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
   * PATCH /api/consumer/cart/:productId
   * Updates cart item quantity.
   */
  async updateCartItemQuantity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const productId = req.params.productId as string;
      const { quantity } = req.body;

      const result = await cartService.updateCartItemQuantity(userId, productId, quantity);

      res.status(200).json({
        success: true,
        message: result.message,
        data: (result as any).cartItem,
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
   * DELETE /api/consumer/cart/:productId
   * Removes specific product from cart.
   */
  async removeFromCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const productId = req.params.productId as string;

      const result = await cartService.removeFromCart(userId, productId);

      res.status(200).json(result);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/consumer/cart
   * Clears entire consumer cart.
   */
  async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const result = await cartService.clearCart(userId);

      res.status(200).json(result);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}

export const cartController = new CartController();
