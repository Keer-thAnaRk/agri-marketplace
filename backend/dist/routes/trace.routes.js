"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceRoutes = void 0;
const express_1 = require("express");
const harvest_controller_1 = require("../controllers/harvest.controller");
const router = (0, express_1.Router)();
// GET /api/trace/:batchId - Public endpoint to retrieve batch traceability information
router.get('/:batchId', (req, res, next) => {
    harvest_controller_1.harvestController.getPublicTrace(req, res, next);
});
exports.traceRoutes = router;
//# sourceMappingURL=trace.routes.js.map