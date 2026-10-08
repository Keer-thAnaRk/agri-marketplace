import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/farmer/register - Register a new farmer
router.post('/farmer/register', (req, res, next) => {
  authController.registerFarmer(req, res, next);
});

// POST /api/auth/farmer/login - Log in an existing farmer
router.post('/farmer/login', (req, res, next) => {
  authController.loginFarmer(req, res, next);
});

// POST /api/auth/admin/login - Log in an admin user
router.post('/admin/login', (req, res, next) => {
  authController.loginAdmin(req, res, next);
});

// POST /api/auth/consumer/register - Register a consumer
router.post('/consumer/register', (req, res, next) => {
  authController.registerConsumer(req, res, next);
});

// POST /api/auth/consumer/login - Log in a consumer
router.post('/consumer/login', (req, res, next) => {
  authController.loginConsumer(req, res, next);
});

export const authRoutes = router;

