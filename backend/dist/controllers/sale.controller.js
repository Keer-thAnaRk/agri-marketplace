"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleController = exports.SaleController = void 0;
const sale_service_1 = require("../services/sale.service");
class SaleController {
    /**
     * GET /api/farmer/sales
     * Returns sales belonging strictly to the authenticated farmer.
     */
    async getFarmerSales(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
            }
            const { status, category, productName, startDate, endDate, limit, page } = req.query;
            const result = await sale_service_1.saleService.getFarmerSales(farmerId, {
                status: status,
                category: category,
                productName: productName,
                startDate: startDate,
                endDate: endDate,
                limit: limit ? Number(limit) : undefined,
                page: page ? Number(page) : undefined,
            });
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/farmer/sales/summary
     * Returns PostgreSQL-backed aggregated metrics for the authenticated farmer.
     */
    async getFarmerSalesSummary(req, res, next) {
        try {
            const farmerId = req.user?.farmerId;
            if (!farmerId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied: Must be an authenticated farmer.',
                });
            }
            const result = await sale_service_1.saleService.getFarmerSalesSummary(farmerId);
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/admin/sales/:saleId/payout
     * Admin-only: marks a sale as PAID_OUT with transactionReference and payoutDate.
     */
    async markSaleAsPaid(req, res, next) {
        try {
            const saleId = Array.isArray(req.params.saleId) ? req.params.saleId[0] : req.params.saleId;
            const { transactionReference, payoutDate } = req.body || {};
            if (!saleId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: saleId.',
                });
            }
            const result = await sale_service_1.saleService.markSaleAsPaid(saleId, {
                transactionReference,
                payoutDate,
            });
            return res.status(200).json(result);
        }
        catch (error) {
            if (error.status) {
                return res.status(error.status).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
    /**
     * GET /api/admin/sales
     * Admin-only: list all platform sales and payouts with search, filters, and metrics.
     */
    async getAdminSales(req, res, next) {
        try {
            const { status, farmerId, category, search, q, startDate, endDate, limit, page } = req.query;
            const result = await sale_service_1.saleService.getAdminSales({
                status: status,
                farmerId: farmerId,
                category: category,
                search: (search || q),
                startDate: startDate,
                endDate: endDate,
                limit: limit ? Number(limit) : undefined,
                page: page ? Number(page) : undefined,
            });
            return res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/sales/:saleId
     * Admin-only: retrieve full details of a specific sale record by ID or saleCode.
     */
    async getSaleById(req, res, next) {
        try {
            const saleId = Array.isArray(req.params.saleId) ? req.params.saleId[0] : req.params.saleId;
            if (!saleId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameter: saleId.',
                });
            }
            const result = await sale_service_1.saleService.getSaleById(saleId);
            return res.status(200).json(result);
        }
        catch (error) {
            if (error.status) {
                return res.status(error.status).json({
                    success: false,
                    error: error.message,
                });
            }
            next(error);
        }
    }
}
exports.SaleController = SaleController;
exports.saleController = new SaleController();
//# sourceMappingURL=sale.controller.js.map