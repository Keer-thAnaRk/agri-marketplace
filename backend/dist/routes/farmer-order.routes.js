"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerOrderRoutes = void 0;
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All farmer order routes require authenticated and APPROVED farmer
router.use(auth_1.requireAuth);
router.use((0, auth_1.requireRole)(client_1.UserRole.FARMER));
router.use(auth_1.requireApprovedFarmer);
// GET /api/farmer/orders - List farmer's orders
router.get('/', (req, res, next) => {
    order_controller_1.orderController.getFarmerOrders(req, res, next);
});
// GET /api/farmer/orders/:orderId - View specific farmer order details
router.get('/:orderId', (req, res, next) => {
    order_controller_1.orderController.getFarmerOrderById(req, res, next);
});
// PATCH /api/farmer/orders/:orderId/status - Update farmer order workflow status
router.patch('/:orderId/status', (req, res, next) => {
    order_controller_1.orderController.updateFarmerOrderStatus(req, res, next);
});
exports.farmerOrderRoutes = router;
//# sourceMappingURL=farmer-order.routes.js.map