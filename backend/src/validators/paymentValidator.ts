import { BadRequestError } from '../utils/errors';

export const validatePaymentInput = (data: any) => {
  if (!data.orderId) {
    throw new BadRequestError('Order ID is required to initiate payment session');
  }
  if (!data.amount || data.amount <= 0) {
    throw new BadRequestError('Payment amount must be greater than zero');
  }
};
