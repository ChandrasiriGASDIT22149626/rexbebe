import { Router } from 'express';
import { getCoupons, validateCoupon } from '../controllers/couponController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

router.get('/', authenticateToken, requireAdmin, getCoupons);
router.post('/validate', validateCoupon);

export default router;
