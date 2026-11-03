import { promotionService } from './promotionService';

export interface CouponItem {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  minSpend: number;
  isActive: boolean;
}

export class CouponService {
  private baseCoupons: CouponItem[] = [
    { code: 'REXBEBE10', discountType: 'PERCENTAGE', value: 10, minSpend: 10000, isActive: true },
    { code: 'WELCOME5000', discountType: 'FIXED', value: 5000, minSpend: 30000, isActive: true },
  ];

  async getCoupons(): Promise<CouponItem[]> {
    const list = [...this.baseCoupons];
    try {
      const popup = await promotionService.getPopupConfig();
      if (popup.enabled && popup.promoCode) {
        list.push({
          code: popup.promoCode.toUpperCase(),
          discountType: popup.discountType || 'PERCENTAGE',
          value: popup.discountPercentage || 20,
          minSpend: popup.minSpend || 0,
          isActive: true,
        });
      }
    } catch (e) {
      console.warn('[CouponService] Notice getting popup coupon:', e);
    }
    return list;
  }

  async validateCoupon(code: string, subtotal: number) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, message: 'Please enter a promo code' };
    }

    // 1. Check active promotional popup coupon first
    try {
      const popup = await promotionService.getPopupConfig();
      if (popup.enabled && popup.promoCode && popup.promoCode.toUpperCase() === cleanCode) {
        const today = new Date().toISOString().split('T')[0];
        if (popup.startDate && popup.startDate > today) {
          return { valid: false, message: `This promotion starts on ${popup.startDate}` };
        }
        if (popup.endDate && popup.endDate < today) {
          return { valid: false, message: 'This promotional offer has expired' };
        }
        if (subtotal < (popup.minSpend || 0)) {
          return {
            valid: false,
            message: `Minimum spend of LKR ${(popup.minSpend || 0).toLocaleString()} required for this code`,
          };
        }

        const value = popup.discountPercentage || 20;
        const discountAmount =
          popup.discountType === 'FIXED' ? value : Math.round((subtotal * value) / 100);

        return {
          valid: true,
          coupon: {
            code: popup.promoCode.toUpperCase(),
            discountType: popup.discountType || 'PERCENTAGE',
            value,
            minSpend: popup.minSpend || 0,
            isActive: true,
          },
          discountAmount,
          message: `${value}% discount applied from ${popup.heading || 'Special Promotion'}!`,
        };
      }
    } catch (e) {
      console.warn('[CouponService] Error validating popup coupon:', e);
    }

    // 2. Check base registered coupons
    const coupon = this.baseCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);
    if (!coupon) return { valid: false, message: 'Invalid or expired promo code' };
    if (subtotal < coupon.minSpend) {
      return {
        valid: false,
        message: `Minimum spend of LKR ${coupon.minSpend.toLocaleString()} required for this code`,
      };
    }
    const discountAmount =
      coupon.discountType === 'PERCENTAGE'
        ? Math.round((subtotal * coupon.value) / 100)
        : coupon.value;
    return { valid: true, coupon, discountAmount, message: 'Promo code applied successfully!' };
  }
}

export const couponService = new CouponService();
