"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.harvestRoutes = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const harvest_controller_1 = require("../controllers/harvest.controller");
const router = (0, express_1.Router)();
// All farmer harvest routes require authenticated, APPROVED farmer
router.use(auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER), auth_1.requireApprovedFarmer);
// GET /api/farmer/harvests - Returns harvest batches belonging ONLY to authenticated farmer
router.get('/', (req, res, next) => {
    harvest_controller_1.harvestController.getFarmerHarvests(req, res, next);
});
// GET /api/farmer/harvests/:batchId/traceability - Returns traceability events (APPROVED farmers ONLY)
router.get('/:batchId/traceability', (req, res, next) => {
    harvest_controller_1.harvestController.getTraceabilityEvents(req, res, next);
});
// POST /api/farmer/harvests/:batchId/traceability - Adds traceability event (APPROVED farmers ONLY)
router.post('/:batchId/traceability', (req, res, next) => {
    harvest_controller_1.harvestController.addTraceabilityEvent(req, res, next);
});
// GET /api/farmer/harvests/:id - Returns single harvest batch for authenticated farmer
router.get('/:id', (req, res, next) => {
    harvest_controller_1.harvestController.getFarmerHarvestById(req, res, next);
});
// POST /api/farmer/harvests - Records new harvest batch (APPROVED farmers ONLY)
router.post('/', (req, res, next) => {
    harvest_controller_1.harvestController.createHarvest(req, res, next);
});
// POST /api/farmer/harvests/:id/events - Adds traceability event (APPROVED farmers ONLY)
router.post('/:id/events', (req, res, next) => {
    harvest_controller_1.harvestController.addTraceabilityEvent(req, res, next);
});
exports.harvestRoutes = router;
//# sourceMappingURL=harvest.routes.js.map