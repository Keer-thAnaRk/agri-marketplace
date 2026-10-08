"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceController = exports.MarketplaceController = void 0;
const marketplace_service_1 = require("../services/marketplace.service");
class MarketplaceController {
    /**
     * GET /api/products
     * Public marketplace product catalog with search, filtering, and sorting.
     */
    async getProducts(req, res, next) {
        try {
            const { search, category, farmingMethod, isOrganic, minPrice, maxPrice, farmerId, inStock, sortBy, page, limit, } = req.query;
            const result = await marketplace_service_1.marketplaceService.getProducts({
                search: search,
                category: category,
                farmingMethod: farmingMethod,
                isOrganic: isOrganic,
                minPrice: minPrice,
                maxPrice: maxPrice,
                farmerId: farmerId,
                inStock: inStock,
                sortBy: sortBy,
                page: page,
                limit: limit,
            });
            res.status(200).json({
                success: true,
                data: result.products,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/products/:id
     * Public single product details with farmer info and harvest traceability.
     */
    async getProductById(req, res, next) {
        try {
            const productId = req.params.id;
            const product = await marketplace_service_1.marketplaceService.getProductById(productId);
            res.status(200).json({
                success: true,
                data: product,
            });
        }
        catch (error) {
            if (error.status) {
                res.status(error.status).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
    /**
     * GET /api/farmers
     * Public directory of verified, approved farmers.
     */
    async getFarmers(req, res, next) {
        try {
            const { search, farmingMethod, city, hub, page, limit } = req.query;
            const result = await marketplace_service_1.marketplaceService.getFarmers({
                search: search,
                farmingMethod: farmingMethod,
                city: city,
                hub: hub,
                page: page,
                limit: limit,
            });
            res.status(200).json({
                success: true,
                data: result.farmers,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/farmers/:id
     * Public farmer profile with full farm bio and active produce list.
     */
    async getFarmerById(req, res, next) {
        try {
            const farmerId = req.params.id;
            const farmer = await marketplace_service_1.marketplaceService.getFarmerById(farmerId);
            res.status(200).json({
                success: true,
                data: farmer,
            });
        }
        catch (error) {
            if (error.status) {
                res.status(error.status).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            next(error);
        }
    }
}
exports.MarketplaceController = MarketplaceController;
exports.marketplaceController = new MarketplaceController();
//# sourceMappingURL=marketplace.controller.js.map