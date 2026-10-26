import fs from 'fs';
import path from 'path';

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
  zone: 'WESTERN' | 'CENTRAL' | 'SOUTHERN' | 'NORTHERN' | 'EASTERN' | 'NORTH_WESTERN' | 'NORTH_CENTRAL' | 'UVA' | 'SABARAGAMUWA';
  deliveryFee: number;
  returnFee: number;
  estimatedDays: string;
  active: boolean;
}

export interface WeightTierConfig {
  upToKg: number;
  baseFee: number;
  extraPerKg: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  code: string;
  district: string; // 'Gampaha', 'Outstation', or custom
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

export interface DeliverySettingsData {
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;
  codHandlingFee: number;
  minCodAmount: number;
  maxCodAmount: number;
  returnFeeDefault: number;
  customerDeliveryNotice: string;
  rateDisclaimer: string;
  unsupportedAddressPolicy: UnsupportedAddressPolicy;
  unsupportedAddressNotice: string;
  activeCouriers: CourierProviderConfig[];
  districtRates: DistrictDeliveryRate[];
  weightTiers: WeightTierConfig[];
  deliveryZones: DeliveryZone[];
}

export const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-gampaha-nearby',
    name: 'Nearby towns in Gampaha District',
    code: 'GAMPAHA_NEARBY',
    district: 'Gampaha',
    deliveryFee: 400,
    returnFee: 300,
    estimatedDays: '1 Business Day',
    active: true,
    isInitialRate: true,
    description: 'Initial business rate for nearby towns in Gampaha District (LKR 400). Not verified official Koombiyo merchant rate.',
    towns: [
      'Wattala',
      'Ja-Ela',
      'Kandana',
      'Kelaniya',
      'Peliyagoda',
      'Ragama',
      'Kiribathgoda',
      'Kadawatha',
      'Mahabage',
      'Hunupitiya',
      'Mabola',
      'Biyagama',
      'Sapugaskanda',
      'Delgoda',
      'Hendala',
      'Enderamulla',
      'Dalugama',
      'Sedawatta',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zone-gampaha-other',
    name: 'Other towns in Gampaha District',
    code: 'GAMPAHA_OTHER',
    district: 'Gampaha',
    deliveryFee: 450,
    returnFee: 350,
    estimatedDays: '1–2 Business Days',
    active: true,
    isInitialRate: true,
    description: 'Initial business rate for other towns in Gampaha District (LKR 450). Not verified official Koombiyo merchant rate.',
    towns: [
      'Gampaha',
      'Negombo',
      'Minuwangoda',
      'Nittambuwa',
      'Veyangoda',
      'Mirigama',
      'Divulapitiya',
      'Katunayake',
      'Ganemulla',
      'Yakkala',
      'Pugoda',
      'Dompe',
      'Seeduwa',
      'Kotadeniyawa',
      'Wathupitiwala',
      'Pasyala',
      'Kirindiwela',
      'Udugampola',
      'Kalagedihena',
      'Radawana',
      'Bemmulla',
      'Alawala',
      'Walgama',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'zone-outstation',
    name: 'Outstation',
    code: 'OUTSTATION',
    district: 'Outstation',
    deliveryFee: 500,
    returnFee: 350,
    estimatedDays: '2–3 Business Days',
    active: true,
    isInitialRate: true,
    description: 'Initial business rate for Outstation delivery (LKR 500). Not verified official Koombiyo merchant rate.',
    towns: [
      // Colombo District
      'Colombo',
      'Dehiwala',
      'Mount Lavinia',
      'Moratuwa',
      'Nugegoda',
      'Maharagama',
      'Kottawa',
      'Malabe',
      'Battaramulla',
      'Kaduwela',
      'Pannipitiya',
      'Homagama',
      'Kolonnawa',
      'Wellampitiya',
      'Rajagiriya',
      'Nawala',
      'Kohuwala',
      'Boralesgamuwa',
      'Piliyandala',
      'Athurugiriya',
      'Hanwella',
      'Avissawella',
      // Kalutara District
      'Panadura',
      'Kalutara',
      'Horana',
      'Wadduwa',
      'Beruwala',
      'Aluthgama',
      'Matugama',
      'Bandaragama',
      'Ingiriya',
      // Kandy District
      'Kandy',
      'Peradeniya',
      'Katugastota',
      'Gampola',
      'Kundasale',
      'Digana',
      'Akurana',
      'Nawalapitiya',
      // Southern
      'Galle',
      'Hikkaduwa',
      'Karapitiya',
      'Ambalangoda',
      'Elpitiya',
      'Bentota',
      'Baddegama',
      'Matara',
      'Weligama',
      'Akuressa',
      'Dikwella',
      'Hambantota',
      'Tangalle',
      'Beliatta',
      // Central / North Western / Others
      'Kurunegala',
      'Kuliyapitiya',
      'Narammala',
      'Wariyapola',
      'Pannala',
      'Polgahawela',
      'Kegalle',
      'Mawanella',
      'Warakapola',
      'Ruwanwella',
      'Ratnapura',
      'Pelmadulla',
      'Balangoda',
      'Embilipitiya',
      'Kuruwita',
      'Anuradhapura',
      'Kekirawa',
      'Medawachchiya',
      'Badulla',
      'Bandarawela',
      'Haputale',
      'Welimada',
      'Matale',
      'Dambulla',
      'Sigiriya',
      'Nuwara Eliya',
      'Hatton',
      'Talawakelle',
      'Puttalam',
      'Chilaw',
      'Wennappuwa',
      'Marawila',
      'Polonnaruwa',
      'Kaduruwela',
      'Hingurakgoda',
      'Monaragala',
      'Wellawaya',
      'Bibile',
      'Trincomalee',
      'Kinniya',
      'Kantale',
      'Batticaloa',
      'Kattankudy',
      'Eravur',
      'Ampara',
      'Kalmunai',
      'Sammanthurai',
      'Jaffna',
      'Nallur',
      'Chavakachcheri',
      'Point Pedro',
      'Kilinochchi',
      'Mannar',
      'Vavuniya',
      'Mullaitivu',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettingsData = {
  defaultDeliveryFee: 450,
  freeDeliveryThreshold: 25000,
  codHandlingFee: 0,
  minCodAmount: 500,
  maxCodAmount: 100000,
  returnFeeDefault: 350,
  customerDeliveryNotice: 'Standard islandwide delivery takes 1–3 business days. Cash on delivery orders are verified by our concierge team before dispatch.',
  rateDisclaimer: 'Initial configuration values supplied by the business, not verified official Koombiyo merchant rates.',
  unsupportedAddressPolicy: 'REQUIRE_REVIEW',
  unsupportedAddressNotice: 'This town has no pre-configured delivery zone. Per store policy, our concierge team will review delivery options and confirm before dispatch (no arbitrary fee applied).',
  activeCouriers: [
    {
      id: 'courier-promptx',
      name: 'PromptX Courier',
      code: 'PROMPTX',
      trackingUrlPattern: 'https://promptx.lk/track/{trackingNumber}',
      active: true,
      contactPhone: '+94 11 234 5678',
      portalUrl: 'https://portal.promptx.lk',
    },
    {
      id: 'courier-domex',
      name: 'Domex Courier',
      code: 'DOMEX',
      trackingUrlPattern: 'https://domex.lk/tracking?wb={trackingNumber}',
      active: true,
      contactPhone: '+94 11 770 0400',
      portalUrl: 'https://domex.lk/merchant',
    },
    {
      id: 'courier-koombiyo',
      name: 'Koombiyo Delivery',
      code: 'KOOMBIYO',
      trackingUrlPattern: 'https://koombiyodelivery.lk/track/{trackingNumber}',
      active: true,
      contactPhone: '+94 11 750 0500',
      portalUrl: 'https://koombiyo.lk/login',
    },
    {
      id: 'courier-pronto',
      name: 'Pronto Lanka',
      code: 'PRONTO',
      trackingUrlPattern: 'https://prontolanka.com/tracking/{trackingNumber}',
      active: true,
      contactPhone: '+94 11 250 5500',
      portalUrl: 'https://prontolanka.com',
    },
    {
      id: 'courier-fardar',
      name: 'Fardar Express',
      code: 'FARDAR',
      trackingUrlPattern: 'https://fardarexpress.com/track/{trackingNumber}',
      active: false,
      contactPhone: '+94 11 450 0000',
    },
    {
      id: 'courier-certis',
      name: 'Certis Courier Services',
      code: 'CERTIS',
      trackingUrlPattern: 'https://certislanka.com/tracking/{trackingNumber}',
      active: false,
      contactPhone: '+94 11 255 7777',
    },
  ],
  districtRates: [
    // Western Province
    { district: 'Colombo', zone: 'WESTERN', deliveryFee: 400, returnFee: 300, estimatedDays: '1 Business Day', active: true },
    { district: 'Gampaha', zone: 'WESTERN', deliveryFee: 450, returnFee: 300, estimatedDays: '1–2 Business Days', active: true },
    { district: 'Kalutara', zone: 'WESTERN', deliveryFee: 450, returnFee: 300, estimatedDays: '1–2 Business Days', active: true },
    // Central Province
    { district: 'Kandy', zone: 'CENTRAL', deliveryFee: 500, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    { district: 'Matale', zone: 'CENTRAL', deliveryFee: 550, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    { district: 'Nuwara Eliya', zone: 'CENTRAL', deliveryFee: 600, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    // Southern Province
    { district: 'Galle', zone: 'SOUTHERN', deliveryFee: 500, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    { district: 'Matara', zone: 'SOUTHERN', deliveryFee: 550, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    { district: 'Hambantota', zone: 'SOUTHERN', deliveryFee: 600, returnFee: 400, estimatedDays: '2–3 Business Days', active: true },
    // North Western
    { district: 'Kurunegala', zone: 'NORTH_WESTERN', deliveryFee: 500, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    { district: 'Puttalam', zone: 'NORTH_WESTERN', deliveryFee: 550, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    // Sabaragamuwa
    { district: 'Ratnapura', zone: 'SABARAGAMUWA', deliveryFee: 500, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    { district: 'Kegalle', zone: 'SABARAGAMUWA', deliveryFee: 500, returnFee: 350, estimatedDays: '2–3 Business Days', active: true },
    // North Central
    { district: 'Anuradhapura', zone: 'NORTH_CENTRAL', deliveryFee: 600, returnFee: 400, estimatedDays: '2–4 Business Days', active: true },
    { district: 'Polonnaruwa', zone: 'NORTH_CENTRAL', deliveryFee: 600, returnFee: 400, estimatedDays: '2–4 Business Days', active: true },
    // Uva
    { district: 'Badulla', zone: 'UVA', deliveryFee: 600, returnFee: 400, estimatedDays: '2–4 Business Days', active: true },
    { district: 'Monaragala', zone: 'UVA', deliveryFee: 650, returnFee: 400, estimatedDays: '2–4 Business Days', active: true },
    // Eastern
    { district: 'Trincomalee', zone: 'EASTERN', deliveryFee: 650, returnFee: 450, estimatedDays: '2–4 Business Days', active: true },
    { district: 'Batticaloa', zone: 'EASTERN', deliveryFee: 650, returnFee: 450, estimatedDays: '2–4 Business Days', active: true },
    { district: 'Ampara', zone: 'EASTERN', deliveryFee: 650, returnFee: 450, estimatedDays: '2–4 Business Days', active: true },
    // Northern
    { district: 'Jaffna', zone: 'NORTHERN', deliveryFee: 700, returnFee: 450, estimatedDays: '3–5 Business Days', active: true },
    { district: 'Kilinochchi', zone: 'NORTHERN', deliveryFee: 700, returnFee: 450, estimatedDays: '3–5 Business Days', active: true },
    { district: 'Mannar', zone: 'NORTHERN', deliveryFee: 700, returnFee: 450, estimatedDays: '3–5 Business Days', active: true },
    { district: 'Vavuniya', zone: 'NORTHERN', deliveryFee: 650, returnFee: 450, estimatedDays: '2–4 Business Days', active: true },
    { district: 'Mullaitivu', zone: 'NORTHERN', deliveryFee: 700, returnFee: 450, estimatedDays: '3–5 Business Days', active: true },
  ],
  weightTiers: [
    { upToKg: 1.0, baseFee: 0, extraPerKg: 0 },
    { upToKg: 2.0, baseFee: 100, extraPerKg: 0 },
    { upToKg: 5.0, baseFee: 250, extraPerKg: 50 },
  ],
  deliveryZones: INITIAL_DELIVERY_ZONES,
};

export class DeliverySettingsRepository {
  private filePath = path.join(__dirname, '../../data/delivery_settings.json');

  private readFromDisk(): DeliverySettingsData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);

        // Migrate / backfill deliveryZones and policy if missing from disk
        let needsSave = false;
        if (!parsed.deliveryZones || !Array.isArray(parsed.deliveryZones) || parsed.deliveryZones.length === 0) {
          parsed.deliveryZones = INITIAL_DELIVERY_ZONES;
          needsSave = true;
        }
        if (!parsed.unsupportedAddressPolicy) {
          parsed.unsupportedAddressPolicy = 'REQUIRE_REVIEW';
          needsSave = true;
        }
        if (!parsed.unsupportedAddressNotice) {
          parsed.unsupportedAddressNotice = DEFAULT_DELIVERY_SETTINGS.unsupportedAddressNotice;
          needsSave = true;
        }
        if (!parsed.rateDisclaimer) {
          parsed.rateDisclaimer = DEFAULT_DELIVERY_SETTINGS.rateDisclaimer;
          needsSave = true;
        }

        if (needsSave) {
          this.writeToDisk(parsed);
        }

        return parsed;
      }
    } catch (err) {
      console.error('[DeliverySettingsRepository] Error reading from disk:', err);
    }
    // Seed default if not yet created
    this.writeToDisk(DEFAULT_DELIVERY_SETTINGS);
    return DEFAULT_DELIVERY_SETTINGS;
  }

  private writeToDisk(data: DeliverySettingsData): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DeliverySettingsRepository] Error writing to disk:', err);
    }
  }

  async getSettings(): Promise<DeliverySettingsData> {
    return this.readFromDisk();
  }

  async updateSettings(partial: Partial<DeliverySettingsData>): Promise<DeliverySettingsData> {
    const current = this.readFromDisk();
    const updated: DeliverySettingsData = {
      ...current,
      ...partial,
      activeCouriers: partial.activeCouriers || current.activeCouriers,
      districtRates: partial.districtRates || current.districtRates,
      weightTiers: partial.weightTiers || current.weightTiers,
      deliveryZones: partial.deliveryZones || current.deliveryZones,
      unsupportedAddressPolicy: partial.unsupportedAddressPolicy || current.unsupportedAddressPolicy,
      unsupportedAddressNotice: partial.unsupportedAddressNotice || current.unsupportedAddressNotice,
      rateDisclaimer: partial.rateDisclaimer || current.rateDisclaimer,
    };
    this.writeToDisk(updated);
    return updated;
  }

  async getDistrictRate(districtName: string): Promise<DistrictDeliveryRate | null> {
    const settings = await this.getSettings();
    const clean = (districtName || '').trim().toLowerCase();
    const found = settings.districtRates.find(
      (d) => d.district.toLowerCase() === clean
    );
    return found || null;
  }

  // ==========================================
  // DELIVERY ZONES MANAGEMENT METHODS
  // ==========================================

  async getDeliveryZones(): Promise<DeliveryZone[]> {
    const settings = await this.getSettings();
    return settings.deliveryZones || [];
  }

  async getDeliveryZoneById(id: string): Promise<DeliveryZone | null> {
    const zones = await this.getDeliveryZones();
    return zones.find((z) => z.id === id) || null;
  }

  async createDeliveryZone(data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    const settings = await this.getSettings();
    const cleanName = (data.name || 'New Delivery Zone').trim();
    const id = data.id || `zone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const code = data.code || cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    const newZone: DeliveryZone = {
      id,
      name: cleanName,
      code,
      district: data.district || 'Gampaha',
      deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 450,
      returnFee: typeof data.returnFee === 'number' ? data.returnFee : 350,
      estimatedDays: data.estimatedDays || '1–2 Business Days',
      active: data.active !== undefined ? data.active : true,
      towns: Array.isArray(data.towns) ? data.towns.map((t) => t.trim()).filter(Boolean) : [],
      isInitialRate: false,
      description: data.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedZones = [...settings.deliveryZones, newZone];
    await this.updateSettings({ deliveryZones: updatedZones });
    return newZone;
  }

  async updateDeliveryZone(id: string, partial: Partial<DeliveryZone>): Promise<DeliveryZone> {
    const settings = await this.getSettings();
    const index = settings.deliveryZones.findIndex((z) => z.id === id);
    if (index === -1) {
      throw new Error(`Delivery zone not found: ${id}`);
    }

    const currentZone = settings.deliveryZones[index];
    const updatedZone: DeliveryZone = {
      ...currentZone,
      ...partial,
      towns: partial.towns ? partial.towns.map((t) => t.trim()).filter(Boolean) : currentZone.towns,
      updatedAt: new Date().toISOString(),
    };

    const newZones = [...settings.deliveryZones];
    newZones[index] = updatedZone;
    await this.updateSettings({ deliveryZones: newZones });
    return updatedZone;
  }

  async deleteDeliveryZone(id: string): Promise<boolean> {
    const settings = await this.getSettings();
    const filtered = settings.deliveryZones.filter((z) => z.id !== id);
    if (filtered.length === settings.deliveryZones.length) {
      return false;
    }
    await this.updateSettings({ deliveryZones: filtered });
    return true;
  }

  async addTownToZone(zoneId: string, town: string): Promise<DeliveryZone> {
    const settings = await this.getSettings();
    const zone = settings.deliveryZones.find((z) => z.id === zoneId);
    if (!zone) {
      throw new Error(`Zone not found: ${zoneId}`);
    }

    const cleanTown = town.trim();
    if (!cleanTown) {
      throw new Error('Town name cannot be empty');
    }

    // Avoid duplicate within the same zone (case-insensitive)
    const exists = zone.towns.some((t) => t.toLowerCase() === cleanTown.toLowerCase());
    if (exists) {
      return zone;
    }

    // Also remove from any other zone if moving
    const updatedZones = settings.deliveryZones.map((z) => {
      if (z.id === zoneId) {
        return {
          ...z,
          towns: [...z.towns, cleanTown],
          updatedAt: new Date().toISOString(),
        };
      } else {
        return {
          ...z,
          towns: z.towns.filter((t) => t.toLowerCase() !== cleanTown.toLowerCase()),
        };
      }
    });

    await this.updateSettings({ deliveryZones: updatedZones });
    return updatedZones.find((z) => z.id === zoneId)!;
  }

  async removeTownFromZone(zoneId: string, town: string): Promise<DeliveryZone> {
    const settings = await this.getSettings();
    const zone = settings.deliveryZones.find((z) => z.id === zoneId);
    if (!zone) {
      throw new Error(`Zone not found: ${zoneId}`);
    }

    const cleanTown = town.trim().toLowerCase();
    const updatedZones = settings.deliveryZones.map((z) => {
      if (z.id === zoneId) {
        return {
          ...z,
          towns: z.towns.filter((t) => t.toLowerCase() !== cleanTown),
          updatedAt: new Date().toISOString(),
        };
      }
      return z;
    });

    await this.updateSettings({ deliveryZones: updatedZones });
    return updatedZones.find((z) => z.id === zoneId)!;
  }

  async reassignTown(
    town: string,
    fromZoneId: string,
    toZoneId: string
  ): Promise<{ success: boolean; fromZone: DeliveryZone; toZone: DeliveryZone }> {
    const settings = await this.getSettings();
    const cleanTown = town.trim();
    if (!cleanTown) {
      throw new Error('Town name cannot be empty');
    }

    const fromZ = settings.deliveryZones.find((z) => z.id === fromZoneId);
    const toZ = settings.deliveryZones.find((z) => z.id === toZoneId);
    if (!toZ) {
      throw new Error(`Target destination zone not found: ${toZoneId}`);
    }

    const updatedZones = settings.deliveryZones.map((z) => {
      let towns = [...z.towns];
      if (z.id === fromZoneId) {
        towns = towns.filter((t) => t.toLowerCase() !== cleanTown.toLowerCase());
      }
      if (z.id === toZoneId) {
        if (!towns.some((t) => t.toLowerCase() === cleanTown.toLowerCase())) {
          towns.push(cleanTown);
        }
      }
      return {
        ...z,
        towns,
        updatedAt: z.id === fromZoneId || z.id === toZoneId ? new Date().toISOString() : z.updatedAt,
      };
    });

    await this.updateSettings({ deliveryZones: updatedZones });
    return {
      success: true,
      fromZone: updatedZones.find((z) => z.id === fromZoneId) || fromZ!,
      toZone: updatedZones.find((z) => z.id === toZoneId)!,
    };
  }

  async updateUnsupportedPolicy(
    policy: UnsupportedAddressPolicy,
    notice?: string
  ): Promise<{ unsupportedAddressPolicy: UnsupportedAddressPolicy; unsupportedAddressNotice: string }> {
    const settings = await this.getSettings();
    const updated = await this.updateSettings({
      unsupportedAddressPolicy: policy,
      unsupportedAddressNotice: notice || settings.unsupportedAddressNotice,
    });
    return {
      unsupportedAddressPolicy: updated.unsupportedAddressPolicy,
      unsupportedAddressNotice: updated.unsupportedAddressNotice,
    };
  }

  /**
   * Resolve a Delivery Zone for a given district and town
   * Strictly avoids arbitrary guessing if no active zone contains the town
   */
  async findZoneForTown(
    district?: string,
    town?: string
  ): Promise<{
    matchedZone: DeliveryZone | null;
    isUnmapped: boolean;
    requiresReview: boolean;
    notice?: string;
  }> {
    const settings = await this.getSettings();
    const activeZones = settings.deliveryZones.filter((z) => z.active);

    const cleanDistrict = (district || '').trim().toLowerCase();
    const cleanTown = (town || '').trim().toLowerCase();

    if (!cleanTown) {
      // No town provided yet; check if district has a single unambiguous zone
      const districtZones = activeZones.filter(
        (z) => z.district.toLowerCase() === cleanDistrict
      );
      if (districtZones.length === 1) {
        return {
          matchedZone: districtZones[0],
          isUnmapped: false,
          requiresReview: false,
        };
      }
      return {
        matchedZone: null,
        isUnmapped: false,
        requiresReview: false,
        notice: 'Please select or enter your town to determine delivery charge.',
      };
    }

    const isTownMatch = (townInZone: string, inputTown: string) => {
      const zt = townInZone.toLowerCase();
      if (zt === inputTown) return true;
      if (inputTown.startsWith(zt + ' ') || inputTown.startsWith(zt + '-') || inputTown.startsWith(zt + ',')) return true;
      if (zt.length >= 4 && (inputTown.includes(zt) || zt.includes(inputTown))) return true;
      return false;
    };

    // 1. Direct match by town name inside active zones for this district
    let matched = activeZones.find(
      (z) =>
        (z.district.toLowerCase() === cleanDistrict || z.district.toLowerCase() === 'all') &&
        z.towns.some((t) => isTownMatch(t, cleanTown))
    );

    // 2. If district is not Gampaha, check Outstation zones
    if (!matched && cleanDistrict !== 'gampaha') {
      matched = activeZones.find(
        (z) =>
          z.code === 'OUTSTATION' &&
          z.towns.some((t) => isTownMatch(t, cleanTown))
      );
    }

    // 3. Fallback: Check any active zone containing this town
    if (!matched) {
      matched = activeZones.find((z) =>
        z.towns.some((t) => isTownMatch(t, cleanTown))
      );
    }

    if (matched) {
      return {
        matchedZone: matched,
        isUnmapped: false,
        requiresReview: false,
      };
    }

    // Town is NOT mapped to any active delivery zone!
    // Do not guess town mappings. If a town has no configured zone, request review instead of applying an arbitrary fee.
    return {
      matchedZone: null,
      isUnmapped: true,
      requiresReview: settings.unsupportedAddressPolicy === 'REQUIRE_REVIEW',
      notice: settings.unsupportedAddressNotice,
    };
  }
}
