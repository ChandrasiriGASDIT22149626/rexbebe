import fs from 'fs';
import path from 'path';
import { BadRequestError } from '../utils/errors';

export type CodFinancialStatus =
  | 'COLLECTION_PENDING'
  | 'COLLECTED_BY_COURIER'
  | 'SETTLEMENT_PENDING'
  | 'PARTIALLY_SETTLED'
  | 'SETTLED'
  | 'COLLECTION_DISPUTED';

export interface CourierDeductionItem {
  id?: string;
  type: 'DELIVERY_FEE' | 'RETURN_FEE' | 'COD_HANDLING' | 'WEIGHT_SURCHARGE' | 'TAX_VAT' | 'OTHER';
  amount: number;
  description: string;
}

export interface SettlementRecord {
  id: string;
  settlementBatchRef: string;
  orderId: string;
  orderNumber: string;
  courierProvider: string;
  expectedCodAmount: number;
  courierReportedAmount: number;
  collectionDate: string;
  settlementDate: string;
  bankReference: string;
  documentedDeductions: CourierDeductionItem[];
  totalDeductions: number;
  expectedRemittance: number;
  actualAmountReceived: number;
  discrepancyAmount: number;
  discrepancyReason?: string;
  financialStatus: CodFinancialStatus;
  authorizedBy: string;
  authorizedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourierMerchantAgreement {
  courierCode: string;
  courierName: string;
  agreementReference: string;
  standardDeliveryCharge: number;
  codCommissionType: 'PERCENTAGE' | 'FLAT';
  codCommissionRate: number;
  returnHandlingFee: number;
  vatTaxRatePercent: number;
  settlementCycleNotice: string;
  standardDeductions: CourierDeductionItem[];
  notes?: string;
}

export const DEFAULT_KOOMBIYO_AGREEMENT: CourierMerchantAgreement = {
  courierCode: 'KOOMBIYO',
  courierName: 'Koombiyo Delivery',
  agreementReference: 'KMB-REX-2026-AGR',
  standardDeliveryCharge: 400,
  codCommissionType: 'PERCENTAGE',
  codCommissionRate: 0, // No unapproved COD surcharge in accordance with store policy
  returnHandlingFee: 300,
  vatTaxRatePercent: 0,
  settlementCycleNotice: 'As per actual merchant remittance agreement: weekly/bi-weekly upon statement submission. Dates and amounts are not invented.',
  standardDeductions: [
    {
      type: 'DELIVERY_FEE',
      amount: 400,
      description: 'Contracted parcel delivery fee as per zone rate',
    },
  ],
  notes: 'Actual deductions must be matched against Koombiyo official merchant portal remittance slip.',
};

export class SettlementRepository {
  private settlementsFilePath = path.join(__dirname, '../../data/settlements.json');
  private agreementFilePath = path.join(__dirname, '../../data/courier_agreements.json');

