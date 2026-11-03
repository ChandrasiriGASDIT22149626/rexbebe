import { db, DatabaseManager } from '../../config/database';
import { NotificationRecord } from '../../services/notificationService';

export class PostgresNotificationRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  public async getAll(): Promise<NotificationRecord[]> {
    const res = await this.database.query(
      `SELECT * FROM "Notification" ORDER BY "createdAt" DESC LIMIT 100`
    );

    return res.rows.map((r) => ({
      id: r.id,
      orderNumber: r.link ? r.link.replace('/admin/orders/', '') : 'N/A',
      orderId: r.link ? r.link.replace('/admin/orders/', '') : undefined,
      eventType: (r.type as any) || 'NOTIFICATION',
      channel: 'SMS',
      recipient: 'Customer',
      subject: r.title,
      message: r.message,
      status: 'DELIVERED',
      confirmedSuccess: true,
      provider: 'System',
      timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));
  }

  public async recordNotification(record: NotificationRecord): Promise<void> {
    const now = new Date();
    await this.database.query(
      `INSERT INTO "Notification" (id, title, message, type, "isRead", link, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        record.id,
        record.subject || record.eventType,
        record.message,
        record.eventType,
        false,
        record.orderId ? `/admin/orders/${record.orderId}` : null,
        now,
      ]
    );
  }
}

export const postgresNotificationRepository = new PostgresNotificationRepository();

