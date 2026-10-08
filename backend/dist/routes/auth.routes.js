"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// POST /api/auth/farmer/register - Register a new farmer
router.post('/farmer/register', (req, res, next) => {
    auth_controller_1.authController.registerFarmer(req, res, next);
});
// POST /api/auth/farmer/login - Log in an existing farmer
router.post('/farmer/login', (req, res, next) => {
    auth_controller_1.authController.loginFarmer(req, res, next);
});
// POST /api/auth/admin/login - Log in an admin user
router.post('/admin/login', (req, res, next) => {
    auth_controller_1.authController.loginAdmin(req, res, next);
});
// POST /api/auth/consumer/register - Register a consumer
router.post('/consumer/register', (req, res, next) => {
    auth_controller_1.authController.registerConsumer(req, res, next);
});
// POST /api/auth/consumer/login - Log in a consumer
router.post('/consumer/login', (req, res, next) => {
    auth_controller_1.authController.loginConsumer(req, res, next);
});
exports.authRoutes = router;
//# sourceMappingURL=auth.routes.js.map