import {
  SettlementRepository,
  SettlementRecord,
  CourierMerchantAgreement,
  CodFinancialStatus,
  CourierDeductionItem,
} from '../repositories/settlementRepository';
import { OrderRepository, OrderRecord } from '../repositories/orderRepository';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class SettlementService {
  private settlementRepo: SettlementRepository;
  private orderRepo: OrderRepository;

  constructor() {
    this.settlementRepo = new SettlementRepository();
    this.orderRepo = new OrderRepository();
  }

  async getAllSettlements(filters?: {
    orderNumber?: string;
    batchRef?: string;
    financialStatus?: CodFinancialStatus | 'ALL';
    courier?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SettlementRecord[]> {
    return this.settlementRepo.getAllSettlements(filters);
  }

  async getSettlementByOrderId(orderId: string): Promise<SettlementRecord | null> {
    return this.settlementRepo.getSettlementByOrderId(orderId);
  }

  async recordSettlement(payload: {
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
  }): Promise<{ settlement: SettlementRecord; isUpdate: boolean; order: OrderRecord }> {
    const order = await this.orderRepo.findById(payload.orderId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${payload.orderId}' was not found.`);
    }

    if (!payload.authorizedBy || !payload.authorizedBy.trim()) {
      throw new BadRequestError('Authorized administrator confirmation is required to record funds received.');
    }

    if (!payload.settlementBatchRef || !payload.settlementBatchRef.trim()) {
      throw new BadRequestError('Settlement batch or reference number is required.');
    }

    if (!payload.bankReference || !payload.bankReference.trim()) {
      throw new BadRequestError('Bank deposit or statement reference is required.');
    }

    if (payload.actualAmountReceived === undefined || payload.actualAmountReceived === null || payload.actualAmountReceived < 0) {
      throw new BadRequestError('Actual amount received must be a non-negative number.');
    }

    const expectedCod = payload.expectedCodAmount ?? order.amountToCollect ?? order.totalAmount;
    const courierReported = payload.courierReportedAmount ?? expectedCod;

    const { settlement, isUpdate } = await this.settlementRepo.recordSettlement({
      orderId: order.id,
      orderNumber: order.orderNumber,
      courierProvider: payload.courierProvider || order.courierDetails?.courierProvider || 'Koombiyo Delivery',
      expectedCodAmount: expectedCod,
      courierReportedAmount: courierReported,
      collectionDate: payload.collectionDate || order.collectionDate,
      settlementBatchRef: payload.settlementBatchRef,
      settlementDate: payload.settlementDate,
      bankReference: payload.bankReference,
      documentedDeductions: payload.documentedDeductions || [],
      actualAmountReceived: payload.actualAmountReceived,
      discrepancyReason: payload.discrepancyReason,
      authorizedBy: payload.authorizedBy,
      notes: payload.notes,
    });

    const updatedOrder = await this.orderRepo.applySettlement(order.id, settlement, payload.authorizedBy);

    return {
      settlement,
      isUpdate,
      order: updatedOrder || order,
    };
  }

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
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order '${orderId}' not found`);
    }

    if (payload.status === 'COLLECTION_DISPUTED') {
      const reason = (payload.disputeReason || '').trim();
      if (!reason || reason.length < 5) {
        throw new BadRequestError('A specific dispute reason (minimum 5 characters) is required when marking a COD collection as disputed.');
      }
    }

    const updated = await this.orderRepo.recordCodCollectionEvent(order.id, payload);
    return updated || order;
  }

  async getMerchantAgreement(): Promise<CourierMerchantAgreement> {
    return this.settlementRepo.getMerchantAgreement();
  }

  async updateMerchantAgreement(
    partial: Partial<CourierMerchantAgreement>
  ): Promise<CourierMerchantAgreement> {
    return this.settlementRepo.updateMerchantAgreement(partial);
  }

  async getCodFinancialLedger(filters?: {
    startDate?: string;
    endDate?: string;
    courier?: string;
    financialStatus?: CodFinancialStatus | 'ALL';
    search?: string;
  }) {
    const [orders, allSettlements] = await Promise.all([
      this.orderRepo.findAll(),
      this.settlementRepo.getAllSettlements(),
    ]);

    // Map settlements by orderId and orderNumber
    const settlementMap = new Map<string, SettlementRecord>();
    for (const s of allSettlements) {
      settlementMap.set(s.orderId, s);
      settlementMap.set(s.orderNumber, s);
    }

    // Filter to COD orders only
    let codOrders = orders.filter(
      (o) => o.paymentMethod === 'CASH_ON_DELIVERY' || o.paymentMethod?.toLowerCase().includes('cash')
    );

    // Attach latest settlement record and ensure financial status is derived
    codOrders = codOrders.map((o) => {
      const settlement = settlementMap.get(o.id) || settlementMap.get(o.orderNumber);
      let status: CodFinancialStatus = o.codFinancialStatus || 'COLLECTION_PENDING';

      if (settlement) {
        status = settlement.financialStatus;
      } else if (o.status === 'RETURNED' || o.courierDetails?.deliveryStatus === 'RETURNED_TO_SENDER') {
        status = 'COLLECTION_DISPUTED';
      } else if (o.status === 'DELIVERED' || o.courierDetails?.codCollectionStatus === 'COLLECTED_BY_COURIER' || o.courierDetails?.codCollectionStatus === 'COLLECTED') {
        status = 'SETTLEMENT_PENDING';
      }

      return {
        ...o,
        codFinancialStatus: status,
        settlementRecord: settlement || o.settlementRecord,
      };
    });

    if (filters?.startDate) {
      codOrders = codOrders.filter((o) => o.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      codOrders = codOrders.filter((o) => o.createdAt.slice(0, 10) <= filters.endDate!);
    }
    if (filters?.courier && filters.courier !== 'ALL') {
      const c = filters.courier.toLowerCase();
      codOrders = codOrders.filter(
        (o) =>
          o.courierDetails?.courierProvider?.toLowerCase().includes(c) ||
          o.carrier?.toLowerCase().includes(c) ||
          o.settlementRecord?.courierProvider?.toLowerCase().includes(c)
      );
    }
    if (filters?.financialStatus && filters.financialStatus !== 'ALL') {
      codOrders = codOrders.filter((o) => o.codFinancialStatus === filters.financialStatus);
    }
    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      codOrders = codOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.shippingAddress?.district && o.shippingAddress.district.toLowerCase().includes(q)) ||
          (o.courierDetails?.waybillNumber && o.courierDetails.waybillNumber.toLowerCase().includes(q)) ||
          (o.settlementRecord?.settlementBatchRef && o.settlementRecord.settlementBatchRef.toLowerCase().includes(q)) ||
          (o.settlementRecord?.bankReference && o.settlementRecord.bankReference.toLowerCase().includes(q)) ||
          (o.courierDetails?.bankReference && o.courierDetails.bankReference.toLowerCase().includes(q))
      );
    }

    // Accurate calculation of all 6 financial statuses
    const totalCodOrders = codOrders.length;
    const totalExpectedCod = codOrders.reduce(
      (sum, o) => sum + (o.amountToCollect || o.totalAmount || 0),
      0
    );

    // 1. Collection Pending
    const collectionPendingOrders = codOrders.filter((o) => o.codFinancialStatus === 'COLLECTION_PENDING');
    const collectionPendingAmount = collectionPendingOrders.reduce(
      (sum, o) => sum + (o.amountToCollect || o.totalAmount || 0),
      0
    );

    // 2. Collected by Courier (or awaiting bank remittance)
    const inCourierCustodyOrders = codOrders.filter(
      (o) => o.codFinancialStatus === 'COLLECTED_BY_COURIER' || o.codFinancialStatus === 'SETTLEMENT_PENDING'
    );
    const inCourierCustodyAmount = inCourierCustodyOrders.reduce(
      (sum, o) => sum + (o.courierReportedAmount || o.amountToCollect || o.totalAmount || 0),
      0
    );

    // 3. Settlement Pending
    const settlementPendingOrders = codOrders.filter((o) => o.codFinancialStatus === 'SETTLEMENT_PENDING');
    const settlementPendingAmount = settlementPendingOrders.reduce(
      (sum, o) => sum + (o.courierReportedAmount || o.amountToCollect || o.totalAmount || 0),
      0
    );

    // 4. Partially Settled
    const partiallySettledOrders = codOrders.filter((o) => o.codFinancialStatus === 'PARTIALLY_SETTLED');
    const partiallySettledAmount = partiallySettledOrders.reduce(
      (sum, o) => sum + (o.settlementRecord?.actualAmountReceived || o.courierDetails?.amountRemitted || 0),
      0
    );

    // 5. Settled in Bank
    const settledOrders = codOrders.filter((o) => o.codFinancialStatus === 'SETTLED');
    const settledAmount = settledOrders.reduce(
      (sum, o) => sum + (o.settlementRecord?.actualAmountReceived || o.courierDetails?.amountRemitted || (o.amountToCollect || o.totalAmount || 0)),
      0
    );

    // 6. Collection Disputed
    const disputedOrders = codOrders.filter((o) => o.codFinancialStatus === 'COLLECTION_DISPUTED');
    const disputedAmount = disputedOrders.reduce(
      (sum, o) => sum + (o.amountToCollect || o.totalAmount || 0),
      0
    );

    // Deductions & Discrepancies
    let totalDocumentedDeductions = 0;
    let totalDiscrepancyAmount = 0;

    for (const o of codOrders) {
      if (o.settlementRecord) {
        totalDocumentedDeductions += o.settlementRecord.totalDeductions || 0;
        totalDiscrepancyAmount += o.settlementRecord.discrepancyAmount || 0;
      }
    }

    return {
      summary: {
        totalCodOrders,
        totalExpectedCod,
        collectionPendingCount: collectionPendingOrders.length,
        collectionPendingAmount,
        inCourierCustodyCount: inCourierCustodyOrders.length,
        inCourierCustodyAmount,
        settlementPendingCount: settlementPendingOrders.length,
        settlementPendingAmount,
        partiallySettledCount: partiallySettledOrders.length,
        partiallySettledAmount,
        settledCount: settledOrders.length,
        settledAmount,
        disputedCount: disputedOrders.length,
        disputedAmount,
        totalDocumentedDeductions,
        totalDiscrepancyAmount,
      },
      orders: codOrders,
      settlements: allSettlements,
    };
  }
}
