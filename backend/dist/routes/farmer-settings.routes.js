"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerSettingsRoutes = void 0;
const express_1 = require("express");
const farmer_settings_controller_1 = require("../controllers/farmer-settings.controller");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All settings endpoints require authenticated FARMER
router.use(auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.FARMER));
// GET /api/farmer/settings
router.get('/', (req, res, next) => {
    farmer_settings_controller_1.farmerSettingsController.getFarmerSettings(req, res, next);
});
// PATCH /api/farmer/settings
router.patch('/', (req, res, next) => {
    farmer_settings_controller_1.farmerSettingsController.updateFarmerSettings(req, res, next);
});
// PATCH /api/farmer/settings/password
router.patch('/password', (req, res, next) => {
    farmer_settings_controller_1.farmerSettingsController.changePassword(req, res, next);
});
exports.farmerSettingsRoutes = router;
//# sourceMappingURL=farmer-settings.routes.js.map