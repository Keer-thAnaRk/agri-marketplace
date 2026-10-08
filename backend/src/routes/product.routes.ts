import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  requireAuth,
  requireRole,
  requireApprovedFarmer,
} from '../middleware/auth';
import { productController } from '../controllers/product.controller';

const router = Router();

// All farmer product routes require authenticated, APPROVED farmer
router.use(requireAuth, requireRole(UserRole.FARMER), requireApprovedFarmer);

// GET /api/farmer/products - List all products for the authenticated farmer
router.get('/', (req, res, next) => {
  productController.getFarmerProducts(req, res, next);
});

// GET /api/farmer/products/:id - Get specific product for the authenticated farmer
router.get('/:id', (req, res, next) => {
  productController.getFarmerProductById(req, res, next);
});

// POST /api/farmer/products - Create a new product (APPROVED farmers ONLY)
router.post('/', (req, res, next) => {
  productController.createProduct(req, res, next);
});

// PATCH /api/farmer/products/:id - Edit an existing product (APPROVED farmers ONLY)
router.patch('/:id', (req, res, next) => {
  productController.updateProduct(req, res, next);
});

// DELETE /api/farmer/products/:id - Delete or archive a product (APPROVED farmers ONLY)
router.delete('/:id', (req, res, next) => {
  productController.deleteProduct(req, res, next);
});

export const productRoutes = router;
