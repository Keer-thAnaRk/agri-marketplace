"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = exports.CartController = void 0;
const cart_service_1 = require("../services/cart.service");
class CartController {
    /**
     * GET /api/consumer/cart
     * Retrieves authenticated consumer's cart.
     */
    async getCart(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const cart = await cart_service_1.cartService.getCart(userId);
            res.status(200).json({
                success: true,
                data: cart,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/consumer/cart
     * Adds product to cart or increments quantity.
     */
    async addToCart(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const { productId, quantity } = req.body;
            const targetQuantity = quantity !== undefined && quantity !== null ? quantity : 1;
            const result = await cart_service_1.cartService.addToCart(userId, productId, targetQuantity);
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.cartItem,
            });
        }
        catch (error) {
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
    async updateCartItemQuantity(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const productId = req.params.productId;
            const { quantity } = req.body;
            const result = await cart_service_1.cartService.updateCartItemQuantity(userId, productId, quantity);
            res.status(200).json({
                success: true,
                message: result.message,
                data: result.cartItem,
            });
        }
        catch (error) {
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
    async removeFromCart(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const productId = req.params.productId;
            const result = await cart_service_1.cartService.removeFromCart(userId, productId);
            res.status(200).json(result);
        }
        catch (error) {
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
    async clearCart(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const result = await cart_service_1.cartService.clearCart(userId);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.status) {
                res.status(error.status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
}
exports.CartController = CartController;
exports.cartController = new CartController();
//# sourceMappingURL=cart.controller.js.map