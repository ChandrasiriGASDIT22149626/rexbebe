import { OrderRepository, OrderRecord } from '../repositories/orderRepository';
import { SettlementRepository } from '../repositories/settlementRepository';

export interface CodSummaryCardsData {
  totalCodOrders: { count: number; amount: number };
  pendingConfirmationOrders: { count: number; amount: number };
  ordersBeingPrepared: { count: number; amount: number };
  ordersAwaitingPickup: { count: number; amount: number };
  ordersInTransit: { count: number; amount: number };
  deliveredOrders: { count: number; amount: number };
  failedDeliveries: { count: number; amount: number };
  returnedParcels: { count: number; amount: number };
  codCollectionPending: { count: number; amount: number };
  courierSettlementPending: { count: number; amount: number };
  settlementsCompleted: { count: number; amount: number };
}

export interface PeriodicBreakdownItem {
  periodKey: string;
  label: string;
  orderCount: number;
  totalAmount: number;
  collectedAmount: number;
  settledAmount: number;
  deliveryFees: number;
  returnFees: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
}

export interface DeliveryZoneBreakdownItem {
  zoneId: string;
  zoneName: string;
  orderCount: number;
  totalAmount: number;
  shippingFeesCollected: number;
  courierExpenses: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
  successRatePercent: number;
}

export interface CodAnalyticsReportResponse {
  summaryCards: CodSummaryCardsData;
  periodicBreakdown: {
    daily: PeriodicBreakdownItem[];
    weekly: PeriodicBreakdownItem[];
    monthly: PeriodicBreakdownItem[];
  };
  deliveryZoneBreakdown: DeliveryZoneBreakdownItem[];
  fulfillmentPerformance: {
    totalDelivered: number;
    totalFailedAttempts: number;
    totalReturned: number;
    successRatePercent: number;
    failureReasonsBreakdown: Record<string, { count: number; label: string }>;
  };
  financialReconciliation: {
    awaitingCollectionAmount: number;
    awaitingCollectionCount: number;
    collectedByCourierAmount: number;
    collectedByCourierCount: number;
    pendingSettlementAmount: number;
    pendingSettlementCount: number;
    completedSettlementAmount: number;
    completedSettlementCount: number;
    courierDeliveryExpenses: number;
    returnToSenderCosts: number;
    outstandingCourierBalance: number;
  };
  filteredOrdersCount: number;
  generatedAt: string;
}

