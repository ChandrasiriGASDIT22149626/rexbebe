import fs from 'fs';
import path from 'path';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actingAdministrator: string;
  affectedRecord: string;
  action: string;
  reason?: string;
  details?: Record<string, any> | string;
  ip?: string;
}

export class AuditService {
  private static filePath = path.join(__dirname, '../../data/audit_logs.json');

  private static readLogs(): AuditLogEntry[] {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[AuditService] Error reading audit logs from disk:', err);
    }
    return [];
  }

  private static writeLogs(logs: AuditLogEntry[]): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (err) {
      console.error('[AuditService] Error writing audit logs to disk:', err);
    }
  }

  /**
   * Record a comprehensive audit log entry for any order, delivery, or financial change
   */
  public static record(entry: {
    actingAdministrator?: string;
    affectedRecord: string;
    action: string;
    reason?: string;
    details?: Record<string, any> | string;
    ip?: string;
  }): AuditLogEntry {
    const logs = this.readLogs();
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actingAdministrator: entry.actingAdministrator || 'System Automated Process',
      affectedRecord: entry.affectedRecord,
      action: entry.action,
      reason: entry.reason,
      details: entry.details,
      ip: entry.ip || '127.0.0.1',
    };

    logs.unshift(newEntry);
    // Keep last 1,000 entries
    if (logs.length > 1000) {
      logs.length = 1000;
    }
    this.writeLogs(logs);
    return newEntry;
  }

  public static getLogs(filters?: {
    action?: string;
    affectedRecord?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let logs = this.readLogs();
    if (filters?.action) {
      const q = filters.action.toLowerCase();
      logs = logs.filter(l => l.action.toLowerCase().includes(q));
    }
    if (filters?.affectedRecord) {
      const q = filters.affectedRecord.toLowerCase();
      logs = logs.filter(l => l.affectedRecord.toLowerCase().includes(q));
    }
    if (filters?.limit && filters.limit > 0) {
      logs = logs.slice(0, filters.limit);
    }
    return logs;
  }
}
