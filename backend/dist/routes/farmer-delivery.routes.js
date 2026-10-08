"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerDeliveryRoutes = void 0;
const express_1 = require("express");
const delivery_controller_1 = require("../controllers/delivery.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All farmer delivery routes require an approved farmer profile (401 unauthenticated, 403 pending/rejected)
router.use(auth_1.requireAuth, auth_1.requireApprovedFarmer);
// POST /api/farmer/deliveries/batches - Create a delivery batch
router.post('/batches', (req, res, next) => {
    delivery_controller_1.deliveryController.createBatch(req, res, next);
});
// POST /api/farmer/deliveries/batches/:batchId/orders - Assign eligible orders to batch
router.post('/batches/:batchId/orders', (req, res, next) => {
    delivery_controller_1.deliveryController.assignOrders(req, res, next);
});
// POST /api/farmer/deliveries/batches/auto-create - Hyperlocal automatic batching
router.post('/batches/auto-create', (req, res, next) => {
    delivery_controller_1.deliveryController.autoCreateBatches(req, res, next);
});
// GET /api/farmer/deliveries/batches - Get all delivery batches for authenticated farmer
router.get('/batches', (req, res, next) => {
    delivery_controller_1.deliveryController.getBatches(req, res, next);
});
// GET /api/farmer/deliveries/batches/:batchId - Get single batch details
router.get('/batches/:batchId', (req, res, next) => {
    delivery_controller_1.deliveryController.getBatchById(req, res, next);
});
// PATCH /api/farmer/deliveries/batches/:batchId/status - Update batch status and synchronize orders
router.patch('/batches/:batchId/status', (req, res, next) => {
    delivery_controller_1.deliveryController.updateBatchStatus(req, res, next);
});
exports.farmerDeliveryRoutes = router;
//# sourceMappingURL=farmer-delivery.routes.js.map