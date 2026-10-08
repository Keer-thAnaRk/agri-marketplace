import { Router } from 'express';
import { marketplaceController } from '../controllers/marketplace.controller';

// Router for public product discovery: /api/products
export const publicProductRoutes = Router();

publicProductRoutes.get('/', (req, res, next) => {
  marketplaceController.getProducts(req, res, next);
});

publicProductRoutes.get('/:id', (req, res, next) => {
  marketplaceController.getProductById(req, res, next);
});

// Router for public farmer discovery: /api/farmers
export const publicFarmerRoutes = Router();

publicFarmerRoutes.get('/', (req, res, next) => {
  marketplaceController.getFarmers(req, res, next);
});

publicFarmerRoutes.get('/:id', (req, res, next) => {
  marketplaceController.getFarmerById(req, res, next);
});
