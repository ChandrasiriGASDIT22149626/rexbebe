import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { CustomerRepository } from '../repositories/customerRepository';
import { adminUserService, sanitizeUser } from '../services/adminUserService';
import { recordFailedAdminLogin, resetFailedAdminLogin } from '../middleware/rateLimitMiddleware';
import { AuditService } from '../services/auditService';
import { sendSuccess, sendError } from '../utils/response';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const authService = new AuthService();
const customerRepo = new CustomerRepository();

/**
 * Administrative Portal Login
 * Validates username or email and bcrypt-hashed password against admin_users.
 * Rate limited to prevent brute force attacks.
 */
export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = (req.body.username || req.body.email || req.body.usernameOrEmail || '').trim();
    const password = req.body.password;

    if (!identifier || !password) {
      throw new BadRequestError('Username/email and password are required.');
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

    const admin = adminUserService.findByEmailOrUsername(identifier);

    if (!admin) {
      const { attemptsLeft, isLocked } = recordFailedAdminLogin(req);
      AuditService.record({
        actingAdministrator: identifier,
        affectedRecord: 'AUTH_PORTAL',
        action: 'ADMIN_LOGIN_FAILED',
        reason: 'User not found',
        ip: clientIp,
      });

      const warning = isLocked 
        ? ' Too many failed attempts. Account temporarily locked for 15 minutes.'
        : attemptsLeft <= 2 ? ` (${attemptsLeft} attempt(s) remaining before temporary lockout)` : '';

      return sendError(res, `Invalid username/email or password.${warning}`, 401);
    }

    if (admin.status !== 'ACTIVE') {
      AuditService.record({
        actingAdministrator: admin.email,
        affectedRecord: admin.id,
        action: 'ADMIN_LOGIN_REJECTED',
        reason: `Account status is ${admin.status}`,
        ip: clientIp,
      });
      return sendError(res, `This administrator account is ${admin.status.toLowerCase()}. Please contact the system administrator.`, 403);
    }

    const isMatch = await adminUserService.verifyPassword(password, admin.passwordHash);

    if (!isMatch) {
      const { attemptsLeft, isLocked } = recordFailedAdminLogin(req);
      AuditService.record({
        actingAdministrator: admin.email,
        affectedRecord: admin.id,
        action: 'ADMIN_LOGIN_FAILED',
        reason: 'Incorrect password',
        ip: clientIp,
      });

      const warning = isLocked 
        ? ' Too many failed attempts. Account temporarily locked for 15 minutes.'
        : attemptsLeft <= 2 ? ` (${attemptsLeft} attempt(s) remaining before temporary lockout)` : '';

      return sendError(res, `Invalid username/email or password.${warning}`, 401);
    }

    // Successful login: reset rate limit attempts
    resetFailedAdminLogin(req);
    adminUserService.updateLastLogin(admin.id);

    AuditService.record({
      actingAdministrator: admin.email,
      affectedRecord: admin.id,
      action: 'ADMIN_LOGIN_SUCCESS',
      reason: 'Successful portal authentication',
      ip: clientIp,
    });

    const tokenPayload = {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions || [],
    };

    const token = await authService.generateToken(tokenPayload);

    return sendSuccess(res, {
      user: sanitizeUser(admin),
      token,
      expiresIn: '8h',
    }, 'Administrative authentication successful');
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated administrator profile
 */
export const getAdminMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const admin = adminUserService.findById(req.user.id);
    if (!admin) {
      // If user was deleted after token was generated
      throw new UnauthorizedError('Administrator account no longer exists');
    }

    if (admin.status !== 'ACTIVE') {
      throw new ForbiddenError('Administrator account is no longer active');
    }

    return sendSuccess(res, {
      user: sanitizeUser(admin),
    }, 'Administrator profile retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Administrative Logout
 */
export const adminLogout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    
    if (req.user) {
      AuditService.record({
        actingAdministrator: req.user.email,
        affectedRecord: req.user.id,
        action: 'ADMIN_LOGOUT',
        reason: 'User initiated portal logout',
        ip: clientIp,
      });
    }

    return sendSuccess(res, { loggedOut: true }, 'Administrative session ended successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Customer / Storefront Login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const customer = await customerRepo.findByEmail(email);

    if (!customer) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Validate customer password if customer record has a password hash
    if (customer.passwordHash) {
      const match = await authService.comparePassword(password, customer.passwordHash);
      if (!match) throw new UnauthorizedError('Invalid credentials');
    }

    const userPayload = {
      id: customer.id,
      email: customer.email,
      role: 'CUSTOMER',
    };

    const token = await authService.generateToken(userPayload);

    return sendSuccess(res, {
      user: {
        id: customer.id,
        name: customer.name || 'Valued Customer',
        email: customer.email,
        role: 'CUSTOMER',
      },
      token,
    }, 'Authentication successful');
  } catch (err) {
    next(err);
  }
};

/**
 * Get current customer profile
 */
export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, {
      user: req.user,
    }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
};
