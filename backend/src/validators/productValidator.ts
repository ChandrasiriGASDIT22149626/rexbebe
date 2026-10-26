import { BadRequestError } from '../utils/errors';

export const validateProductInput = (data: any) => {
  if (!data.name || typeof data.name !== 'string') {
    throw new BadRequestError('Product name is required and must be a string');
  }
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    throw new BadRequestError('Product price must be a positive number');
  }
  if (!data.categoryId) {
    throw new BadRequestError('Category ID is required');
  }
};
