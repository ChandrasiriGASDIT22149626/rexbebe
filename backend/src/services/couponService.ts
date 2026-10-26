export class CouponService {
  private coupons = [
    { code: 'REXBEBE10', discountType: 'PERCENTAGE', value: 10, minSpend: 10000, isActive: true },
    { code: 'WELCOME5000', discountType: 'FIXED', value: 5000, minSpend: 30000, isActive: true }
  ];

  async getCoupons() {
    return this.coupons;
  }

  async validateCoupon(code: string, subtotal: number) {
    const coupon = this.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) return { valid: false, message: 'Invalid or expired promo code' };
    if (subtotal < coupon.minSpend) {
      return { valid: false, message: `Minimum spend of LKR ${coupon.minSpend.toLocaleString()} required for this code` };
    }
    const discountAmount = coupon.discountType === 'PERCENTAGE' ? (subtotal * coupon.value) / 100 : coupon.value;
    return { valid: true, coupon, discountAmount };
  }
}
