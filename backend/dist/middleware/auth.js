"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requireApprovedFarmer = requireApprovedFarmer;
exports.requireFarmerOwnership = requireFarmerOwnership;
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../db/prisma");
/**
 * Middleware: Requires a valid Bearer JWT in Authorization header.
 * Attaches the authenticated user (and farmerId if farmer) to req.user.
 */
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Authentication token missing. Please provide a valid Bearer token.',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        let payload;
        try {
            payload = (0, jwt_1.verifyToken)(token);
        }
        catch {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired authentication token. Please log in again.',
            });
            return;
        }
        // Fetch user from DB to verify active status
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            include: { farmer: { select: { id: true, verificationStatus: true } } },
        });
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                error: 'User account not found or has been deactivated.',
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            avatar: user.avatar,
            farmerId: user.farmer?.id,
            verificationStatus: user.farmer?.verificationStatus,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Middleware: Requires the authenticated user to hold one of the specified roles.
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required.',
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
            });
            return;
        }
        next();
    };
}
/**
 * Middleware: Requires the authenticated user to be a FARMER whose profile is APPROVED.
 * PENDING or REJECTED farmers will receive a 403 Forbidden.
 */
function requireApprovedFarmer(req, res, next) {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
    }
    if (req.user.role !== client_1.UserRole.FARMER || !req.user.farmerId) {
        res.status(403).json({
            success: false,
            error: 'Access denied: Must be an authenticated farmer.',
        });
        return;
    }
    if (req.user.verificationStatus !== client_1.VerificationStatus.APPROVED) {
        res.status(403).json({
            success: false,
            error: `Access denied: Farmer account is not approved. Current status: ${req.user.verificationStatus || 'UNKNOWN'}`,
            verificationStatus: req.user.verificationStatus,
        });
        return;
    }
    next();
}
/**
 * Middleware: Prevents farmers from accessing or approving another farmer's records.
 * For farmer routes with :farmerId param, ensures req.user.farmerId matches param.
 */
function requireFarmerOwnership(req, res, next) {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
    }
    // Admins can bypass ownership checks
    if (req.user.role === client_1.UserRole.ADMIN) {
        next();
        return;
    }
    const requestedFarmerId = Array.isArray(req.params.farmerId)
        ? req.params.farmerId[0]
        : req.params.farmerId;
    if (!requestedFarmerId || requestedFarmerId !== req.user.farmerId) {
        res.status(403).json({
            success: false,
            error: 'Access denied: You are not authorized to access or modify records for this farmer.',
        });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map