export class CodAnalyticsService {
  private orderRepo: OrderRepository;
  private settlementRepo: SettlementRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.settlementRepo = new SettlementRepository();
  }

  public async getAnalyticsReport(filters?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    zoneId?: string;
  }): Promise<CodAnalyticsReportResponse> {
    const allOrders = await this.orderRepo.findAll();
    
    // Strict filter: ONLY COD orders
    let codOrders = allOrders.filter(
      (o) =>
        o.paymentMethod === 'CASH_ON_DELIVERY' ||
        o.paymentMethod === 'COD' ||
        o.paymentMethod?.toLowerCase().includes('cash')
    );

    // Apply Date Range filter if provided
    if (filters?.startDate) {
      codOrders = codOrders.filter((o) => o.createdAt.slice(0, 10) >= filters.startDate!);
    }
    if (filters?.endDate) {
      codOrders = codOrders.filter((o) => o.createdAt.slice(0, 10) <= filters.endDate!);
    }

    // Apply Search filter if provided
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      codOrders = codOrders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q) ||
          o.shippingAddress?.district?.toLowerCase().includes(q) ||
          o.shippingAddress?.city?.toLowerCase().includes(q) ||
          o.courierDetails?.waybillNumber?.toLowerCase().includes(q) ||
          o.trackingNumber?.toLowerCase().includes(q) ||
          o.settlementRecord?.settlementBatchRef?.toLowerCase().includes(q)
      );
    }

    // Apply Zone filter if provided
    if (filters?.zoneId && filters.zoneId !== 'ALL') {
      codOrders = codOrders.filter((o) => o.deliveryZoneSnapshot?.zoneId === filters.zoneId);
    }

    // 1. Calculate the 11 Summary Cards
    const summaryCards: CodSummaryCardsData = {
      totalCodOrders: { count: 0, amount: 0 },
      pendingConfirmationOrders: { count: 0, amount: 0 },
      ordersBeingPrepared: { count: 0, amount: 0 },
      ordersAwaitingPickup: { count: 0, amount: 0 },
      ordersInTransit: { count: 0, amount: 0 },
      deliveredOrders: { count: 0, amount: 0 },
      failedDeliveries: { count: 0, amount: 0 },
      returnedParcels: { count: 0, amount: 0 },
      codCollectionPending: { count: 0, amount: 0 },
      courierSettlementPending: { count: 0, amount: 0 },
      settlementsCompleted: { count: 0, amount: 0 },
    };

    codOrders.forEach((o) => {
      const amt = o.amountToCollect || o.totalAmount || 0;
      summaryCards.totalCodOrders.count += 1;
      summaryCards.totalCodOrders.amount += amt;

      const orderStatus = o.status;
      const deliveryStatus = o.courierDetails?.deliveryStatus;
      const codStatus = o.codFinancialStatus || o.codCollectionStatus;

      // Pending confirmation orders
      if (orderStatus === 'PENDING_CONFIRMATION') {
        summaryCards.pendingConfirmationOrders.count += 1;
        summaryCards.pendingConfirmationOrders.amount += amt;
      }

      // Orders being prepared (Confirmed, Processing, Packed)
      if (['CONFIRMED', 'PROCESSING', 'PACKED', 'NEW'].includes(orderStatus)) {
        summaryCards.ordersBeingPrepared.count += 1;
        summaryCards.ordersBeingPrepared.amount += amt;
      }

      // Orders awaiting pickup (Ready to Ship / Ready for Pickup)
      if (orderStatus === 'READY_TO_SHIP' || deliveryStatus === 'READY_FOR_PICKUP') {
        summaryCards.ordersAwaitingPickup.count += 1;
        summaryCards.ordersAwaitingPickup.amount += amt;
      }

      // Orders in transit (Shipped, In Transit, Out for Delivery, Picked Up)
      if (
        orderStatus === 'SHIPPED' ||
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(deliveryStatus || '')
      ) {
        summaryCards.ordersInTransit.count += 1;
        summaryCards.ordersInTransit.amount += amt;
      }

      // Delivered orders
      if (orderStatus === 'DELIVERED' || deliveryStatus === 'DELIVERED') {
        summaryCards.deliveredOrders.count += 1;
        summaryCards.deliveredOrders.amount += amt;
      }

      // Failed deliveries
      const hasFailedAttempt = Boolean(
        deliveryStatus === 'DELIVERY_ATTEMPT_FAILED' ||
        (o.courierDetails?.deliveryAttempts && o.courierDetails.deliveryAttempts.length > 0)
      );
      if (hasFailedAttempt) {
        summaryCards.failedDeliveries.count += 1;
        summaryCards.failedDeliveries.amount += amt;
      }

      // Returned parcels (Returning, Returned to Sender, Returned)
      if (
        orderStatus === 'RETURNED' ||
        ['RETURNING_TO_SENDER', 'RETURNED_TO_SENDER'].includes(deliveryStatus || '')
      ) {
        summaryCards.returnedParcels.count += 1;
        summaryCards.returnedParcels.amount += amt;
      }

      // COD collection pending
      if (codStatus === 'COLLECTION_PENDING' || !codStatus) {
        summaryCards.codCollectionPending.count += 1;
        summaryCards.codCollectionPending.amount += amt;
      }

      // Courier settlement pending
      if (
        codStatus === 'SETTLEMENT_PENDING' ||
        (deliveryStatus === 'DELIVERED' && codStatus !== 'SETTLED' && codStatus !== 'PARTIALLY_SETTLED')
      ) {
        summaryCards.courierSettlementPending.count += 1;
        summaryCards.courierSettlementPending.amount += amt;
      }

      // Settlements completed
      if (codStatus === 'SETTLED' || codStatus === 'PARTIALLY_SETTLED') {
        summaryCards.settlementsCompleted.count += 1;
        summaryCards.settlementsCompleted.amount += o.settlementRecord?.actualAmountReceived || amt;
      }
    });

    // 2. Periodic Breakdowns: Daily, Weekly, Monthly
    const dailyMap = new Map<string, PeriodicBreakdownItem>();
    const weeklyMap = new Map<string, PeriodicBreakdownItem>();
    const monthlyMap = new Map<string, PeriodicBreakdownItem>();

    codOrders.forEach((o) => {
      const amt = o.amountToCollect || o.totalAmount || 0;
      const orderDate = o.createdAt ? o.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const monthKey = orderDate.slice(0, 7); // YYYY-MM

      // ISO week calculator
      const dateObj = new Date(orderDate);
      const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
      const pastDaysOfYear = (dateObj.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const weekKey = `${dateObj.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

      const isDelivered = o.status === 'DELIVERED' || o.courierDetails?.deliveryStatus === 'DELIVERED';
      const isFailed = o.courierDetails?.deliveryStatus === 'DELIVERY_ATTEMPT_FAILED';
      const isReturned = o.status === 'RETURNED' || ['RETURNING_TO_SENDER', 'RETURNED_TO_SENDER'].includes(o.courierDetails?.deliveryStatus || '');
      const deliveryFee = o.shippingFee || o.courierDetails?.deliveryFee || 400;
      const returnFee = o.verifiedReturnCharges || o.courierDetails?.verifiedReturnCharges || 0;
      const isCollected = ['COLLECTED_BY_COURIER', 'COLLECTED', 'SETTLEMENT_PENDING', 'SETTLED', 'PARTIALLY_SETTLED'].includes(o.codFinancialStatus || o.codCollectionStatus || '');
      const settledAmount = o.settlementRecord?.actualAmountReceived || (['SETTLED', 'PARTIALLY_SETTLED'].includes(o.codFinancialStatus || '') ? amt : 0);

      // Helper to accumulate into map
      const updateMap = (map: Map<string, PeriodicBreakdownItem>, key: string, label: string) => {
        if (!map.has(key)) {
          map.set(key, {
            periodKey: key,
            label,
            orderCount: 0,
            totalAmount: 0,
            collectedAmount: 0,
            settledAmount: 0,
            deliveryFees: 0,
            returnFees: 0,
            deliveredCount: 0,
            failedCount: 0,
            returnedCount: 0,
          });
        }
        const item = map.get(key)!;
        item.orderCount += 1;
        item.totalAmount += amt;
        if (isCollected) item.collectedAmount += amt;
        item.settledAmount += settledAmount;
        item.deliveryFees += deliveryFee;
        item.returnFees += returnFee;
        if (isDelivered) item.deliveredCount += 1;
        if (isFailed) item.failedCount += 1;
        if (isReturned) item.returnedCount += 1;
      };

      updateMap(dailyMap, orderDate, orderDate);
      updateMap(weeklyMap, weekKey, `Week ${weekNum}, ${dateObj.getFullYear()}`);
      updateMap(monthlyMap, monthKey, new Date(orderDate).toLocaleString('default', { month: 'short', year: 'numeric' }));
    });

    const daily = Array.from(dailyMap.values()).sort((a, b) => b.periodKey.localeCompare(a.periodKey)).slice(0, 30);
    const weekly = Array.from(weeklyMap.values()).sort((a, b) => b.periodKey.localeCompare(a.periodKey)).slice(0, 16);
    const monthly = Array.from(monthlyMap.values()).sort((a, b) => b.periodKey.localeCompare(a.periodKey)).slice(0, 12);

    // 3. Delivery Zones Breakdown
    const zoneMap = new Map<string, DeliveryZoneBreakdownItem>();
    codOrders.forEach((o) => {
      const snap = o.deliveryZoneSnapshot;
      const zoneId = snap?.zoneId || (o.shippingAddress?.district?.toLowerCase().includes('gampaha') ? 'zone-gampaha-other' : 'zone-outstation');
      const zoneName = snap?.zoneName || (o.shippingAddress?.district || 'Other Districts / Outstation');
      const amt = o.amountToCollect || o.totalAmount || 0;
      const shippingFee = o.shippingFee || snap?.deliveryFee || 400;
      const courierExpense = (o.courierDetails?.deliveryFee || 400) + (o.verifiedReturnCharges || 0);

      const isDelivered = o.status === 'DELIVERED' || o.courierDetails?.deliveryStatus === 'DELIVERED';
      const isFailed = o.courierDetails?.deliveryStatus === 'DELIVERY_ATTEMPT_FAILED';
      const isReturned = o.status === 'RETURNED' || ['RETURNING_TO_SENDER', 'RETURNED_TO_SENDER'].includes(o.courierDetails?.deliveryStatus || '');

      if (!zoneMap.has(zoneId)) {
        zoneMap.set(zoneId, {
          zoneId,
          zoneName,
          orderCount: 0,
          totalAmount: 0,
          shippingFeesCollected: 0,
          courierExpenses: 0,
          deliveredCount: 0,
          failedCount: 0,
          returnedCount: 0,
          successRatePercent: 0,
        });
      }

      const z = zoneMap.get(zoneId)!;
      z.orderCount += 1;
      z.totalAmount += amt;
      z.shippingFeesCollected += shippingFee;
      z.courierExpenses += courierExpense;
      if (isDelivered) z.deliveredCount += 1;
      if (isFailed) z.failedCount += 1;
      if (isReturned) z.returnedCount += 1;
      z.successRatePercent = z.orderCount > 0 ? Math.round((z.deliveredCount / z.orderCount) * 100) : 0;
    });

    const deliveryZoneBreakdown = Array.from(zoneMap.values()).sort((a, b) => b.orderCount - a.orderCount);

    // 4. Fulfillment Performance & Failure Reasons
    let totalDelivered = 0;
    let totalFailedAttempts = 0;
    let totalReturned = 0;
    const failureReasonsBreakdown: Record<string, { count: number; label: string }> = {
      CUSTOMER_UNAVAILABLE: { count: 0, label: 'Customer unavailable' },
      INCORRECT_ADDRESS: { count: 0, label: 'Incorrect address' },
      PHONE_UNREACHABLE: { count: 0, label: 'Customer phone unreachable' },
      CUSTOMER_REFUSED: { count: 0, label: 'Customer refused the parcel' },
      COURIER_ISSUE: { count: 0, label: 'Courier delivery issue' },
      OTHER: { count: 0, label: 'Other documented reasons' },
    };

    codOrders.forEach((o) => {
      if (o.status === 'DELIVERED' || o.courierDetails?.deliveryStatus === 'DELIVERED') {
        totalDelivered += 1;
      }
      if (o.status === 'RETURNED' || ['RETURNING_TO_SENDER', 'RETURNED_TO_SENDER'].includes(o.courierDetails?.deliveryStatus || '')) {
        totalReturned += 1;
      }

      if (o.courierDetails?.deliveryAttempts && o.courierDetails.deliveryAttempts.length > 0) {
        totalFailedAttempts += o.courierDetails.deliveryAttempts.length;
        o.courierDetails.deliveryAttempts.forEach((att) => {
          const reasonKey = att.reasonCode || 'OTHER';
          if (failureReasonsBreakdown[reasonKey]) {
            failureReasonsBreakdown[reasonKey].count += 1;
          } else {
            failureReasonsBreakdown['OTHER'].count += 1;
          }
        });
      }
    });

    const successRatePercent = codOrders.length > 0 ? Math.round((totalDelivered / codOrders.length) * 100) : 0;

    // 5. Financial Reconciliation
    let awaitingCollectionAmount = 0;
    let awaitingCollectionCount = 0;
    let collectedByCourierAmount = 0;
    let collectedByCourierCount = 0;
    let pendingSettlementAmount = 0;
    let pendingSettlementCount = 0;
    let completedSettlementAmount = 0;
    let completedSettlementCount = 0;
    let courierDeliveryExpenses = 0;
    let returnToSenderCosts = 0;

    codOrders.forEach((o) => {
      const amt = o.amountToCollect || o.totalAmount || 0;
      const status = o.codFinancialStatus || o.codCollectionStatus || 'COLLECTION_PENDING';
      const shipping = o.shippingFee || o.courierDetails?.deliveryFee || 400;
      const returnCharge = o.verifiedReturnCharges || o.courierDetails?.verifiedReturnCharges || 0;

      courierDeliveryExpenses += shipping;
      returnToSenderCosts += returnCharge;

      if (status === 'COLLECTION_PENDING') {
        awaitingCollectionAmount += amt;
        awaitingCollectionCount += 1;
      } else if (status === 'COLLECTED_BY_COURIER' || status === 'COLLECTED') {
        collectedByCourierAmount += amt;
        collectedByCourierCount += 1;
      } else if (status === 'SETTLEMENT_PENDING') {
        pendingSettlementAmount += amt;
        pendingSettlementCount += 1;
      } else if (status === 'SETTLED' || status === 'PARTIALLY_SETTLED') {
        completedSettlementAmount += (o.settlementRecord?.actualAmountReceived || amt);
        completedSettlementCount += 1;
      }
    });

    // Outstanding courier balance:
    // Cash collected by courier minus actual bank receipts minus documented courier expenses for settled parcels
    const totalCashInCourierHands = collectedByCourierAmount + pendingSettlementAmount;
    const outstandingCourierBalance = Math.max(0, totalCashInCourierHands);

    return {
      summaryCards,
      periodicBreakdown: {
        daily,
        weekly,
        monthly,
      },
      deliveryZoneBreakdown,
      fulfillmentPerformance: {
        totalDelivered,
        totalFailedAttempts,
        totalReturned,
        successRatePercent,
        failureReasonsBreakdown,
      },
      financialReconciliation: {
        awaitingCollectionAmount,
        awaitingCollectionCount,
        collectedByCourierAmount,
        collectedByCourierCount,
        pendingSettlementAmount,
        pendingSettlementCount,
        completedSettlementAmount,
        completedSettlementCount,
        courierDeliveryExpenses,
        returnToSenderCosts,
        outstandingCourierBalance,
      },
      filteredOrdersCount: codOrders.length,
      generatedAt: new Date().toISOString(),
    };
  }
}
