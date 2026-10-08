"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const product_controller_1 = require("../controllers/product.controller");
const router = (0, express_1.Router)();
// All farmer product routes require authenticated, APPROVED farmer
router.use(auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER), auth_1.requireApprovedFarmer);
// GET /api/farmer/products - List all products for the authenticated farmer
router.get('/', (req, res, next) => {
    product_controller_1.productController.getFarmerProducts(req, res, next);
});
// GET /api/farmer/products/:id - Get specific product for the authenticated farmer
router.get('/:id', (req, res, next) => {
    product_controller_1.productController.getFarmerProductById(req, res, next);
});
// POST /api/farmer/products - Create a new product (APPROVED farmers ONLY)
router.post('/', (req, res, next) => {
    product_controller_1.productController.createProduct(req, res, next);
});
// PATCH /api/farmer/products/:id - Edit an existing product (APPROVED farmers ONLY)
router.patch('/:id', (req, res, next) => {
    product_controller_1.productController.updateProduct(req, res, next);
});
// DELETE /api/farmer/products/:id - Delete or archive a product (APPROVED farmers ONLY)
router.delete('/:id', (req, res, next) => {
    product_controller_1.productController.deleteProduct(req, res, next);
});
exports.productRoutes = router;
//# sourceMappingURL=product.routes.js.map