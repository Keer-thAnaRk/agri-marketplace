"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.surplusRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const surplus_controller_1 = require("../controllers/surplus.controller");
const router = (0, express_1.Router)();
// All farmer surplus routes require authenticated, APPROVED farmer
router.use(auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER), auth_1.requireApprovedFarmer);
// GET /api/farmer/surplus - Returns surplus offers belonging ONLY to authenticated farmer
router.get('/', (req, res, next) => {
    surplus_controller_1.surplusController.getFarmerSurplusOffers(req, res, next);
});
// GET /api/farmer/surplus/:id - Returns single surplus offer for authenticated farmer
router.get('/:id', (req, res, next) => {
    surplus_controller_1.surplusController.getFarmerSurplusOfferById(req, res, next);
});
// POST /api/farmer/surplus - Creates surplus flash offer (APPROVED farmers ONLY)
router.post('/', (req, res, next) => {
    surplus_controller_1.surplusController.createSurplusOffer(req, res, next);
});
// PATCH /api/farmer/surplus/:id - Modifies active surplus offer (APPROVED farmers ONLY)
router.patch('/:id', (req, res, next) => {
    surplus_controller_1.surplusController.updateSurplusOffer(req, res, next);
});
// DELETE /api/farmer/surplus/:id - Cancels active surplus offer (APPROVED farmers ONLY)
router.delete('/:id', (req, res, next) => {
    surplus_controller_1.surplusController.cancelSurplusOffer(req, res, next);
});
exports.surplusRoutes = router;
//# sourceMappingURL=surplus.routes.js.map