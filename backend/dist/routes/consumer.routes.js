"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumerRoutes = void 0;
const express_1 = require("express");
const consumer_controller_1 = require("../controllers/consumer.controller");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Protect all consumer endpoints: valid JWT required and must be CONSUMER or ADMIN
router.use(auth_1.requireAuth);
router.use((0, auth_1.requireRole)(client_1.UserRole.CONSUMER, client_1.UserRole.ADMIN));
// Consumer Profile
router.get('/profile', (req, res, next) => {
    consumer_controller_1.consumerController.getProfile(req, res, next);
});
router.get('/me', (req, res, next) => {
    consumer_controller_1.consumerController.getProfile(req, res, next);
});
router.patch('/profile', (req, res, next) => {
    consumer_controller_1.consumerController.updateProfile(req, res, next);
});
router.put('/profile', (req, res, next) => {
    consumer_controller_1.consumerController.updateProfile(req, res, next);
});
// Consumer Address Management
router.get('/addresses', (req, res, next) => {
    consumer_controller_1.consumerController.getAddresses(req, res, next);
});
router.post('/addresses', (req, res, next) => {
    consumer_controller_1.consumerController.createAddress(req, res, next);
});
router.put('/addresses/:id', (req, res, next) => {
    consumer_controller_1.consumerController.updateAddress(req, res, next);
});
router.patch('/addresses/:id', (req, res, next) => {
    consumer_controller_1.consumerController.updateAddress(req, res, next);
});
router.delete('/addresses/:id', (req, res, next) => {
    consumer_controller_1.consumerController.deleteAddress(req, res, next);
});
router.patch('/addresses/:id/default', (req, res, next) => {
    consumer_controller_1.consumerController.setDefaultAddress(req, res, next);
});
router.post('/addresses/:id/default', (req, res, next) => {
    consumer_controller_1.consumerController.setDefaultAddress(req, res, next);
});
// Consumer Cart Management
router.get('/cart', (req, res, next) => {
    cart_controller_1.cartController.getCart(req, res, next);
});
router.post('/cart', (req, res, next) => {
    cart_controller_1.cartController.addToCart(req, res, next);
});
router.patch('/cart/:productId', (req, res, next) => {
    cart_controller_1.cartController.updateCartItemQuantity(req, res, next);
});
router.put('/cart/:productId', (req, res, next) => {
    cart_controller_1.cartController.updateCartItemQuantity(req, res, next);
});
router.delete('/cart/:productId', (req, res, next) => {
    cart_controller_1.cartController.removeFromCart(req, res, next);
});
router.delete('/cart', (req, res, next) => {
    cart_controller_1.cartController.clearCart(req, res, next);
});
// Reviews (consumer-owned): create, list, edit, delete
router.get('/reviews', (req, res, next) => {
    consumer_controller_1.consumerController.getMyReviews(req, res, next);
});
router.get('/products/:productId/reviews', (req, res, next) => {
    consumer_controller_1.consumerController.getProductReviews(req, res, next);
});
router.post('/products/:productId/reviews', (req, res, next) => {
    consumer_controller_1.consumerController.createReview(req, res, next);
});
router.patch('/reviews/:reviewId', (req, res, next) => {
    consumer_controller_1.consumerController.updateReview(req, res, next);
});
router.delete('/reviews/:reviewId', (req, res, next) => {
    consumer_controller_1.consumerController.deleteReview(req, res, next);
});
// Disputes (consumer-owned)
router.get('/disputes', (req, res, next) => {
    consumer_controller_1.consumerController.getMyDisputes(req, res, next);
});
router.get('/disputes/:disputeId', (req, res, next) => {
    consumer_controller_1.consumerController.getDisputeById(req, res, next);
});
router.post('/orders/:orderId/disputes', (req, res, next) => {
    consumer_controller_1.consumerController.createDispute(req, res, next);
});
exports.consumerRoutes = router;
//# sourceMappingURL=consumer.routes.js.map