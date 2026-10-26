export interface PaymentSession {
  sandbox: boolean;
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  hash: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}
