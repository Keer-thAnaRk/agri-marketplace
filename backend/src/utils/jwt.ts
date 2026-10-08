import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  farmerId?: string;
}

/**
 * Generates a signed JWT authentication token for a session.
 */
export function generateToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwtSecret, options);
}

/**
 * Synchronously verifies a JWT token and returns the decoded payload.
 * Throws an error if invalid or expired.
 */
export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
