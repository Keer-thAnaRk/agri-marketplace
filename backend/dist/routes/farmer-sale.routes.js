"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerSaleRoutes = void 0;
const express_1 = require("express");
const sale_controller_1 = require("../controllers/sale.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All farmer sales routes require authentication and APPROVED farmer status
router.use(auth_1.requireAuth, auth_1.requireApprovedFarmer);
// GET /api/farmer/sales/summary - PostgreSQL aggregation summary
router.get('/summary', (req, res, next) => {
    sale_controller_1.saleController.getFarmerSalesSummary(req, res, next);
});
// GET /api/farmer/sales - List sales for authenticated farmer with optional filters
router.get('/', (req, res, next) => {
    sale_controller_1.saleController.getFarmerSales(req, res, next);
});
exports.farmerSaleRoutes = router;
//# sourceMappingURL=farmer-sale.routes.js.map