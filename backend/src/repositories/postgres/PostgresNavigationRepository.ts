import { db, DatabaseManager } from '../../config/database';
import { NavItemConfig, NavigationConfig } from '../../services/navigationStorage';

export class PostgresNavigationRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToNavItem(row: any): NavItemConfig {
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
      id: row.id,
      name: row.name,
      pageTitle: row.pageTitle || undefined,
      slug: row.slug || undefined,
      href: row.href,
      badge: row.badge || undefined,
      description: row.description || undefined,
      shortDescription: row.shortDescription || undefined,
      detailedDescription: row.detailedDescription || undefined,
      bannerImage: row.bannerImage || undefined,
      thumbnailImage: row.thumbnailImage || undefined,
      galleryImages: parse(row.galleryImages, []),
      assignedProductIds: parse(row.assignedProductIds, []),
      status: row.status || 'published',
      order: Number(row.order || 0),
      isActive: Boolean(row.isActive),
      destinationType: row.destinationType || undefined,
      destinationReference: row.destinationReference || undefined,
      subGroups: parse(row.subGroups, []),
    };
  }

  public async getAll(): Promise<NavigationConfig> {
    const res = await this.database.query(
      `SELECT * FROM "NavigationItem" ORDER BY "order" ASC, "name" ASC`
    );
    const items = res.rows.map((r) => this.mapRowToNavItem(r));
    return { items };
  }

  public async getPublic(): Promise<NavigationConfig> {
    const res = await this.database.query(
      `SELECT * FROM "NavigationItem" WHERE "isActive" = true AND status = 'published' ORDER BY "order" ASC, "name" ASC`
    );
    const items = res.rows.map((r) => this.mapRowToNavItem(r));
    return { items };
  }

  public async updateAll(newConfig: NavigationConfig): Promise<NavigationConfig> {
    const items = newConfig.items || [];
    const now = new Date();

    await this.database.transaction(async (tx) => {
      // Upsert each item
      for (const item of items) {
        await tx.query(
          `INSERT INTO "NavigationItem" (
            id, name, "pageTitle", slug, href, "order", status, "isActive",
            badge, description, "shortDescription", "detailedDescription",
            "bannerImage", "thumbnailImage", "galleryImages", "assignedProductIds",
            "destinationType", "destinationReference", "subGroups", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $20)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            "pageTitle" = EXCLUDED."pageTitle",
            slug = EXCLUDED.slug,
            href = EXCLUDED.href,
            "order" = EXCLUDED."order",
            status = EXCLUDED.status,
            "isActive" = EXCLUDED."isActive",
            badge = EXCLUDED.badge,
            description = EXCLUDED.description,
            "shortDescription" = EXCLUDED."shortDescription",
            "detailedDescription" = EXCLUDED."detailedDescription",
            "bannerImage" = EXCLUDED."bannerImage",
            "thumbnailImage" = EXCLUDED."thumbnailImage",
            "galleryImages" = EXCLUDED."galleryImages",
            "assignedProductIds" = EXCLUDED."assignedProductIds",
            "destinationType" = EXCLUDED."destinationType",
            "destinationReference" = EXCLUDED."destinationReference",
            "subGroups" = EXCLUDED."subGroups",
            "updatedAt" = EXCLUDED."updatedAt"`,
          [
            item.id,
            item.name,
            item.pageTitle || null,
            item.slug || null,
            item.href,
            Number(item.order || 0),
            item.status || 'published',
            item.isActive !== undefined ? Boolean(item.isActive) : true,
            item.badge || null,
            item.description || null,
            item.shortDescription || null,
            item.detailedDescription || null,
            item.bannerImage || null,
            item.thumbnailImage || null,
            JSON.stringify(item.galleryImages || []),
            JSON.stringify(item.assignedProductIds || []),
            item.destinationType || null,
            item.destinationReference || null,
            JSON.stringify(item.subGroups || []),
            now,
          ]
        );
      }
    });

    return await this.getAll();
  }
}

export const postgresNavigationRepository = new PostgresNavigationRepository();

