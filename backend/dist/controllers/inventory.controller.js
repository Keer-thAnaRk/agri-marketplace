"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const inventory_service_1 = require("../services/inventory.service");
class InventoryController {
    /**
     * GET /api/farmer/inventory
     * Returns inventory belonging ONLY to the authenticated farmer.
     */
    async getFarmerInventory(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const items = await inventory_service_1.inventoryService.getFarmerInventory(farmerId);
            res.status(200).json({
                success: true,
                count: items.length,
                data: items,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/farmer/inventory/:productId
     * Returns inventory for the authenticated farmer's product.
     */
    async getInventoryByProductId(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const productId = req.params.productId;
            const item = await inventory_service_1.inventoryService.getInventoryByProductId(farmerId, productId);
            res.status(200).json({
                success: true,
                data: item,
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
     * PATCH /api/farmer/inventory/:productId
     * Updates inventory stock level for the authenticated, approved farmer.
     */
    async updateStock(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const productId = req.params.productId;
            const updatedItem = await inventory_service_1.inventoryService.updateStock(farmerId, productId, req.body);
            res.status(200).json({
                success: true,
                message: 'Inventory stock level updated successfully.',
                data: updatedItem,
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
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map