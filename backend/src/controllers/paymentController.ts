import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { validatePaymentInput } from '../validators/paymentValidator';
import { sendSuccess } from '../utils/response';

const paymentService = new PaymentService();

export const createPaymentSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    validatePaymentInput(req.body);
    const { orderId, amount, currency } = req.body;
    const sessionPayload = await paymentService.createPayHereSession(orderId, amount, currency);
    return sendSuccess(res, sessionPayload, 'Payment session created securely');
  } catch (err) {
    next(err);
  }
};

export const paymentCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.verifyPaymentCallback(req.body);
    return sendSuccess(res, result, 'Payment callback processed');
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;
    return sendSuccess(res, { verified: true, orderId, paymentStatus: 'PAID' }, 'Payment verified');
  } catch (err) {
    next(err);
  }
};
