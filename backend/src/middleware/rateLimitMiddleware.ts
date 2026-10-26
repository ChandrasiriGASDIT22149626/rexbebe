import { Request, Response, NextFunction } from 'express';

const ipRequestMap = new Map<string, { count: number; resetTime: number }>();
const LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 200;

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // In development, or for local IP requests and administrative APIs, bypass general rate limit
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
  if (process.env.NODE_ENV !== 'production' || isLocal || req.path.startsWith('/api/admin') || req.path.startsWith('/api/categories') || req.path.startsWith('/api/navigation')) {
    return next();
  }

  const now = Date.now();
  const record = ipRequestMap.get(ip);
  if (!record || now > record.resetTime) {
    ipRequestMap.set(ip, { count: 1, resetTime: now + LIMIT_WINDOW_MS });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  }

  next();
};

// Dedicated Admin Login Rate Limiting (Brute-force protection)
interface LoginAttemptRecord {
  failedCount: number;
  lockedUntil: number | null;
  resetTime: number;
}

const loginAttemptsMap = new Map<string, LoginAttemptRecord>();
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';
  const bodyId = (req.body?.username || req.body?.email || req.body?.usernameOrEmail || '').toLowerCase().trim();
  return `${ip}::${bodyId || 'anon'}`;
}

export const adminLoginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = getClientIdentifier(req);
  const now = Date.now();
  const record = loginAttemptsMap.get(key);

  if (record) {
    // Check if currently locked out
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. This account/IP is temporarily locked for security. Please try again in ${remainingMinutes} minute(s).`,
        retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      });
    }

    // Reset expired window
    if (now > record.resetTime) {
      loginAttemptsMap.delete(key);
    }
  }

  next();
};

export const recordFailedAdminLogin = (req: Request): { attemptsLeft: number; isLocked: boolean } => {
  const key = getClientIdentifier(req);
  const now = Date.now();
  let record = loginAttemptsMap.get(key);

  if (!record || now > record.resetTime) {
    record = {
      failedCount: 1,
      lockedUntil: null,
      resetTime: now + LOGIN_ATTEMPT_WINDOW_MS,
    };
  } else {
    record.failedCount += 1;
  }

  if (record.failedCount >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttemptsMap.set(key, record);
    return { attemptsLeft: 0, isLocked: true };
  }

  loginAttemptsMap.set(key, record);
  return { attemptsLeft: MAX_FAILED_ATTEMPTS - record.failedCount, isLocked: false };
};

export const resetFailedAdminLogin = (req: Request): void => {
  const key = getClientIdentifier(req);
  loginAttemptsMap.delete(key);
};
