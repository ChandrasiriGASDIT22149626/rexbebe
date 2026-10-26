import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

const ALLOWED_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'STORE_MANAGER',
  'CONTENT_MANAGER',
  'CUSTOMER_SUPPORT',
];

/**
 * Ensures the authenticated user has administrative privileges.
 * Customers and unauthenticated visitors are strictly blocked.
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Administrative credentials required. Please log in to continue.'));
  }

  if (!ALLOWED_ADMIN_ROLES.includes(req.user.role)) {
    return next(new ForbiddenError('Access denied: Administrator privileges required for this section. Customers cannot access admin functionality.'));
  }

  next();
};

/**
 * Restricts access to Super Administrators only (e.g., managing other admin users, system setup).
 */
export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Administrative credentials required. Please log in to continue.'));
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return next(new ForbiddenError('Access denied: Super Administrator privileges required.'));
  }

  next();
};
