"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    async registerFarmer(req, res, next) {
        try {
            const { fullName, email, phone, password, profilePhoto, farmName, farmLocation, city, state, pincode, hub, farmingMethod, yearsFarming, mainCrops, farmDescription, govtIdFileName, govtIdFileUrl, ownershipDocFileName, ownershipDocFileUrl, farmPhotoUrl, } = req.body;
            if (!fullName || !email || !phone || !password || !farmName || !farmLocation || !pincode) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required registration fields: fullName, email, phone, password, farmName, farmLocation, and pincode are required.',
                });
                return;
            }
            if (password.length < 6) {
                res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters long.',
                });
                return;
            }
            const result = await auth_service_1.authService.registerFarmer({
                fullName,
                email,
                phone,
                password,
                profilePhoto,
                farmName,
                farmLocation,
                city,
                state,
                pincode,
                hub,
                farmingMethod,
                yearsFarming: Number(yearsFarming) || 1,
                mainCrops,
                farmDescription,
                govtIdFileName,
                govtIdFileUrl,
                ownershipDocFileName,
                ownershipDocFileUrl,
                farmPhotoUrl,
            });
            res.status(201).json({
                success: true,
                message: 'Farmer account registered successfully. Verification status is Pending Admin Approval.',
                data: result,
            });
        }
        catch (error) {
            if (error.message.includes('already exists')) {
                res.status(409).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async loginFarmer(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Email and password are required.',
                });
                return;
            }
            const result = await auth_service_1.authService.loginFarmer({ email, password });
            res.status(200).json({
                success: true,
                message: 'Farmer authenticated successfully.',
                data: result,
            });
        }
        catch (error) {
            if (error.message.includes('Invalid email or password')) {
                res.status(401).json({ success: false, error: error.message });
                return;
            }
            if (error.message.includes('Access denied')) {
                res.status(403).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async loginAdmin(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.loginAdmin({ email, password });
            res.status(200).json({
                success: true,
                message: 'Admin authenticated successfully.',
                data: result,
            });
        }
        catch (error) {
            if (error.message.includes('Invalid email or password')) {
                res.status(401).json({ success: false, error: error.message });
                return;
            }
            if (error.message.includes('Access denied')) {
                res.status(403).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async registerConsumer(req, res, next) {
        try {
            const { name, email, phone, password } = req.body;
            if (!name || !email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Name, email, and password are required.',
                });
                return;
            }
            if (password.length < 6) {
                res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters long.',
                });
                return;
            }
            const result = await auth_service_1.authService.registerConsumer({
                name,
                email,
                phone,
                password,
            });
            res.status(201).json({
                success: true,
                message: 'Consumer account registered successfully.',
                data: result,
            });
        }
        catch (error) {
            if (error.message.includes('already exists')) {
                res.status(409).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
    async loginConsumer(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email) {
                res.status(400).json({
                    success: false,
                    error: 'Email is required.',
                });
                return;
            }
            const result = await auth_service_1.authService.loginConsumer({ email, password });
            res.status(200).json({
                success: true,
                message: 'Consumer authenticated successfully.',
                data: result,
            });
        }
        catch (error) {
            if (error.message.includes('Invalid email or password') || error.message.includes('Password is required')) {
                res.status(401).json({ success: false, error: error.message });
                return;
            }
            if (error.message.includes('Access denied') || error.message.includes('deactivated')) {
                res.status(403).json({ success: false, error: error.message });
                return;
            }
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map