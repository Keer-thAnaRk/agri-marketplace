"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const sale_controller_1 = require("../controllers/sale.controller");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All admin routes strictly require ADMIN role
router.use(auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.ADMIN));
// GET /api/admin/farmers - List all farmers (optional ?status=pending|approved|rejected)
router.get('/farmers', (req, res, next) => {
    admin_controller_1.adminController.getAllFarmers(req, res, next);
});
// GET /api/admin/farmers/pending - List all pending farmer applications
router.get('/farmers/pending', (req, res, next) => {
    admin_controller_1.adminController.getPendingFarmers(req, res, next);
});
// GET /api/admin/farmers/:farmerId - View specific farmer application and submitted documents
router.get('/farmers/:farmerId', (req, res, next) => {
    admin_controller_1.adminController.getFarmerById(req, res, next);
});
// POST /api/admin/farmers/:farmerId/approve - Approve a farmer application
router.post('/farmers/:farmerId/approve', (req, res, next) => {
    admin_controller_1.adminController.approveFarmer(req, res, next);
});
router.patch('/farmers/:farmerId/approve', (req, res, next) => {
    admin_controller_1.adminController.approveFarmer(req, res, next);
});
// POST /api/admin/farmers/:farmerId/reject - Reject a farmer application with a reason
router.post('/farmers/:farmerId/reject', (req, res, next) => {
    admin_controller_1.adminController.rejectFarmer(req, res, next);
});
router.patch('/farmers/:farmerId/reject', (req, res, next) => {
    admin_controller_1.adminController.rejectFarmer(req, res, next);
});
// ============================================================================
// ADMIN SALES & PAYOUTS ROUTES (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/sales - View platform sales and pending payouts with search and filters
router.get('/sales', (req, res, next) => {
    sale_controller_1.saleController.getAdminSales(req, res, next);
});
router.get('/payouts', (req, res, next) => {
    sale_controller_1.saleController.getAdminSales(req, res, next);
});
// GET /api/admin/sales/:saleId - View details of a specific sale record
router.get('/sales/:saleId', (req, res, next) => {
    sale_controller_1.saleController.getSaleById(req, res, next);
});
router.get('/payouts/:saleId', (req, res, next) => {
    sale_controller_1.saleController.getSaleById(req, res, next);
});
// PATCH /api/admin/sales/:saleId/payout - Mark a sale as PAID_OUT
router.patch('/sales/:saleId/payout', (req, res, next) => {
    sale_controller_1.saleController.markSaleAsPaid(req, res, next);
});
router.patch('/sales/:saleId', (req, res, next) => {
    sale_controller_1.saleController.markSaleAsPaid(req, res, next);
});
router.patch('/payouts/:saleId/payout', (req, res, next) => {
    sale_controller_1.saleController.markSaleAsPaid(req, res, next);
});
router.patch('/payouts/:saleId', (req, res, next) => {
    sale_controller_1.saleController.markSaleAsPaid(req, res, next);
});
// ============================================================================
// ADMIN PRODUCT MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/products - List all products across farmers with search and filters
router.get('/products', (req, res, next) => {
    admin_controller_1.adminController.getAllProducts(req, res, next);
});
// GET /api/admin/products/:productId - View specific product with farmer, inventory, and traceability
router.get('/products/:productId', (req, res, next) => {
    admin_controller_1.adminController.getProductById(req, res, next);
});
// PATCH /api/admin/products/:productId/status - Toggle or update product status
router.patch('/products/:productId/status', (req, res, next) => {
    admin_controller_1.adminController.updateProductStatus(req, res, next);
});
router.patch('/products/:productId', (req, res, next) => {
    admin_controller_1.adminController.updateProductStatus(req, res, next);
});
// ============================================================================
// ADMIN ORDER MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/orders - List all orders across consumers and farmers with search & filters
router.get('/orders', (req, res, next) => {
    admin_controller_1.adminController.getAllOrders(req, res, next);
});
// GET /api/admin/orders/:orderId - View specific order with items, customer, batch, timeline
router.get('/orders/:orderId', (req, res, next) => {
    admin_controller_1.adminController.getOrderById(req, res, next);
});
// PATCH /api/admin/orders/:orderId/status - Update order workflow progression
router.patch('/orders/:orderId/status', (req, res, next) => {
    admin_controller_1.adminController.updateOrderStatus(req, res, next);
});
// ============================================================================
// ADMIN DELIVERY BATCH MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/deliveries - List all delivery batches across platform with search & filters
router.get('/deliveries', (req, res, next) => {
    admin_controller_1.adminController.getAllDeliveryBatches(req, res, next);
});
router.get('/deliveries/batches', (req, res, next) => {
    admin_controller_1.adminController.getAllDeliveryBatches(req, res, next);
});
// GET /api/admin/deliveries/:batchId - View specific delivery batch with orders and timeline
router.get('/deliveries/:batchId', (req, res, next) => {
    admin_controller_1.adminController.getDeliveryBatchById(req, res, next);
});
router.get('/deliveries/batches/:batchId', (req, res, next) => {
    admin_controller_1.adminController.getDeliveryBatchById(req, res, next);
});
// PATCH /api/admin/deliveries/:batchId/status - Update delivery batch progression status
router.patch('/deliveries/:batchId/status', (req, res, next) => {
    admin_controller_1.adminController.updateDeliveryBatchStatus(req, res, next);
});
router.patch('/deliveries/batches/:batchId/status', (req, res, next) => {
    admin_controller_1.adminController.updateDeliveryBatchStatus(req, res, next);
});
// ============================================================================
// ADMIN DISPUTE MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/disputes - List all platform disputes with search & filters
router.get('/disputes', (req, res, next) => {
    admin_controller_1.adminController.getAllDisputes(req, res, next);
});
// GET /api/admin/disputes/:disputeId - View specific dispute details with order & customer relations
router.get('/disputes/:disputeId', (req, res, next) => {
    admin_controller_1.adminController.getDisputeById(req, res, next);
});
// PATCH /api/admin/disputes/:disputeId/status - Review, resolve, or reject a dispute
router.patch('/disputes/:disputeId/status', (req, res, next) => {
    admin_controller_1.adminController.updateDisputeStatus(req, res, next);
});
router.patch('/disputes/:disputeId/resolve', (req, res, next) => {
    admin_controller_1.adminController.resolveDispute(req, res, next);
});
router.patch('/disputes/:disputeId/reject', (req, res, next) => {
    admin_controller_1.adminController.rejectDispute(req, res, next);
});
router.patch('/disputes/:disputeId', (req, res, next) => {
    admin_controller_1.adminController.updateDisputeStatus(req, res, next);
});
// ============================================================================
// ADMIN REVIEW MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/reviews - List all platform customer produce and grower reviews
router.get('/reviews', (req, res, next) => {
    admin_controller_1.adminController.getAllReviews(req, res, next);
});
// ============================================================================
// ADMIN DASHBOARD & ANALYTICS ROUTES (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/dashboard - Operational dashboard metrics, trends, and recent records
router.get('/dashboard', (req, res, next) => {
    admin_controller_1.adminController.getDashboardData(req, res, next);
});
// GET /api/admin/analytics - Platform analytics time-series and distributions
router.get('/analytics', (req, res, next) => {
    admin_controller_1.adminController.getAnalyticsData(req, res, next);
});
// ============================================================================
// ADMIN USER MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/users - List all users across platform with search, role, status filters, pagination
router.get('/users', (req, res, next) => {
    admin_controller_1.adminController.getAllUsers(req, res, next);
});
// GET /api/admin/users/:userId - View specific user profile details
router.get('/users/:userId', (req, res, next) => {
    admin_controller_1.adminController.getUserById(req, res, next);
});
// PATCH /api/admin/users/:userId/status - Toggle activate/deactivate status
router.patch('/users/:userId/status', (req, res, next) => {
    admin_controller_1.adminController.updateUserStatus(req, res, next);
});
router.patch('/users/:userId', (req, res, next) => {
    admin_controller_1.adminController.updateUserStatus(req, res, next);
});
// ============================================================================
// ADMIN NOTIFICATIONS & SYSTEM ALERTS (Strictly ADMIN Role)
// ============================================================================
// GET /api/admin/notifications - Retrieve notifications strictly for authenticated admin
router.get('/notifications', (req, res, next) => {
    notification_controller_1.notificationController.getAdminNotifications(req, res, next);
});
// GET /api/admin/notifications/unread-count - Get total unread count from PostgreSQL
router.get('/notifications/unread-count', (req, res, next) => {
    notification_controller_1.notificationController.getAdminUnreadCount(req, res, next);
});
// PATCH /api/admin/notifications/read-all - Mark all admin notifications as read
router.patch('/notifications/read-all', (req, res, next) => {
    notification_controller_1.notificationController.markAllAdminNotificationsAsRead(req, res, next);
});
router.post('/notifications/mark-all-read', (req, res, next) => {
    notification_controller_1.notificationController.markAllAdminNotificationsAsRead(req, res, next);
});
// PATCH /api/admin/notifications/:notificationId/read - Mark specific notification as read (with IDOR check)
router.patch('/notifications/:notificationId/read', (req, res, next) => {
    notification_controller_1.notificationController.markAdminNotificationAsRead(req, res, next);
});
router.patch('/notifications/:notificationId', (req, res, next) => {
    notification_controller_1.notificationController.markAdminNotificationAsRead(req, res, next);
});
// DELETE /api/admin/notifications/:notificationId - Delete single notification (with IDOR check)
router.delete('/notifications/:notificationId', (req, res, next) => {
    notification_controller_1.notificationController.deleteAdminNotification(req, res, next);
});
// DELETE /api/admin/notifications - Clear all notifications for authenticated admin
router.delete('/notifications', (req, res, next) => {
    notification_controller_1.notificationController.clearAllAdminNotifications(req, res, next);
});
exports.adminRoutes = router;
//# sourceMappingURL=admin.routes.js.map