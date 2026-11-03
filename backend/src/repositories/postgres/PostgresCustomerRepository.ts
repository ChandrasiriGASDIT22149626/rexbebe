import { db, DatabaseManager } from '../../config/database';
import { MockCustomer } from '../customerRepository';

export class PostgresCustomerRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToCustomer(row: any): MockCustomer {
    return {
      id: row.id,
      userId: row.userId || row.id,
      name: row.name || 'Anonymous Customer',
      email: row.email || '',
      phone: row.phone || undefined,
      role: 'CUSTOMER',
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  public async findAll(): Promise<MockCustomer[]> {
    const res = await this.database.query(`SELECT * FROM "Customer" ORDER BY "createdAt" DESC`);
    return res.rows.map((r) => this.mapRowToCustomer(r));
  }

  public async findById(id: string): Promise<MockCustomer | null> {
    if (!id) return null;
    const res = await this.database.query(
      `SELECT * FROM "Customer" WHERE id = $1 OR "userId" = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToCustomer(res.rows[0]);
  }

  public async findByEmail(email: string): Promise<MockCustomer | null> {
    if (!email) return null;
    const res = await this.database.query(
      `SELECT * FROM "Customer" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToCustomer(res.rows[0]);
  }

  public async upsertCustomer(data: { id?: string; name: string; email: string; phone?: string }): Promise<MockCustomer> {
    const id = data.id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    await this.database.query(
      `INSERT INTO "Customer" (id, name, email, phone, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         "updatedAt" = EXCLUDED."updatedAt"`,
      [id, data.name, data.email, data.phone || null, now]
    );
    return (await this.findById(id))!;
  }
}

export const postgresCustomerRepository = new PostgresCustomerRepository();

