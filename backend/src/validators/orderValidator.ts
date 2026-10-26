import { BadRequestError } from '../utils/errors';

export const validateOrderInput = (data: any) => {
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new BadRequestError('Order must contain at least one item');
  }
  for (const item of data.items) {
    if (!item.variantId || !item.quantity || item.quantity <= 0) {
      throw new BadRequestError('Each order item must specify a valid variantId and quantity > 0');
    }
  }

  const addr = data.shippingAddress;
  if (!addr) {
    throw new BadRequestError('Shipping address is required');
  }

  const name = addr.recipientName || data.customerName;
  if (!name || name.trim().length < 2) {
    throw new BadRequestError('Valid customer recipient name is required for delivery');
  }

  if (!addr.street || addr.street.trim().length < 3) {
    throw new BadRequestError('Valid street address and delivery details are required');
  }

  const townOrCity = addr.city || addr.town;
  if (!townOrCity || townOrCity.trim().length < 2) {
    throw new BadRequestError('Town / City is required');
  }

  // Mobile number validation (especially critical for COD doorstep contact)
  const phone = addr.phone || data.phone || '';
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 15) {
    throw new BadRequestError('A valid mobile phone number is required so our courier can contact you upon arrival');
  }

  // Email validation where applicable
  const email = addr.email || data.customerEmail;
  if (email && email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new BadRequestError('Please provide a valid email address');
    }
  }

  // District validation (required to calculate delivery rates securely)
  const district = addr.district || addr.city;
  if (!district || district.trim().length < 2) {
    throw new BadRequestError('District selection is required to determine delivery rates');
  }
  addr.district = district.trim();

  // Postal code validation where applicable
  if (addr.postalCode && typeof addr.postalCode === 'string') {
    const cleanPostal = addr.postalCode.trim();
    if (cleanPostal.length > 10) {
      throw new BadRequestError('Postal code is invalid (maximum 10 characters)');
    }
  }
};
