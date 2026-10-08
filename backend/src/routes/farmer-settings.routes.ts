import { Router } from 'express';
import { farmerSettingsController } from '../controllers/farmer-settings.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All settings endpoints require authenticated FARMER
router.use(requireAuth, requireRole(UserRole.FARMER));

// GET /api/farmer/settings
router.get('/', (req, res, next) => {
  farmerSettingsController.getFarmerSettings(req, res, next);
});

// PATCH /api/farmer/settings
router.patch('/', (req, res, next) => {
  farmerSettingsController.updateFarmerSettings(req, res, next);
});

// PATCH /api/farmer/settings/password
router.patch('/password', (req, res, next) => {
  farmerSettingsController.changePassword(req, res, next);
});

export const farmerSettingsRoutes = router;
