import crypto from 'crypto';
import { config } from '../config/environment';

export class PaymentService {
  /**
   * Generates secure PayHere payment payload and MD5 signature on the backend.
   * Merchant secret is NEVER exposed to the frontend browser.
   */
  async createPayHereSession(orderId: string, amount: number, currency: string = 'LKR') {
    const merchantId = config.payments.payhere.merchantId;
    const secret = config.payments.payhere.secret;

    const formattedAmount = amount.toFixed(2);
    const hash = crypto
      .createHash('md5')
      .update(merchantId + orderId + formattedAmount + currency + crypto.createHash('md5').update(secret).digest('hex').toUpperCase())
      .digest('hex')
      .toUpperCase();

    const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const backendBaseUrl = (process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:5000').replace(/\/+$/, '');

    return {
      sandbox: process.env.PAYHERE_SANDBOX !== 'false',
      merchantId,
      orderId,
      amount: formattedAmount,
      currency,
      hash,
      returnUrl: `${frontendBaseUrl}/order/${orderId}?status=success`,
      cancelUrl: `${frontendBaseUrl}/checkout?status=cancel`,
      notifyUrl: `${backendBaseUrl}/api/payments/callback`,
    };
  }

  async verifyPaymentCallback(body: any) {
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;
    const secret = config.payments.payhere.secret;

    const expectedHash = crypto
      .createHash('md5')
      .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + crypto.createHash('md5').update(secret).digest('hex').toUpperCase())
      .digest('hex')
      .toUpperCase();

    const isVerified = md5sig === expectedHash;
    return {
      isVerified,
      status: status_code === '2' ? 'PAID' : 'FAILED',
      orderId: order_id,
    };
  }
}
