import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { saleController } from '../controllers/sale.controller';
import { notificationController } from '../controllers/notification.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes strictly require ADMIN role
router.use(requireAuth, requireRole(UserRole.ADMIN));

// GET /api/admin/farmers - List all farmers (optional ?status=pending|approved|rejected)
router.get('/farmers', (req, res, next) => {
  adminController.getAllFarmers(req, res, next);
});

// GET /api/admin/farmers/pending - List all pending farmer applications
router.get('/farmers/pending', (req, res, next) => {
  adminController.getPendingFarmers(req, res, next);
});

// GET /api/admin/farmers/:farmerId - View specific farmer application and submitted documents
router.get('/farmers/:farmerId', (req, res, next) => {
  adminController.getFarmerById(req, res, next);
});

// POST /api/admin/farmers/:farmerId/approve - Approve a farmer application
router.post('/farmers/:farmerId/approve', (req, res, next) => {
  adminController.approveFarmer(req, res, next);
});
router.patch('/farmers/:farmerId/approve', (req, res, next) => {
  adminController.approveFarmer(req, res, next);
});

// POST /api/admin/farmers/:farmerId/reject - Reject a farmer application with a reason
router.post('/farmers/:farmerId/reject', (req, res, next) => {
  adminController.rejectFarmer(req, res, next);
});
router.patch('/farmers/:farmerId/reject', (req, res, next) => {
  adminController.rejectFarmer(req, res, next);
});

// ============================================================================
// ADMIN SALES & PAYOUTS ROUTES (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/sales - View platform sales and pending payouts with search and filters
router.get('/sales', (req, res, next) => {
  saleController.getAdminSales(req, res, next);
});
router.get('/payouts', (req, res, next) => {
  saleController.getAdminSales(req, res, next);
});

// GET /api/admin/sales/:saleId - View details of a specific sale record
router.get('/sales/:saleId', (req, res, next) => {
  saleController.getSaleById(req, res, next);
});
router.get('/payouts/:saleId', (req, res, next) => {
  saleController.getSaleById(req, res, next);
});

// PATCH /api/admin/sales/:saleId/payout - Mark a sale as PAID_OUT
router.patch('/sales/:saleId/payout', (req, res, next) => {
  saleController.markSaleAsPaid(req, res, next);
});
router.patch('/sales/:saleId', (req, res, next) => {
  saleController.markSaleAsPaid(req, res, next);
});
router.patch('/payouts/:saleId/payout', (req, res, next) => {
  saleController.markSaleAsPaid(req, res, next);
});
router.patch('/payouts/:saleId', (req, res, next) => {
  saleController.markSaleAsPaid(req, res, next);
});

// ============================================================================
// ADMIN PRODUCT MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/products - List all products across farmers with search and filters
router.get('/products', (req, res, next) => {
  adminController.getAllProducts(req, res, next);
});

// GET /api/admin/products/:productId - View specific product with farmer, inventory, and traceability
router.get('/products/:productId', (req, res, next) => {
  adminController.getProductById(req, res, next);
});

// PATCH /api/admin/products/:productId/status - Toggle or update product status
router.patch('/products/:productId/status', (req, res, next) => {
  adminController.updateProductStatus(req, res, next);
});
router.patch('/products/:productId', (req, res, next) => {
  adminController.updateProductStatus(req, res, next);
});

// ============================================================================
// ADMIN ORDER MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/orders - List all orders across consumers and farmers with search & filters
router.get('/orders', (req, res, next) => {
  adminController.getAllOrders(req, res, next);
});

// GET /api/admin/orders/:orderId - View specific order with items, customer, batch, timeline
router.get('/orders/:orderId', (req, res, next) => {
  adminController.getOrderById(req, res, next);
});

// PATCH /api/admin/orders/:orderId/status - Update order workflow progression
router.patch('/orders/:orderId/status', (req, res, next) => {
  adminController.updateOrderStatus(req, res, next);
});

// ============================================================================
// ADMIN DELIVERY BATCH MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/deliveries - List all delivery batches across platform with search & filters
router.get('/deliveries', (req, res, next) => {
  adminController.getAllDeliveryBatches(req, res, next);
});
router.get('/deliveries/batches', (req, res, next) => {
  adminController.getAllDeliveryBatches(req, res, next);
});

// GET /api/admin/deliveries/:batchId - View specific delivery batch with orders and timeline
router.get('/deliveries/:batchId', (req, res, next) => {
  adminController.getDeliveryBatchById(req, res, next);
});
router.get('/deliveries/batches/:batchId', (req, res, next) => {
  adminController.getDeliveryBatchById(req, res, next);
});

