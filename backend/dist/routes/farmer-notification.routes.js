"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerNotificationRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
// Apply requireAuth and requireRole(UserRole.FARMER) to all farmer notification routes
router.use(auth_1.requireAuth);
router.use((0, auth_1.requireRole)(client_1.UserRole.FARMER));
// GET /api/farmer/notifications - Retrieve authenticated farmer's notifications
router.get('/', (req, res, next) => {
    notification_controller_1.notificationController.getFarmerNotifications(req, res, next);
});
// POST /api/farmer/notifications/mark-all-read - Mark all notifications as read for current farmer
router.post('/mark-all-read', (req, res, next) => {
    notification_controller_1.notificationController.markAllAsRead(req, res, next);
});
// GET /api/farmer/notifications/:id - Retrieve single notification (ownership verified)
router.get('/:id', (req, res, next) => {
    notification_controller_1.notificationController.getFarmerNotificationById(req, res, next);
});
// PATCH /api/farmer/notifications/:id/read - Mark single notification as read (ownership verified)
router.patch('/:id/read', (req, res, next) => {
    notification_controller_1.notificationController.markAsRead(req, res, next);
});
exports.farmerNotificationRoutes = router;
//# sourceMappingURL=farmer-notification.routes.js.map