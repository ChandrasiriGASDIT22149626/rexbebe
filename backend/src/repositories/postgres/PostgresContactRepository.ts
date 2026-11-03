import { db, DatabaseManager } from '../../config/database';

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class PostgresContactRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToContact(row: any): ContactMessageRecord {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      subject: row.subject || undefined,
      message: row.message,
      status: row.status || 'UNREAD',
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async findAll(): Promise<ContactMessageRecord[]> {
    const res = await this.database.query(
      `SELECT * FROM "ContactMessage" ORDER BY "createdAt" DESC`
    );
    return res.rows.map((r) => this.mapRowToContact(r));
  }

  public async findById(id: string): Promise<ContactMessageRecord | null> {
    if (!id) return null;
    const res = await this.database.query(
      `SELECT * FROM "ContactMessage" WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToContact(res.rows[0]);
  }

  public async create(data: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    status?: string;
  }): Promise<ContactMessageRecord> {
    const id = data.id || `msg-${Date.now()}`;
    const now = new Date();

    await this.database.query(
      `INSERT INTO "ContactMessage" (id, name, email, phone, subject, message, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
      [
        id,
        data.name,
        data.email,
        data.phone || null,
        data.subject || null,
        data.message,
        data.status || 'UNREAD',
        now,
      ]
    );

    return (await this.findById(id))!;
  }

  public async updateStatus(id: string, status: string): Promise<ContactMessageRecord | null> {
    await this.database.query(
      `UPDATE "ContactMessage" SET status = $2, "updatedAt" = NOW() WHERE id = $1`,
      [id, status]
    );
    return await this.findById(id);
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.database.query(`DELETE FROM "ContactMessage" WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const postgresContactRepository = new PostgresContactRepository();

