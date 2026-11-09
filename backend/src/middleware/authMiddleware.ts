import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UnauthorizedError } from '../utils/errors';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username?: string;
  name?: string;
  role: string;
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Extracts authentication token from Authorization header, custom headers, or session cookies.
 */
export function extractTokenFromRequest(req: Request): string | null {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const t = authHeader.split(' ')[1]?.trim();
    if (t) return t;
  }

  // 2. Custom header fallback: "x-admin-token" or "x-access-token"
  const customHeader = req.headers['x-admin-token'] || req.headers['x-access-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }

  // 3. Cookie fallback: check parsed cookies or raw cookie header
  const rawCookies = (req as any).cookies || req.headers['cookie'];
  if (typeof rawCookies === 'object' && rawCookies !== null) {
    const cToken = rawCookies['rexbebe_admin_token'] || rawCookies['admin_token'] || rawCookies['token'];
    if (typeof cToken === 'string' && cToken.trim()) return cToken.trim();
  } else if (typeof rawCookies === 'string') {
    const match = rawCookies.match(/(?:^|;\s*)(?:rexbebe_admin_token|admin_token|token)=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  }

  return null;
}

/**
 * Validates the JWT Bearer token on incoming requests.
 * Secure: strictly checks cryptographic signature and expiration.
 * No backdoors or test header overrides permitted.
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromRequest(req);

  if (!token) {
    req.user = undefined;
    return next(new UnauthorizedError('Authentication required. Please log in with valid credentials.'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Session expired. Please log in again.'));
    }
    return next(new UnauthorizedError('Invalid or expired authentication token.'));
  }
};

/**
 * Optional token authentication: decodes user if token provided, but doesn't block if missing.
 */
export const optionalAuthenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromRequest(req);

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthenticatedUser;
    req.user = decoded;
  } catch {
    req.user = undefined;
  }
  next();
};
