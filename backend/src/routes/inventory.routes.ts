import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  requireAuth,
  requireRole,
  requireApprovedFarmer,
} from '../middleware/auth';
import { inventoryController } from '../controllers/inventory.controller';

const router = Router();

// All farmer inventory routes require authenticated, APPROVED farmer
router.use(requireAuth, requireRole(UserRole.FARMER), requireApprovedFarmer);

// GET /api/farmer/inventory - Returns inventory belonging ONLY to authenticated farmer
router.get('/', (req, res, next) => {
  inventoryController.getFarmerInventory(req, res, next);
});

// GET /api/farmer/inventory/:productId - Returns inventory for farmer's product
router.get('/:productId', (req, res, next) => {
  inventoryController.getInventoryByProductId(req, res, next);
});

// PATCH /api/farmer/inventory/:productId - Update stock level (APPROVED farmers ONLY)
router.patch('/:productId', (req, res, next) => {
  inventoryController.updateStock(req, res, next);
});

export const inventoryRoutes = router;
