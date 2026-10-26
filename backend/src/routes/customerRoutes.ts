import { Router } from 'express';
import { getMeCustomer, getMyOrders, getAllCustomers } from '../controllers/customerController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

router.get('/me', authenticateToken, getMeCustomer);
router.get('/me/orders', authenticateToken, getMyOrders);
router.get('/admin/all', authenticateToken, requireAdmin, getAllCustomers);

export default router;
