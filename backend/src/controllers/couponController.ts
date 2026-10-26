import { Request, Response, NextFunction } from 'express';
import { CouponService } from '../services/couponService';
import { sendSuccess } from '../utils/response';

const couponService = new CouponService();

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await couponService.getCoupons();
    return sendSuccess(res, coupons, 'Coupons list retrieved');
  } catch (err) {
    next(err);
  }
};

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal = 0 } = req.body;
    const result = await couponService.validateCoupon(code, subtotal);
    return sendSuccess(res, result, result.valid ? 'Coupon applied successfully' : 'Invalid coupon');
  } catch (err) {
    next(err);
  }
};
