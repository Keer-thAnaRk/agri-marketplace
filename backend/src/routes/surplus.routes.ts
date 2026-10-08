import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  requireAuth,
  requireRole,
  requireApprovedFarmer,
} from '../middleware/auth';
import { surplusController } from '../controllers/surplus.controller';

const router = Router();

// All farmer surplus routes require authenticated, APPROVED farmer
router.use(requireAuth, requireRole(UserRole.FARMER), requireApprovedFarmer);

// GET /api/farmer/surplus - Returns surplus offers belonging ONLY to authenticated farmer
router.get('/', (req, res, next) => {
  surplusController.getFarmerSurplusOffers(req, res, next);
});

// GET /api/farmer/surplus/:id - Returns single surplus offer for authenticated farmer
router.get('/:id', (req, res, next) => {
  surplusController.getFarmerSurplusOfferById(req, res, next);
});

// POST /api/farmer/surplus - Creates surplus flash offer (APPROVED farmers ONLY)
router.post('/', (req, res, next) => {
  surplusController.createSurplusOffer(req, res, next);
});

// PATCH /api/farmer/surplus/:id - Modifies active surplus offer (APPROVED farmers ONLY)
router.patch('/:id', (req, res, next) => {
  surplusController.updateSurplusOffer(req, res, next);
});

// DELETE /api/farmer/surplus/:id - Cancels active surplus offer (APPROVED farmers ONLY)
router.delete('/:id', (req, res, next) => {
  surplusController.cancelSurplusOffer(req, res, next);
});

export const surplusRoutes = router;
