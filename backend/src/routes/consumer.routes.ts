import { Router } from 'express';
import { consumerController } from '../controllers/consumer.controller';
import { cartController } from '../controllers/cart.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Protect all consumer endpoints: valid JWT required and must be CONSUMER or ADMIN
router.use(requireAuth);
router.use(requireRole(UserRole.CONSUMER, UserRole.ADMIN));

// Consumer Profile
router.get('/profile', (req, res, next) => {
  consumerController.getProfile(req, res, next);
});

router.get('/me', (req, res, next) => {
  consumerController.getProfile(req, res, next);
});

router.patch('/profile', (req, res, next) => {
  consumerController.updateProfile(req, res, next);
});

router.put('/profile', (req, res, next) => {
  consumerController.updateProfile(req, res, next);
});

// Consumer Address Management
router.get('/addresses', (req, res, next) => {
  consumerController.getAddresses(req, res, next);
});

router.post('/addresses', (req, res, next) => {
  consumerController.createAddress(req, res, next);
});

router.put('/addresses/:id', (req, res, next) => {
  consumerController.updateAddress(req, res, next);
});

router.patch('/addresses/:id', (req, res, next) => {
  consumerController.updateAddress(req, res, next);
});

router.delete('/addresses/:id', (req, res, next) => {
  consumerController.deleteAddress(req, res, next);
});

router.patch('/addresses/:id/default', (req, res, next) => {
  consumerController.setDefaultAddress(req, res, next);
});

router.post('/addresses/:id/default', (req, res, next) => {
  consumerController.setDefaultAddress(req, res, next);
});

// Consumer Cart Management
router.get('/cart', (req, res, next) => {
  cartController.getCart(req, res, next);
});

router.post('/cart', (req, res, next) => {
  cartController.addToCart(req, res, next);
});

router.patch('/cart/:productId', (req, res, next) => {
  cartController.updateCartItemQuantity(req, res, next);
});

router.put('/cart/:productId', (req, res, next) => {
  cartController.updateCartItemQuantity(req, res, next);
});

router.delete('/cart/:productId', (req, res, next) => {
  cartController.removeFromCart(req, res, next);
});

router.delete('/cart', (req, res, next) => {
  cartController.clearCart(req, res, next);
});

// Reviews (consumer-owned): create, list, edit, delete
router.get('/reviews', (req, res, next) => {
  consumerController.getMyReviews(req, res, next);
});

router.get('/products/:productId/reviews', (req, res, next) => {
  consumerController.getProductReviews(req, res, next);
});

router.post('/products/:productId/reviews', (req, res, next) => {
  consumerController.createReview(req, res, next);
});

router.patch('/reviews/:reviewId', (req, res, next) => {
  consumerController.updateReview(req, res, next);
});

router.delete('/reviews/:reviewId', (req, res, next) => {
  consumerController.deleteReview(req, res, next);
});

// Disputes (consumer-owned)
router.get('/disputes', (req, res, next) => {
  consumerController.getMyDisputes(req, res, next);
});

router.get('/disputes/:disputeId', (req, res, next) => {
  consumerController.getDisputeById(req, res, next);
});

router.post('/orders/:orderId/disputes', (req, res, next) => {
  consumerController.createDispute(req, res, next);
});

export const consumerRoutes = router;
