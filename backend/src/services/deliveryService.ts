import {
  DeliverySettingsRepository,
  DistrictDeliveryRate,
  DeliveryZone,
  UnsupportedAddressPolicy,
} from '../repositories/deliverySettingsRepository';
import { DeliveryZoneSnapshot } from '../repositories/orderRepository';
import { ProductRepository } from '../repositories/productRepository';
import { couponService } from './couponService';
import { BadRequestError } from '../utils/errors';

export interface CalculationResult {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  codHandlingFee: number;
  advancePayment: number;
  amountToCollect: number;
  totalAmount: number;
  freeDeliveryEligible: boolean;
  freeDeliveryThreshold: number;
  estimatedDays: string;
  district: string;
  town?: string;
  zoneName?: string;
  zoneId?: string;
  courierSuggested: string;
  isCodAvailable: boolean;
  codNotice?: string;
  requiresDeliveryReview?: boolean;
  isUnmapped?: boolean;
  unsupportedNotice?: string;
  deliveryZoneSnapshot?: DeliveryZoneSnapshot;
}

export class DeliveryService {
  private deliveryRepo = new DeliverySettingsRepository();
  private productRepo = new ProductRepository();

  async getSettings() {
    return this.deliveryRepo.getSettings();
  }

  async updateSettings(data: any) {
    return this.deliveryRepo.updateSettings(data);
  }

  // Delivery Zones CRUD
  async getDeliveryZones(): Promise<DeliveryZone[]> {
    return this.deliveryRepo.getDeliveryZones();
  }

  async getDeliveryZoneById(id: string): Promise<DeliveryZone | null> {
    return this.deliveryRepo.getDeliveryZoneById(id);
  }

  async createDeliveryZone(data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    return this.deliveryRepo.createDeliveryZone(data);
  }

  async updateDeliveryZone(id: string, partial: Partial<DeliveryZone>): Promise<DeliveryZone> {
    return this.deliveryRepo.updateDeliveryZone(id, partial);
  }

  async deleteDeliveryZone(id: string): Promise<boolean> {
    return this.deliveryRepo.deleteDeliveryZone(id);
  }

  async addTownToZone(zoneId: string, town: string): Promise<DeliveryZone> {
    return this.deliveryRepo.addTownToZone(zoneId, town);
  }

  async removeTownFromZone(zoneId: string, town: string): Promise<DeliveryZone> {
    return this.deliveryRepo.removeTownFromZone(zoneId, town);
  }

  async reassignTown(
    town: string,
    fromZoneId: string,
    toZoneId: string
  ): Promise<{ success: boolean; fromZone: DeliveryZone; toZone: DeliveryZone }> {
    return this.deliveryRepo.reassignTown(town, fromZoneId, toZoneId);
  }

  async updateUnsupportedPolicy(
    policy: UnsupportedAddressPolicy,
    notice?: string
  ): Promise<{ unsupportedAddressPolicy: UnsupportedAddressPolicy; unsupportedAddressNotice: string }> {
    return this.deliveryRepo.updateUnsupportedPolicy(policy, notice);
  }

  async lookupZone(district?: string, town?: string) {
    return this.deliveryRepo.findZoneForTown(district, town);
  }

