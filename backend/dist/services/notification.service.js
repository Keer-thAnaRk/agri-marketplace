"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
exports.formatRelativeTime = formatRelativeTime;
exports.formatNotification = formatNotification;
const prisma_1 = require("../db/prisma");
const client_1 = require("@prisma/client");
function formatRelativeTime(date) {
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60)
        return 'Just now';
    if (diffMins < 60)
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1)
        return 'Yesterday';
    if (diffDays < 7)
        return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatNotification(n) {
    return {
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type ? n.type.toLowerCase() : 'system',
        rawType: n.type,
        isRead: n.isRead,
        link: n.link,
        createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
        timestamp: n.createdAt ? formatRelativeTime(new Date(n.createdAt)) : 'Just now',
    };
}
class NotificationService {
    /**
     * Returns all notifications for a given farmer (User.id), ordered from newest to oldest.
     */
    async getFarmerNotifications(userId) {
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        const unreadCount = await prisma_1.prisma.notification.count({
            where: { userId, isRead: false },
        });
        return {
            notifications: notifications.map(formatNotification),
            count: notifications.length,
            unreadCount,
        };
    }
    /**
     * Returns notifications strictly belonging to the authenticated Admin user (User.id),
     * with support for type filtering, read/unread status filtering, and pagination.
     */
    async getAdminNotifications(userId, filters) {
        const where = {
            userId,
        };
        // Filter by NotificationType (case-insensitive conversion)
        if (filters?.type && filters.type.toUpperCase() !== 'ALL') {
            const normalizedType = filters.type.toUpperCase();
            if (Object.values(client_1.NotificationType).includes(normalizedType)) {
                where.type = normalizedType;
            }
        }
        // Filter by read / unread status
        if (filters?.status) {
            const statusLower = filters.status.toLowerCase();
            if (statusLower === 'unread' || statusLower === 'false') {
                where.isRead = false;
            }
            else if (statusLower === 'read' || statusLower === 'true') {
                where.isRead = true;
            }
        }
        const page = Math.max(1, filters?.page || 1);
        const limit = Math.min(100, Math.max(1, filters?.limit || 20));
        const skip = (page - 1) * limit;
        const [notifications, totalFiltered, unreadCount, totalAll] = await Promise.all([
            prisma_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.notification.count({ where }),
            prisma_1.prisma.notification.count({ where: { userId, isRead: false } }),
            prisma_1.prisma.notification.count({ where: { userId } }),
        ]);
        const totalPages = Math.ceil(totalFiltered / limit) || 1;
        return {
            notifications: notifications.map(formatNotification),
            count: notifications.length,
            unreadCount,
            total: totalFiltered,
            totalAll,
            pagination: {
                page,
                limit,
                totalPages,
            },
        };
    }
    /**
     * Returns unread count for the given user directly from PostgreSQL.
     */
    async getUnreadCount(userId) {
        const unreadCount = await prisma_1.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
        return { unreadCount };
    }
    /**
     * Fetches a single notification and verifies user ownership.
     */
    async getNotificationById(userId, notificationId) {
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification) {
            return { notFound: true, forbidden: false, notification: null };
        }
        if (notification.userId !== userId) {
            return { notFound: false, forbidden: true, notification: null };
        }
        return { notFound: false, forbidden: false, notification: formatNotification(notification) };
    }
    /**
     * Marks a single notification as read if it belongs strictly to the authenticated user.
     */
    async markAsRead(userId, notificationId) {
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification) {
            return { notFound: true, forbidden: false, notification: null };
        }
        if (notification.userId !== userId) {
            return { notFound: false, forbidden: true, notification: null };
        }
        const updated = await prisma_1.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        return { notFound: false, forbidden: false, notification: formatNotification(updated) };
    }
    /**
     * Marks all unread notifications for a user as read.
     */
    async markAllAsRead(userId) {
        const result = await prisma_1.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        return { updatedCount: result.count };
    }
    /**
     * Deletes a single notification belonging strictly to the authenticated user.
     */
    async deleteNotification(userId, notificationId) {
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification) {
            return { notFound: true, forbidden: false };
        }
        if (notification.userId !== userId) {
            return { notFound: false, forbidden: true };
        }
        await prisma_1.prisma.notification.delete({
            where: { id: notificationId },
        });
        return { notFound: false, forbidden: false, success: true };
    }
    /**
     * Clears/deletes all notifications belonging strictly to the authenticated user.
     */
    async clearAllNotifications(userId) {
        const result = await prisma_1.prisma.notification.deleteMany({
            where: { userId },
        });
        return { deletedCount: result.count };
    }
    /**
     * Broadcasts an administrative alert to all active platform administrators.
     */
    async notifyAdmins(data) {
        const admins = await prisma_1.prisma.user.findMany({
            where: {
                role: client_1.UserRole.ADMIN,
                isActive: true,
            },
            select: { id: true },
        });
        if (admins.length === 0)
            return [];
        const created = await Promise.all(admins.map((admin) => prisma_1.prisma.notification.create({
            data: {
                userId: admin.id,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link,
                isRead: false,
            },
        })));
        return created;
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map