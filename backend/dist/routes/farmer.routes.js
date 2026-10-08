"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerRoutes = void 0;
const express_1 = require("express");
const farmer_controller_1 = require("../controllers/farmer.controller");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const product_routes_1 = require("./product.routes");
const inventory_routes_1 = require("./inventory.routes");
const harvest_routes_1 = require("./harvest.routes");
const surplus_routes_1 = require("./surplus.routes");
const farmer_order_routes_1 = require("./farmer-order.routes");
const farmer_delivery_routes_1 = require("./farmer-delivery.routes");
const farmer_sale_routes_1 = require("./farmer-sale.routes");
const farmer_notification_routes_1 = require("./farmer-notification.routes");
const farmer_settings_routes_1 = require("./farmer-settings.routes");
const router = (0, express_1.Router)();
// Products subrouter: /api/farmer/products
router.use('/products', product_routes_1.productRoutes);
// Inventory subrouter: /api/farmer/inventory
router.use('/inventory', inventory_routes_1.inventoryRoutes);
// Harvests subrouter: /api/farmer/harvests
router.use('/harvests', harvest_routes_1.harvestRoutes);
// Surplus subrouter: /api/farmer/surplus
router.use('/surplus', surplus_routes_1.surplusRoutes);
// Orders subrouter: /api/farmer/orders
router.use('/orders', farmer_order_routes_1.farmerOrderRoutes);
// Deliveries subrouter: /api/farmer/deliveries
router.use('/deliveries', farmer_delivery_routes_1.farmerDeliveryRoutes);
// Sales subrouter: /api/farmer/sales
router.use('/sales', farmer_sale_routes_1.farmerSaleRoutes);
// Notifications subrouter: /api/farmer/notifications
router.use('/notifications', farmer_notification_routes_1.farmerNotificationRoutes);
// Settings subrouter: /api/farmer/settings
router.use('/settings', farmer_settings_routes_1.farmerSettingsRoutes);
// GET /api/farmer/dashboard - Returns aggregated live operational dashboard data (APPROVED farmers ONLY)
router.get('/dashboard', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER), auth_1.requireApprovedFarmer, (req, res, next) => {
    farmer_controller_1.farmerController.getFarmerDashboard(req, res, next);
});
// GET /api/farmer/status - Returns verification status for the currently authenticated farmer
router.get('/status', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER, client_1.UserRole.ADMIN), (req, res, next) => {
    farmer_controller_1.farmerController.getFarmerStatus(req, res, next);
});
// GET /api/farmer/profile - Returns full farmer profile for authenticated farmer
router.get('/profile', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER, client_1.UserRole.ADMIN), (req, res, next) => {
    farmer_controller_1.farmerController.getFarmerProfile(req, res, next);
});
// PATCH /api/farmer/profile - Updates profile for authenticated farmer
router.patch('/profile', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER), (req, res, next) => {
    farmer_controller_1.farmerController.updateFarmerProfile(req, res, next);
});
// PATCH /api/farmer/profile/:farmerId - Updates profile with explicit farmerId check
router.patch('/profile/:farmerId', auth_1.requireAuth, auth_1.requireFarmerOwnership, (req, res, next) => {
    farmer_controller_1.farmerController.updateFarmerProfile(req, res, next);
});
// GET /api/farmer/profile/:farmerId - Returns full farmer profile (data isolation enforced)
router.get('/profile/:farmerId', auth_1.requireAuth, auth_1.requireFarmerOwnership, (req, res, next) => {
    farmer_controller_1.farmerController.getFarmerProfile(req, res, next);
});
exports.farmerRoutes = router;
//# sourceMappingURL=farmer.routes.js.map