import { Request, Response, NextFunction } from 'express';
import { DeliveryService } from '../services/deliveryService';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';

const deliveryService = new DeliveryService();

export const getDeliverySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await deliveryService.getSettings();
    return sendSuccess(res, settings, 'Delivery settings retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateDeliverySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await deliveryService.updateSettings(req.body);
    return sendSuccess(res, updated, 'Delivery settings updated successfully');
  } catch (err) {
    next(err);
  }
};

export const calculateDelivery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { district, town, items, paymentMethod, couponCode, parcelWeightKg, advancePayment } = req.body;
    const result = await deliveryService.calculateOrderPricing({
      district,
      town,
      items: items || [],
      paymentMethod: paymentMethod || 'PAYHERE',
      couponCode,
      parcelWeightKg,
      advancePayment,
    });
    return sendSuccess(res, result, 'Order pricing calculated');
  } catch (err) {
    next(err);
  }
};

// ==========================================
// DELIVERY ZONES CONTROLLERS
// ==========================================

export const getDeliveryZones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zones = await deliveryService.getDeliveryZones();
    return sendSuccess(res, zones, 'Delivery zones retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getDeliveryZoneById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const zone = await deliveryService.getDeliveryZoneById(id);
    if (!zone) {
      throw new BadRequestError(`Delivery zone not found: ${id}`);
    }
    return sendSuccess(res, zone, 'Delivery zone retrieved');
  } catch (err) {
    next(err);
  }
};

export const createDeliveryZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, district, deliveryFee, returnFee, estimatedDays, active, towns, description } = req.body;
    if (!name || !name.trim()) {
      throw new BadRequestError('Zone name is required');
    }
    if (typeof deliveryFee !== 'number' || deliveryFee < 0) {
      throw new BadRequestError('Valid delivery fee is required');
    }

    const created = await deliveryService.createDeliveryZone({
      name: name.trim(),
      code: code ? code.trim() : undefined,
      district: district ? district.trim() : 'Gampaha',
      deliveryFee,
      returnFee: typeof returnFee === 'number' ? returnFee : 300,
      estimatedDays: estimatedDays || '1–2 Business Days',
      active: active !== undefined ? active : true,
      towns: Array.isArray(towns) ? towns : [],
      description,
    });
    return sendSuccess(res, created, 'Delivery zone created successfully');
  } catch (err) {
    next(err);
  }
};

export const updateDeliveryZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await deliveryService.updateDeliveryZone(id, req.body);
    return sendSuccess(res, updated, 'Delivery zone updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteDeliveryZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await deliveryService.deleteDeliveryZone(id);
    if (!deleted) {
      throw new BadRequestError(`Zone ${id} could not be deleted`);
    }
    return sendSuccess(res, { id, deleted: true }, 'Delivery zone deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const addTownToZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { town } = req.body;
    if (!town || !town.trim()) {
      throw new BadRequestError('Town name is required');
    }
    const updated = await deliveryService.addTownToZone(id, town.trim());
    return sendSuccess(res, updated, `Town '${town}' added to zone`);
  } catch (err) {
    next(err);
  }
};

export const removeTownFromZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, town } = req.params;
    if (!town || !town.trim()) {
      throw new BadRequestError('Town name is required');
    }
    const updated = await deliveryService.removeTownFromZone(id, decodeURIComponent(town.trim()));
    return sendSuccess(res, updated, `Town '${town}' removed from zone`);
  } catch (err) {
    next(err);
  }
};

export const reassignTown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { town, fromZoneId, toZoneId } = req.body;
    if (!town || !town.trim()) {
      throw new BadRequestError('Town name is required');
    }
    if (!fromZoneId || !toZoneId) {
      throw new BadRequestError('Both fromZoneId and toZoneId are required');
    }
    const result = await deliveryService.reassignTown(town.trim(), fromZoneId, toZoneId);
    return sendSuccess(res, result, `Town '${town}' reassigned successfully`);
  } catch (err) {
    next(err);
  }
};

export const updatePolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unsupportedAddressPolicy, unsupportedAddressNotice } = req.body;
    if (!unsupportedAddressPolicy || !['REQUIRE_REVIEW', 'BLOCK_CHECKOUT'].includes(unsupportedAddressPolicy)) {
      throw new BadRequestError('Invalid unsupportedAddressPolicy. Must be REQUIRE_REVIEW or BLOCK_CHECKOUT');
    }
    const result = await deliveryService.updateUnsupportedPolicy(unsupportedAddressPolicy, unsupportedAddressNotice);
    return sendSuccess(res, result, 'Unsupported address delivery policy updated');
  } catch (err) {
    next(err);
  }
};

export const lookupZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { district, town } = req.body;
    const lookup = await deliveryService.lookupZone(district, town);
    return sendSuccess(res, lookup, 'Zone lookup completed');
  } catch (err) {
    next(err);
  }
};
