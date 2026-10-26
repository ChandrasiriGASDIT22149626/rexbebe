import { fetchApi } from './api';
import { PaymentSession } from '../types/payment';

export const paymentService = {
  async createPaymentSession(orderId: string, amount: number, currency: string = 'LKR'): Promise<PaymentSession> {
    return fetchApi<PaymentSession>('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, currency }),
    });
  },

  async verifyPayment(orderId: string) {
    return fetchApi('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }
};
