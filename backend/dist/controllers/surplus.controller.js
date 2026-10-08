"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.surplusController = exports.SurplusController = void 0;
const surplus_service_1 = require("../services/surplus.service");
class SurplusController {
    /**
     * GET /api/surplus (Public / Consumer Marketplace)
     */
    async getPublicSurplusOffers(req, res, next) {
        try {
            const { category, search, minDiscount, sortBy, page, limit } = req.query;
            const result = await surplus_service_1.surplusService.getPublicSurplusOffers({
                category: typeof category === 'string' ? category : undefined,
                search: typeof search === 'string' ? search : undefined,
                minDiscount: typeof minDiscount === 'string' ? minDiscount : undefined,
                sortBy: typeof sortBy === 'string' ? sortBy : undefined,
                page: typeof page === 'string' ? page : undefined,
                limit: typeof limit === 'string' ? limit : undefined,
            });
            res.status(200).json({
                success: true,
                count: result.offers.length,
                data: result.offers,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/surplus/:id (Public / Consumer single offer)
     */
    async getPublicSurplusOfferById(req, res, next) {
        try {
            const offerId = req.params.id;
            const offer = await surplus_service_1.surplusService.getPublicSurplusOfferById(offerId);
            res.status(200).json({
                success: true,
                data: offer,
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
     * GET /api/farmer/surplus
     * Return surplus offers belonging ONLY to the authenticated farmer.
     */
    async getFarmerSurplusOffers(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const offers = await surplus_service_1.surplusService.getFarmerSurplusOffers(farmerId);
            res.status(200).json({
                success: true,
                count: offers.length,
                data: offers,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/farmer/surplus/:id
     * Return a single surplus offer for the authenticated farmer.
     */
    async getFarmerSurplusOfferById(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const offerId = req.params.id;
            const offer = await surplus_service_1.surplusService.getFarmerSurplusOfferById(farmerId, offerId);
            res.status(200).json({
                success: true,
                data: offer,
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
     * POST /api/farmer/surplus
     * Create a surplus flash discount offer (APPROVED farmers ONLY).
     */
    async createSurplusOffer(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            // Ignore any farmerId or offerPrice sent in client payload
            const { farmerId: _ignoredFarmerId, offerPrice: _ignoredPrice, ...payload } = req.body;
            const created = await surplus_service_1.surplusService.createSurplusOffer(farmerId, payload);
            res.status(201).json({
                success: true,
                message: 'Surplus flash offer published successfully.',
                data: created,
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
     * PATCH /api/farmer/surplus/:id
     * Modify an active surplus offer (APPROVED farmers ONLY).
     */
    async updateSurplusOffer(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const offerId = req.params.id;
            const { farmerId: _ignored, offerPrice: _ignoredPrice, ...payload } = req.body;
            const updated = await surplus_service_1.surplusService.updateSurplusOffer(farmerId, offerId, payload);
            res.status(200).json({
                success: true,
                message: 'Surplus offer updated successfully.',
                data: updated,
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
     * DELETE /api/farmer/surplus/:id
     * Cancel an active surplus offer (APPROVED farmers ONLY).
     */
    async cancelSurplusOffer(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
                return;
            }
            const offerId = req.params.id;
            const cancelled = await surplus_service_1.surplusService.cancelSurplusOffer(farmerId, offerId);
            res.status(200).json({
                success: true,
                message: 'Surplus offer cancelled successfully.',
                data: cancelled,
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
exports.SurplusController = SurplusController;
exports.surplusController = new SurplusController();
//# sourceMappingURL=surplus.controller.js.map