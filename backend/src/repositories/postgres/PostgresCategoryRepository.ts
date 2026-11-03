import { db, DatabaseManager } from '../../config/database';
import { CategoryRecord, CreateCategoryInput, UpdateCategoryInput } from '../categoryRepository';

export class PostgresCategoryRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToCategory(row: any): CategoryRecord {
    const parseJson = (val: any, fallback: any = []) => {
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
      slug: row.slug,
      parentId: row.parentId || null,
      order: Number(row.order || 0),
      status: row.status as any || 'published',
      isActive: Boolean(row.isActive),
      pageTitle: row.pageTitle || undefined,
      href: row.href || undefined,
      description: row.description || undefined,
      shortDescription: row.shortDescription || undefined,
      detailedDescription: row.detailedDescription || undefined,
      bannerImage: row.bannerImage || undefined,
      thumbnailImage: row.thumbnailImage || undefined,
      galleryImages: parseJson(row.galleryImages, []),
      assignedProductIds: parseJson(row.assignedProductIds, []),
      shortcutButtons: parseJson(row.shortcutButtons, []),
      badge: row.badge || undefined,
      seoTitle: row.seoTitle || undefined,
      seoDescription: row.seoDescription || undefined,
      destinationType: row.destinationType || undefined,
      destinationReference: row.destinationReference || undefined,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async findAll(): Promise<CategoryRecord[]> {
    const res = await this.database.query(`SELECT * FROM "Category" ORDER BY "order" ASC, "name" ASC`);
    return res.rows.map(r => this.mapRowToCategory(r));
  }

  public async findById(id: string): Promise<CategoryRecord | null> {
    if (!id) return null;
    const res = await this.database.query(
      `SELECT * FROM "Category" WHERE id = $1 OR LOWER(slug) = LOWER($1) LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToCategory(res.rows[0]);
  }

  public async findBySlug(slug: string): Promise<CategoryRecord | null> {
    if (!slug) return null;
    const res = await this.database.query(
      `SELECT * FROM "Category" WHERE LOWER(slug) = LOWER($1) LIMIT 1`,
      [slug]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToCategory(res.rows[0]);
  }

  public async create(input: CreateCategoryInput): Promise<CategoryRecord> {
    const id = input.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    await this.database.query(
      `INSERT INTO "Category" (
        id, name, slug, "parentId", "order", status, "isActive", "pageTitle", href,
        description, "shortDescription", "detailedDescription", "bannerImage", "thumbnailImage",
        "galleryImages", "assignedProductIds", "shortcutButtons", badge, "seoTitle", "seoDescription",
        "destinationType", "destinationReference", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        "parentId" = EXCLUDED."parentId",
        "order" = EXCLUDED."order",
        status = EXCLUDED.status,
        "isActive" = EXCLUDED."isActive",
        "pageTitle" = EXCLUDED."pageTitle",
        href = EXCLUDED.href,
        description = EXCLUDED.description,
        "shortDescription" = EXCLUDED."shortDescription",
        "detailedDescription" = EXCLUDED."detailedDescription",
        "bannerImage" = EXCLUDED."bannerImage",
        "thumbnailImage" = EXCLUDED."thumbnailImage",
        "galleryImages" = EXCLUDED."galleryImages",
        "assignedProductIds" = EXCLUDED."assignedProductIds",
        "shortcutButtons" = EXCLUDED."shortcutButtons",
        badge = EXCLUDED.badge,
        "seoTitle" = EXCLUDED."seoTitle",
        "seoDescription" = EXCLUDED."seoDescription",
        "destinationType" = EXCLUDED."destinationType",
        "destinationReference" = EXCLUDED."destinationReference",
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        id,
        input.name,
        slug,
        input.parentId || null,
        input.order !== undefined ? input.order : 0,
        input.status || 'published',
        input.isActive !== undefined ? input.isActive : true,
        input.pageTitle || null,
        input.href || `/shop/${slug}`,
        input.description || null,
        input.shortDescription || null,
        input.detailedDescription || null,
        input.bannerImage || null,
        input.thumbnailImage || null,
        JSON.stringify(input.galleryImages || []),
        JSON.stringify(input.assignedProductIds || []),
        JSON.stringify(input.shortcutButtons || []),
        input.badge || null,
        input.seoTitle || null,
        input.seoDescription || null,
        input.destinationType || null,
        input.destinationReference || null,
        now,
        now,
      ]
    );

    return (await this.findById(id))!;
  }

  public async update(id: string, updates: UpdateCategoryInput): Promise<CategoryRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const now = new Date();

    await this.database.query(
      `UPDATE "Category" SET
        name = $2,
        slug = $3,
        "parentId" = $4,
        "order" = $5,
        status = $6,
        "isActive" = $7,
        "pageTitle" = $8,
        href = $9,
        description = $10,
        "shortDescription" = $11,
        "detailedDescription" = $12,
        "bannerImage" = $13,
        "thumbnailImage" = $14,
        "galleryImages" = $15,
        "assignedProductIds" = $16,
        "shortcutButtons" = $17,
        badge = $18,
        "seoTitle" = $19,
        "seoDescription" = $20,
        "destinationType" = $21,
        "destinationReference" = $22,
        "updatedAt" = $23
       WHERE id = $1`,
      [
        id,
        merged.name,
        merged.slug,
        merged.parentId || null,
        Number(merged.order || 0),
        merged.status,
        Boolean(merged.isActive),
        merged.pageTitle || null,
        merged.href || null,
        merged.description || null,
        merged.shortDescription || null,
        merged.detailedDescription || null,
        merged.bannerImage || null,
        merged.thumbnailImage || null,
        JSON.stringify(merged.galleryImages || []),
        JSON.stringify(merged.assignedProductIds || []),
        JSON.stringify(merged.shortcutButtons || []),
        merged.badge || null,
        merged.seoTitle || null,
        merged.seoDescription || null,
        merged.destinationType || null,
        merged.destinationReference || null,
        now,
      ]
    );

    return await this.findById(id);
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.database.query(`DELETE FROM "Category" WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const postgresCategoryRepository = new PostgresCategoryRepository();

