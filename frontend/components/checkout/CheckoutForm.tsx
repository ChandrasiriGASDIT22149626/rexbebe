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
import { Truck, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
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

  // Recalculate authoritative server pricing when district, town, payment method, or cart items change
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
      });
      setPricing(result);
    } catch (err: any) {
      console.error('Pricing calculation error:', err);
      setCalcError(err.message || 'Could not calculate delivery rates for this district');
    } finally {
      setCalculating(false);
    }
  }, [items, deliveryInfo.district, deliveryInfo.city, paymentType]);

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