  async calculateOrderPricing(payload: {
    district?: string;
    town?: string;
    street?: string;
    postalCode?: string;
    items: { variantId: string; quantity: number }[];
    paymentMethod: string;
    couponCode?: string;
    parcelWeightKg?: number;
    advancePayment?: number;
  }): Promise<CalculationResult> {
    const settings = await this.deliveryRepo.getSettings();

    // 1. Calculate authoritative subtotal directly from database variants
    let subtotal = 0;
    const allProducts = await this.productRepo.findAll();

    for (const item of payload.items) {
      let foundVariant: any = null;
      for (const prod of allProducts) {
        const v = prod.variants?.find((varItem: any) => varItem.id === item.variantId);
        if (v) {
          foundVariant = v;
          break;
        }
      }

      if (!foundVariant) {
        for (const prod of allProducts) {
          if (item.variantId.includes(prod.id) || (prod.slug && item.variantId.includes(prod.slug))) {
            foundVariant = prod.variants?.[0] || {
              id: item.variantId,
              sku: prod.sku || 'REX-STD',
              price: prod.price,
              stockQuantity: prod.stockQuantity || 10,
            };
            break;
          }
        }
      }

      if (!foundVariant) {
        throw new BadRequestError(`Invalid product variant: ${item.variantId}`);
      }
      subtotal += foundVariant.price * item.quantity;
    }

    // 2. Discount calculation
    let discount = 0;
    if (payload.couponCode) {
      const couponValidation = await couponService.validateCoupon(payload.couponCode, subtotal);
      if (couponValidation.valid && couponValidation.discountAmount) {
        discount = Math.round(couponValidation.discountAmount);
      }
    }

    // 3. Delivery Fee Calculation (Authoritative Koombiyo Delivery API)
    const districtName = (payload.district || '').trim();
    const townName = (payload.town || '').trim();
    const postalCode = (payload.postalCode || '').trim();
    const street = (payload.street || '').trim();

    let baseDeliveryFee = settings.defaultDeliveryFee || 450;
    let estimatedDays = '1–2 Business Days';
    let matchedZoneName: string | undefined = undefined;
    let matchedZoneId: string | undefined = undefined;
    let requiresDeliveryReview = false;
    let isUnmapped = false;
    let unsupportedNotice: string | undefined = undefined;
    let deliveryZoneSnapshot: DeliveryZoneSnapshot | undefined = undefined;

    // Use Koombiyo API as the primary and authoritative rate source
    const { koombiyoApiClient } = await import('./courier/KoombiyoApiClient');
    let koombiyoResolved: any = null;

    if (koombiyoApiClient.hasCredentials()) {
      try {
        if (townName || districtName) {
          koombiyoResolved = await koombiyoApiClient.resolveAddress(districtName, townName, postalCode, street);
        }
      } catch (e) {
        console.warn('[Koombiyo Address Resolution Error]', (e as any).message);
      }
    }

    if (koombiyoResolved) {
      const isWestern = koombiyoResolved.districtName.toLowerCase() === 'colombo' || koombiyoResolved.districtName.toLowerCase() === 'gampaha';
      matchedZoneName = `Koombiyo Delivery — ${koombiyoResolved.cityName} (${koombiyoResolved.districtName})`;
      matchedZoneId = `KOOMBIYO_${koombiyoResolved.districtId}_${koombiyoResolved.cityId}`;
      baseDeliveryFee = koombiyoResolved.deliveryCharge;
      estimatedDays = isWestern ? '1–2 Business Days' : '2–3 Business Days';
      requiresDeliveryReview = false;
      isUnmapped = false;

      deliveryZoneSnapshot = {
        zoneId: matchedZoneId,
        zoneName: matchedZoneName,
        district: koombiyoResolved.districtName,
        town: koombiyoResolved.cityName,
        deliveryFee: koombiyoResolved.deliveryCharge,
        isInitialRate: false,
        requiresReview: false,
        policyApplied: 'KOOMBIYO_API_RATE',
        appliedAt: new Date().toISOString(),
      };
    } else if (townName) {
      // Fallback: check repository zones if Koombiyo API is temporarily unavailable
      const zoneLookup = await this.deliveryRepo.findZoneForTown(districtName, townName);
      if (zoneLookup.matchedZone) {
        matchedZoneName = zoneLookup.matchedZone.name;
        matchedZoneId = zoneLookup.matchedZone.id;
        baseDeliveryFee = zoneLookup.matchedZone.deliveryFee;
        estimatedDays = zoneLookup.matchedZone.estimatedDays;
        deliveryZoneSnapshot = {
          zoneId: zoneLookup.matchedZone.id,
          zoneName: zoneLookup.matchedZone.name,
          district: districtName || zoneLookup.matchedZone.district,
          town: townName,
          deliveryFee: zoneLookup.matchedZone.deliveryFee,
          isInitialRate: true,
          requiresReview: false,
          policyApplied: 'ZONE_MATCHED',
          appliedAt: new Date().toISOString(),
        };
      } else {
        // District rate fallback
        const distRate = await this.deliveryRepo.getDistrictRate(districtName || 'Colombo');
        baseDeliveryFee = distRate?.deliveryFee || 450;
        matchedZoneName = `Koombiyo Delivery — ${districtName || 'Standard'}`;
        estimatedDays = distRate?.estimatedDays || '2–3 Business Days';
        requiresDeliveryReview = false;
        isUnmapped = false;
      }
    } else if (districtName) {
      const distRate = await this.deliveryRepo.getDistrictRate(districtName);
      if (distRate && distRate.active) {
        baseDeliveryFee = distRate.deliveryFee;
        estimatedDays = distRate.estimatedDays;
      }
      matchedZoneName = `Koombiyo Delivery — ${districtName}`;
    }

    // 4. Weight calculation
    let weightFee = 0;
    const weight = payload.parcelWeightKg || 0.5; // default 500g package
    if (weight > 1.0 && settings.weightTiers && settings.weightTiers.length > 0) {
      for (const tier of settings.weightTiers) {
        if (weight <= tier.upToKg) {
          weightFee = tier.baseFee;
          break;
        }
      }
      const maxTier = settings.weightTiers[settings.weightTiers.length - 1];
      if (weight > maxTier.upToKg && maxTier.extraPerKg > 0) {
        const extraWeight = Math.ceil(weight - maxTier.upToKg);
        weightFee = maxTier.baseFee + extraWeight * maxTier.extraPerKg;
      }
    }

    // 5. Free Delivery Evaluation
    const freeDeliveryEligible = (subtotal - discount) >= settings.freeDeliveryThreshold && subtotal > 0;
    const deliveryFee = freeDeliveryEligible ? 0 : (baseDeliveryFee + weightFee);

    // If free delivery was applied, update snapshot
    if (freeDeliveryEligible && deliveryZoneSnapshot) {
      deliveryZoneSnapshot.deliveryFee = 0;
      deliveryZoneSnapshot.reviewNotes = (deliveryZoneSnapshot.reviewNotes ? deliveryZoneSnapshot.reviewNotes + ' ' : '') + 'Free delivery threshold achieved.';
    }

    // 6. COD Handling Fee & Availability
    const isCod = payload.paymentMethod === 'CASH_ON_DELIVERY';
    let codHandlingFee = 0;
    let isCodAvailable = true;
    let codNotice: string | undefined = undefined;

    const netAmountBeforeCod = subtotal - discount + deliveryFee;

    if (isCod) {
      codHandlingFee = settings.codHandlingFee || 0;

      if (netAmountBeforeCod < settings.minCodAmount) {
        isCodAvailable = false;
        codNotice = `Minimum order amount for Cash on Delivery is LKR ${settings.minCodAmount.toLocaleString()}.`;
      } else if (netAmountBeforeCod > settings.maxCodAmount) {
        isCodAvailable = false;
        codNotice = `Maximum order amount for Cash on Delivery is LKR ${settings.maxCodAmount.toLocaleString()}. Please choose online payment.`;
      }
    }

    const totalAmount = subtotal - discount + deliveryFee + codHandlingFee;
    const advancePayment = payload.advancePayment || 0;
    const amountToCollect = isCod ? Math.max(0, totalAmount - advancePayment) : 0;

    const courierSuggested = 'Koombiyo Delivery';

    return {
      subtotal,
      discount,
      deliveryFee,
      codHandlingFee,
      advancePayment,
      amountToCollect,
      totalAmount,
      freeDeliveryEligible,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      estimatedDays,
      district: districtName || 'Gampaha',
      town: townName,
      zoneName: matchedZoneName,
      zoneId: matchedZoneId,
      courierSuggested,
      isCodAvailable,
      codNotice,
      requiresDeliveryReview,
      isUnmapped,
      unsupportedNotice,
      deliveryZoneSnapshot,
    };
  }
}
