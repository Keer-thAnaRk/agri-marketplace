"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumerController = exports.ConsumerController = void 0;
const consumer_service_1 = require("../services/consumer.service");
class ConsumerController {
    async getProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const profile = await consumer_service_1.consumerService.getProfile(userId);
            res.status(200).json({
                success: true,
                data: profile,
            });
        }
        catch (error) {
            if (error.status === 404 || error.message?.includes('not found')) {
                res.status(404).json({ success: false, error: error.message });
                return;
            }
            if (error.status === 403 || error.message?.includes('deactivated')) {
                res.status(403).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const { name, phone, avatar } = req.body || {};
            const updated = await consumer_service_1.consumerService.updateProfile(userId, { name, phone, avatar });
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully.',
                data: updated,
            });
        }
        catch (error) {
            if (error.status === 400 || error.message?.includes('Name cannot be empty')) {
                res.status(400).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async getAddresses(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const addresses = await consumer_service_1.consumerService.getAddresses(userId);
            res.status(200).json({
                success: true,
                data: addresses,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const { name, phone, addressLine, city, state, pincode, hub, isDefault } = req.body || {};
            const address = await consumer_service_1.consumerService.createAddress(userId, {
                name,
                phone,
                addressLine,
                city,
                state,
                pincode,
                hub,
                isDefault,
            });
            res.status(201).json({
                success: true,
                message: 'Delivery address added successfully.',
                data: address,
            });
        }
        catch (error) {
            if (error.status === 400) {
                res.status(400).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async updateAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            if (!addressId) {
                res.status(400).json({ success: false, error: 'Address ID is required.' });
                return;
            }
            const updated = await consumer_service_1.consumerService.updateAddress(userId, addressId, req.body || {});
            res.status(200).json({
                success: true,
                message: 'Delivery address updated successfully.',
                data: updated,
            });
        }
        catch (error) {
            if (error.status === 400) {
                res.status(400).json({ success: false, error: error.message });
                return;
            }
            if (error.status === 404 || error.message?.includes('not found')) {
                res.status(404).json({ success: false, error: error.message });
                return;
            }
            if (error.status === 403 || error.message?.includes('Access denied')) {
                res.status(403).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async deleteAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            if (!addressId) {
                res.status(400).json({ success: false, error: 'Address ID is required.' });
                return;
            }
            const result = await consumer_service_1.consumerService.deleteAddress(userId, addressId);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.status === 404 || error.message?.includes('not found')) {
                res.status(404).json({ success: false, error: error.message });
                return;
            }
            if (error.status === 403 || error.message?.includes('Access denied')) {
                res.status(403).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async setDefaultAddress(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const addressId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            if (!addressId) {
                res.status(400).json({ success: false, error: 'Address ID is required.' });
                return;
            }
            const updated = await consumer_service_1.consumerService.setDefaultAddress(userId, addressId);
            res.status(200).json({
                success: true,
                message: 'Address set as primary default.',
                data: updated,
            });
        }
        catch (error) {
            if (error.status === 404 || error.message?.includes('not found')) {
                res.status(404).json({ success: false, error: error.message });
                return;
            }
            if (error.status === 403 || error.message?.includes('Access denied')) {
                res.status(403).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async getProductReviews(req, res, next) {
        try {
            const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
            if (!productId) {
                res.status(400).json({ success: false, error: 'Product ID is required.' });
                return;
            }
            const result = await consumer_service_1.consumerService.getProductReviews(productId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            if (error.status === 404) {
                res.status(404).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async getMyReviews(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const reviews = await consumer_service_1.consumerService.getConsumerReviews(userId);
            res.status(200).json({ success: true, data: reviews });
        }
        catch (error) {
            next(error);
        }
    }
    async createReview(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
            if (!productId) {
                res.status(400).json({ success: false, error: 'Product ID is required.' });
                return;
            }
            const review = await consumer_service_1.consumerService.createReview(userId, productId, req.body || {});
            res.status(201).json({
                success: true,
                message: 'Review submitted successfully.',
                data: review,
            });
        }
        catch (error) {
            const status = error.status || 400;
            if (status === 400 || status === 403 || status === 404 || status === 409) {
                res.status(status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async updateReview(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
            if (!reviewId) {
                res.status(400).json({ success: false, error: 'Review ID is required.' });
                return;
            }
            const updated = await consumer_service_1.consumerService.updateReview(userId, reviewId, req.body || {});
            res.status(200).json({
                success: true,
                message: 'Review updated successfully.',
                data: updated,
            });
        }
        catch (error) {
            const status = error.status || 400;
            if (status === 400 || status === 403 || status === 404) {
                res.status(status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async deleteReview(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
            if (!reviewId) {
                res.status(400).json({ success: false, error: 'Review ID is required.' });
                return;
            }
            const result = await consumer_service_1.consumerService.deleteReview(userId, reviewId);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            const status = error.status || 400;
            if (status === 400 || status === 403 || status === 404) {
                res.status(status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async getMyDisputes(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const disputes = await consumer_service_1.consumerService.getConsumerDisputes(userId);
            res.status(200).json({ success: true, data: disputes });
        }
        catch (error) {
            next(error);
        }
    }
    async getDisputeById(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const disputeId = Array.isArray(req.params.disputeId) ? req.params.disputeId[0] : req.params.disputeId;
            if (!disputeId) {
                res.status(400).json({ success: false, error: 'Dispute ID is required.' });
                return;
            }
            const dispute = await consumer_service_1.consumerService.getConsumerDisputeById(userId, disputeId);
            res.status(200).json({ success: true, data: dispute });
        }
        catch (error) {
            const status = error.status || 400;
            if (status === 400 || status === 403 || status === 404) {
                res.status(status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async createDispute(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: 'Authentication required.' });
                return;
            }
            const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
            if (!orderId) {
                res.status(400).json({ success: false, error: 'Order ID is required.' });
                return;
            }
            const dispute = await consumer_service_1.consumerService.createDispute(userId, orderId, req.body || {});
            res.status(201).json({
                success: true,
                message: 'Dispute submitted successfully.',
                data: dispute,
            });
        }
        catch (error) {
            const status = error.status || 400;
            if (status === 400 || status === 403 || status === 404) {
                res.status(status).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
}
exports.ConsumerController = ConsumerController;
exports.consumerController = new ConsumerController();
//# sourceMappingURL=consumer.controller.js.map