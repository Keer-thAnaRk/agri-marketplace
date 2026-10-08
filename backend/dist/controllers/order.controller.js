"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
class OrderController {
    /**
     * POST /api/orders
     * Authenticated consumer creates a new order.
     */
    async createOrder(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ success: false, error: 'Authentication required to place an order.' });
                return;
            }
            if (req.user.role === 'FARMER') {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Farmer accounts cannot place consumer orders. Please use a Consumer account.',
                });
                return;
            }
            const consumerId = req.user.id;
            // Extract client payload; NEVER trust client-supplied consumerId, prices, or totals!
            const { items, addressId, deliveryAddress, deliverySlot, paymentMethod, paymentStatus } = req.body;
            const order = await order_service_1.orderService.createOrder(consumerId, {
                items,
                addressId,
                deliveryAddress,
                deliverySlot,
                paymentMethod,
                paymentStatus,
            });
            res.status(201).json({
                success: true,
                message: 'Order created successfully and inventory reserved.',
                data: order,
            });
        }
        catch (error) {
            const status = error.status || 400;
            if (status === 400 ||
                status === 403 ||
                status === 404 ||
                error.message?.includes('Insufficient inventory') ||
                error.message?.includes('not found') ||
                error.message?.includes('inactive') ||
                error.message?.includes('positive number') ||
                error.message?.includes('valid productId') ||
                error.message?.includes('at least one item') ||
                error.message?.includes('Access denied')) {
                res.status(status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    /**
     * GET /api/orders
     * Authenticated consumer views their own order history with filtering & pagination.
     */
    async getConsumerOrders(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const search = typeof req.query.search === 'string' ? req.query.search : undefined;
            const result = await order_service_1.orderService.getConsumerOrders(req.user.id, {
                page,
                limit,
                status,
                search,
            });
            res.status(200).json({
                success: true,
                count: result.orders.length,
                data: result.orders,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/orders/:orderId/cancel
     * Authenticated consumer cancels an eligible order (PLACED or CONFIRMED).
     */
    async cancelConsumerOrder(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
            const { reason } = req.body || {};
            const isAdmin = req.user.role === 'ADMIN';
            const cancelledOrder = await order_service_1.orderService.cancelConsumerOrder(req.user.id, orderId, reason, isAdmin);
            res.status(200).json({
                success: true,
                message: `Order #${cancelledOrder.orderNumber} has been cancelled successfully and reserved inventory was restored.`,
                data: cancelledOrder,
            });
        }
        catch (error) {
            const status = error.status || 400;
            if (status === 400 ||
                status === 403 ||
                status === 404 ||
                error.message?.includes('cannot be cancelled') ||
                error.message?.includes('already cancelled') ||
                error.message?.includes('not found') ||
                error.message?.includes('Access denied')) {
                res.status(status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    /**
     * GET /api/orders/:orderId
     * Authenticated consumer views a single order by ID or orderNumber.
     */
    async getConsumerOrderById(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
            const isAdmin = req.user.role === 'ADMIN';
            const order = await order_service_1.orderService.getConsumerOrderById(req.user.id, orderId, isAdmin);
            if (!order) {
                res.status(404).json({
                    success: false,
                    error: `Order "${orderId}" not found or access denied.`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/farmer/orders
     * Authenticated farmer views incoming orders containing their products.
     */
    async getFarmerOrders(req, res, next) {
        try {
            if (!req.user || !req.user.farmerId) {
                res.status(403).json({ success: false, error: 'Access denied: Must be an authenticated farmer.' });
                return;
            }
            const orders = await order_service_1.orderService.getFarmerOrders(req.user.farmerId);
            res.status(200).json({
                success: true,
                count: orders.length,
                data: orders,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/farmer/orders/:orderId
     * Authenticated farmer views details of an order (scoped only to their products).
     */
    async getFarmerOrderById(req, res, next) {
        try {
            if (!req.user || !req.user.farmerId) {
                res.status(403).json({ success: false, error: 'Access denied: Must be an authenticated farmer.' });
                return;
            }
            const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
            const order = await order_service_1.orderService.getFarmerOrderById(req.user.farmerId, orderId);
            if (!order) {
                res.status(404).json({
                    success: false,
                    error: `Order "${orderId}" not found or does not contain items from your farm.`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: order,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/farmer/orders/:orderId/status
     * Authenticated approved farmer updates order status.
     */
    async updateFarmerOrderStatus(req, res, next) {
        try {
            if (!req.user || !req.user.farmerId) {
                res.status(403).json({ success: false, error: 'Access denied: Must be an authenticated farmer.' });
                return;
            }
            const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
            const { status } = req.body;
            if (!status) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required field: status is required.',
                });
                return;
            }
            const updated = await order_service_1.orderService.updateFarmerOrderStatus(req.user.farmerId, orderId, status);
            res.status(200).json({
                success: true,
                message: `Order status updated to ${status}.`,
                data: updated,
            });
        }
        catch (error) {
            if (error.message?.includes('Invalid status transition') ||
                error.message?.includes('Cannot update status') ||
                error.message?.includes('Cannot change status') ||
                error.message?.includes('Unknown or invalid')) {
                res.status(400).json({ success: false, error: error.message });
                return;
            }
            if (error.message?.includes('not found') || error.message?.includes('Access denied')) {
                res.status(404).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
}
exports.OrderController = OrderController;
exports.orderController = new OrderController();
//# sourceMappingURL=order.controller.js.map