'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../hooks/useCart';
import { DeliveryForm } from './DeliveryForm';
import { PaymentMethod } from './PaymentMethod';
import { OrderSummary } from './OrderSummary';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { deliveryService, PricingCalculationResult } from '../../services/deliveryService';
import { Button } from '../ui/Button';
import { Truck, CheckCircle2, ShieldCheck, AlertCircle, Tag, Check, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = React.useRef(false);
  const [calculating, setCalculating] = useState(false);
  const [paymentType, setPaymentType] = useState<'CASH_ON_DELIVERY' | 'PAYHERE'>('CASH_ON_DELIVERY');

  // Client idempotency key: unique per checkout session to prevent double submission
  const [idempotencyKey] = useState(() => `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const [deliveryInfo, setDeliveryInfo] = useState({
    recipientName: '',
    street: '',
    city: 'Colombo',
    district: 'Colombo',
    postalCode: '',
    country: 'Sri Lanka',
    email: '',
    phone: '',
    deliveryInstructions: '',
  });

  const [pricing, setPricing] = useState<PricingCalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Promo Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [couponNotice, setCouponNotice] = useState<{ text: string; success: boolean } | null>(null);

  // Check if promo code was saved in session (e.g. copied from Promotional Popup)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('rexbebe_applied_promo');
      if (stored) {
        setAppliedCoupon(stored.toUpperCase());
        setCouponInput(stored.toUpperCase());
      }
    } catch (_) {}
  }, []);

  // Recalculate authoritative server pricing when district, town, payment method, cart items, or coupon change
  const fetchPricing = useCallback(async () => {
    if (items.length === 0) return;
    setCalculating(true);
    setCalcError(null);
    try {
      const result = await deliveryService.calculatePricing({
        district: deliveryInfo.district || 'Colombo',
        town: deliveryInfo.city || 'Colombo',
        items: items.map((i) => ({ variantId: i.variant.id, quantity: i.quantity })),
        paymentMethod: paymentType,
        couponCode: appliedCoupon || undefined,
      });
      setPricing(result);
    } catch (err: any) {
      console.error('Pricing calculation error:', err);
      setCalcError(err.message || 'Could not calculate delivery rates for this district');
    } finally {
      setCalculating(false);
    }
  }, [items, deliveryInfo.district, deliveryInfo.city, paymentType, appliedCoupon]);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponNotice({ text: 'Please enter a promo code.', success: false });
      return;
    }

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: pricing?.subtotal || 0 }),
      });
      const data = await res.json();
      if (data.success && data.data && data.data.valid) {
        setAppliedCoupon(code);
        setCouponNotice({
          text: data.data.message || `Promo code "${code}" applied successfully!`,
          success: true,
        });
        sessionStorage.setItem('rexbebe_applied_promo', code);
      } else {
        setCouponNotice({
          text: data.data?.message || data.message || 'Invalid or expired promo code.',
          success: false,
        });
      }
    } catch (err: any) {
      setCouponNotice({ text: 'Error validating promo code.', success: false });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponInput('');
    setCouponNotice(null);
    try {
      sessionStorage.removeItem('rexbebe_applied_promo');
    } catch (_) {}
  };

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Prevent duplicate orders caused by repeated clicks or retries
    if (isSubmittingRef.current || loading) {
      return;
    }

    if (items.length === 0) {
      setFormError('Your shopping bag is empty.');
      return;
    }

    // 2. Comprehensive client-side validation
    if (!deliveryInfo.recipientName.trim() || deliveryInfo.recipientName.trim().length < 2) {
      setFormError('Please enter the full recipient name for delivery.');
      return;
    }

    const cleanPhone = deliveryInfo.phone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 15) {
      setFormError('Please enter a valid mobile phone number so our courier can contact you upon arrival.');
      return;
    }

    if (!deliveryInfo.street.trim() || deliveryInfo.street.trim().length < 3) {
      setFormError('Please enter your complete street address for parcel delivery.');
      return;
    }

    if (!deliveryInfo.city.trim() || deliveryInfo.city.trim().length < 2) {
      setFormError('Please enter your city / town.');
      return;
    }

    if (!deliveryInfo.district.trim()) {
      setFormError('Please select your delivery district.');
      return;
    }

    if (deliveryInfo.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(deliveryInfo.email.trim())) {
        setFormError('Please provide a valid email address.');
        return;
      }
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // 3. Create order on backend (Strict server validation for stock & price)
      const newOrder = await orderService.createOrder({
        customerId: 'cust-guest',
        customerName: deliveryInfo.recipientName.trim(),
        customerEmail: deliveryInfo.email.trim(),
        phone: deliveryInfo.phone.trim(),
        items: items.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          recipientName: deliveryInfo.recipientName.trim(),
          phone: deliveryInfo.phone.trim(),
          email: deliveryInfo.email.trim(),
          street: deliveryInfo.street.trim(),
          city: deliveryInfo.city.trim(),
          town: deliveryInfo.city.trim(),
          district: deliveryInfo.district.trim(),
          postalCode: deliveryInfo.postalCode?.trim() || '',
          country: deliveryInfo.country || 'Sri Lanka',
          deliveryInstructions: deliveryInfo.deliveryInstructions?.trim() || '',
        },
        paymentMethod: paymentType,
        idempotencyKey,
        couponCode: appliedCoupon || undefined,
      });

      // 4. If PayHere selected, initialize online gateway session
      if (paymentType === 'PAYHERE') {
        try {
          const paySession = await paymentService.createPaymentSession(newOrder.orderNumber, newOrder.totalAmount);
          console.log('[PayHere Gateway Session Initialized]', paySession);
        } catch (gateErr) {
          console.warn('[PayHere Gateway Session Fallback]', gateErr);
        }
      }

      // 5. Clear cart and redirect to order confirmation page
      clearCart();
      router.push(`/order/${newOrder.orderNumber}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setFormError(err.message || 'Failed to place order. Please review your delivery details.');
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const subtotal = pricing ? pricing.subtotal : items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const deliveryFee = pricing ? pricing.deliveryFee : 450;
  const codHandlingFee = pricing?.codHandlingFee || 0;
  const discount = pricing?.discount || 0;
  const total = pricing ? pricing.totalAmount : subtotal + deliveryFee;
  const amountToCollect = pricing?.amountToCollect !== undefined ? pricing.amountToCollect : total;

  return (
    <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      <div className="lg:col-span-7 space-y-8">
        <DeliveryForm
          values={deliveryInfo}
          onChange={setDeliveryInfo}
          pricing={pricing}
          estimatedDays={pricing?.estimatedDays}
        />

        {/* Promotional / Voucher Code Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Tag className="w-5 h-5 text-pink-600" />
            <h3 className="font-serif text-xl font-medium text-stone-900">
              Promotional Code & Vouchers
            </h3>
          </div>

          <div className="space-y-3">
            {!appliedCoupon ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. LITTLE20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-pink-300 font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={calculating || !couponInput.trim()}
                  className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Apply Code 🌸
                </button>
              </div>
            ) : (
              <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-mono font-black text-pink-700 text-xs sm:text-sm tracking-wider">
                      {appliedCoupon}
                    </span>
                    <span className="text-[11px] text-pink-600 block">
                      Promotional discount applied to subtotal
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-stone-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {couponNotice && (
              <p
                className={`text-xs font-medium flex items-center space-x-1 ${
                  couponNotice.success ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                <span>{couponNotice.text}</span>
              </p>
            )}
          </div>
        </div>

        <PaymentMethod
          selectedMethod={paymentType}
          onSelect={setPaymentType}
          codHandlingFee={pricing?.codHandlingFee}
          isCodAvailable={pricing?.isCodAvailable ?? true}
          codNotice={pricing?.codNotice}
          amountToCollect={amountToCollect}
        />
      </div>

      <div className="lg:col-span-5 space-y-6">
        <OrderSummary
          items={items}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          codHandlingFee={codHandlingFee}
          discount={discount}
          total={total}
          amountToCollect={amountToCollect}
          isCod={paymentType === 'CASH_ON_DELIVERY'}
          district={deliveryInfo.district}
          town={deliveryInfo.city}
          zoneName={pricing?.zoneName}
          requiresDeliveryReview={pricing?.requiresDeliveryReview}
          estimatedDays={pricing?.estimatedDays}
        />

        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{formError}</span>
          </div>
        )}

        {calcError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{calcError}</span>
          </div>
        )}

        <Button
          id="checkout-submit-btn"
          type="submit"
          variant="primary"
          size="lg"
          className="w-full text-sm font-bold tracking-wide uppercase py-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          disabled={loading || calculating || items.length === 0 || (paymentType === 'CASH_ON_DELIVERY' && pricing?.isCodAvailable === false)}
        >
          {loading
            ? 'Placing Order...'
            : paymentType === 'CASH_ON_DELIVERY'
            ? `Confirm & Place Order (${formatCurrency(amountToCollect)})`
            : `Pay Online with PayHere (${formatCurrency(total)})`}
        </Button>

        <p className="text-[11px] text-stone-500 text-center flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>REXBEBE Concierge Guarantee • Handcrafted Luxury Babywear</span>
        </p>
      </div>
    </form>
  );
}
