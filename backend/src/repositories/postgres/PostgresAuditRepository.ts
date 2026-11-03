import { db, DatabaseManager } from '../../config/database';
import { AuditLogEntry } from '../../services/auditService';

export class PostgresAuditRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  public async record(entry: {
    actingAdministrator?: string;
    affectedRecord: string;
    action: string;
    reason?: string;
    details?: Record<string, any> | string;
    ip?: string;
  }): Promise<AuditLogEntry> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const actingAdmin = entry.actingAdministrator || 'System Automated Process';
    const detailStr = typeof entry.details === 'object' ? JSON.stringify(entry.details) : String(entry.details || entry.reason || '');

    await this.database.query(
      `INSERT INTO "AuditLog" (id, action, entity, "entityId", details, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, entry.action, actingAdmin, entry.affectedRecord, detailStr, now]
    );

    return {
      id,
      timestamp: now.toISOString(),
      actingAdministrator: actingAdmin,
      affectedRecord: entry.affectedRecord,
      action: entry.action,
      reason: entry.reason,
      details: entry.details,
      ip: entry.ip,
    };
  }

  public async getAll(filters?: { action?: string; limit?: number }): Promise<AuditLogEntry[]> {
    let sql = `SELECT * FROM "AuditLog"`;
    const params: any[] = [];

    if (filters?.action) {
      params.push(filters.action);
      sql += ` WHERE action = $1`;
    }

    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1}`;
    params.push(filters?.limit || 100);

    const res = await this.database.query(sql, params);
    return res.rows.map((r) => ({
      id: r.id,
      timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      actingAdministrator: r.entity || 'System Automated Process',
      affectedRecord: r.entityId || 'N/A',
      action: r.action,
      details: r.details,
    }));
  }
}

export const postgresAuditRepository = new PostgresAuditRepository();

