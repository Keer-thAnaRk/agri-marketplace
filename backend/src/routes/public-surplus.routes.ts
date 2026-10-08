import { Router } from 'express';
import { surplusController } from '../controllers/surplus.controller';

const router = Router();

// GET /api/surplus - Public/consumer surplus marketplace offers
router.get('/', (req, res, next) => {
  surplusController.getPublicSurplusOffers(req, res, next);
});

// GET /api/surplus/:id - Public/consumer single surplus offer details
router.get('/:id', (req, res, next) => {
  surplusController.getPublicSurplusOfferById(req, res, next);
});

export const publicSurplusRoutes = router;
