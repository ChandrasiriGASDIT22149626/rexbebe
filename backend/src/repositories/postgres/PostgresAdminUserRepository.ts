import { db, DatabaseManager } from '../../config/database';
import { AdminUser, SanitizedAdminUser, sanitizeUser } from '../../services/adminUserService';

export class PostgresAdminUserRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToAdmin(row: any): AdminUser {
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
      username: row.username || row.email.split('@')[0],
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as any || 'ADMIN',
      status: row.status as any || 'ACTIVE',
      permissions: parse(row.permissions),
      lastLogin: row.lastLogin ? new Date(row.lastLogin).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
    };
  }

  public async findByEmail(email: string): Promise<AdminUser | null> {
    if (!email) return null;
    const res = await this.database.query(
      `SELECT * FROM "AdminUser" WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToAdmin(res.rows[0]);
  }

  public async findById(id: string): Promise<AdminUser | null> {
    if (!id) return null;
    const res = await this.database.query(
      `SELECT * FROM "AdminUser" WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToAdmin(res.rows[0]);
  }

  public async getAll(): Promise<SanitizedAdminUser[]> {
    const res = await this.database.query(`SELECT * FROM "AdminUser" ORDER BY "createdAt" ASC`);
    return res.rows.map((r) => sanitizeUser(this.mapRowToAdmin(r)));
  }

  public async create(admin: AdminUser): Promise<AdminUser> {
    const now = new Date();
    await this.database.query(
      `INSERT INTO "AdminUser" (id, name, username, email, "passwordHash", role, status, permissions, "lastLogin", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         "passwordHash" = EXCLUDED."passwordHash",
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         permissions = EXCLUDED.permissions,
         "updatedAt" = EXCLUDED."updatedAt"`,
      [
        admin.id,
        admin.name,
        admin.username,
        admin.email,
        admin.passwordHash,
        admin.role,
        admin.status,
        JSON.stringify(admin.permissions || []),
        admin.lastLogin ? new Date(admin.lastLogin) : null,
        now,
        now,
      ]
    );
    return (await this.findById(admin.id)) || admin;
  }

  public async recordLogin(id: string): Promise<void> {
    await this.database.query(
      `UPDATE "AdminUser" SET "lastLogin" = NOW(), "updatedAt" = NOW() WHERE id = $1`,
      [id]
    );
  }

  public async updateStatus(id: string, status: string): Promise<SanitizedAdminUser | null> {
    await this.database.query(
      `UPDATE "AdminUser" SET status = $2, "updatedAt" = NOW() WHERE id = $1`,
      [id, status]
    );
    const user = await this.findById(id);
    return user ? sanitizeUser(user) : null;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.database.query(`DELETE FROM "AdminUser" WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const postgresAdminUserRepository = new PostgresAdminUserRepository();

