import { db, DatabaseManager } from '../../config/database';

export interface MediaAssetRecord {
  id: string;
  name: string;
  url: string;
  size?: string;
  category?: string;
  folder?: string;
  title?: string;
  alt?: string;
  tags?: string[];
  dimensions?: { width: number; height: number };
  usedInCount?: number;
  isSystem?: boolean;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class PostgresMediaRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToMedia(row: any): MediaAssetRecord {
    const parse = (val: any, fallback: any = null) => {
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
      url: row.url,
      size: row.size || undefined,
      category: row.category || 'general',
      folder: row.folder || undefined,
      title: row.title || undefined,
      alt: row.alt || undefined,
      tags: parse(row.tags, []),
      dimensions: parse(row.dimensions, undefined),
      usedInCount: Number(row.usedInCount || 0),
      isSystem: Boolean(row.isSystem),
      uploadedAt: row.uploadedAt ? new Date(row.uploadedAt).toISOString() : new Date().toISOString(),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async findAll(filter?: { folder?: string; category?: string }): Promise<MediaAssetRecord[]> {
    let sql = `SELECT * FROM "MediaAsset"`;
    const params: any[] = [];

    if (filter?.folder) {
      params.push(filter.folder);
      sql += ` WHERE folder = $${params.length}`;
    } else if (filter?.category) {
      params.push(filter.category);
      sql += ` WHERE category = $${params.length}`;
    }

    sql += ` ORDER BY "uploadedAt" DESC, "createdAt" DESC`;
    const res = await this.database.query(sql, params);
    return res.rows.map((r) => this.mapRowToMedia(r));
  }

  public async findById(id: string): Promise<MediaAssetRecord | null> {
    if (!id) return null;
    const res = await this.database.query(
      `SELECT * FROM "MediaAsset" WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToMedia(res.rows[0]);
  }

  public async create(data: Partial<MediaAssetRecord>): Promise<MediaAssetRecord> {
    const id = data.id || `media-${Date.now()}`;
    const now = new Date();

    await this.database.query(
      `INSERT INTO "MediaAsset" (
        id, name, url, size, category, folder, title, alt, tags, dimensions, "usedInCount", "isSystem", "uploadedAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        size = EXCLUDED.size,
        category = EXCLUDED.category,
        folder = EXCLUDED.folder,
        title = EXCLUDED.title,
        alt = EXCLUDED.alt,
        tags = EXCLUDED.tags,
        dimensions = EXCLUDED.dimensions,
        "usedInCount" = EXCLUDED."usedInCount",
        "isSystem" = EXCLUDED."isSystem",
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        id,
        data.name || 'untitled',
        data.url || '',
        data.size || null,
        data.category || 'general',
        data.folder || null,
        data.title || null,
        data.alt || null,
        JSON.stringify(data.tags || []),
        data.dimensions ? JSON.stringify(data.dimensions) : null,
        Number(data.usedInCount || 0),
        Boolean(data.isSystem),
        data.uploadedAt ? new Date(data.uploadedAt) : now,
        now,
        now,
      ]
    );

    return (await this.findById(id))!;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.database.query(`DELETE FROM "MediaAsset" WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const postgresMediaRepository = new PostgresMediaRepository();

