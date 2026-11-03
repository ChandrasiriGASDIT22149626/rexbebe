import { db, DatabaseManager } from '../../config/database';
import { CollectionRecord } from '../../controllers/collectionController';

export class PostgresCollectionRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToCollection(row: any): CollectionRecord {
    const parse = (val: any) => {
      if (!val) return [];
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    };

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      bannerImage: row.bannerImage || '',
      bannerImageAlt: row.bannerImageAlt || undefined,
      assignedProductIds: parse(row.assignedProductIds),
      order: Number(row.order || 0),
      status: (row.status as any) || 'published',
      badge: row.badge || undefined,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async findAll(): Promise<CollectionRecord[]> {
    const res = await this.database.query(
      `SELECT * FROM "Collection" ORDER BY "order" ASC, "name" ASC`
    );
    return res.rows.map((r) => this.mapRowToCollection(r));
  }

  public async findById(id: string): Promise<CollectionRecord | null> {
    if (!id) return null;
    const res = await this.database.query(
      `SELECT * FROM "Collection" WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToCollection(res.rows[0]);
  }

  public async findBySlug(slug: string): Promise<CollectionRecord | null> {
    if (!slug) return null;
    const res = await this.database.query(
      `SELECT * FROM "Collection" WHERE LOWER(slug) = LOWER($1) LIMIT 1`,
      [slug.trim()]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToCollection(res.rows[0]);
  }

  public async create(data: Partial<CollectionRecord>): Promise<CollectionRecord> {
    const id = data.id || `col-${Date.now()}`;
    const slug = data.slug || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : id);
    const now = new Date();

    await this.database.query(
      `INSERT INTO "Collection" (
        id, name, slug, description, "bannerImage", badge, "order", status, "assignedProductIds", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        "bannerImage" = EXCLUDED."bannerImage",
        badge = EXCLUDED.badge,
        "order" = EXCLUDED."order",
        status = EXCLUDED.status,
        "assignedProductIds" = EXCLUDED."assignedProductIds",
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        id,
        data.name || 'Untitled Collection',
        slug,
        data.description || null,
        data.bannerImage || null,
        data.badge || null,
        Number(data.order || 0),
        data.status || 'published',
        JSON.stringify(data.assignedProductIds || []),
        data.createdAt ? new Date(data.createdAt) : now,
        now,
      ]
    );

    return (await this.findById(id))!;
  }

  public async update(id: string, updates: Partial<CollectionRecord>): Promise<CollectionRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const now = new Date();

    await this.database.query(
      `UPDATE "Collection" SET
        name = $2,
        slug = $3,
        description = $4,
        "bannerImage" = $5,
        badge = $6,
        "order" = $7,
        status = $8,
        "assignedProductIds" = $9,
        "updatedAt" = $10
       WHERE id = $1`,
      [
        id,
        merged.name,
        merged.slug,
        merged.description || null,
        merged.bannerImage || null,
        merged.badge || null,
        Number(merged.order || 0),
        merged.status || 'published',
        JSON.stringify(merged.assignedProductIds || []),
        now,
      ]
    );

    return await this.findById(id);
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.database.query(`DELETE FROM "Collection" WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const postgresCollectionRepository = new PostgresCollectionRepository();

