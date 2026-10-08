"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerSettingsController = exports.FarmerSettingsController = void 0;
const farmer_settings_service_1 = require("../services/farmer-settings.service");
class FarmerSettingsController {
    /**
     * GET /api/farmer/settings
     * Returns settings and preferences for authenticated farmer.
     */
    async getFarmerSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const data = await farmer_settings_service_1.farmerSettingsService.getFarmerSettings(userId);
            res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
            if (error.status) {
                res.status(error.status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    /**
     * PATCH /api/farmer/settings
     * Updates settings and preferences for authenticated farmer.
     */
    async updateFarmerSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const data = await farmer_settings_service_1.farmerSettingsService.updateFarmerSettings(userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Settings updated successfully.',
                data,
            });
        }
        catch (error) {
            if (error.status) {
                res.status(error.status).json({ success: false, error: error.message });
                return;
            }
            const msg = error.message || '';
            if (msg.includes('Name cannot be empty') || msg.includes('cannot be empty')) {
                res.status(400).json({ success: false, error: msg });
                return;
            }
            if (msg.includes('Modification of protected field')) {
                res.status(403).json({ success: false, error: msg });
                return;
            }
            next(error);
        }
    }
    /**
     * PATCH /api/farmer/settings/password
     * Changes password for authenticated farmer.
     */
    async changePassword(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await farmer_settings_service_1.farmerSettingsService.changePassword(userId, req.body);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            if (error.status) {
                res.status(error.status).json({ success: false, error: error.message });
                return;
            }
            const msg = error.message || '';
            if (msg.includes('Current password is required') ||
                msg.includes('New password is required') ||
                msg.includes('Incorrect current password') ||
                msg.includes('at least 6 characters') ||
                msg.includes('cannot be identical')) {
                res.status(400).json({ success: false, error: msg });
                return;
            }
            next(error);
        }
    }
}
exports.FarmerSettingsController = FarmerSettingsController;
exports.farmerSettingsController = new FarmerSettingsController();
//# sourceMappingURL=farmer-settings.controller.js.map