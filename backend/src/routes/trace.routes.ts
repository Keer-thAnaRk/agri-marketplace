import { Router } from 'express';
import { harvestController } from '../controllers/harvest.controller';

const router = Router();

// GET /api/trace/:batchId - Public endpoint to retrieve batch traceability information
router.get('/:batchId', (req, res, next) => {
  harvestController.getPublicTrace(req, res, next);
});

export const traceRoutes = router;
