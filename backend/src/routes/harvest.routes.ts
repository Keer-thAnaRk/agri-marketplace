import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  requireAuth,
  requireRole,
  requireApprovedFarmer,
} from '../middleware/auth';
import { harvestController } from '../controllers/harvest.controller';

const router = Router();

// All farmer harvest routes require authenticated, APPROVED farmer
router.use(requireAuth, requireRole(UserRole.FARMER), requireApprovedFarmer);

// GET /api/farmer/harvests - Returns harvest batches belonging ONLY to authenticated farmer
router.get('/', (req, res, next) => {
  harvestController.getFarmerHarvests(req, res, next);
});

// GET /api/farmer/harvests/:batchId/traceability - Returns traceability events (APPROVED farmers ONLY)
router.get('/:batchId/traceability', (req, res, next) => {
  harvestController.getTraceabilityEvents(req, res, next);
});

// POST /api/farmer/harvests/:batchId/traceability - Adds traceability event (APPROVED farmers ONLY)
router.post('/:batchId/traceability', (req, res, next) => {
  harvestController.addTraceabilityEvent(req, res, next);
});

// GET /api/farmer/harvests/:id - Returns single harvest batch for authenticated farmer
router.get('/:id', (req, res, next) => {
  harvestController.getFarmerHarvestById(req, res, next);
});

// POST /api/farmer/harvests - Records new harvest batch (APPROVED farmers ONLY)
router.post('/', (req, res, next) => {
  harvestController.createHarvest(req, res, next);
});

// POST /api/farmer/harvests/:id/events - Adds traceability event (APPROVED farmers ONLY)
router.post('/:id/events', (req, res, next) => {
  harvestController.addTraceabilityEvent(req, res, next);
});

export const harvestRoutes = router;