  private readSettlements(): SettlementRecord[] {
    try {
      if (fs.existsSync(this.settlementsFilePath)) {
        const raw = fs.readFileSync(this.settlementsFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[SettlementRepository] Error reading settlements from disk:', err);
    }
    return [];
  }

  private writeSettlements(data: SettlementRecord[]): void {
    try {
      const dir = path.dirname(this.settlementsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settlementsFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SettlementRepository] Error writing settlements to disk:', err);
    }
  }

  private readAgreement(): CourierMerchantAgreement {
    try {
      if (fs.existsSync(this.agreementFilePath)) {
        const raw = fs.readFileSync(this.agreementFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[SettlementRepository] Error reading agreement:', err);
    }
    this.writeAgreement(DEFAULT_KOOMBIYO_AGREEMENT);
    return DEFAULT_KOOMBIYO_AGREEMENT;
  }

  private writeAgreement(data: CourierMerchantAgreement): void {
    try {
      const dir = path.dirname(this.agreementFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.agreementFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SettlementRepository] Error writing agreement:', err);
    }
  }

  async getAllSettlements(filters?: {
    orderNumber?: string;
    batchRef?: string;
    financialStatus?: CodFinancialStatus | 'ALL';
    courier?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SettlementRecord[]> {
    let list = this.readSettlements();

    if (filters?.orderNumber) {
      const q = filters.orderNumber.trim().toLowerCase();
      list = list.filter((s) => s.orderNumber.toLowerCase().includes(q));
    }
    if (filters?.batchRef) {
      const q = filters.batchRef.trim().toLowerCase();
      list = list.filter((s) => s.settlementBatchRef.toLowerCase().includes(q));
    }
    if (filters?.financialStatus && filters.financialStatus !== 'ALL') {
      list = list.filter((s) => s.financialStatus === filters.financialStatus);
    }
    if (filters?.courier) {
      const q = filters.courier.trim().toLowerCase();
      list = list.filter((s) => s.courierProvider.toLowerCase().includes(q));
    }
    if (filters?.startDate) {
      list = list.filter((s) => s.settlementDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      list = list.filter((s) => s.settlementDate <= filters.endDate!);
    }

    return list;
  }

  async getSettlementById(id: string): Promise<SettlementRecord | null> {
    const list = this.readSettlements();
    return list.find((s) => s.id === id) || null;
  }

  async getSettlementByOrderId(orderId: string): Promise<SettlementRecord | null> {
    const list = this.readSettlements();
    return list.find((s) => s.orderId === orderId || s.orderNumber === orderId) || null;
  }

  /**
   * Record or update an authorized settlement entry with duplicate prevention
   */
  async recordSettlement(payload: {
    orderId: string;
    orderNumber: string;
    courierProvider: string;
    expectedCodAmount: number;
    courierReportedAmount: number;
    collectionDate?: string;
    settlementBatchRef: string;
    settlementDate?: string;
    bankReference: string;
    documentedDeductions: CourierDeductionItem[];
    actualAmountReceived: number;
    discrepancyReason?: string;
    authorizedBy: string;
    notes?: string;
  }): Promise<{ settlement: SettlementRecord; isUpdate: boolean }> {
    const list = this.readSettlements();
    const cleanBatch = payload.settlementBatchRef.trim();
    const cleanBankRef = payload.bankReference.trim();

    if (!cleanBatch) {
      throw new BadRequestError('Settlement batch or reference number is required');
    }
    if (!cleanBankRef) {
      throw new BadRequestError('Bank or payment reference is required');
    }
    if (!payload.authorizedBy || !payload.authorizedBy.trim()) {
      throw new BadRequestError('Authorized administrator name is required to confirm funds received');
    }

    // Calculate total deductions and expected net remittance
    const totalDeductions = (payload.documentedDeductions || []).reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );
    const expectedRemittance = Math.max(0, payload.courierReportedAmount - totalDeductions);
    const discrepancyAmount = expectedRemittance - payload.actualAmountReceived;

    // Validate discrepancy reason if there is a shortfall
    if (discrepancyAmount > 0 && (!payload.discrepancyReason || payload.discrepancyReason.trim().length < 5)) {
      throw new BadRequestError(
        `Discrepancy detected (Shortfall of LKR ${discrepancyAmount.toLocaleString()}). A specific adjustment reason (minimum 5 characters) is required.`
      );
    }

    // Determine final financial status based on actual funds received
    let financialStatus: CodFinancialStatus;
    if (payload.actualAmountReceived >= expectedRemittance && expectedRemittance > 0) {
      financialStatus = 'SETTLED';
    } else if (payload.actualAmountReceived > 0 && payload.actualAmountReceived < expectedRemittance) {
      financialStatus = 'PARTIALLY_SETTLED';
    } else if (discrepancyAmount !== 0 && payload.actualAmountReceived === 0) {
      financialStatus = 'COLLECTION_DISPUTED';
    } else {
      financialStatus = 'SETTLEMENT_PENDING';
    }

    const now = new Date().toISOString();
    const settlementDate = payload.settlementDate || now.split('T')[0];
    const collectionDate = payload.collectionDate || now.split('T')[0];

    // Duplicate Prevention Check:
    // If a settlement record with the same orderId and settlementBatchRef already exists, update it rather than duplicating.
    const existingIndex = list.findIndex(
      (s) => s.orderId === payload.orderId && s.settlementBatchRef.toLowerCase() === cleanBatch.toLowerCase()
    );

    let settlementRecord: SettlementRecord;
    let isUpdate = false;

    if (existingIndex !== -1) {
      // Existing entry: update safely without duplicate balance increments
      isUpdate = true;
      settlementRecord = {
        ...list[existingIndex],
        courierReportedAmount: payload.courierReportedAmount,
        collectionDate,
        settlementDate,
        bankReference: cleanBankRef,
        documentedDeductions: payload.documentedDeductions,
        totalDeductions,
        expectedRemittance,
        actualAmountReceived: payload.actualAmountReceived,
        discrepancyAmount,
        discrepancyReason: payload.discrepancyReason,
        financialStatus,
        authorizedBy: payload.authorizedBy.trim(),
        authorizedAt: now,
        notes: payload.notes || list[existingIndex].notes,
        updatedAt: now,
      };
      list[existingIndex] = settlementRecord;
    } else {
      // Also check if order is already SETTLED under another batch
      const alreadySettled = list.find((s) => s.orderId === payload.orderId && s.financialStatus === 'SETTLED');
      if (alreadySettled) {
        throw new BadRequestError(
          `Order #${payload.orderNumber} is already fully settled under batch "${alreadySettled.settlementBatchRef}" on ${alreadySettled.settlementDate}. Duplicate settlement entries are prohibited.`
        );
      }

      settlementRecord = {
        id: `stl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        settlementBatchRef: cleanBatch,
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        courierProvider: payload.courierProvider || 'Koombiyo Delivery',
        expectedCodAmount: payload.expectedCodAmount,
        courierReportedAmount: payload.courierReportedAmount,
        collectionDate,
        settlementDate,
        bankReference: cleanBankRef,
        documentedDeductions: payload.documentedDeductions,
        totalDeductions,
        expectedRemittance,
        actualAmountReceived: payload.actualAmountReceived,
        discrepancyAmount,
        discrepancyReason: payload.discrepancyReason,
        financialStatus,
        authorizedBy: payload.authorizedBy.trim(),
        authorizedAt: now,
        notes: payload.notes || '',
        createdAt: now,
        updatedAt: now,
      };
      list.unshift(settlementRecord);
    }

    this.writeSettlements(list);
    return { settlement: settlementRecord, isUpdate };
  }

  async getMerchantAgreement(): Promise<CourierMerchantAgreement> {
    return this.readAgreement();
  }

  async updateMerchantAgreement(
    partial: Partial<CourierMerchantAgreement>
  ): Promise<CourierMerchantAgreement> {
    const current = this.readAgreement();
    const updated: CourierMerchantAgreement = {
      ...current,
      ...partial,
      standardDeductions: partial.standardDeductions || current.standardDeductions,
    };
    this.writeAgreement(updated);
    return updated;
  }
}
