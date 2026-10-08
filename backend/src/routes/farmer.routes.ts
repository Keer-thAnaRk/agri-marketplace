import { Router } from 'express';
import { farmerController } from '../controllers/farmer.controller';
import { requireAuth, requireRole, requireFarmerOwnership, requireApprovedFarmer } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { productRoutes } from './product.routes';
import { inventoryRoutes } from './inventory.routes';
import { harvestRoutes } from './harvest.routes';
import { surplusRoutes } from './surplus.routes';
import { farmerOrderRoutes } from './farmer-order.routes';
import { farmerDeliveryRoutes } from './farmer-delivery.routes';
import { farmerSaleRoutes } from './farmer-sale.routes';
import { farmerNotificationRoutes } from './farmer-notification.routes';
import { farmerSettingsRoutes } from './farmer-settings.routes';

const router = Router();

// Products subrouter: /api/farmer/products
router.use('/products', productRoutes);

// Inventory subrouter: /api/farmer/inventory
router.use('/inventory', inventoryRoutes);

// Harvests subrouter: /api/farmer/harvests
router.use('/harvests', harvestRoutes);

// Surplus subrouter: /api/farmer/surplus
router.use('/surplus', surplusRoutes);

// Orders subrouter: /api/farmer/orders
router.use('/orders', farmerOrderRoutes);

// Deliveries subrouter: /api/farmer/deliveries
router.use('/deliveries', farmerDeliveryRoutes);

// Sales subrouter: /api/farmer/sales
router.use('/sales', farmerSaleRoutes);

// Notifications subrouter: /api/farmer/notifications
router.use('/notifications', farmerNotificationRoutes);

// Settings subrouter: /api/farmer/settings
router.use('/settings', farmerSettingsRoutes);


// GET /api/farmer/dashboard - Returns aggregated live operational dashboard data (APPROVED farmers ONLY)
router.get(
  '/dashboard',
  requireAuth,
  requireRole(UserRole.FARMER),
  requireApprovedFarmer,
  (req, res, next) => {
    farmerController.getFarmerDashboard(req, res, next);
  }
);

// GET /api/farmer/status - Returns verification status for the currently authenticated farmer
router.get(
  '/status',
  requireAuth,
  requireRole(UserRole.FARMER, UserRole.ADMIN),
  (req, res, next) => {
    farmerController.getFarmerStatus(req, res, next);
  }
);

// GET /api/farmer/profile - Returns full farmer profile for authenticated farmer
router.get(
  '/profile',
  requireAuth,
  requireRole(UserRole.FARMER, UserRole.ADMIN),
  (req, res, next) => {
    farmerController.getFarmerProfile(req, res, next);
  }
);

// PATCH /api/farmer/profile - Updates profile for authenticated farmer
router.patch(
  '/profile',
  requireAuth,
  requireRole(UserRole.FARMER),
  (req, res, next) => {
    farmerController.updateFarmerProfile(req, res, next);
  }
);

// PATCH /api/farmer/profile/:farmerId - Updates profile with explicit farmerId check
router.patch(
  '/profile/:farmerId',
  requireAuth,
  requireFarmerOwnership,
  (req, res, next) => {
    farmerController.updateFarmerProfile(req, res, next);
  }
);

// GET /api/farmer/profile/:farmerId - Returns full farmer profile (data isolation enforced)
router.get(
  '/profile/:farmerId',
  requireAuth,
  requireFarmerOwnership,
  (req, res, next) => {
    farmerController.getFarmerProfile(req, res, next);
  }
);

export const farmerRoutes = router;
