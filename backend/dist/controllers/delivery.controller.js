"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryController = exports.DeliveryController = void 0;
const delivery_service_1 = require("../services/delivery.service");
class DeliveryController {
    /**
     * POST /api/farmer/deliveries/batches
     */
    async createBatch(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({ success: false, error: 'Must be an authenticated farmer profile.' });
                return;
            }
            const batch = await delivery_service_1.deliveryService.createDeliveryBatch(farmerId, req.body);
            res.status(201).json({
                success: true,
                data: batch,
                message: `Delivery batch #${batch.batchCode} created successfully.`,
            });
        }
        catch (error) {
            const status = error.status || 400;
            res.status(status).json({ success: false, error: error.message || 'Failed to create delivery batch.' });
        }
    }
    /**
     * POST /api/farmer/deliveries/batches/:batchId/orders
     */
    async assignOrders(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({ success: false, error: 'Must be an authenticated farmer profile.' });
                return;
            }
            const batchId = Array.isArray(req.params.batchId) ? req.params.batchId[0] : req.params.batchId;
            const orderIds = req.body.orderIds || (req.body.orderId ? [req.body.orderId] : []);
            const batch = await delivery_service_1.deliveryService.assignOrdersToBatch(farmerId, batchId, orderIds);
            res.status(200).json({
                success: true,
                data: batch,
                message: `Orders assigned to delivery batch #${batch.batchCode} successfully.`,
            });
        }
        catch (error) {
            const status = error.status || 400;
            res.status(status).json({ success: false, error: error.message || 'Failed to assign orders to batch.' });
        }
    }
    /**
     * POST /api/farmer/deliveries/batches/auto-create
     */
    async autoCreateBatches(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({ success: false, error: 'Must be an authenticated farmer profile.' });
                return;
            }
            const result = await delivery_service_1.deliveryService.autoCreateDeliveryBatches(farmerId);
            res.status(result.count > 0 ? 201 : 200).json(result);
        }
        catch (error) {
            const status = error.status || 400;
            res.status(status).json({ success: false, error: error.message || 'Failed to auto-create delivery batches.' });
        }
    }
    /**
     * GET /api/farmer/deliveries/batches
     */
    async getBatches(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({ success: false, error: 'Must be an authenticated farmer profile.' });
                return;
            }
            const result = await delivery_service_1.deliveryService.getFarmerDeliveryBatches(farmerId);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error.status || 400;
            res.status(status).json({ success: false, error: error.message || 'Failed to fetch delivery batches.' });
        }
    }
    /**
     * GET /api/farmer/deliveries/batches/:batchId
     */
    async getBatchById(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({ success: false, error: 'Must be an authenticated farmer profile.' });
                return;
            }
            const batchId = Array.isArray(req.params.batchId) ? req.params.batchId[0] : req.params.batchId;
            const batch = await delivery_service_1.deliveryService.getFarmerDeliveryBatchById(farmerId, batchId);
            res.status(200).json({ success: true, data: batch });
        }
        catch (error) {
            const status = error.status || 400;
            res.status(status).json({ success: false, error: error.message || 'Failed to fetch delivery batch details.' });
        }
    }
    /**
     * PATCH /api/farmer/deliveries/batches/:batchId/status
     */
    async updateBatchStatus(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({ success: false, error: 'Must be an authenticated farmer profile.' });
                return;
            }
            const batchId = Array.isArray(req.params.batchId) ? req.params.batchId[0] : req.params.batchId;
            const { status } = req.body;
            if (!status) {
                res.status(400).json({ success: false, error: 'Target status must be provided.' });
                return;
            }
            const batch = await delivery_service_1.deliveryService.updateDeliveryBatchStatus(farmerId, batchId, status);
            res.status(200).json({
                success: true,
                data: batch,
                message: `Delivery batch status updated to "${batch.status}".`,
            });
        }
        catch (error) {
            const status = error.status || 400;
            res.status(status).json({ success: false, error: error.message || 'Failed to update delivery batch status.' });
        }
    }
}
exports.DeliveryController = DeliveryController;
exports.deliveryController = new DeliveryController();
//# sourceMappingURL=delivery.controller.js.map