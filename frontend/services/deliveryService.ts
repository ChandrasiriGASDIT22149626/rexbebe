import { fetchApi } from './api';

export interface CourierProviderConfig {
  id: string;
  name: string;
  code: string;
  trackingUrlPattern: string;
  active: boolean;
  contactPhone?: string;
  portalUrl?: string;
}

export interface DistrictDeliveryRate {
  district: string;
  zone: string;
  deliveryFee: number;
  returnFee: number;
  estimatedDays: string;
  active: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  code: string;
  district: string;
  deliveryFee: number;
  returnFee: number;
  estimatedDays: string;
  active: boolean;
  towns: string[];
  isInitialRate: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UnsupportedAddressPolicy = 'REQUIRE_REVIEW' | 'BLOCK_CHECKOUT';

export interface DeliveryZoneSnapshot {
  zoneId: string;
  zoneName: string;
  district: string;
  town: string;
  deliveryFee: number;
  isInitialRate: boolean;
  requiresReview: boolean;
  policyApplied: string;
  appliedAt: string;
  reviewNotes?: string;
}

export interface DeliverySettingsData {
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;
  codHandlingFee: number;
  minCodAmount: number;
  maxCodAmount: number;
  returnFeeDefault: number;
  customerDeliveryNotice: string;
  rateDisclaimer?: string;
  unsupportedAddressPolicy?: UnsupportedAddressPolicy;
  unsupportedAddressNotice?: string;
  activeCouriers: CourierProviderConfig[];
  districtRates: DistrictDeliveryRate[];
  weightTiers?: { upToKg: number; baseFee: number; extraPerKg: number }[];
  deliveryZones?: DeliveryZone[];
}

export interface PricingCalculationResult {
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

export const SRI_LANKA_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Kurunegala',
  'Puttalam',
  'Ratnapura',
  'Kegalle',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Trincomalee',
  'Batticaloa',
  'Ampara',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
];

export const deliveryService = {
  async getSettings(): Promise<DeliverySettingsData> {
    return fetchApi<DeliverySettingsData>('/delivery-settings');
  },

  async updateSettings(data: Partial<DeliverySettingsData>): Promise<DeliverySettingsData> {
    return fetchApi<DeliverySettingsData>('/delivery-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async calculatePricing(payload: {
    district: string;
    town?: string;
    items: { variantId: string; quantity: number }[];
    paymentMethod: string;
    couponCode?: string;
    parcelWeightKg?: number;
    advancePayment?: number;
  }): Promise<PricingCalculationResult> {
    return fetchApi<PricingCalculationResult>('/delivery/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getZones(): Promise<DeliveryZone[]> {
    return fetchApi<DeliveryZone[]>('/delivery/zones');
  },

  async createZone(data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    return fetchApi<DeliveryZone>('/delivery/zones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateZone(id: string, data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    return fetchApi<DeliveryZone>(`/delivery/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteZone(id: string): Promise<{ id: string; deleted: boolean }> {
    return fetchApi<{ id: string; deleted: boolean }>(`/delivery/zones/${id}`, {
      method: 'DELETE',
    });
  },

  async addTownToZone(zoneId: string, town: string): Promise<DeliveryZone> {
    return fetchApi<DeliveryZone>(`/delivery/zones/${zoneId}/towns`, {
      method: 'POST',
      body: JSON.stringify({ town }),
    });
  },

  async removeTownFromZone(zoneId: string, town: string): Promise<DeliveryZone> {
    return fetchApi<DeliveryZone>(`/delivery/zones/${zoneId}/towns/${encodeURIComponent(town)}`, {
      method: 'DELETE',
    });
  },

  async reassignTown(town: string, fromZoneId: string, toZoneId: string): Promise<{
    success: boolean;
    fromZone: DeliveryZone;
    toZone: DeliveryZone;
  }> {
    return fetchApi<{ success: boolean; fromZone: DeliveryZone; toZone: DeliveryZone }>(
      '/delivery/zones/reassign-town',
      {
        method: 'POST',
        body: JSON.stringify({ town, fromZoneId, toZoneId }),
      }
    );
  },

  async updatePolicy(
    unsupportedAddressPolicy: UnsupportedAddressPolicy,
    unsupportedAddressNotice?: string
  ): Promise<{ unsupportedAddressPolicy: UnsupportedAddressPolicy; unsupportedAddressNotice: string }> {
    return fetchApi<{ unsupportedAddressPolicy: UnsupportedAddressPolicy; unsupportedAddressNotice: string }>(
      '/delivery/policy',
      {
        method: 'PUT',
        body: JSON.stringify({ unsupportedAddressPolicy, unsupportedAddressNotice }),
      }
    );
  },

  async lookupZone(district?: string, town?: string): Promise<{
    matchedZone: DeliveryZone | null;
    isUnmapped: boolean;
    requiresReview: boolean;
    notice?: string;
  }> {
    return fetchApi<{
      matchedZone: DeliveryZone | null;
      isUnmapped: boolean;
      requiresReview: boolean;
      notice?: string;
    }>('/delivery/lookup-zone', {
      method: 'POST',
      body: JSON.stringify({ district, town }),
    });
  },
};
