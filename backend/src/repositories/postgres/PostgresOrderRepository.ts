import { db, DatabaseManager, DatabaseClient } from '../../config/database';
import {
  OrderRecord,
  OrderItemRecord,
  OrderStatus,
  CourierDetails,
  ReturnInspectionRecord,
  ManualCourierBookingPayload,
  DeliveryStatusUpdatePayload,
  RecordDeliveryAttemptPayload,
  InitiateReturnToSenderPayload,
  ReturnInspectionPayload,
  UnresolvedReturnCase,
  CodSettlementStatus,
  DeliveryAttemptRecord,
  FAILURE_REASONS_CATALOG,
  ItemInspectionRecord,
} from '../orderRepository';

export class PostgresOrderRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  /**
   * Helper to map a PostgreSQL row and its order items into an OrderRecord
   */
  private mapRowToOrder(row: any, items: any[] = []): OrderRecord {
    const courierDetails: CourierDetails =
      typeof row.courierDetails === 'string'
        ? JSON.parse(row.courierDetails)
        : row.courierDetails || {};

    const shippingAddress =
      typeof row.shippingAddress === 'string'
        ? JSON.parse(row.shippingAddress)
        : row.shippingAddress;

    const timeline =
      typeof row.timeline === 'string'
        ? JSON.parse(row.timeline)
        : row.timeline || [];

    const deliveryZoneSnapshot =
      typeof row.deliveryZoneSnapshot === 'string'
        ? JSON.parse(row.deliveryZoneSnapshot)
        : row.deliveryZoneSnapshot;

    const returnInspection =
      typeof row.returnInspection === 'string'
        ? JSON.parse(row.returnInspection)
        : row.returnInspection;

    const unresolvedReturnAlert =
      typeof row.unresolvedReturnAlert === 'string'
        ? JSON.parse(row.unresolvedReturnAlert)
        : row.unresolvedReturnAlert;

    const mappedItems: OrderItemRecord[] = items.map((i) => ({
      id: i.id,
      productId: i.productId || undefined,
      variantId: i.variantId || '',
      title: i.title,
      partName: i.partName || undefined,
      purchaseType: i.purchaseType || undefined,
      partColors: typeof i.partColors === 'string' ? JSON.parse(i.partColors) : i.partColors,
      color: i.color || undefined,
      size: i.size || undefined,
      image: i.image || i.imageUrl || undefined,
      price: Number(i.price || 0),
      quantity: Number(i.quantity || 1),
      totalPrice: Number(i.totalPrice || 0),
    }));

    return {
      id: row.id,
      orderNumber: row.orderNumber,
      customerId: row.customerId || undefined,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      phone: row.phone || undefined,
      country: row.country || 'Sri Lanka',
      countryFlag: row.countryFlag || undefined,
      status: row.status as OrderStatus,
      paymentStatus: row.paymentStatus,
      codCollectionStatus: row.codCollectionStatus || undefined,
      codSettlementStatus: row.codSettlementStatus as CodSettlementStatus,
      codFinancialStatus: row.codFinancialStatus || undefined,
      courierReportedAmount: row.courierReportedAmount ? Number(row.courierReportedAmount) : undefined,
      collectionDate: row.collectionDate || undefined,
      idempotencyKey: row.idempotencyKey || undefined,
      paymentMethod: row.paymentMethod,
      paymentReference: row.paymentReference || undefined,
      subtotal: Number(row.subtotal || 0),
      discount: Number(row.discount || 0),
      shippingFee: Number(row.shippingFee || 0),
      codHandlingFee: row.codHandlingFee ? Number(row.codHandlingFee) : undefined,
      advancePayment: row.advancePayment ? Number(row.advancePayment) : undefined,
      amountToCollect: row.amountToCollect ? Number(row.amountToCollect) : undefined,
      tax: Number(row.tax || 0),
      totalAmount: Number(row.totalAmount || 0),
      isRestocked: Boolean(row.isRestocked),
      carrier: row.carrier || undefined,
      trackingNumber: row.trackingNumber || undefined,
      internalNotes: row.internalNotes || undefined,
      courierDetails,
      returnInspection,
      verifiedReturnCharges: row.verifiedReturnCharges ? Number(row.verifiedReturnCharges) : undefined,
      unresolvedReturnAlert,
      deliveryZoneSnapshot,
      shippingAddress,
      timeline,
      items: mappedItems,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async findAll(): Promise<OrderRecord[]> {
    const ordersRes = await this.database.query(`SELECT * FROM "Order" ORDER BY "createdAt" DESC`);
    if (ordersRes.rows.length === 0) return [];

    const orderIds = ordersRes.rows.map((o) => o.id);
    const itemsRes = await this.database.query(
      `SELECT * FROM "OrderItem" WHERE "orderId" = ANY($1::text[])`,
      [orderIds]
    );

    const itemsByOrder = new Map<string, any[]>();
    for (const item of itemsRes.rows) {
      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, []);
      }
      itemsByOrder.get(item.orderId)!.push(item);
    }

    return ordersRes.rows.map((row) =>
      this.mapRowToOrder(row, itemsByOrder.get(row.id) || [])
    );
  }

  public async findById(id: string): Promise<OrderRecord | null> {
    if (!id) return null;
    const cleanId = id.trim();
    const orderRes = await this.database.query(
      `SELECT * FROM "Order" WHERE LOWER(id) = LOWER($1) OR LOWER("orderNumber") = LOWER($1) LIMIT 1`,
      [cleanId]
    );

    if (orderRes.rows.length === 0) return null;
    const row = orderRes.rows[0];

    const itemsRes = await this.database.query(
      `SELECT * FROM "OrderItem" WHERE "orderId" = $1`,
      [row.id]
    );

    return this.mapRowToOrder(row, itemsRes.rows);
  }

  public async create(
    orderData: Omit<OrderRecord, 'id' | 'orderNumber' | 'createdAt'> & { orderNumber?: string }
  ): Promise<{ order: OrderRecord; isDuplicate: boolean }> {
    const res = await this.database.transaction(async (tx) => {
      // 1. Idempotency Check inside transaction
      if (orderData.idempotencyKey) {
        const existing = await tx.query(
          `SELECT id FROM "Order" WHERE "idempotencyKey" = $1 LIMIT 1`,
          [orderData.idempotencyKey]
        );
        if (existing.rows.length > 0) {
          return { id: existing.rows[0].id as string, isDuplicate: true };
        }
      }

      // 2. Server-side rapid double-submit guard: Check identical order within last 15 seconds
      const fifteenSecondsAgo = new Date(Date.now() - 15000);
      const recentOrdersRes = await tx.query(
        `SELECT id, "totalAmount", "customerEmail", phone FROM "Order"
         WHERE ("customerEmail" = $1 OR (phone IS NOT NULL AND phone = $2)) AND "createdAt" >= $3
         ORDER BY "createdAt" DESC LIMIT 5`,
        [orderData.customerEmail, orderData.phone || 'NO_PHONE', fifteenSecondsAgo]
      );

      for (const recent of recentOrdersRes.rows) {
        if (Math.abs(Number(recent.totalAmount) - Number(orderData.totalAmount)) < 0.01) {
          const itemsCheck = await tx.query(
            `SELECT "variantId", quantity FROM "OrderItem" WHERE "orderId" = $1`,
            [recent.id]
          );
          if (
            orderData.items &&
            itemsCheck.rows.length === orderData.items.length &&
            orderData.items.every((it) =>
              itemsCheck.rows.some(
                (dbIt) => dbIt.variantId === it.variantId && Number(dbIt.quantity) === Number(it.quantity)
              )
            )
          ) {
            return { id: recent.id as string, isDuplicate: true };
          }
        }
      }

      // 3. Generate identifiers
      const now = new Date();
      const id = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const orderNumber =
        orderData.orderNumber ||
        `RXB-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Ensure customer exists in Customer table if customerId is passed
      let validCustomerId = orderData.customerId || null;
      if (validCustomerId) {
        const custCheck = await tx.query(`SELECT 1 FROM "Customer" WHERE id = $1 LIMIT 1`, [validCustomerId]);
        if (custCheck.rows.length === 0) {
          await tx.query(
            `INSERT INTO "Customer" (id, name, email, phone, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $5)
             ON CONFLICT (id) DO NOTHING`,
            [validCustomerId, orderData.customerName, orderData.customerEmail, orderData.phone || null, now]
          );
        }
      }

      // 3. Insert Order
      await tx.query(
        `INSERT INTO "Order" (
          id, "orderNumber", "customerId", "customerName", "customerEmail", phone, country, "countryFlag",
          status, "paymentStatus", "paymentMethod", "paymentReference", "codCollectionStatus",
          "codSettlementStatus", "codFinancialStatus", "courierReportedAmount", "collectionDate",
          "idempotencyKey", subtotal, discount, "shippingFee", "codHandlingFee", "advancePayment",
          "amountToCollect", tax, "totalAmount", "isRestocked", carrier, "trackingNumber",
          "courierDetails", "returnInspection", "verifiedReturnCharges", "unresolvedReturnAlert",
          "deliveryZoneSnapshot", "shippingAddress", "billingAddress", timeline, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23,
          $24, $25, $26, $27, $28, $29,
          $30, $31, $32, $33,
          $34, $35, $36, $37, $38, $39
        )`,
        [
          id,
          orderNumber,
          validCustomerId,
          orderData.customerName,
          orderData.customerEmail,
          orderData.phone || null,
          orderData.country || 'Sri Lanka',
          orderData.countryFlag || null,
          orderData.status || 'PENDING_CONFIRMATION',
          orderData.paymentStatus || 'PENDING',
          orderData.paymentMethod || 'CASH_ON_DELIVERY',
          orderData.paymentReference || null,
          orderData.codCollectionStatus || 'COLLECTION_PENDING',
          orderData.codSettlementStatus || 'PENDING_REMITTANCE',
          orderData.codFinancialStatus || null,
          orderData.courierReportedAmount ? Number(orderData.courierReportedAmount) : null,
          orderData.collectionDate || null,
          orderData.idempotencyKey || null,
          Number(orderData.subtotal || 0),
          Number(orderData.discount || 0),
          Number(orderData.shippingFee || 0),
          Number(orderData.codHandlingFee || 0),
          Number(orderData.advancePayment || 0),
          Number(orderData.amountToCollect || 0),
          Number(orderData.tax || 0),
          Number(orderData.totalAmount || 0),
          Boolean(orderData.isRestocked),
          orderData.carrier || null,
          orderData.trackingNumber || null,
          orderData.courierDetails ? JSON.stringify(orderData.courierDetails) : null,
          orderData.returnInspection ? JSON.stringify(orderData.returnInspection) : null,
          orderData.verifiedReturnCharges ? Number(orderData.verifiedReturnCharges) : null,
          orderData.unresolvedReturnAlert ? JSON.stringify(orderData.unresolvedReturnAlert) : null,
          orderData.deliveryZoneSnapshot ? JSON.stringify(orderData.deliveryZoneSnapshot) : null,
          orderData.shippingAddress ? JSON.stringify(orderData.shippingAddress) : null,
          (orderData as any).billingAddress ? JSON.stringify((orderData as any).billingAddress) : null,
          JSON.stringify(orderData.timeline || []),
          now,
          now,
        ]
      );

      // 4. Insert Order Items (Historical preservation)
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          const itemId = item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          
          let validVariantId = item.variantId || null;
          if (validVariantId) {
            const varCheck = await tx.query(
              `SELECT 1 FROM "ProductVariant" WHERE id = $1 LIMIT 1`,
              [validVariantId]
            );
            if (varCheck.rows.length === 0) {
              validVariantId = null;
            }
          }

          let validProductId = item.productId || null;
          if (validProductId) {
            const prodCheck = await tx.query(
              `SELECT 1 FROM "Product" WHERE id = $1 LIMIT 1`,
              [validProductId]
            );
            if (prodCheck.rows.length === 0) {
              validProductId = null;
            }
          }

          await tx.query(
            `INSERT INTO "OrderItem" (id, "orderId", "variantId", "productId", title, sku, size, color, "colorHex", "partColors", image, "imageUrl", price, quantity, "totalPrice", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [
              itemId,
              id,
              validVariantId,
              validProductId,
              item.title,
              item.sku || null,
              item.size || null,
              item.color || null,
              (item as any).colorHex || null,
              item.partColors ? JSON.stringify(item.partColors) : null,
              item.image || null,
              (item as any).imageUrl || item.image || null,
              Number(item.price || 0),
              Number(item.quantity || 1),
              Number(item.totalPrice || item.price * (item.quantity || 1) || 0),
              now,
            ]
          );
        }
      }

      // 5. Insert Timeline Events
      if (orderData.timeline && Array.isArray(orderData.timeline)) {
        for (let i = 0; i < orderData.timeline.length; i++) {
          const tl = orderData.timeline[i];
          await tx.query(
            `INSERT INTO "OrderTimelineEvent" (id, "orderId", status, note, admin, timestamp, "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              `${id}-tl-${i}`,
              id,
              tl.status || 'ORDER_PLACED',
              tl.note || 'Order placed',
              tl.admin || null,
              tl.time ? new Date(tl.time) : now,
              now,
            ]
          );
        }
      }

      return { id, isDuplicate: false };
    });

    const fullOrder = await this.findById(res.id);
    return { order: fullOrder!, isDuplicate: res.isDuplicate };
  }

  public async updateOrder(id: string, updates: Partial<OrderRecord>): Promise<OrderRecord | null> {
    const updatedId = await this.database.transaction(async (tx) => {
      // Row lock the order to prevent race conditions during concurrent updates
      const lockRes = await tx.query(
        `SELECT * FROM "Order" WHERE id = $1 FOR UPDATE`,
        [id]
      );
      if (lockRes.rows.length === 0) return null;

      const current = lockRes.rows[0];
      const now = new Date();

      await tx.query(
        `UPDATE "Order" SET
           status = COALESCE($2, status),
           "paymentStatus" = COALESCE($3, "paymentStatus"),
           "codCollectionStatus" = COALESCE($4, "codCollectionStatus"),
           "codSettlementStatus" = COALESCE($5, "codSettlementStatus"),
           "codFinancialStatus" = COALESCE($6, "codFinancialStatus"),
           carrier = COALESCE($7, carrier),
           "trackingNumber" = COALESCE($8, "trackingNumber"),
           "courierDetails" = COALESCE($9, "courierDetails"),
           "returnInspection" = COALESCE($10, "returnInspection"),
           "verifiedReturnCharges" = COALESCE($11, "verifiedReturnCharges"),
           "unresolvedReturnAlert" = COALESCE($12, "unresolvedReturnAlert"),
           timeline = COALESCE($13, timeline),
           "isRestocked" = COALESCE($14, "isRestocked"),
           "internalNotes" = COALESCE($15, "internalNotes"),
           "updatedAt" = $16
         WHERE id = $1`,
        [
          id,
          updates.status || null,
          updates.paymentStatus || null,
          updates.codCollectionStatus || null,
          updates.codSettlementStatus || null,
          updates.codFinancialStatus || null,
          updates.carrier || null,
          updates.trackingNumber || null,
          updates.courierDetails ? JSON.stringify(updates.courierDetails) : null,
          updates.returnInspection ? JSON.stringify(updates.returnInspection) : null,
          updates.verifiedReturnCharges !== undefined ? Number(updates.verifiedReturnCharges) : null,
          updates.unresolvedReturnAlert ? JSON.stringify(updates.unresolvedReturnAlert) : null,
          updates.timeline ? JSON.stringify(updates.timeline) : null,
          updates.isRestocked !== undefined ? Boolean(updates.isRestocked) : null,
          updates.internalNotes !== undefined ? updates.internalNotes : null,
          now,
        ]
      );

      // Keep relational OrderTimelineEvent table in sync with order timeline
      if (Array.isArray(updates.timeline)) {
        for (let i = 0; i < updates.timeline.length; i++) {
          const tl = updates.timeline[i];
          const eventId = `${id}-tl-${i}`;
          await tx.query(
            `INSERT INTO "OrderTimelineEvent" (id, "orderId", status, note, admin, timestamp, "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, admin = EXCLUDED.admin, timestamp = EXCLUDED.timestamp`,
            [
              eventId,
              id,
              tl.status || 'STATUS_UPDATE',
              tl.note || '',
              tl.admin || 'Admin Staff',
              tl.time ? new Date(tl.time) : new Date(),
            ]
          );
        }
      }

      return id;
    });

    if (!updatedId) return null;
    return await this.findById(updatedId);
  }

  public async updateStatus(
    id: string,
    status: OrderStatus,
    carrier?: string,
    trackingNumber?: string,
    note?: string,
    admin: string = 'Admin Staff',
    options?: {
      codCollectionStatus?: string;
      deliveryStatus?: string;
    }
  ): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    existing.status = status;
    if (carrier) existing.carrier = carrier;
    if (trackingNumber) existing.trackingNumber = trackingNumber;

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status,
      time: nowIso,
      note: note || `Status updated to ${status}`,
      admin,
    });

    if (options?.codCollectionStatus) {
      existing.codCollectionStatus = options.codCollectionStatus;
    }

    if (options?.deliveryStatus) {
      if (!existing.courierDetails) existing.courierDetails = {};
      existing.courierDetails.deliveryStatus = options.deliveryStatus as any;
    }

    return await this.updateOrder(id, existing);
  }

  public async assignCourier(id: string, courierData: any): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    existing.courierDetails = {
      ...existing.courierDetails,
      ...courierData,
      bookingDate: courierData.bookingDate || nowIso.slice(0, 10),
    };

    if (courierData.courierProvider) existing.carrier = courierData.courierProvider;
    if (courierData.waybillNumber) existing.trackingNumber = courierData.waybillNumber;

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: existing.status,
      time: nowIso,
      note: `Assigned to courier ${courierData.courierProvider || 'Courier'} with Waybill #${courierData.waybillNumber || 'N/A'}`,
      admin: courierData.admin || 'Admin Staff',
    });

    return await this.updateOrder(id, existing);
  }

  public async recordDeliveryAndPayment(id: string, payload: any): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    existing.status = 'DELIVERED';
    existing.codCollectionStatus = 'COLLECTED';
    if (!existing.courierDetails) existing.courierDetails = {};
    existing.courierDetails.deliveryStatus = 'DELIVERED';
    existing.courierDetails.deliveredDate = nowIso;
    existing.courierDetails.codCollectionStatus = 'COLLECTED';

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: 'DELIVERED',
      time: nowIso,
      note: `Delivery confirmed. Cash collection recorded: LKR ${payload.collectedAmount || existing.amountToCollect || existing.totalAmount}`,
      admin: payload.admin || 'Admin Staff',
    });

    return await this.updateOrder(id, existing);
  }

  public async recordCodRemittance(id: string, remittance: any): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    existing.codSettlementStatus = 'REMITTED';
    if (!existing.courierDetails) existing.courierDetails = {};
    existing.courierDetails.codRemittanceStatus = 'REMITTED';
    existing.courierDetails.amountRemitted = remittance.amountRemitted;
    existing.courierDetails.remittanceDate = remittance.remittanceDate;
    existing.courierDetails.bankReference = remittance.bankReference;

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: existing.status,
      time: nowIso,
      note: `Courier COD remittance recorded: LKR ${remittance.amountRemitted} (Bank Ref: ${remittance.bankReference})`,
      admin: remittance.admin || 'Finance Staff',
    });

    return await this.updateOrder(id, existing);
  }

  public async addInternalNote(id: string, note: string): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    existing.internalNotes = existing.internalNotes ? `${existing.internalNotes}\n[${nowIso}] ${note}` : `[${nowIso}] ${note}`;
    return await this.updateOrder(id, existing);
  }

  public async refundOrder(id: string, reason: string): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    existing.paymentStatus = 'REFUNDED';
    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: existing.status,
      time: nowIso,
      note: `Refund processed. Reason: ${reason}`,
      admin: 'Admin Staff',
    });

    return await this.updateOrder(id, existing);
  }

  public async bookCourierManual(id: string, payload: ManualCourierBookingPayload): Promise<OrderRecord | null> {
    return await this.assignCourier(id, payload);
  }

  public async updateCourierDeliveryStatus(id: string, payload: DeliveryStatusUpdatePayload): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    if (!existing.courierDetails) existing.courierDetails = {};
    existing.courierDetails.deliveryStatus = payload.deliveryStatus;

    if (payload.deliveryStatus === 'DELIVERED') {
      existing.status = 'DELIVERED';
      existing.codCollectionStatus = 'COLLECTED';
      existing.courierDetails.deliveredDate = nowIso;
    } else if (payload.deliveryStatus === 'RETURNING_TO_SENDER' || payload.deliveryStatus === 'RETURNED_TO_SENDER') {
      existing.status = 'RETURNED';
      existing.courierDetails.returnedDate = nowIso;
      existing.courierDetails.returnReason = payload.reason;
    }

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: payload.deliveryStatus as any,
      time: nowIso,
      note: `Courier delivery status updated to ${payload.deliveryStatus}${payload.reason ? ` (${payload.reason})` : ''}`,
      admin: payload.admin || 'Admin Staff',
    });

    return await this.updateOrder(id, existing);
  }

  public async addCourierNote(id: string, note: string, admin: string = 'Admin Staff'): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    if (!existing.courierDetails) existing.courierDetails = {};
    existing.courierDetails.courierNotes = existing.courierDetails.courierNotes
      ? `${existing.courierDetails.courierNotes} | [${nowIso}] ${note}`
      : `[${nowIso}] ${note}`;

    return await this.updateOrder(id, existing);
  }

  public async findByOrderNumber(orderNumber: string): Promise<OrderRecord | null> {
    return this.findById(orderNumber);
  }

  public async recordCodCollectionEvent(
    id: string,
    payload: {
      status: 'COLLECTION_PENDING' | 'COLLECTED_BY_COURIER' | 'COLLECTION_DISPUTED';
      courierReportedAmount?: number;
      collectionDate?: string;
      disputeReason?: string;
      admin?: string;
      notes?: string;
    }
  ): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const adminUser = payload.admin || 'Admin Staff';
    const collDate = payload.collectionDate || nowIso.slice(0, 10);

    if (!existing.courierDetails) {
      existing.courierDetails = {};
    }

    existing.codCollectionStatus = payload.status;
    existing.courierDetails.codCollectionStatus = payload.status;
    existing.courierReportedAmount = payload.courierReportedAmount ?? existing.amountToCollect ?? existing.totalAmount;
    existing.collectionDate = collDate;
    existing.updatedAt = nowIso;

    if (payload.status === 'COLLECTED_BY_COURIER') {
      existing.status = 'DELIVERED';
      existing.paymentStatus = 'PAID';
      existing.courierDetails.deliveryStatus = 'DELIVERED';
      if (!existing.codFinancialStatus || existing.codFinancialStatus === 'COLLECTION_PENDING') {
        existing.codFinancialStatus = 'SETTLEMENT_PENDING';
      }
    } else if (payload.status === 'COLLECTION_DISPUTED') {
      existing.codFinancialStatus = 'COLLECTION_DISPUTED';
      if (payload.disputeReason) {
        existing.courierDetails.failureReason = payload.disputeReason;
      }
    } else if (payload.status === 'COLLECTION_PENDING') {
      existing.codFinancialStatus = 'COLLECTION_PENDING';
    }

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: payload.status,
      time: nowIso,
      note:
        payload.status === 'COLLECTION_DISPUTED'
          ? `COD Collection Disputed: ${payload.disputeReason || 'Discrepancy reported by courier'}.${payload.notes ? ` Note: ${payload.notes}` : ''}`
          : `COD Collection status recorded as '${payload.status}'. Courier reported: LKR ${(existing.courierReportedAmount || 0).toLocaleString()} on ${collDate}.${payload.notes ? ` Note: ${payload.notes}` : ''}`,
      admin: adminUser,
    });

    return await this.updateOrder(id, existing);
  }

  public async applySettlement(
    id: string,
    settlement: any,
    admin?: string
  ): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    existing.codFinancialStatus = settlement.financialStatus;
    existing.settlementRecord = settlement;
    existing.updatedAt = nowIso;

    if (!existing.courierDetails) {
      existing.courierDetails = {};
    }

    existing.courierDetails.codRemittanceStatus =
      settlement.financialStatus === 'SETTLED' ? 'RECONCILED' : 'REMITTED';
    existing.codSettlementStatus =
      settlement.financialStatus === 'SETTLED' ? 'RECONCILED' : 'REMITTED';
    existing.courierDetails.amountRemitted = settlement.actualAmountReceived;
    existing.courierDetails.remittanceDate = settlement.settlementDate;
    existing.courierDetails.bankReference = settlement.bankReference;

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: settlement.financialStatus,
      time: nowIso,
      note: `Authorized settlement confirmed by ${admin || settlement.authorizedBy}. Batch #${settlement.settlementBatchRef}, Bank Ref: ${settlement.bankReference}. Actual funds deposited: LKR ${settlement.actualAmountReceived?.toLocaleString() || '0'}.`,
      admin: admin || settlement.authorizedBy,
    });

    return await this.updateOrder(id, existing);
  }

  public async recordDeliveryAttempt(
    id: string,
    payload: RecordDeliveryAttemptPayload,
    admin?: string
  ): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const adminUser = admin || payload.admin || 'Logistics Admin';
    const attemptDate = payload.date || nowIso;

    if (!existing.courierDetails) {
      existing.courierDetails = {};
    }

    const currentAttempts = existing.courierDetails.deliveryAttempts || [];
    const attemptNumber = currentAttempts.length + 1;

    const reasonCode = payload.reasonCode || (typeof payload.reason === 'string' ? payload.reason : 'CUSTOMER_UNAVAILABLE');
    const catalogEntry = FAILURE_REASONS_CATALOG.find((c) => c.code === reasonCode);
    const failureLabel = catalogEntry ? catalogEntry.label : String(payload.reason);

    const attemptRecord: DeliveryAttemptRecord = {
      attemptNumber,
      date: attemptDate,
      reason: failureLabel,
      reasonCode: (catalogEntry ? catalogEntry.code : (reasonCode as any)),
      admin: adminUser,
      notes: payload.notes,
      nextAction: payload.nextAction || (attemptNumber >= 3 || reasonCode === 'CUSTOMER_REFUSED' ? 'INITIATE_RETURN' : 'SCHEDULE_RETRY'),
      scheduledRetryDate: payload.scheduledRetryDate,
    };

    currentAttempts.push(attemptRecord);
    existing.courierDetails.deliveryAttempts = currentAttempts;
    existing.courierDetails.failureReason = failureLabel;
    existing.courierDetails.deliveryStatus = 'DELIVERY_ATTEMPT_FAILED';
    existing.updatedAt = nowIso;

    const isCod = existing.paymentMethod === 'CASH_ON_DELIVERY' || existing.paymentMethod?.toLowerCase().includes('cash');
    if (isCod) {
      existing.codCollectionStatus = 'COLLECTION_PENDING';
      existing.courierDetails.codCollectionStatus = 'COLLECTION_PENDING';
      if (!existing.codFinancialStatus) {
        existing.codFinancialStatus = 'COLLECTION_PENDING';
      }
    }

    if (attemptRecord.nextAction === 'INITIATE_RETURN') {
      existing.courierDetails.deliveryStatus = 'RETURNING_TO_SENDER';
      existing.courierDetails.returnReason = `RTS after Attempt #${attemptNumber} failure: ${failureLabel}`;
      const alert = {
        type: 'PENDING_WAREHOUSE_INSPECTION',
        summary: `Parcel returning to sender (${failureLabel}). Return-to-sender initiated.`,
        flaggedAt: nowIso,
      };
      existing.unresolvedReturnAlert = alert;
      existing.courierDetails.unresolvedReturnAlert = alert;
    } else {
      if (attemptNumber >= 2 || reasonCode === 'CUSTOMER_REFUSED' || !payload.scheduledRetryDate) {
        const alertType = reasonCode === 'CUSTOMER_REFUSED' ? 'CUSTOMER_REFUSAL' : (attemptNumber >= 2 ? 'MULTIPLE_FAILED_ATTEMPTS' : 'NEEDS_RETRY_SCHEDULING');
        const alert = {
          type: alertType,
          summary: `Order #${existing.orderNumber} has ${attemptNumber} failed attempt(s) (${failureLabel}). Next action: ${attemptRecord.nextAction || 'Review'}.`,
          flaggedAt: nowIso,
        };
        existing.unresolvedReturnAlert = alert;
        existing.courierDetails.unresolvedReturnAlert = alert;
      }
    }

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: existing.courierDetails.deliveryStatus,
      time: nowIso,
      note: `Delivery Attempt #${attemptNumber} recorded as Failed. Reason: ${failureLabel}.${payload.notes ? ` Notes: ${payload.notes}.` : ''}${payload.scheduledRetryDate ? ` Next retry scheduled: ${payload.scheduledRetryDate}.` : ''} Action: ${attemptRecord.nextAction}. COD collection pending.`,
      admin: adminUser,
      reason: failureLabel,
    });

    return await this.updateOrder(id, existing);
  }

  public async initiateReturnToSender(
    id: string,
    payload: InitiateReturnToSenderPayload,
    admin?: string
  ): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const adminUser = admin || payload.admin || 'Logistics Admin';
    const returnReason = payload.reason || 'Failed delivery attempts - returning to warehouse';
    const verifiedReturnCharge = payload.verifiedReturnCharge !== undefined ? payload.verifiedReturnCharge : 300;

    if (!existing.courierDetails) {
      existing.courierDetails = {};
    }

    existing.courierDetails.deliveryStatus = 'RETURNING_TO_SENDER';
    existing.courierDetails.returnReason = returnReason;
    existing.courierDetails.verifiedReturnCharges = verifiedReturnCharge;
    existing.verifiedReturnCharges = verifiedReturnCharge;
    existing.updatedAt = nowIso;

    const isCod = existing.paymentMethod === 'CASH_ON_DELIVERY' || existing.paymentMethod?.toLowerCase().includes('cash');
    if (isCod) {
      if (existing.codCollectionStatus !== 'COLLECTED_BY_COURIER') {
        existing.codCollectionStatus = 'COLLECTION_PENDING';
        existing.courierDetails.codCollectionStatus = 'COLLECTION_PENDING';
      }
    }

    const alert = {
      type: 'PENDING_WAREHOUSE_INSPECTION',
      summary: `Parcel returning to warehouse (${returnReason}). Verified return charge: LKR ${verifiedReturnCharge}. Inspection pending upon arrival.`,
      flaggedAt: nowIso,
    };
    existing.unresolvedReturnAlert = alert;
    existing.courierDetails.unresolvedReturnAlert = alert;

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: 'RETURNING_TO_SENDER',
      time: nowIso,
      note: `Return-to-Sender (RTS) processed by ${adminUser}. Reason: ${returnReason}. Verified return charge: LKR ${verifiedReturnCharge.toLocaleString()}. Awaiting physical receipt & inspection.`,
      admin: adminUser,
      reason: returnReason,
    });

    return await this.updateOrder(id, existing);
  }

  public async recordReturnInspection(
    id: string,
    payload: ReturnInspectionPayload,
    inspector?: string
  ): Promise<OrderRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const nowIso = new Date().toISOString();
    const inspectorUser = inspector || payload.inspector || payload.admin || 'Warehouse Quality Control';
    const returnDate = payload.returnDate || nowIso;
    const verifiedReturnCharge = payload.verifiedReturnCharge !== undefined ? payload.verifiedReturnCharge : (existing.verifiedReturnCharges ?? 300);

    if (!existing.courierDetails) {
      existing.courierDetails = {};
    }

    existing.status = 'RETURNED';
    existing.courierDetails.deliveryStatus = 'RETURNED_TO_SENDER';
    existing.courierDetails.returnedDate = returnDate;
    existing.courierDetails.verifiedReturnCharges = verifiedReturnCharge;
    existing.verifiedReturnCharges = verifiedReturnCharge;
    existing.updatedAt = nowIso;

    const isCod = existing.paymentMethod === 'CASH_ON_DELIVERY' || existing.paymentMethod?.toLowerCase().includes('cash');
    if (isCod) {
      existing.codCollectionStatus = 'COLLECTION_DISPUTED';
      existing.courierDetails.codCollectionStatus = 'COLLECTION_DISPUTED';
      existing.codFinancialStatus = 'COLLECTION_DISPUTED';
    }

    const itemRecords: ItemInspectionRecord[] = (payload.items || []).map((it) => {
      const matched = existing.items.find((oi) => oi.variantId === it.variantId);
      return {
        itemId: it.variantId,
        variantId: it.variantId,
        title: matched?.title,
        color: matched?.color,
        size: matched?.size,
        quantityReturned: it.quantityReturned,
        quantityRestocked: it.restockApproved ? it.quantityToRestock : 0,
        condition: it.condition,
        restockApproved: it.restockApproved,
        notes: it.notes,
      };
    });

    const totalRestockedUnits = itemRecords.reduce((sum, r) => sum + r.quantityRestocked, 0);

    const inspectionRecord: ReturnInspectionRecord = {
      inspectionId: `INSP-${existing.orderNumber}-${Date.now().toString(36).toUpperCase()}`,
      returnDate,
      parcelCondition: payload.parcelCondition,
      decision: payload.decision,
      inspector: inspectorUser,
      returnCharges: verifiedReturnCharge,
      courierExpenses: {
        returnFee: verifiedReturnCharge,
        initialDeliveryFee: existing.shippingFee || 0,
        totalCourierExpense: (existing.shippingFee || 0) + verifiedReturnCharge,
        notes: payload.notes,
      },
      items: itemRecords,
      notes: payload.notes,
      inspectedAt: nowIso,
    };

    existing.returnInspection = inspectionRecord;
    existing.courierDetails.returnInspection = inspectionRecord;
    existing.isRestocked = true;

    existing.unresolvedReturnAlert = undefined;
    if (existing.courierDetails.unresolvedReturnAlert) {
      existing.courierDetails.unresolvedReturnAlert = undefined;
    }

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: 'RETURNED',
      time: nowIso,
      note: `Warehouse Return Inspection completed by ${inspectorUser}. Parcel Condition: ${payload.parcelCondition}. Restock Decision: ${payload.decision}. Restocked units: ${totalRestockedUnits}. Courier Return Charge: LKR ${verifiedReturnCharge.toLocaleString()}.${payload.notes ? ` Notes: ${payload.notes}` : ''}`,
      admin: inspectorUser,
      reason: payload.decision,
    });

    return await this.updateOrder(id, existing);
  }

  public async getUnresolvedCases(): Promise<UnresolvedReturnCase[]> {
    const orders = await this.findAll();
    const cases: UnresolvedReturnCase[] = [];

    for (const order of orders) {
      const courier = order.courierDetails;
      const attempts = courier?.deliveryAttempts || [];
      const failedAttempts = attempts.filter((a) => a.reason);
      const deliveryStatus = courier?.deliveryStatus;
      const isRts = deliveryStatus === 'RETURNING_TO_SENDER' || deliveryStatus === 'RETURNED_TO_SENDER';

      let unresolvedType: UnresolvedReturnCase['unresolvedType'] | null = null;
      let summary = '';

      if (order.unresolvedReturnAlert) {
        unresolvedType = order.unresolvedReturnAlert.type as any;
        summary = order.unresolvedReturnAlert.summary;
      } else if (isRts && !order.returnInspection) {
        unresolvedType = 'PENDING_WAREHOUSE_INSPECTION';
        summary = `Order #${order.orderNumber} returned/returning to warehouse. Condition inspection & restocking pending.`;
      } else if (failedAttempts.length >= 2 && deliveryStatus !== 'DELIVERED' && !order.returnInspection) {
        unresolvedType = 'MULTIPLE_FAILED_ATTEMPTS';
        summary = `Order #${order.orderNumber} has ${failedAttempts.length} failed delivery attempts. Administrator action required.`;
      } else if (deliveryStatus === 'DELIVERY_ATTEMPT_FAILED') {
        const lastAttempt = attempts[attempts.length - 1];
        if (lastAttempt?.reasonCode === 'CUSTOMER_REFUSED' || lastAttempt?.reason?.toLowerCase().includes('refus')) {
          unresolvedType = 'CUSTOMER_REFUSAL';
          summary = `Customer refused delivery on Order #${order.orderNumber}. Return processing required.`;
        } else if (!lastAttempt?.scheduledRetryDate) {
          unresolvedType = 'NEEDS_RETRY_SCHEDULING';
          summary = `Delivery attempt failed on Order #${order.orderNumber}. Next delivery retry date not yet scheduled.`;
        }
      }

      if (unresolvedType) {
        const lastAttempt = attempts[attempts.length - 1];
        cases.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone || order.shippingAddress?.phone,
          totalAmount: order.totalAmount,
          deliveryStatus: deliveryStatus || 'NOT_BOOKED',
          failedAttemptsCount: failedAttempts.length,
          lastAttemptDate: lastAttempt?.date,
          lastFailureReason: courier?.failureReason || lastAttempt?.reason,
          unresolvedType,
          flaggedAt: order.unresolvedReturnAlert?.flaggedAt || order.updatedAt || order.createdAt,
          summary,
        });
      }
    }

    return cases;
  }

  public async getFailedAndReturnOrders(filters?: {
    status?: string;
    reason?: string;
    parcelCondition?: string;
    unresolvedOnly?: boolean;
  }): Promise<OrderRecord[]> {
    const orders = await this.findAll();
    return orders.filter((order) => {
      const courier = order.courierDetails;
      const status = courier?.deliveryStatus || order.status;

      if (filters?.status) {
        if (filters.status === 'FAILED_ALL') {
          const isFailedOrRts =
            status === 'DELIVERY_ATTEMPT_FAILED' ||
            status === 'RETURNING_TO_SENDER' ||
            status === 'RETURNED_TO_SENDER' ||
            order.status === 'RETURNED';
          if (!isFailedOrRts) return false;
        } else if (status !== filters.status && order.status !== filters.status) {
          return false;
        }
      }

      if (filters?.unresolvedOnly) {
        const isDelivered = status === 'DELIVERED' || order.status === 'DELIVERED';
        const isInspected = Boolean(order.returnInspection);
        if (isDelivered || isInspected) return false;
      }

      if (filters?.parcelCondition && order.returnInspection?.parcelCondition !== filters.parcelCondition) {
        return false;
      }

      if (filters?.reason) {
        const reason = (courier?.failureReason || courier?.returnReason || '').toLowerCase();
        if (!reason.includes(filters.reason.toLowerCase())) return false;
      }

      return true;
    });
  }
}

export const postgresOrderRepository = new PostgresOrderRepository();
