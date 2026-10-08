import { Router } from 'express';
import { saleController } from '../controllers/sale.controller';
import { requireAuth, requireApprovedFarmer } from '../middleware/auth';

const router = Router();

// All farmer sales routes require authentication and APPROVED farmer status
router.use(requireAuth, requireApprovedFarmer);

// GET /api/farmer/sales/summary - PostgreSQL aggregation summary
router.get('/summary', (req, res, next) => {
  saleController.getFarmerSalesSummary(req, res, next);
});

// GET /api/farmer/sales - List sales for authenticated farmer with optional filters
router.get('/', (req, res, next) => {
  saleController.getFarmerSales(req, res, next);
});

export const farmerSaleRoutes = router;
