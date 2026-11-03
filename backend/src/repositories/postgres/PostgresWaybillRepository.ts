import { db, DatabaseManager } from '../../config/database';

export interface WaybillAllocationRecord {
  id: string;
  waybillId: string;
  courierCode: string;
  status: 'AVAILABLE' | 'RESERVED' | 'ASSIGNED' | 'UNCERTAIN' | 'EXHAUSTED' | 'CANCELLED';
  orderId?: string | null;
  orderNumber?: string | null;
  assignedAt?: Date | null;
  reservedAt?: Date | null;
  reservedUntil?: Date | null;
  notes?: string | null;
}

export class PostgresWaybillRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  /**
   * Database-level concurrency reservation for waybill allocation.
   * Atomically selects the next available waybill using SELECT ... FOR UPDATE SKIP LOCKED,
   * flags it as RESERVED for 5 minutes, and commits the transaction immediately.
   * NEVER holds database transactions open during external API calls.
   */
  public async reserveNextAvailableWaybill(courierCode: string = 'KOOMBIYO'): Promise<string> {
    return await this.database.transaction(async (tx) => {
      // 1. Clean up any expired reservations (older than 5 minutes) back to AVAILABLE
      await tx.query(
        `UPDATE "WaybillAllocation"
         SET status = 'AVAILABLE', "reservedAt" = NULL, "reservedUntil" = NULL
         WHERE status = 'RESERVED' AND "reservedUntil" < NOW() AND "courierCode" = $1`,
        [courierCode]
      );

      // 2. Select the next available waybill with row lock, skipping any currently locked rows
      const selectRes = await tx.query<{ waybillId: string }>(
        `SELECT "waybillId"
         FROM "WaybillAllocation"
         WHERE status = 'AVAILABLE' AND "courierCode" = $1
         ORDER BY "waybillId" ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [courierCode]
      );

      if (selectRes.rows.length === 0) {
        throw new Error(
          'No active Koombiyo waybills available on your account. Please request new waybills from Koombiyo portal or API.'
        );
      }

      const waybillId = selectRes.rows[0].waybillId;
      const now = new Date();
      const reservedUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5-minute lease

      // 3. Mark reserved
      await tx.query(
        `UPDATE "WaybillAllocation"
         SET status = 'RESERVED',
             "reservedAt" = $2,
             "reservedUntil" = $3,
             "updatedAt" = $2
         WHERE "waybillId" = $1`,
        [waybillId, now, reservedUntil]
      );

      return waybillId;
    });
  }

  /**
   * Commit waybill assignment upon successful API dispatch
   */
  public async assignWaybill(
    waybillId: string,
    orderId: string,
    orderNumber: string
  ): Promise<void> {
    const now = new Date();
    await this.database.query(
      `UPDATE "WaybillAllocation"
       SET status = 'ASSIGNED',
           "orderId" = $2,
           "orderNumber" = $3,
           "assignedAt" = $4,
           "reservedAt" = NULL,
           "reservedUntil" = NULL,
           "updatedAt" = $4
       WHERE "waybillId" = $1`,
      [waybillId, orderId, orderNumber, now]
    );
  }

  /**
   * Release a reserved waybill back to available (e.g. if pre-dispatch validation failed)
   */
  public async releaseReservation(waybillId: string): Promise<void> {
    await this.database.query(
      `UPDATE "WaybillAllocation"
       SET status = 'AVAILABLE',
           "orderId" = NULL,
           "orderNumber" = NULL,
           "reservedAt" = NULL,
           "reservedUntil" = NULL,
           "updatedAt" = NOW()
       WHERE "waybillId" = $1 AND status = 'RESERVED'`,
      [waybillId]
    );
  }

  /**
   * Mark waybill as UNCERTAIN after API timeout (retains reservation to prevent duplicate dispatch)
   */
  public async markWaybillUncertain(
    waybillId: string,
    orderId: string,
    orderNumber: string,
    reason?: string
  ): Promise<void> {
    const now = new Date();
    await this.database.query(
      `UPDATE "WaybillAllocation"
       SET status = 'UNCERTAIN',
           "orderId" = $2,
           "orderNumber" = $3,
           notes = $4,
           "reservedAt" = NULL,
           "reservedUntil" = NULL,
           "updatedAt" = $5
       WHERE "waybillId" = $1`,
      [waybillId, orderId, orderNumber, reason || 'API Timeout Outcome Uncertain', now]
    );
  }

  /**
   * Get list of all available active waybills
   */
  public async getAvailableWaybills(courierCode: string = 'KOOMBIYO'): Promise<string[]> {
    const res = await this.database.query<{ waybillId: string }>(
      `SELECT "waybillId"
       FROM "WaybillAllocation"
       WHERE (status = 'AVAILABLE' OR (status = 'RESERVED' AND "reservedUntil" < NOW()))
         AND "courierCode" = $1
       ORDER BY "waybillId" ASC`,
      [courierCode]
    );
    return res.rows.map((r) => r.waybillId);
  }
}

export const postgresWaybillRepository = new PostgresWaybillRepository();

