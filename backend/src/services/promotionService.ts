import fs from 'fs';
import path from 'path';
import { postgresSettingsRepository } from '../repositories/postgres/PostgresSettingsRepository';

export interface PromotionalPopupConfig {
  enabled: boolean;
  heading: string;
  subheading: string;
  description: string;
  offerBadge: string;
  discountPercentage: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  promoCode: string;
  minSpend: number;
  imageUrl: string;
  shopNowText: string;
  shopNowHref: string;
  startDate?: string;
  endDate?: string;
  displayDelaySeconds: number;
  updatedAt: string;
}

const DEFAULT_POPUP_CONFIG: PromotionalPopupConfig = {
  enabled: true,
  heading: 'LITTLE ONES SALE!',
  subheading: 'SPECIAL OFFER 🌸',
  description: 'Enjoy special discounts on selected baby clothing! Soft organic cashmere rompers & pastel sets for your little darling.',
  offerBadge: '20% OFF',
  discountPercentage: 20,
  discountType: 'PERCENTAGE',
  promoCode: 'LITTLE20',
  minSpend: 0,
  imageUrl: '/images/products/cocomelon-pink-folded-tshirt.jpg',
  shopNowText: 'Shop Little Ones Sale 🛍',
  shopNowHref: '/sale',
  startDate: '2026-11-01',
  endDate: '2026-12-31',
  displayDelaySeconds: 2,
  updatedAt: new Date().toISOString(),
};

const popupFilePath = path.resolve(__dirname, '../../data/promotional_popup.json');

export class PromotionService {
  private readConfigFromFile(): PromotionalPopupConfig {
    try {
      if (fs.existsSync(popupFilePath)) {
        const raw = fs.readFileSync(popupFilePath, 'utf-8');
        return { ...DEFAULT_POPUP_CONFIG, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[PromotionService] Error reading file, using default:', err);
    }
    return DEFAULT_POPUP_CONFIG;
  }

  private writeConfigToFile(config: PromotionalPopupConfig): void {
    try {
      const dir = path.dirname(popupFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(popupFilePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PromotionService] Error writing file:', err);
    }
  }

  public async getPopupConfig(): Promise<PromotionalPopupConfig> {
    if (process.env.USE_POSTGRES === 'true') {
      try {
        const dbConfig = await postgresSettingsRepository.getPromotionalPopupConfig();
        if (dbConfig) {
          return {
            ...DEFAULT_POPUP_CONFIG,
            ...dbConfig,
            // Strictly enforce the boolean state saved in database so false is never reverted to default true
            enabled: Boolean(dbConfig.enabled),
          };
        }
      } catch (e) {
        console.warn('[PromotionService] Postgres read error, falling back to file:', e);
      }
    }
    return this.readConfigFromFile();
  }

  public async getPublicPopupConfig(): Promise<PromotionalPopupConfig | null> {
    const config = await this.getPopupConfig();
    if (!config || !config.enabled) return null;

    const today = new Date().toISOString().split('T')[0];
    if (config.startDate && config.startDate > today) {
      return null;
    }
    if (config.endDate && config.endDate < today) {
      return null;
    }

    return config;
  }

  public async updatePopupConfig(partial: Partial<PromotionalPopupConfig>): Promise<PromotionalPopupConfig> {
    const current = await this.getPopupConfig();
    const updated: PromotionalPopupConfig = {
      ...current,
      ...partial,
      enabled: partial.enabled !== undefined ? Boolean(partial.enabled) : current.enabled,
      updatedAt: new Date().toISOString(),
    };

    if (process.env.USE_POSTGRES === 'true') {
      try {
        await postgresSettingsRepository.updatePromotionalPopupConfig(updated);
      } catch (e) {
        console.error('[PromotionService] Critical Postgres write error:', e);
        throw new Error(`Failed to persist promotion configuration to database: ${(e as any).message}`);
      }
    }

    // Best-effort local file write for offline dev; caught cleanly on Vercel read-only filesystem
    try {
      this.writeConfigToFile(updated);
    } catch (_) {}

    return updated;
  }
}

export const promotionService = new PromotionService();

