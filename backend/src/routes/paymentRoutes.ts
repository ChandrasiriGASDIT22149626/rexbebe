import { Router } from 'express';
import { createPaymentSession, paymentCallback, verifyPayment } from '../controllers/paymentController';

const router = Router();

router.post('/create', createPaymentSession);
router.post('/callback', paymentCallback);
router.post('/verify', verifyPayment);

export default router;
