import { db, DatabaseManager } from '../../config/database';

export interface ReviewRecord {
  id: string;
  productId?: string;
  customerId?: string;
  authorName?: string;
  rating: number;
  comment: string;
  title?: string;
  verified?: boolean;
  fit?: string;
  status: string;
  createdAt: string;
}

export class PostgresReviewRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToReview(row: any): ReviewRecord {
    return {
      id: row.id,
      productId: row.productId || undefined,
      customerId: row.customerId || undefined,
      authorName: row.authorName || 'Anonymous',
      rating: Number(row.rating || 5),
      comment: row.comment || '',
      title: row.title || undefined,
      verified: Boolean(row.verified),
      fit: row.fit || undefined,
      status: row.status || 'approved',
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  public async findAll(filters?: { status?: string }): Promise<ReviewRecord[]> {
    let sql = `SELECT * FROM "Review"`;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'all') {
      params.push(filters.status);
      sql += ` WHERE status = $1`;
    }

    sql += ` ORDER BY "createdAt" DESC`;
    const res = await this.database.query(sql, params);
    return res.rows.map((r) => this.mapRowToReview(r));
  }

  public async findById(id: string): Promise<ReviewRecord | null> {
    if (!id) return null;
    const res = await this.database.query(`SELECT * FROM "Review" WHERE id = $1 LIMIT 1`, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRowToReview(res.rows[0]);
  }

  public async create(data: Partial<ReviewRecord>): Promise<ReviewRecord> {
    const id = data.id || `rev-${Date.now()}`;
    const now = new Date();

    // Ensure Product exists if productId provided, otherwise fallback to first product
    let prodId = data.productId;
    if (prodId) {
      const pCheck = await this.database.query(`SELECT id FROM "Product" WHERE id = $1 LIMIT 1`, [prodId]);
      if (pCheck.rows.length === 0) {
        const anyP = await this.database.query(`SELECT id FROM "Product" LIMIT 1`);
        prodId = anyP.rows[0]?.id;
      }
    } else {
      const anyP = await this.database.query(`SELECT id FROM "Product" LIMIT 1`);
      prodId = anyP.rows[0]?.id;
    }

    await this.database.query(
      `INSERT INTO "Review" (id, "productId", "customerId", "authorName", rating, comment, title, verified, fit, status, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         rating = EXCLUDED.rating,
         comment = EXCLUDED.comment`,
      [
        id,
        prodId,
        data.customerId || null,
        data.authorName || 'Guest Reviewer',
        Number(data.rating || 5),
        data.comment || '',
        data.title || null,
        Boolean(data.verified),
        data.fit || null,
        data.status || 'approved',
        now,
      ]
    );

    return (await this.findById(id))!;
  }

  public async updateStatus(id: string, status: string): Promise<ReviewRecord | null> {
    await this.database.query(`UPDATE "Review" SET status = $2 WHERE id = $1`, [id, status]);
    return await this.findById(id);
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.database.query(`DELETE FROM "Review" WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const postgresReviewRepository = new PostgresReviewRepository();

