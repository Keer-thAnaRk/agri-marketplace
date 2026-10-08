import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { requireAuth, requireRole, requireApprovedFarmer } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All farmer order routes require authenticated and APPROVED farmer
router.use(requireAuth);
router.use(requireRole(UserRole.FARMER));
router.use(requireApprovedFarmer);

// GET /api/farmer/orders - List farmer's orders
router.get('/', (req, res, next) => {
  orderController.getFarmerOrders(req, res, next);
});

// GET /api/farmer/orders/:orderId - View specific farmer order details
router.get('/:orderId', (req, res, next) => {
  orderController.getFarmerOrderById(req, res, next);
});

// PATCH /api/farmer/orders/:orderId/status - Update farmer order workflow status
router.patch('/:orderId/status', (req, res, next) => {
  orderController.updateFarmerOrderStatus(req, res, next);
});

export const farmerOrderRoutes = router;
