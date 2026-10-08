"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
class ProductController {
    /**
     * GET /api/farmer/products
     * Returns products belonging ONLY to the authenticated farmer.
     */
    async getFarmerProducts(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const products = await product_service_1.productService.getFarmerProducts(farmerId);
            res.status(200).json({
                success: true,
                count: products.length,
                data: products,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/farmer/products/:id
     * Returns a single product only if it belongs to the authenticated farmer.
     */
    async getFarmerProductById(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const productId = req.params.id;
            const product = await product_service_1.productService.getFarmerProductById(farmerId, productId);
            res.status(200).json({
                success: true,
                data: product,
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
     * POST /api/farmer/products
     * Creates a product for the authenticated farmer in PostgreSQL.
     * farmerId is derived strictly from the authenticated farmer's session token.
     */
    async createProduct(req, res, next) {
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
            const product = await product_service_1.productService.createProduct(farmerId, productData);
            res.status(201).json({
                success: true,
                message: 'Product listed and published successfully.',
                data: product,
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
     * PATCH /api/farmer/products/:id
     * Updates a product in PostgreSQL, ensuring only the owner can modify it.
     */
    async updateProduct(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const productId = req.params.id;
            // Strip out any attempts to re-assign farmerId
            const { farmerId: _ignored, ...updateData } = req.body;
            const updatedProduct = await product_service_1.productService.updateProduct(farmerId, productId, updateData);
            res.status(200).json({
                success: true,
                message: 'Product updated successfully.',
                data: updatedProduct,
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
     * DELETE /api/farmer/products/:id
     * Deletes or deactivates a product owned by the authenticated farmer.
     */
    async deleteProduct(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const productId = req.params.id;
            const result = await product_service_1.productService.deleteProduct(farmerId, productId);
            res.status(200).json({
                success: true,
                ...result,
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
}
exports.ProductController = ProductController;
exports.productController = new ProductController();
//# sourceMappingURL=product.controller.js.map