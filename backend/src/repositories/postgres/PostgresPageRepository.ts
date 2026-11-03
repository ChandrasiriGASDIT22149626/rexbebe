import { db, DatabaseManager } from '../../config/database';
import { WebsitePageRecord } from '../../controllers/pageController';

export class PostgresPageRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToPage(row: any): WebsitePageRecord {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      url: row.url || `/pages/${row.slug}`,
      heading: row.heading || row.name,
      shortDescription: row.shortDescription || '',
      detailedDescription: row.detailedDescription || row.content || '',
      bannerImage: row.bannerImage || '',
      status: (row.status as any) || 'published',
      isVisible: row.isVisible !== false,
      seoTitle: row.seoTitle || row.name,
      seoDescription: row.seoDescription || '',
      lastUpdated: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async getAll(): Promise<WebsitePageRecord[]> {
    const res = await this.database.query(`SELECT * FROM "WebsitePage" ORDER BY "name" ASC`);
    return res.rows.map((r) => this.mapRowToPage(r));
  }

  public async getBySlug(slug: string): Promise<WebsitePageRecord | null> {
    if (!slug) return null;
    const res = await this.database.query(
      `SELECT * FROM "WebsitePage" WHERE LOWER(slug) = LOWER($1) OR id = $1 LIMIT 1`,
      [slug.trim()]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToPage(res.rows[0]);
  }

  public async update(id: string, updates: Partial<WebsitePageRecord>): Promise<WebsitePageRecord | null> {
    const existing = await this.getBySlug(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, lastUpdated: new Date().toISOString() };
    const now = new Date();

    await this.database.query(
      `UPDATE "WebsitePage" SET
        name = $2,
        slug = $3,
        url = $4,
        heading = $5,
        "shortDescription" = $6,
        "detailedDescription" = $7,
        content = $7,
        "bannerImage" = $8,
        status = $9,
        "isVisible" = $10,
        "seoTitle" = $11,
        "seoDescription" = $12,
        "updatedAt" = $13
       WHERE id = $1`,
      [
        id,
        merged.name,
        merged.slug,
        merged.url,
        merged.heading,
        merged.shortDescription,
        merged.detailedDescription,
        merged.bannerImage,
        merged.status,
        merged.isVisible,
        merged.seoTitle,
        merged.seoDescription,
        now,
      ]
    );

    return await this.getBySlug(id);
  }

  public async create(page: WebsitePageRecord): Promise<WebsitePageRecord> {
    const id = page.id || `page-${page.slug}`;
    const now = new Date();

    await this.database.query(
      `INSERT INTO "WebsitePage" (
        id, name, slug, url, heading, "shortDescription", "detailedDescription", content,
        "bannerImage", status, "isVisible", "seoTitle", "seoDescription", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, $11, $12, $13, $13)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        url = EXCLUDED.url,
        heading = EXCLUDED.heading,
        "shortDescription" = EXCLUDED."shortDescription",
        "detailedDescription" = EXCLUDED."detailedDescription",
        content = EXCLUDED.content,
        "bannerImage" = EXCLUDED."bannerImage",
        status = EXCLUDED.status,
        "isVisible" = EXCLUDED."isVisible",
        "seoTitle" = EXCLUDED."seoTitle",
        "seoDescription" = EXCLUDED."seoDescription",
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        id,
        page.name,
        page.slug,
        page.url || `/pages/${page.slug}`,
        page.heading || page.name,
        page.shortDescription || '',
        page.detailedDescription || '',
        page.bannerImage || '',
        page.status || 'published',
        page.isVisible !== false,
        page.seoTitle || page.name,
        page.seoDescription || page.shortDescription || '',
        now,
      ]
    );

    return (await this.getBySlug(id)) || page;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.database.query(
      `DELETE FROM "WebsitePage" WHERE id = $1 OR LOWER(slug) = LOWER($1)`,
      [id.trim()]
    );
    return (res.rowCount || 0) > 0;
  }
}

export const postgresPageRepository = new PostgresPageRepository();

