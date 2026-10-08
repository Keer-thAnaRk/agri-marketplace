import { Request, Response, NextFunction } from 'express';
import { UserRole, VerificationStatus } from '@prisma/client';
import { verifyToken, AuthTokenPayload } from '../utils/jwt';
import { prisma } from '../db/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string | null;
  farmerId?: string;
  verificationStatus?: VerificationStatus;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware: Requires a valid Bearer JWT in Authorization header.
 * Attaches the authenticated user (and farmerId if farmer) to req.user.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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
    let payload: AuthTokenPayload;

    try {
      payload = verifyToken(token);
    } catch {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token. Please log in again.',
      });
      return;
    }

    // Fetch user from DB to verify active status
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Requires the authenticated user to hold one of the specified roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
export function requireApprovedFarmer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== UserRole.FARMER || !req.user.farmerId) {
    res.status(403).json({
      success: false,
      error: 'Access denied: Must be an authenticated farmer.',
    });
    return;
  }

  if (req.user.verificationStatus !== VerificationStatus.APPROVED) {
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
export function requireFarmerOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  // Admins can bypass ownership checks
  if (req.user.role === UserRole.ADMIN) {
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
