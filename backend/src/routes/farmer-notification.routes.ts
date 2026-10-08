import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

// Apply requireAuth and requireRole(UserRole.FARMER) to all farmer notification routes
router.use(requireAuth);
router.use(requireRole(UserRole.FARMER));

// GET /api/farmer/notifications - Retrieve authenticated farmer's notifications
router.get('/', (req, res, next) => {
  notificationController.getFarmerNotifications(req, res, next);
});

// POST /api/farmer/notifications/mark-all-read - Mark all notifications as read for current farmer
router.post('/mark-all-read', (req, res, next) => {
  notificationController.markAllAsRead(req, res, next);
});

// GET /api/farmer/notifications/:id - Retrieve single notification (ownership verified)
router.get('/:id', (req, res, next) => {
  notificationController.getFarmerNotificationById(req, res, next);
});

// PATCH /api/farmer/notifications/:id/read - Mark single notification as read (ownership verified)
router.patch('/:id/read', (req, res, next) => {
  notificationController.markAsRead(req, res, next);
});

export const farmerNotificationRoutes = router;
