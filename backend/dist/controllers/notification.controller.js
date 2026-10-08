"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    // ============================================================================
    // FARMER NOTIFICATIONS
    // ============================================================================
    /**
     * GET /api/farmer/notifications
     * Returns all notifications belonging strictly to the authenticated farmer's User.id.
     */
    async getFarmerNotifications(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const result = await notification_service_1.notificationService.getFarmerNotifications(userId);
            res.status(200).json({
                success: true,
                count: result.count,
                unreadCount: result.unreadCount,
                data: result.notifications,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/farmer/notifications/:id
     * Returns a single notification only if it belongs to the authenticated farmer's User.id.
     */
    async getFarmerNotificationById(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const notificationId = req.params.id;
            const result = await notification_service_1.notificationService.getNotificationById(userId, notificationId);
            if (result.notFound) {
                res.status(404).json({
                    success: false,
                    error: 'Notification not found.',
                });
                return;
            }
            if (result.forbidden) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: You do not have permission to view this notification.',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: result.notification,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // ============================================================================
    // ADMIN NOTIFICATIONS (Strictly ADMIN Role)
    // ============================================================================
    /**
     * GET /api/admin/notifications
     * Returns notifications strictly belonging to the authenticated Admin's User.id.
     * Supports type filtering, read/unread status filtering, and pagination.
     */
    async getAdminNotifications(req, res, next) {
        try {
            const adminUserId = req.user?.id;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const type = req.query.type;
            const status = req.query.status;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            const result = await notification_service_1.notificationService.getAdminNotifications(adminUserId, {
                type,
                status,
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                count: result.count,
                unreadCount: result.unreadCount,
                total: result.total,
                totalAll: result.totalAll,
                pagination: result.pagination,
                data: result.notifications,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/notifications/unread-count
     * Returns current unread notification count directly from PostgreSQL.
     */
    async getAdminUnreadCount(req, res, next) {
        try {
            const adminUserId = req.user?.id;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const result = await notification_service_1.notificationService.getUnreadCount(adminUserId);
            res.status(200).json({
                success: true,
                unreadCount: result.unreadCount,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/admin/notifications/:notificationId/read
     * Marks a notification as read only if it belongs to the authenticated Admin.
     * Prevents IDOR (Admin A cannot mark Admin B's notification).
     */
    async markAdminNotificationAsRead(req, res, next) {
        try {
            const adminUserId = req.user?.id;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const notificationId = (req.params.notificationId || req.params.id);
            const result = await notification_service_1.notificationService.markAsRead(adminUserId, notificationId);
            if (result.notFound) {
                res.status(404).json({
                    success: false,
                    error: 'Notification not found.',
                });
                return;
            }
            if (result.forbidden) {
                res.status(403).json({
                    success: false,
                    error: "Access denied: You cannot modify another user's notification.",
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Notification marked as read.',
                data: result.notification,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/admin/notifications/read-all
     * POST  /api/admin/notifications/mark-all-read
     * Marks all unread notifications belonging to the authenticated Admin as read.
     */
    async markAllAdminNotificationsAsRead(req, res, next) {
        try {
            const adminUserId = req.user?.id;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const result = await notification_service_1.notificationService.markAllAsRead(adminUserId);
            res.status(200).json({
                success: true,
                message: 'All notifications marked as read.',
                count: result.updatedCount,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/admin/notifications/:notificationId
     * Deletes a notification only if it belongs to the authenticated Admin.
     */
    async deleteAdminNotification(req, res, next) {
        try {
            const adminUserId = req.user?.id;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const notificationId = (req.params.notificationId || req.params.id);
            const result = await notification_service_1.notificationService.deleteNotification(adminUserId, notificationId);
            if (result.notFound) {
                res.status(404).json({
                    success: false,
                    error: 'Notification not found.',
                });
                return;
            }
            if (result.forbidden) {
                res.status(403).json({
                    success: false,
                    error: "Access denied: You cannot delete another user's notification.",
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Notification deleted successfully.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/admin/notifications
     * Clears all notifications belonging strictly to the authenticated Admin.
     */
    async clearAllAdminNotifications(req, res, next) {
        try {
            const adminUserId = req.user?.id;
            if (!adminUserId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const result = await notification_service_1.notificationService.clearAllNotifications(adminUserId);
            res.status(200).json({
                success: true,
                message: 'All notifications cleared successfully.',
                count: result.deletedCount,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // ============================================================================
    // GENERIC MARK AS READ & MARK ALL
    // ============================================================================
    async markAsRead(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const notificationId = req.params.id;
            const result = await notification_service_1.notificationService.markAsRead(userId, notificationId);
            if (result.notFound) {
                res.status(404).json({
                    success: false,
                    error: 'Notification not found.',
                });
                return;
            }
            if (result.forbidden) {
                res.status(403).json({
                    success: false,
                    error: "Access denied: You cannot mark another user's notification as read.",
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Notification marked as read.',
                data: result.notification,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required.',
                });
                return;
            }
            const result = await notification_service_1.notificationService.markAllAsRead(userId);
            res.status(200).json({
                success: true,
                message: 'All notifications marked as read.',
                count: result.updatedCount,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map