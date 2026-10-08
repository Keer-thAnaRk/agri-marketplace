"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const inventory_controller_1 = require("../controllers/inventory.controller");
const router = (0, express_1.Router)();
// All farmer inventory routes require authenticated, APPROVED farmer
router.use(auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER), auth_1.requireApprovedFarmer);
// GET /api/farmer/inventory - Returns inventory belonging ONLY to authenticated farmer
router.get('/', (req, res, next) => {
    inventory_controller_1.inventoryController.getFarmerInventory(req, res, next);
});
// GET /api/farmer/inventory/:productId - Returns inventory for farmer's product
router.get('/:productId', (req, res, next) => {
    inventory_controller_1.inventoryController.getInventoryByProductId(req, res, next);
});
// PATCH /api/farmer/inventory/:productId - Update stock level (APPROVED farmers ONLY)
router.patch('/:productId', (req, res, next) => {
    inventory_controller_1.inventoryController.updateStock(req, res, next);
});
exports.inventoryRoutes = router;
//# sourceMappingURL=inventory.routes.js.map