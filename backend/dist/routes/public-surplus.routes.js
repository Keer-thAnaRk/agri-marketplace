"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicSurplusRoutes = void 0;
const express_1 = require("express");
const surplus_controller_1 = require("../controllers/surplus.controller");
const router = (0, express_1.Router)();
// GET /api/surplus - Public/consumer surplus marketplace offers
router.get('/', (req, res, next) => {
    surplus_controller_1.surplusController.getPublicSurplusOffers(req, res, next);
});
// GET /api/surplus/:id - Public/consumer single surplus offer details
router.get('/:id', (req, res, next) => {
    surplus_controller_1.surplusController.getPublicSurplusOfferById(req, res, next);
});
exports.publicSurplusRoutes = router;
//# sourceMappingURL=public-surplus.routes.js.map