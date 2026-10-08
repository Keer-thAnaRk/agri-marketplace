"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All consumer order routes require authentication
router.use(auth_1.requireAuth);
// POST /api/orders - Place a new order
router.post('/', (req, res, next) => {
    order_controller_1.orderController.createOrder(req, res, next);
});
// GET /api/orders - View consumer's order history
router.get('/', (req, res, next) => {
    order_controller_1.orderController.getConsumerOrders(req, res, next);
});
// GET /api/orders/:orderId - View specific consumer order details
router.get('/:orderId', (req, res, next) => {
    order_controller_1.orderController.getConsumerOrderById(req, res, next);
});
// POST /api/orders/:orderId/cancel - Cancel consumer order
router.post('/:orderId/cancel', (req, res, next) => {
    order_controller_1.orderController.cancelConsumerOrder(req, res, next);
});
exports.orderRoutes = router;
//# sourceMappingURL=order.routes.js.map