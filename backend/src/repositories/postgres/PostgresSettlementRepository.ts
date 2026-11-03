import { db, DatabaseManager } from '../../config/database';
import {
  SettlementRecord,
  CourierMerchantAgreement,
  DEFAULT_KOOMBIYO_AGREEMENT,
  CodFinancialStatus,
} from '../settlementRepository';

export class PostgresSettlementRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToSettlement(row: any): SettlementRecord {
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
      settlementBatchRef: row.settlementBatchRef,
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      courierProvider: row.courierProvider,
      expectedCodAmount: Number(row.expectedCodAmount || 0),
      courierReportedAmount: Number(row.courierReportedAmount || 0),
      collectionDate: row.collectionDate || '',
      settlementDate: row.settlementDate || '',
      bankReference: row.bankReference || '',
      documentedDeductions: parse(row.documentedDeductions),
      totalDeductions: Number(row.totalDeductions || 0),
      expectedRemittance: Number(row.expectedRemittance || 0),
      actualAmountReceived: Number(row.actualAmountReceived || 0),
      discrepancyAmount: Number(row.discrepancyAmount || 0),
      discrepancyReason: row.discrepancyReason || undefined,
      financialStatus: row.financialStatus as CodFinancialStatus,
      authorizedBy: row.authorizedBy || '',
      authorizedAt: row.authorizedAt || '',
      notes: row.notes || undefined,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public async getAllSettlements(filters?: {
    orderNumber?: string;
    batchRef?: string;
    financialStatus?: CodFinancialStatus | 'ALL';
    courier?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SettlementRecord[]> {
    let sql = `SELECT * FROM "SettlementRecord" WHERE 1=1`;
    const params: any[] = [];

    if (filters?.orderNumber) {
      params.push(`%${filters.orderNumber.trim().toLowerCase()}%`);
      sql += ` AND LOWER("orderNumber") LIKE $${params.length}`;
    }
    if (filters?.batchRef) {
      params.push(`%${filters.batchRef.trim().toLowerCase()}%`);
      sql += ` AND LOWER("settlementBatchRef") LIKE $${params.length}`;
    }
    if (filters?.financialStatus && filters.financialStatus !== 'ALL') {
      params.push(filters.financialStatus);
      sql += ` AND "financialStatus" = $${params.length}`;
    }
    if (filters?.courier) {
      params.push(`%${filters.courier.trim().toLowerCase()}%`);
      sql += ` AND LOWER("courierProvider") LIKE $${params.length}`;
    }
    if (filters?.startDate) {
      params.push(filters.startDate);
      sql += ` AND "settlementDate" >= $${params.length}`;
    }
    if (filters?.endDate) {
      params.push(filters.endDate);
      sql += ` AND "settlementDate" <= $${params.length}`;
    }

    sql += ` ORDER BY "createdAt" DESC`;

    const res = await this.database.query(sql, params);
    return res.rows.map((r) => this.mapRowToSettlement(r));
  }

  public async getSettlementById(id: string): Promise<SettlementRecord | null> {
    if (!id) return null;
    const res = await this.database.query(
      `SELECT * FROM "SettlementRecord" WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToSettlement(res.rows[0]);
  }

  public async getSettlementByOrderId(orderId: string): Promise<SettlementRecord | null> {
    if (!orderId) return null;
    const res = await this.database.query(
      `SELECT * FROM "SettlementRecord" WHERE "orderId" = $1 OR "orderNumber" = $1 LIMIT 1`,
      [orderId]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToSettlement(res.rows[0]);
  }

  public async recordSettlement(payload: any): Promise<SettlementRecord> {
    const existing = await this.getSettlementByOrderId(payload.orderId);
    const id = existing ? existing.id : `stl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    await this.database.query(
      `INSERT INTO "SettlementRecord" (
        id, "settlementBatchRef", "orderId", "orderNumber", "courierProvider",
        "expectedCodAmount", "courierReportedAmount", "collectionDate", "settlementDate",
        "bankReference", "documentedDeductions", "totalDeductions", "expectedRemittance",
        "actualAmountReceived", "discrepancyAmount", "discrepancyReason", "financialStatus",
        "authorizedBy", "authorizedAt", notes, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21)
      ON CONFLICT (id) DO UPDATE SET
        "settlementBatchRef" = EXCLUDED."settlementBatchRef",
        "courierReportedAmount" = EXCLUDED."courierReportedAmount",
        "collectionDate" = EXCLUDED."collectionDate",
        "settlementDate" = EXCLUDED."settlementDate",
        "bankReference" = EXCLUDED."bankReference",
        "documentedDeductions" = EXCLUDED."documentedDeductions",
        "totalDeductions" = EXCLUDED."totalDeductions",
        "expectedRemittance" = EXCLUDED."expectedRemittance",
        "actualAmountReceived" = EXCLUDED."actualAmountReceived",
        "discrepancyAmount" = EXCLUDED."discrepancyAmount",
        "discrepancyReason" = EXCLUDED."discrepancyReason",
        "financialStatus" = EXCLUDED."financialStatus",
        "authorizedBy" = EXCLUDED."authorizedBy",
        "authorizedAt" = EXCLUDED."authorizedAt",
        notes = EXCLUDED.notes,
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        id,
        payload.settlementBatchRef || `BATCH-${Date.now()}`,
        payload.orderId,
        payload.orderNumber,
        payload.courierProvider || 'Koombiyo',
        Number(payload.expectedCodAmount || 0),
        Number(payload.courierReportedAmount || 0),
        payload.collectionDate || '',
        payload.settlementDate || '',
        payload.bankReference || '',
        JSON.stringify(payload.documentedDeductions || []),
        Number(payload.totalDeductions || 0),
        Number(payload.expectedRemittance || 0),
        Number(payload.actualAmountReceived || 0),
        Number(payload.discrepancyAmount || 0),
        payload.discrepancyReason || null,
        payload.financialStatus || 'SETTLED',
        payload.authorizedBy || 'Admin',
        payload.authorizedAt || new Date().toISOString(),
        payload.notes || null,
        now,
      ]
    );

    return (await this.getSettlementById(id))!;
  }

  public async getCourierAgreement(courierCode: string = 'KOOMBIYO'): Promise<CourierMerchantAgreement> {
    const res = await this.database.query(
      `SELECT * FROM "CourierMerchantAgreement" WHERE "courierCode" = $1 LIMIT 1`,
      [courierCode]
    );
    if (res.rows.length === 0) return DEFAULT_KOOMBIYO_AGREEMENT;
    const r = res.rows[0];
    return {
      courierCode: r.courierCode,
      courierName: r.courierName,
      agreementReference: r.agreementReference || 'AGR-KOOM-2026',
      standardDeliveryCharge: Number(r.standardDeliveryCharge || 450),
      codCommissionType: r.codCommissionType as any || 'PERCENTAGE',
      codCommissionRate: Number(r.codCommissionValue || 0),
      returnHandlingFee: 0,
      vatTaxRatePercent: r.vatApplicable ? 18 : 0,
      settlementCycleNotice: 'Bi-weekly automated bank transfer',
      standardDeductions: [],
    };
  }

  public async updateMerchantAgreement(
    partial: Partial<CourierMerchantAgreement>,
    courierCode: string = 'KOOMBIYO'
  ): Promise<CourierMerchantAgreement> {
    const current = await this.getCourierAgreement(courierCode);
    const updated: CourierMerchantAgreement = {
      ...current,
      ...partial,
      standardDeductions: partial.standardDeductions || current.standardDeductions,
    };

    const now = new Date();
    await this.database.query(
      `INSERT INTO "CourierMerchantAgreement" (
        id, "courierCode", "courierName", "agreementReference", "standardDeliveryCharge",
        "codCommissionType", "codCommissionValue", "vatApplicable", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
      ON CONFLICT ("courierCode") DO UPDATE SET
        "courierName" = EXCLUDED."courierName",
        "agreementReference" = EXCLUDED."agreementReference",
        "standardDeliveryCharge" = EXCLUDED."standardDeliveryCharge",
        "codCommissionType" = EXCLUDED."codCommissionType",
        "codCommissionValue" = EXCLUDED."codCommissionValue",
        "vatApplicable" = EXCLUDED."vatApplicable",
        "updatedAt" = EXCLUDED."updatedAt"`,
      [
        `cma-${courierCode.toLowerCase()}`,
        courierCode,
        updated.courierName || 'Koombiyo Delivery',
        updated.agreementReference || 'AGR-KOOM-2026',
        Number(updated.standardDeliveryCharge || 450),
        updated.codCommissionType || 'PERCENTAGE',
        Number(updated.codCommissionRate || 0),
        Boolean(updated.vatTaxRatePercent && updated.vatTaxRatePercent > 0),
        now,
      ]
    );

    return updated;
  }
}

export const postgresSettlementRepository = new PostgresSettlementRepository();

