import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All consumer order routes require authentication
router.use(requireAuth);

// POST /api/orders - Place a new order
router.post('/', (req, res, next) => {
  orderController.createOrder(req, res, next);
});

// GET /api/orders - View consumer's order history
router.get('/', (req, res, next) => {
  orderController.getConsumerOrders(req, res, next);
});

// GET /api/orders/:orderId - View specific consumer order details
router.get('/:orderId', (req, res, next) => {
  orderController.getConsumerOrderById(req, res, next);
});

// POST /api/orders/:orderId/cancel - Cancel consumer order
router.post('/:orderId/cancel', (req, res, next) => {
  orderController.cancelConsumerOrder(req, res, next);
});

export const orderRoutes = router;
