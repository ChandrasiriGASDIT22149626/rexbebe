import { db, DatabaseManager } from '../../config/database';

export class PostgresSettingsRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  // --- 1. STORE SETTINGS (StoreSettings table) ---
  public async getStoreSettings(): Promise<any> {
    const res = await this.database.query(`SELECT * FROM "StoreSettings" WHERE id = 'default' LIMIT 1`);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    const parse = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v || {});
    return {
      storeInfo: parse(r.storeInfo),
      international: parse(r.international),
      shipping: parse(r.shipping),
      payments: parse(r.payments),
      seo: parse(r.seo),
    };
  }

  public async updateStoreSettings(settings: any): Promise<any> {
    const now = new Date();
    const current = (await this.getStoreSettings()) || {};
    const merged = { ...current, ...settings };

    await this.database.query(
      `INSERT INTO "StoreSettings" (id, "storeInfo", international, shipping, payments, seo, "createdAt", "updatedAt")
       VALUES ('default', $1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (id) DO UPDATE SET
         "storeInfo" = EXCLUDED."storeInfo",
         international = EXCLUDED.international,
         shipping = EXCLUDED.shipping,
         payments = EXCLUDED.payments,
         seo = EXCLUDED.seo,
         "updatedAt" = EXCLUDED."updatedAt"`,
      [
        JSON.stringify(merged.storeInfo || {}),
        JSON.stringify(merged.international || {}),
        JSON.stringify(merged.shipping || {}),
        JSON.stringify(merged.payments || {}),
        JSON.stringify(merged.seo || {}),
        now,
      ]
    );

    return merged;
  }

  // --- 2. HOMEPAGE CONFIGURATION (HomepageConfig table) ---
  public async getHomepageConfig(): Promise<any> {
    const res = await this.database.query(`SELECT * FROM "HomepageConfig" WHERE id = 'default' LIMIT 1`);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    const parse = (v: any) => (typeof v === 'string' ? JSON.parse(v) : v || {});
    return r.rawConfig ? parse(r.rawConfig) : {
      hero: parse(r.hero),
      announcements: parse(r.announcements),
      featuredSections: parse(r.featuredSections),
      bannerGrid: parse(r.bannerGrid),
      valueProps: parse(r.valueProps),
    };
  }

  public async updateHomepageConfig(config: any): Promise<any> {
    const now = new Date();
    await this.database.query(
      `INSERT INTO "HomepageConfig" (id, hero, announcements, "featuredSections", "bannerGrid", "valueProps", "rawConfig", "createdAt", "updatedAt")
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $7)
       ON CONFLICT (id) DO UPDATE SET
         hero = EXCLUDED.hero,
         announcements = EXCLUDED.announcements,
         "featuredSections" = EXCLUDED."featuredSections",
         "bannerGrid" = EXCLUDED."bannerGrid",
         "valueProps" = EXCLUDED."valueProps",
         "rawConfig" = EXCLUDED."rawConfig",
         "updatedAt" = EXCLUDED."updatedAt"`,
      [
        JSON.stringify(config.hero || {}),
        JSON.stringify(config.announcements || []),
        JSON.stringify(config.featuredSections || []),
        JSON.stringify(config.bannerGrid || []),
        JSON.stringify(config.valueProps || []),
        JSON.stringify(config),
        now,
      ]
    );

    return config;
  }

  // --- 3. SEO SETTINGS (SeoSettings table) ---
  public async getSeoSettings(): Promise<any> {
    const res = await this.database.query(`SELECT * FROM "SeoSettings" WHERE id = 'default' LIMIT 1`);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    if (r.rawConfig) {
      return typeof r.rawConfig === 'string' ? JSON.parse(r.rawConfig) : r.rawConfig;
    }
    return {
      metaTitle: r.metaTitle,
      metaDescription: r.metaDescription,
      socialShareImage: r.socialShareImage,
      keywords: r.keywords,
    };
  }

  public async updateSeoSettings(seo: any): Promise<any> {
    const now = new Date();
    await this.database.query(
      `INSERT INTO "SeoSettings" (id, "metaTitle", "metaDescription", "socialShareImage", keywords, "rawConfig", "createdAt", "updatedAt")
       VALUES ('default', $1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (id) DO UPDATE SET
         "metaTitle" = EXCLUDED."metaTitle",
         "metaDescription" = EXCLUDED."metaDescription",
         "socialShareImage" = EXCLUDED."socialShareImage",
         keywords = EXCLUDED.keywords,
         "rawConfig" = EXCLUDED."rawConfig",
         "updatedAt" = EXCLUDED."updatedAt"`,
      [
        seo.metaTitle || seo.title || null,
        seo.metaDescription || seo.description || null,
        seo.socialShareImage || seo.ogImage || null,
        seo.keywords || null,
        JSON.stringify(seo),
        now,
      ]
    );

    return seo;
  }
}

export const postgresSettingsRepository = new PostgresSettingsRepository();

