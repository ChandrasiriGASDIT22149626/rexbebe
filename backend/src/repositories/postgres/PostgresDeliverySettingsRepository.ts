import { db, DatabaseManager } from '../../config/database';
import {
  DeliverySettingsData,
  DeliveryZone,
  DistrictDeliveryRate,
  DEFAULT_DELIVERY_SETTINGS,
} from '../deliverySettingsRepository';

export class PostgresDeliverySettingsRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  public async getSettings(): Promise<DeliverySettingsData> {
    const res = await this.database.query(
      `SELECT * FROM "DeliveryZoneSettings" WHERE id = 'default' LIMIT 1`
    );

    if (res.rows.length === 0) {
      return { ...DEFAULT_DELIVERY_SETTINGS };
    }

    const row = res.rows[0];
    const parse = (val: any, fallback: any = []) => {
      if (!val) return fallback;
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return fallback;
        }
      }
      return val;
    };

    return {
      ...DEFAULT_DELIVERY_SETTINGS,
      activeCouriers: DEFAULT_DELIVERY_SETTINGS.activeCouriers,
      districtRates: parse(row.rates, DEFAULT_DELIVERY_SETTINGS.districtRates),
      deliveryZones: parse(row.zones, DEFAULT_DELIVERY_SETTINGS.deliveryZones),
    };
  }

  public async updateSettings(partial: Partial<DeliverySettingsData>): Promise<DeliverySettingsData> {
    const current = await this.getSettings();
    const updated: DeliverySettingsData = {
      ...current,
      ...partial,
      activeCouriers: partial.activeCouriers || current.activeCouriers,
      districtRates: partial.districtRates || current.districtRates,
      deliveryZones: partial.deliveryZones || current.deliveryZones,
    };

    const now = new Date();
    await this.database.query(
      `INSERT INTO "DeliveryZoneSettings" (id, zones, rates, "courierAgreements", "domesticRates", "internationalRates", "createdAt", "updatedAt")
       VALUES ('default', $1, $2, '[]', NULL, NULL, $3, $3)
       ON CONFLICT (id) DO UPDATE SET
         zones = EXCLUDED.zones,
         rates = EXCLUDED.rates,
         "updatedAt" = EXCLUDED."updatedAt"`,
      [
        JSON.stringify(updated.deliveryZones),
        JSON.stringify(updated.districtRates),
        now,
      ]
    );

    return updated;
  }

  public async getDistrictRate(districtName: string): Promise<DistrictDeliveryRate | null> {
    const settings = await this.getSettings();
    const clean = (districtName || '').trim().toLowerCase();
    const found = settings.districtRates.find(
      (d) => d.district.toLowerCase() === clean
    );
    return found || null;
  }

  public async getDeliveryZones(): Promise<DeliveryZone[]> {
    const settings = await this.getSettings();
    return settings.deliveryZones || [];
  }

  public async getDeliveryZoneById(id: string): Promise<DeliveryZone | null> {
    const zones = await this.getDeliveryZones();
    return zones.find((z) => z.id === id) || null;
  }

  public async createDeliveryZone(zone: DeliveryZone): Promise<DeliveryZone> {
    const current = await this.getSettings();
    const zones = current.deliveryZones || [];
    zones.push(zone);
    await this.updateSettings({ deliveryZones: zones });
    return zone;
  }

  public async updateDeliveryZone(id: string, updates: Partial<DeliveryZone>): Promise<DeliveryZone | null> {
    const current = await this.getSettings();
    const zones = current.deliveryZones || [];
    const idx = zones.findIndex((z) => z.id === id);
    if (idx === -1) return null;

    zones[idx] = { ...zones[idx], ...updates, updatedAt: new Date().toISOString() };
    await this.updateSettings({ deliveryZones: zones });
    return zones[idx];
  }

  public async deleteDeliveryZone(id: string): Promise<boolean> {
    const current = await this.getSettings();
    const zones = current.deliveryZones || [];
    const filtered = zones.filter((z) => z.id !== id);
    if (filtered.length === zones.length) return false;

    await this.updateSettings({ deliveryZones: filtered });
    return true;
  }
}

export const postgresDeliverySettingsRepository = new PostgresDeliverySettingsRepository();
