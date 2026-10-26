import { fetchApi } from './api';
import { OrderRecord } from './orderService';

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

export interface SettlementSummary {
  totalCodOrders: number;
  totalExpectedCod: number;
  collectionPendingCount: number;
  collectionPendingAmount: number;
  inCourierCustodyCount: number;
  inCourierCustodyAmount: number;
  settlementPendingCount: number;
  settlementPendingAmount: number;
  partiallySettledCount: number;
  partiallySettledAmount: number;
  settledCount: number;
  settledAmount: number;
  disputedCount: number;
  disputedAmount: number;
  totalDocumentedDeductions: number;
  totalDiscrepancyAmount: number;
}

export interface CodFinancialLedgerResponse {
  summary: SettlementSummary;
  orders: OrderRecord[];
  settlements: SettlementRecord[];
}

export interface RecordSettlementPayload {
  orderId: string;
  orderNumber?: string;
  courierProvider?: string;
  expectedCodAmount?: number;
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
}

export const settlementService = {
  async getSettlements(params?: {
    orderNumber?: string;
    batchRef?: string;
    financialStatus?: CodFinancialStatus | 'ALL';
    courier?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SettlementRecord[]> {
    const q = new URLSearchParams();
    if (params?.orderNumber) q.set('orderNumber', params.orderNumber);
    if (params?.batchRef) q.set('batchRef', params.batchRef);
    if (params?.financialStatus && params.financialStatus !== 'ALL') q.set('financialStatus', params.financialStatus);
    if (params?.courier) q.set('courier', params.courier);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);

    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchApi<SettlementRecord[]>(`/settlements${qs}`);
  },

  async recordSettlement(
    payload: RecordSettlementPayload
  ): Promise<{ settlement: SettlementRecord; isUpdate: boolean; order: OrderRecord }> {
    return fetchApi<{ settlement: SettlementRecord; isUpdate: boolean; order: OrderRecord }>('/settlements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async recordCodCollection(
    orderId: string,
    payload: {
      status: 'COLLECTION_PENDING' | 'COLLECTED_BY_COURIER' | 'COLLECTION_DISPUTED';
      courierReportedAmount?: number;
      collectionDate?: string;
      disputeReason?: string;
      admin?: string;
      notes?: string;
    }
  ): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/settlements/orders/${orderId}/cod-collection`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getMerchantAgreement(): Promise<CourierMerchantAgreement> {
    return fetchApi<CourierMerchantAgreement>('/settlements/agreement-config');
  },

  async updateMerchantAgreement(
    partial: Partial<CourierMerchantAgreement>
  ): Promise<CourierMerchantAgreement> {
    return fetchApi<CourierMerchantAgreement>('/settlements/agreement-config', {
      method: 'PUT',
      body: JSON.stringify(partial),
    });
  },

  async getCodFinancialLedger(params?: {
    startDate?: string;
    endDate?: string;
    courier?: string;
    financialStatus?: CodFinancialStatus | 'ALL';
    search?: string;
  }): Promise<CodFinancialLedgerResponse> {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.courier) q.set('courier', params.courier);
    if (params?.financialStatus && params.financialStatus !== 'ALL') q.set('financialStatus', params.financialStatus);
    if (params?.search) q.set('search', params.search);

    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchApi<CodFinancialLedgerResponse>(`/settlements/ledger${qs}`);
  },
};
