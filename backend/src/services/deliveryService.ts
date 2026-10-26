import {
  DeliverySettingsRepository,
  DistrictDeliveryRate,
  DeliveryZone,
  UnsupportedAddressPolicy,
} from '../repositories/deliverySettingsRepository';
import { DeliveryZoneSnapshot } from '../repositories/orderRepository';
import { ProductRepository } from '../repositories/productRepository';
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
        throw new BadRequestError(`Invalid product variant: ${item.variantId}`);
      }
      subtotal += foundVariant.price * item.quantity;
    }

    // 2. Discount calculation
    let discount = 0;
    if (payload.couponCode === 'REXBEBE10') {
      discount = Math.round(subtotal * 0.1);
    }

    // 3. Delivery Zone & Town Rate Resolution
    const districtName = (payload.district || '').trim();
    const townName = (payload.town || '').trim();

    let baseDeliveryFee = settings.defaultDeliveryFee;
    let estimatedDays = '1–3 Business Days';
    let matchedZoneName: string | undefined = undefined;
    let matchedZoneId: string | undefined = undefined;
    let requiresDeliveryReview = false;
    let isUnmapped = false;
    let unsupportedNotice: string | undefined = undefined;
    let deliveryZoneSnapshot: DeliveryZoneSnapshot | undefined = undefined;

    if (townName) {
      // Find zone mapped to this town
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
          isInitialRate: !!zoneLookup.matchedZone.isInitialRate,
          requiresReview: false,
          policyApplied: 'ZONE_MATCHED',
          appliedAt: new Date().toISOString(),
        };
      } else if (zoneLookup.isUnmapped) {
        // Town is unmapped!
        isUnmapped = true;
        unsupportedNotice = zoneLookup.notice || settings.unsupportedAddressNotice;

        if (settings.unsupportedAddressPolicy === 'BLOCK_CHECKOUT') {
          throw new BadRequestError(
            `Delivery is not currently configured for town "${townName}". Please select a covered town or contact concierge.`
          );
        }

        // Policy: REQUIRE_REVIEW
        // "Do not guess town mappings. If a town has no configured zone, request review instead of applying an arbitrary fee."
        requiresDeliveryReview = true;
        baseDeliveryFee = 0; // Avoid arbitrary fee!
        estimatedDays = 'Pending Concierge Review';
        matchedZoneName = 'Unmapped Town (Review Required)';
        matchedZoneId = 'UNMAPPED_REVIEW_REQUIRED';

        deliveryZoneSnapshot = {
          zoneId: 'UNMAPPED_REVIEW_REQUIRED',
          zoneName: 'Unmapped Town (Review Required)',
          district: districtName || 'Other',
          town: townName,
          deliveryFee: 0,
          isInitialRate: false,
          requiresReview: true,
          policyApplied: 'REQUIRE_REVIEW',
          appliedAt: new Date().toISOString(),
          reviewNotes: `Town "${townName}" is not mapped to any configured delivery zone. Arbitrary fee avoided per store policy. Concierge review required.`,
        };
      }
    } else if (districtName) {
      // Only district selected, town not yet entered
      const districtRate = await this.deliveryRepo.getDistrictRate(districtName);
      if (districtRate && districtRate.active) {
        baseDeliveryFee = districtRate.deliveryFee;
        estimatedDays = districtRate.estimatedDays;
      }
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

    const activeCouriers = settings.activeCouriers.filter((c) => c.active);
    const courierSuggested = activeCouriers[0]?.name || 'Koombiyo Delivery';

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
