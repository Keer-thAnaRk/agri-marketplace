import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller';
import { requireAuth, requireApprovedFarmer } from '../middleware/auth';

const router = Router();

// All farmer delivery routes require an approved farmer profile (401 unauthenticated, 403 pending/rejected)
router.use(requireAuth, requireApprovedFarmer);

// POST /api/farmer/deliveries/batches - Create a delivery batch
router.post('/batches', (req, res, next) => {
  deliveryController.createBatch(req, res, next);
});

// POST /api/farmer/deliveries/batches/:batchId/orders - Assign eligible orders to batch
router.post('/batches/:batchId/orders', (req, res, next) => {
  deliveryController.assignOrders(req, res, next);
});

// POST /api/farmer/deliveries/batches/auto-create - Hyperlocal automatic batching
router.post('/batches/auto-create', (req, res, next) => {
  deliveryController.autoCreateBatches(req, res, next);
});

// GET /api/farmer/deliveries/batches - Get all delivery batches for authenticated farmer
router.get('/batches', (req, res, next) => {
  deliveryController.getBatches(req, res, next);
});

// GET /api/farmer/deliveries/batches/:batchId - Get single batch details
router.get('/batches/:batchId', (req, res, next) => {
  deliveryController.getBatchById(req, res, next);
});

// PATCH /api/farmer/deliveries/batches/:batchId/status - Update batch status and synchronize orders
router.patch('/batches/:batchId/status', (req, res, next) => {
  deliveryController.updateBatchStatus(req, res, next);
});

export const farmerDeliveryRoutes = router;