// PATCH /api/admin/deliveries/:batchId/status - Update delivery batch progression status
router.patch('/deliveries/:batchId/status', (req, res, next) => {
  adminController.updateDeliveryBatchStatus(req, res, next);
});
router.patch('/deliveries/batches/:batchId/status', (req, res, next) => {
  adminController.updateDeliveryBatchStatus(req, res, next);
});

// ============================================================================
// ADMIN DISPUTE MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/disputes - List all platform disputes with search & filters
router.get('/disputes', (req, res, next) => {
  adminController.getAllDisputes(req, res, next);
});

// GET /api/admin/disputes/:disputeId - View specific dispute details with order & customer relations
router.get('/disputes/:disputeId', (req, res, next) => {
  adminController.getDisputeById(req, res, next);
});

// PATCH /api/admin/disputes/:disputeId/status - Review, resolve, or reject a dispute
router.patch('/disputes/:disputeId/status', (req, res, next) => {
  adminController.updateDisputeStatus(req, res, next);
});
router.patch('/disputes/:disputeId/resolve', (req, res, next) => {
  adminController.resolveDispute(req, res, next);
});
router.patch('/disputes/:disputeId/reject', (req, res, next) => {
  adminController.rejectDispute(req, res, next);
});
router.patch('/disputes/:disputeId', (req, res, next) => {
  adminController.updateDisputeStatus(req, res, next);
});

// ============================================================================
// ADMIN REVIEW MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/reviews - List all platform customer produce and grower reviews
router.get('/reviews', (req, res, next) => {
  adminController.getAllReviews(req, res, next);
});

// ============================================================================
// ADMIN DASHBOARD & ANALYTICS ROUTES (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/dashboard - Operational dashboard metrics, trends, and recent records
router.get('/dashboard', (req, res, next) => {
  adminController.getDashboardData(req, res, next);
});

// GET /api/admin/analytics - Platform analytics time-series and distributions
router.get('/analytics', (req, res, next) => {
  adminController.getAnalyticsData(req, res, next);
});

// ============================================================================
// ADMIN USER MANAGEMENT ROUTES (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/users - List all users across platform with search, role, status filters, pagination
router.get('/users', (req, res, next) => {
  adminController.getAllUsers(req, res, next);
});

// GET /api/admin/users/:userId - View specific user profile details
router.get('/users/:userId', (req, res, next) => {
  adminController.getUserById(req, res, next);
});

// PATCH /api/admin/users/:userId/status - Toggle activate/deactivate status
router.patch('/users/:userId/status', (req, res, next) => {
  adminController.updateUserStatus(req, res, next);
});
router.patch('/users/:userId', (req, res, next) => {
  adminController.updateUserStatus(req, res, next);
});

// ============================================================================
// ADMIN NOTIFICATIONS & SYSTEM ALERTS (Strictly ADMIN Role)
// ============================================================================

// GET /api/admin/notifications - Retrieve notifications strictly for authenticated admin
router.get('/notifications', (req, res, next) => {
  notificationController.getAdminNotifications(req, res, next);
});

// GET /api/admin/notifications/unread-count - Get total unread count from PostgreSQL
router.get('/notifications/unread-count', (req, res, next) => {
  notificationController.getAdminUnreadCount(req, res, next);
});

// PATCH /api/admin/notifications/read-all - Mark all admin notifications as read
router.patch('/notifications/read-all', (req, res, next) => {
  notificationController.markAllAdminNotificationsAsRead(req, res, next);
});
router.post('/notifications/mark-all-read', (req, res, next) => {
  notificationController.markAllAdminNotificationsAsRead(req, res, next);
});

// PATCH /api/admin/notifications/:notificationId/read - Mark specific notification as read (with IDOR check)
router.patch('/notifications/:notificationId/read', (req, res, next) => {
  notificationController.markAdminNotificationAsRead(req, res, next);
});
router.patch('/notifications/:notificationId', (req, res, next) => {
  notificationController.markAdminNotificationAsRead(req, res, next);
});

// DELETE /api/admin/notifications/:notificationId - Delete single notification (with IDOR check)
router.delete('/notifications/:notificationId', (req, res, next) => {
  notificationController.deleteAdminNotification(req, res, next);
});

// DELETE /api/admin/notifications - Clear all notifications for authenticated admin
router.delete('/notifications', (req, res, next) => {
  notificationController.clearAllAdminNotifications(req, res, next);
});

export const adminRoutes = router;

