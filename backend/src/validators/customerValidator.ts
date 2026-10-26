import { BadRequestError } from '../utils/errors';

export const validateCustomerInput = (data: any) => {
  if (!data.email || !data.email.includes('@')) {
    throw new BadRequestError('A valid email address is required');
  }
  if (!data.name || data.name.trim().length < 2) {
    throw new BadRequestError('Customer name must be at least 2 characters');
  }
};
