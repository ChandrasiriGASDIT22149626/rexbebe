import { Router } from 'express';
import {
  adminLogin,
  getAdminMe,
  adminLogout,
  login,
  getMe,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';
import { adminLoginRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

// Customer Authentication
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

// Dedicated Administrative Authentication
router.post('/admin/login', adminLoginRateLimiter, adminLogin);
router.get('/admin/me', authenticateToken, requireAdmin, getAdminMe);
router.post('/admin/logout', authenticateToken, requireAdmin, adminLogout);

export default router;
