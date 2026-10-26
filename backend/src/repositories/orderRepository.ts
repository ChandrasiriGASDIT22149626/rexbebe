import fs from 'fs';
import path from 'path';

export interface OrderItemRecord {
  id: string;
  productId?: string;
  variantId: string;
  title: string;
  partName?: string;
  purchaseType?: string;
  partColors?: Record<string, string>;
  color?: string;
  size?: string;
  image?: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'NEW'
  | 'PACKED';

export type PaymentStatus =
  | 'COD_PENDING'
  | 'PAID'
  | 'PENDING'
  | 'REFUNDED'
  | 'FAILED';

export type CodSettlementStatus =
  | 'PENDING_REMITTANCE'
  | 'REMITTED'
  | 'RECONCILED';

import {
  CodFinancialStatus,
  SettlementRecord,
  CourierDeductionItem,
} from './settlementRepository';

export { CodFinancialStatus, SettlementRecord, CourierDeductionItem };

import {
  CourierDeliveryStatus,
  DeliveryAttemptRecord,
  ManualCourierBookingPayload,
  DeliveryStatusUpdatePayload,
  DeliveryFailureReason,
  FAILURE_REASONS_CATALOG,
  ParcelCondition,
  RestockDecision,
  ItemInspectionRecord,
  ReturnInspectionRecord,
  RecordDeliveryAttemptPayload,
  InitiateReturnToSenderPayload,
  ReturnInspectionPayload,
  UnresolvedReturnCase,
} from '../services/courier/types';

export {
  CourierDeliveryStatus,
  DeliveryAttemptRecord,
  ManualCourierBookingPayload,
  DeliveryStatusUpdatePayload,
  DeliveryFailureReason,
  FAILURE_REASONS_CATALOG,
  ParcelCondition,
  RestockDecision,
  ItemInspectionRecord,
  ReturnInspectionRecord,
  RecordDeliveryAttemptPayload,
  InitiateReturnToSenderPayload,
  ReturnInspectionPayload,
  UnresolvedReturnCase,
};

export interface CourierDetails {
  courierProvider?: string;
  bookingType?: 'MANUAL' | 'API';
  bookingDate?: string;
  pickupDate?: string;
  waybillNumber?: string;
  trackingUrl?: string;
  parcelWeight?: number; // kg
  deliveryFee?: number;
  codAmountToCollect?: number;
  dispatchDate?: string;
  expectedDeliveryDate?: string;
  deliveryStatus?: CourierDeliveryStatus;
  deliveryAttempts?: DeliveryAttemptRecord[];
  failureReason?: string;
  returnReason?: string;
  deliveredDate?: string;
  returnedDate?: string;
  courierNotes?: string;
  verifiedReturnCharges?: number;
  returnInspection?: ReturnInspectionRecord;
  unresolvedReturnAlert?: {
    type: string;
    summary: string;
    flaggedAt: string;
  };
  codCollectionStatus?:
    | 'COLLECTION_PENDING'
    | 'COLLECTED_BY_COURIER'
    | 'COLLECTED'
    | 'NOT_COLLECTED'
    | 'COLLECTION_DISPUTED'
    | 'PENDING'
    | string;
  codRemittanceStatus?: CodSettlementStatus;
  amountRemitted?: number;
  remittanceDate?: string;
  bankReference?: string;
  notes?: string;
}

export interface DeliveryZoneSnapshot {
  zoneId: string;
  zoneName: string;
  district: string;
  town: string;
  deliveryFee: number;
  isInitialRate: boolean;
  requiresReview: boolean;
  policyApplied: string;
  appliedAt: string;
  reviewNotes?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  country?: string;
  countryFlag?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  codCollectionStatus?: 'COLLECTION_PENDING' | 'COLLECTED_BY_COURIER' | 'COLLECTED' | 'NOT_COLLECTED' | 'COLLECTION_DISPUTED' | 'PENDING' | string;
  codSettlementStatus?: CodSettlementStatus;
  codFinancialStatus?: CodFinancialStatus;
  courierReportedAmount?: number;
  collectionDate?: string;
  settlementRecord?: SettlementRecord;
  idempotencyKey?: string;
  paymentMethod: string;
  paymentReference?: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  codHandlingFee?: number;
  advancePayment?: number;
  amountToCollect?: number;
  tax: number;
  totalAmount: number;
  isRestocked?: boolean;
  courierDetails?: CourierDetails;
  returnInspection?: ReturnInspectionRecord;
  verifiedReturnCharges?: number;
  unresolvedReturnAlert?: {
    type: string;
    summary: string;
    flaggedAt: string;
  };
  carrier?: string;
  trackingNumber?: string;
  internalNotes?: string;
  deliveryZoneSnapshot?: DeliveryZoneSnapshot;
  requiresDeliveryReview?: boolean;
  timeline?: { status: string; time: string; note: string; admin?: string; reason?: string }[];
  items: OrderItemRecord[];
  shippingAddress: {
    recipientName: string;
    phone?: string;
    street: string;
    city: string;
    town?: string;
    district?: string;
    state?: string;
    postalCode: string;
    country: string;
    deliveryInstructions?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export class OrderRepository {
  private filePath = path.join(__dirname, '../../data/orders.json');

  private readFromDisk(): OrderRecord[] {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[OrderRepository] Error reading orders from disk:', err);
    }
    return [];
  }

  private writeToDisk(orders: OrderRecord[]): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(orders, null, 2), 'utf-8');
    } catch (err) {
      console.error('[OrderRepository] Error writing orders to disk:', err);
    }
  }

  async findAll(): Promise<OrderRecord[]> {
    return this.readFromDisk();
  }

  async findById(id: string): Promise<OrderRecord | null> {
    if (!id) return null;
    const orders = this.readFromDisk();
    const cleanId = id.trim().toLowerCase();
    return (
      orders.find(
        o =>
          (o.id && o.id.toLowerCase() === cleanId) ||
          (o.orderNumber && o.orderNumber.toLowerCase() === cleanId)
      ) || null
    );
  }

  async create(orderData: Omit<OrderRecord, 'id' | 'orderNumber' | 'createdAt'> & { orderNumber?: string }): Promise<{ order: OrderRecord; isDuplicate: boolean }> {
    const orders = this.readFromDisk();

    // 1. Idempotency Check: prevent duplicate orders with same idempotencyKey
    if (orderData.idempotencyKey) {
      const existing = orders.find(o => o.idempotencyKey === orderData.idempotencyKey);
      if (existing) {
        return { order: existing, isDuplicate: true };
      }
    }

    // 2. Rapid double-submit guard: If same contact and items submitted within last 15 seconds
    const fifteenSecsAgo = Date.now() - 15000;
    const recentDuplicate = orders.find(o => {
      const orderTime = new Date(o.createdAt).getTime();
      if (orderTime < fifteenSecsAgo) return false;
      const sameContact = (o.customerEmail && o.customerEmail === orderData.customerEmail) ||
                          (o.phone && o.phone === orderData.phone);
      if (!sameContact) return false;
      if (o.items.length !== orderData.items.length) return false;
      return o.items.every((it, idx) => it.variantId === orderData.items[idx]?.variantId && it.quantity === orderData.items[idx]?.quantity);
    });
    if (recentDuplicate) {
      return { order: recentDuplicate, isDuplicate: true };
    }

    // 3. Collision-free unique order number generation
    let orderNumber = orderData.orderNumber || `RXB-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    while (orders.some(o => o.orderNumber === orderNumber)) {
      orderNumber = `RXB-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const isCod =
      orderData.paymentMethod === 'CASH_ON_DELIVERY' ||
      orderData.paymentMethod?.toLowerCase().includes('cash');

    const newOrder: OrderRecord = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      isRestocked: false,
      codFinancialStatus: orderData.codFinancialStatus || (isCod ? 'COLLECTION_PENDING' : undefined),
      codCollectionStatus: orderData.codCollectionStatus || (isCod ? 'COLLECTION_PENDING' : undefined),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    this.writeToDisk(orders);
    return { order: newOrder, isDuplicate: false };
  }

  async updateOrder(id: string, updates: Partial<OrderRecord>): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    Object.assign(order, updates, { updatedAt: new Date().toISOString() });
    this.writeToDisk(orders);
    return order;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    carrier?: string,
    trackingNumber?: string,
    note?: string,
    admin?: string,
    extras?: {
      codCollectionStatus?: string;
      deliveryStatus?: any;
    }
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (!order.courierDetails) order.courierDetails = {};

    if (carrier) {
      order.carrier = carrier;
      order.courierDetails.courierProvider = carrier;
    }
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
      order.courierDetails.waybillNumber = trackingNumber;
    }

    // Auto synchronize delivery and COD statuses based on lifecycle
    const isCod = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod?.toLowerCase().includes('cash');
    if (status === 'SHIPPED') {
      order.courierDetails.deliveryStatus = 'IN_TRANSIT';
    } else if (status === 'READY_TO_SHIP') {
      order.courierDetails.deliveryStatus = 'DISPATCHED';
    } else if (status === 'PACKED') {
      order.courierDetails.deliveryStatus = 'PENDING';
    } else if (status === 'DELIVERED') {
      order.courierDetails.deliveryStatus = 'DELIVERED';
      if (isCod) {
        order.codCollectionStatus = 'COLLECTED_BY_COURIER';
        order.courierDetails.codCollectionStatus = 'COLLECTED_BY_COURIER';
        order.paymentStatus = 'PAID';
        if (!order.codFinancialStatus || order.codFinancialStatus === 'COLLECTION_PENDING') {
          order.codFinancialStatus = 'SETTLEMENT_PENDING';
        }
      }
    } else if (status === 'CANCELLED') {
      order.courierDetails.deliveryStatus = 'FAILED_ATTEMPT';
      if (isCod) {
        order.codCollectionStatus = 'NOT_COLLECTED';
        order.courierDetails.codCollectionStatus = 'NOT_COLLECTED';
      }
    } else if (status === 'RETURNED') {
      order.courierDetails.deliveryStatus = 'RETURNED';
      if (isCod) {
        order.codCollectionStatus = 'COLLECTION_DISPUTED';
        order.courierDetails.codCollectionStatus = 'COLLECTION_DISPUTED';
        order.codFinancialStatus = 'COLLECTION_DISPUTED';
      }
    }


    if (extras?.codCollectionStatus) {
      order.codCollectionStatus = extras.codCollectionStatus;
      order.courierDetails.codCollectionStatus = extras.codCollectionStatus as any;
    }
    if (extras?.deliveryStatus) {
      order.courierDetails.deliveryStatus = extras.deliveryStatus;
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status,
      time: new Date().toISOString(),
      note: note || `Order status updated to ${status}`,
      admin: admin || 'Admin Staff',
    });

    this.writeToDisk(orders);
    return order;
  }

  async assignCourier(
    id: string,
    details: {
      courierProvider: string;
      waybillNumber: string;
      trackingUrl?: string;
      parcelWeight?: number;
      deliveryFee?: number;
      expectedDeliveryDate?: string;
      dispatchDate?: string;
      notes?: string;
    }
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    order.carrier = details.courierProvider;
    order.trackingNumber = details.waybillNumber;
    order.status = 'READY_TO_SHIP';
    order.updatedAt = new Date().toISOString();

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.courierDetails = {
      ...order.courierDetails,
      courierProvider: details.courierProvider,
      waybillNumber: details.waybillNumber,
      trackingUrl: details.trackingUrl,
      parcelWeight: details.parcelWeight,
      deliveryFee: details.deliveryFee || order.shippingFee,
      codAmountToCollect: order.amountToCollect || order.totalAmount,
      dispatchDate: details.dispatchDate || new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: details.expectedDeliveryDate,
      deliveryStatus: 'DISPATCHED',
      codCollectionStatus: order.courierDetails.codCollectionStatus || 'PENDING',
      codRemittanceStatus: order.courierDetails.codRemittanceStatus || 'PENDING_REMITTANCE',
      notes: details.notes || order.courierDetails.notes,
    };

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'READY_TO_SHIP',
      time: new Date().toISOString(),
      note: `Waybill #${details.waybillNumber} issued via ${details.courierProvider}. Package marked ready to ship.`,
    });

    this.writeToDisk(orders);
    return order;
  }

  async recordDeliveryAndPayment(
    id: string,
    details: {
      deliveryDate?: string;
      note?: string;
      collectedAmount?: number;
    }
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    order.status = 'DELIVERED';
    order.paymentStatus = 'PAID';
    order.updatedAt = new Date().toISOString();

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.courierDetails.deliveryStatus = 'DELIVERED';
    order.courierDetails.codCollectionStatus = 'COLLECTED_BY_COURIER';
    order.codCollectionStatus = 'COLLECTED_BY_COURIER';
    if (!order.codFinancialStatus || order.codFinancialStatus === 'COLLECTION_PENDING') {
      order.codFinancialStatus = 'SETTLEMENT_PENDING';
    }
    // CRITICAL: Delivery confirmation does NOT mean the money has reached REXBEBE's bank!
    // It is marked COLLECTED by courier, but stays PENDING_REMITTANCE / SETTLEMENT_PENDING until bank transfer is verified!
    if (!order.courierDetails.codRemittanceStatus || order.courierDetails.codRemittanceStatus === 'PENDING_REMITTANCE') {
      order.courierDetails.codRemittanceStatus = 'PENDING_REMITTANCE';
      order.codSettlementStatus = 'PENDING_REMITTANCE';
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'DELIVERED',
      time: new Date().toISOString(),
      note: details.note || `Delivered to recipient. Customer paid cash collection of LKR ${(details.collectedAmount || order.amountToCollect || order.totalAmount).toLocaleString()} to courier.`,
    });

    this.writeToDisk(orders);
    return order;
  }

  async recordCodRemittance(
    id: string,
    remittance: {
      amountRemitted: number;
      remittanceDate: string;
      bankReference: string;
      isReconciled?: boolean;
      note?: string;
    }
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const settlementStatus: CodSettlementStatus = remittance.isReconciled ? 'RECONCILED' : 'REMITTED';
    order.codSettlementStatus = settlementStatus;
    order.updatedAt = new Date().toISOString();

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.courierDetails.codRemittanceStatus = settlementStatus;
    order.courierDetails.amountRemitted = remittance.amountRemitted;
    order.courierDetails.remittanceDate = remittance.remittanceDate;
    order.courierDetails.bankReference = remittance.bankReference;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: settlementStatus,
      time: new Date().toISOString(),
      note: remittance.note || `Courier remitted LKR ${remittance.amountRemitted.toLocaleString()} to business bank account. Ref: ${remittance.bankReference}`,
    });

    this.writeToDisk(orders);
    return order;
  }

  async addInternalNote(id: string, note: string): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    order.internalNotes = order.internalNotes
      ? `${order.internalNotes}\n[${new Date().toISOString().slice(0, 10)}] ${note}`
      : `[${new Date().toISOString().slice(0, 10)}] ${note}`;
    order.updatedAt = new Date().toISOString();
    this.writeToDisk(orders);
    return order;
  }

  async refundOrder(id: string, reason?: string): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    order.paymentStatus = 'REFUNDED';
    order.status = 'CANCELLED';
    order.updatedAt = new Date().toISOString();
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'REFUNDED',
      time: new Date().toISOString(),
      note: reason ? `Refund processed: ${reason}` : 'Full refund issued via payment gateway',
    });

    this.writeToDisk(orders);
    return order;
  }

  async bookCourierManual(
    id: string,
    payload: ManualCourierBookingPayload,
    admin?: string
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const carrierName = payload.courierProvider || 'Koombiyo Delivery';
    const waybill = (payload.trackingNumber || payload.waybillNumber || '').trim();
    const nowIso = new Date().toISOString();
    const bookingDate = payload.bookingDate || nowIso.slice(0, 10);
    const pickupDate = payload.pickupDate || bookingDate;
    const adminUser = admin || payload.admin || 'Admin Staff';

    order.carrier = carrierName;
    order.trackingNumber = waybill || order.trackingNumber;
    order.status = 'READY_TO_SHIP';
    order.updatedAt = nowIso;

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    const trackingUrl = waybill
      ? `https://koombiyodelivery.lk/track/${encodeURIComponent(waybill)}`
      : order.courierDetails.trackingUrl || '';

    order.courierDetails = {
      ...order.courierDetails,
      courierProvider: carrierName,
      bookingType: 'MANUAL',
      bookingDate,
      pickupDate,
      waybillNumber: waybill || order.courierDetails.waybillNumber,
      trackingUrl,
      parcelWeight: payload.parcelWeight ? Number(payload.parcelWeight) : (order.courierDetails.parcelWeight || 0.5),
      deliveryFee: payload.deliveryFee ? Number(payload.deliveryFee) : (order.courierDetails.deliveryFee || order.shippingFee || 450),
      codAmountToCollect: payload.codAmountToCollect ? Number(payload.codAmountToCollect) : (order.amountToCollect || order.totalAmount),
      expectedDeliveryDate: payload.expectedDeliveryDate || order.courierDetails.expectedDeliveryDate,
      deliveryStatus: 'READY_FOR_PICKUP',
      courierNotes: payload.courierNotes || order.courierDetails.courierNotes,
    };

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'READY_FOR_PICKUP',
      time: nowIso,
      note: `Manual courier booking recorded for ${carrierName}. Tracking: #${waybill || 'Pending'}. Scheduled pickup: ${pickupDate}.${payload.courierNotes ? ` Note: ${payload.courierNotes}` : ''}`,
      admin: adminUser,
    });

    this.writeToDisk(orders);
    return order;
  }

  async updateCourierDeliveryStatus(
    id: string,
    payload: DeliveryStatusUpdatePayload,
    admin?: string
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const nowIso = new Date().toISOString();
    const statusDate = payload.date || nowIso;
    const adminUser = admin || payload.admin || 'Admin Staff';
    const isCod = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod?.toLowerCase().includes('cash');

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    const newDeliveryStatus = payload.deliveryStatus;
    order.courierDetails.deliveryStatus = newDeliveryStatus;
    order.updatedAt = nowIso;

    if (payload.courierNotes) {
      order.courierDetails.courierNotes = payload.courierNotes;
    }

    let timelineNote = `Courier delivery status updated to '${newDeliveryStatus}'.`;

    switch (newDeliveryStatus) {
      case 'READY_FOR_PICKUP':
        order.status = 'READY_TO_SHIP';
        timelineNote = `Parcel packed and marked Ready for Pickup by courier rider.`;
        break;

      case 'PICKED_UP':
        order.status = 'SHIPPED';
        timelineNote = `Parcel collected by ${order.courierDetails.courierProvider || 'Koombiyo Delivery'} dispatch rider.`;
        break;

      case 'IN_TRANSIT':
        order.status = 'SHIPPED';
        timelineNote = `Parcel in transit via ${order.courierDetails.courierProvider || 'Koombiyo'} sorting network.`;
        break;

      case 'OUT_FOR_DELIVERY':
        order.status = 'SHIPPED';
        timelineNote = `Rider out for doorstep delivery and cash collection.`;
        break;

      case 'DELIVERY_ATTEMPT_FAILED': {
        const attemptNum = payload.attemptNumber || (order.courierDetails.deliveryAttempts?.length || 0) + 1;
        const failureReason = payload.reason || 'Customer unavailable at delivery address';
        order.courierDetails.failureReason = failureReason;

        // Keep COD collection pending unless cash collection is confirmed
        if (isCod) {
          order.codCollectionStatus = 'COLLECTION_PENDING';
          order.courierDetails.codCollectionStatus = 'COLLECTION_PENDING';
          if (!order.codFinancialStatus) {
            order.codFinancialStatus = 'COLLECTION_PENDING';
          }
        }

        if (!order.courierDetails.deliveryAttempts) {
          order.courierDetails.deliveryAttempts = [];
        }
        order.courierDetails.deliveryAttempts.push({
          attemptNumber: attemptNum,
          date: statusDate,
          reason: failureReason,
          admin: adminUser,
          notes: payload.courierNotes,
        });

        // Notify/flag unresolved case if >= 2 attempts or customer refused
        if (attemptNum >= 2 || failureReason.toLowerCase().includes('refus')) {
          const alertType = failureReason.toLowerCase().includes('refus') ? 'CUSTOMER_REFUSAL' : 'MULTIPLE_FAILED_ATTEMPTS';
          const alert = {
            type: alertType,
            summary: `Delivery attempt #${attemptNum} failed (${failureReason}). Requires administrator review.`,
            flaggedAt: nowIso,
          };
          order.unresolvedReturnAlert = alert;
          order.courierDetails.unresolvedReturnAlert = alert;
        }

        timelineNote = `Delivery Attempt #${attemptNum} failed. Reason: ${failureReason}. COD collection remains pending.`;
        break;
      }

      case 'DELIVERED':
        order.status = 'DELIVERED';
        order.paymentStatus = 'PAID';
        order.courierDetails.deliveredDate = statusDate;
        order.unresolvedReturnAlert = undefined;
        if (order.courierDetails.unresolvedReturnAlert) {
          order.courierDetails.unresolvedReturnAlert = undefined;
        }
        if (isCod) {
          order.codCollectionStatus = 'COLLECTED_BY_COURIER';
          order.courierDetails.codCollectionStatus = 'COLLECTED_BY_COURIER';
          if (!order.codFinancialStatus || order.codFinancialStatus === 'COLLECTION_PENDING') {
            order.codFinancialStatus = 'SETTLEMENT_PENDING';
          }
        }
        const collected = payload.collectedAmount || order.amountToCollect || order.totalAmount;
        timelineNote = `Parcel successfully delivered to recipient. Doorstep COD cash collected: LKR ${collected.toLocaleString()}. Remittance from courier is pending.`;
        break;

      case 'RETURNING_TO_SENDER': {
        const returnReason = payload.reason || 'Failed delivery attempts - returning to warehouse';
        order.courierDetails.returnReason = returnReason;
        if (payload.verifiedReturnCharge !== undefined) {
          order.verifiedReturnCharges = payload.verifiedReturnCharge;
          order.courierDetails.verifiedReturnCharges = payload.verifiedReturnCharge;
        }
        const alert = {
          type: 'PENDING_WAREHOUSE_INSPECTION',
          summary: `Parcel returning to sender (${returnReason}). Awaiting warehouse reception & physical inspection.`,
          flaggedAt: nowIso,
        };
        order.unresolvedReturnAlert = alert;
        order.courierDetails.unresolvedReturnAlert = alert;
        timelineNote = `Parcel returning to sender. Reason: ${returnReason}.${order.verifiedReturnCharges ? ` Verified return charge: LKR ${order.verifiedReturnCharges}.` : ''}`;
        break;
      }

      case 'RETURNED_TO_SENDER': {
        order.status = 'RETURNED';
        const returnReason = payload.reason || 'Parcel returned to warehouse by courier';
        order.courierDetails.returnReason = returnReason;
        order.courierDetails.returnedDate = statusDate;
        if (payload.verifiedReturnCharge !== undefined) {
          order.verifiedReturnCharges = payload.verifiedReturnCharge;
          order.courierDetails.verifiedReturnCharges = payload.verifiedReturnCharge;
        }
        if (isCod) {
          order.codCollectionStatus = 'COLLECTION_DISPUTED';
          order.courierDetails.codCollectionStatus = 'COLLECTION_DISPUTED';
          order.codFinancialStatus = 'COLLECTION_DISPUTED';
        }
        // Strictly do NOT mark restocked here!
        order.isRestocked = false;
        const alert = {
          type: 'PENDING_WAREHOUSE_INSPECTION',
          summary: `Parcel received back at warehouse. Physical reception & condition inspection required before restocking.`,
          flaggedAt: nowIso,
        };
        order.unresolvedReturnAlert = alert;
        order.courierDetails.unresolvedReturnAlert = alert;
        timelineNote = `Parcel safely received back at REXBEBE warehouse. Reason: ${returnReason}. Physical inspection & restock decision pending.`;
        break;
      }

      case 'NOT_BOOKED':
        order.status = 'CONFIRMED';
        timelineNote = `Courier booking cleared. Marked as Not Booked.`;
        break;

      default:
        break;
    }

    if (payload.reason && !timelineNote.includes(payload.reason)) {
      timelineNote += ` Reason: ${payload.reason}`;
    }
    if (payload.courierNotes) {
      timelineNote += ` Note: ${payload.courierNotes}`;
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: newDeliveryStatus,
      time: nowIso,
      note: timelineNote,
      admin: adminUser,
      reason: payload.reason,
    });

    this.writeToDisk(orders);
    return order;
  }

  async addCourierNote(id: string, note: string, admin?: string): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const nowIso = new Date().toISOString();
    const adminUser = admin || 'Admin Staff';

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.courierDetails.courierNotes = order.courierDetails.courierNotes
      ? `${order.courierDetails.courierNotes}\n[${nowIso.slice(0, 10)} - ${adminUser}]: ${note}`
      : `[${nowIso.slice(0, 10)} - ${adminUser}]: ${note}`;

    order.updatedAt = nowIso;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.courierDetails.deliveryStatus || order.status,
      time: nowIso,
      note: `Courier note added: ${note}`,
      admin: adminUser,
    });

    this.writeToDisk(orders);
    return order;
  }

  async recordCodCollectionEvent(
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
    const orders = this.readFromDisk();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const nowIso = new Date().toISOString();
    const adminUser = payload.admin || 'Admin Staff';
    const collDate = payload.collectionDate || nowIso.slice(0, 10);

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.codCollectionStatus = payload.status;
    order.courierDetails.codCollectionStatus = payload.status;
    order.courierReportedAmount = payload.courierReportedAmount ?? order.amountToCollect ?? order.totalAmount;
    order.collectionDate = collDate;
    order.updatedAt = nowIso;

    if (payload.status === 'COLLECTED_BY_COURIER') {
      order.status = 'DELIVERED';
      order.paymentStatus = 'PAID';
      order.courierDetails.deliveryStatus = 'DELIVERED';
      if (!order.codFinancialStatus || order.codFinancialStatus === 'COLLECTION_PENDING') {
        order.codFinancialStatus = 'SETTLEMENT_PENDING';
      }
    } else if (payload.status === 'COLLECTION_DISPUTED') {
      order.codFinancialStatus = 'COLLECTION_DISPUTED';
      if (payload.disputeReason) {
        order.courierDetails.failureReason = payload.disputeReason;
      }
    } else if (payload.status === 'COLLECTION_PENDING') {
      order.codFinancialStatus = 'COLLECTION_PENDING';
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: payload.status,
      time: nowIso,
      note:
        payload.status === 'COLLECTION_DISPUTED'
          ? `COD Collection Disputed: ${payload.disputeReason || 'Discrepancy reported by courier'}.${payload.notes ? ` Note: ${payload.notes}` : ''}`
          : `COD Collection status recorded as '${payload.status}'. Courier reported: LKR ${(order.courierReportedAmount || 0).toLocaleString()} on ${collDate}.${payload.notes ? ` Note: ${payload.notes}` : ''}`,
      admin: adminUser,
    });

    this.writeToDisk(orders);
    return order;
  }

  async applySettlement(
    id: string,
    settlement: SettlementRecord,
    admin?: string
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const nowIso = new Date().toISOString();
    order.codFinancialStatus = settlement.financialStatus;
    order.settlementRecord = settlement;
    order.updatedAt = nowIso;

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.courierDetails.codRemittanceStatus =
      settlement.financialStatus === 'SETTLED' ? 'RECONCILED' : 'REMITTED';
    order.codSettlementStatus =
      settlement.financialStatus === 'SETTLED' ? 'RECONCILED' : 'REMITTED';
    order.courierDetails.amountRemitted = settlement.actualAmountReceived;
    order.courierDetails.remittanceDate = settlement.settlementDate;
    order.courierDetails.bankReference = settlement.bankReference;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: settlement.financialStatus,
      time: nowIso,
      note: `Authorized settlement confirmed by ${admin || settlement.authorizedBy}. Batch #${settlement.settlementBatchRef}, Bank Ref: ${settlement.bankReference}. Actual funds deposited: LKR ${settlement.actualAmountReceived.toLocaleString()} (Expected Net: LKR ${settlement.expectedRemittance.toLocaleString()}${settlement.discrepancyAmount > 0 ? `, Shortfall: LKR ${settlement.discrepancyAmount.toLocaleString()} - ${settlement.discrepancyReason}` : ''}).`,
      admin: admin || settlement.authorizedBy,
    });

    this.writeToDisk(orders);
    return order;
  }

  async recordDeliveryAttempt(
    id: string,
    payload: RecordDeliveryAttemptPayload,
    admin?: string
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const nowIso = new Date().toISOString();
    const adminUser = admin || payload.admin || 'Logistics Admin';
    const attemptDate = payload.date || nowIso;

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    const currentAttempts = order.courierDetails.deliveryAttempts || [];
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
    order.courierDetails.deliveryAttempts = currentAttempts;
    order.courierDetails.failureReason = failureLabel;
    order.courierDetails.deliveryStatus = 'DELIVERY_ATTEMPT_FAILED';
    order.updatedAt = nowIso;

    // Strict Rule: Keep COD collection pending
    const isCod = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod?.toLowerCase().includes('cash');
    if (isCod) {
      order.codCollectionStatus = 'COLLECTION_PENDING';
      order.courierDetails.codCollectionStatus = 'COLLECTION_PENDING';
      if (!order.codFinancialStatus) {
        order.codFinancialStatus = 'COLLECTION_PENDING';
      }
    }

    // If next action is INITIATE_RETURN, update status to RETURNING_TO_SENDER
    if (attemptRecord.nextAction === 'INITIATE_RETURN') {
      order.courierDetails.deliveryStatus = 'RETURNING_TO_SENDER';
      order.courierDetails.returnReason = `RTS after Attempt #${attemptNumber} failure: ${failureLabel}`;
      const alert = {
        type: 'PENDING_WAREHOUSE_INSPECTION',
        summary: `Parcel returning to sender (${failureLabel}). Return-to-sender initiated.`,
        flaggedAt: nowIso,
      };
      order.unresolvedReturnAlert = alert;
      order.courierDetails.unresolvedReturnAlert = alert;
    } else {
      if (attemptNumber >= 2 || reasonCode === 'CUSTOMER_REFUSED' || !payload.scheduledRetryDate) {
        const alertType = reasonCode === 'CUSTOMER_REFUSED' ? 'CUSTOMER_REFUSAL' : (attemptNumber >= 2 ? 'MULTIPLE_FAILED_ATTEMPTS' : 'NEEDS_RETRY_SCHEDULING');
        const alert = {
          type: alertType,
          summary: `Order #${order.orderNumber} has ${attemptNumber} failed attempt(s) (${failureLabel}). Next action: ${attemptRecord.nextAction || 'Review'}.`,
          flaggedAt: nowIso,
        };
        order.unresolvedReturnAlert = alert;
        order.courierDetails.unresolvedReturnAlert = alert;
      }
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.courierDetails.deliveryStatus,
      time: nowIso,
      note: `Delivery Attempt #${attemptNumber} recorded as Failed. Reason: ${failureLabel}.${payload.notes ? ` Notes: ${payload.notes}.` : ''}${payload.scheduledRetryDate ? ` Next retry scheduled: ${payload.scheduledRetryDate}.` : ''} Action: ${attemptRecord.nextAction}. COD collection pending.`,
      admin: adminUser,
      reason: failureLabel,
    });

    this.writeToDisk(orders);
    return order;
  }

  async initiateReturnToSender(
    id: string,
    payload: InitiateReturnToSenderPayload,
    admin?: string
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const nowIso = new Date().toISOString();
    const adminUser = admin || payload.admin || 'Logistics Admin';
    const returnReason = payload.reason || 'Failed delivery attempts - returning to warehouse';
    const verifiedReturnCharge = payload.verifiedReturnCharge !== undefined ? payload.verifiedReturnCharge : 300;

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.courierDetails.deliveryStatus = 'RETURNING_TO_SENDER';
    order.courierDetails.returnReason = returnReason;
    order.courierDetails.verifiedReturnCharges = verifiedReturnCharge;
    order.verifiedReturnCharges = verifiedReturnCharge;
    order.updatedAt = nowIso;

    const isCod = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod?.toLowerCase().includes('cash');
    if (isCod) {
      if (order.codCollectionStatus !== 'COLLECTED_BY_COURIER') {
        order.codCollectionStatus = 'COLLECTION_PENDING';
        order.courierDetails.codCollectionStatus = 'COLLECTION_PENDING';
      }
    }

    const alert = {
      type: 'PENDING_WAREHOUSE_INSPECTION',
      summary: `Parcel returning to warehouse (${returnReason}). Verified return charge: LKR ${verifiedReturnCharge}. Inspection pending upon arrival.`,
      flaggedAt: nowIso,
    };
    order.unresolvedReturnAlert = alert;
    order.courierDetails.unresolvedReturnAlert = alert;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'RETURNING_TO_SENDER',
      time: nowIso,
      note: `Return-to-Sender (RTS) processed by ${adminUser}. Reason: ${returnReason}. Verified return charge: LKR ${verifiedReturnCharge.toLocaleString()}. Awaiting physical receipt & inspection.`,
      admin: adminUser,
      reason: returnReason,
    });

    this.writeToDisk(orders);
    return order;
  }

  async recordReturnInspection(
    id: string,
    payload: ReturnInspectionPayload,
    inspector?: string
  ): Promise<OrderRecord | null> {
    const orders = this.readFromDisk();
    const order = orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;

    const nowIso = new Date().toISOString();
    const inspectorUser = inspector || payload.inspector || payload.admin || 'Warehouse Quality Control';
    const returnDate = payload.returnDate || nowIso;
    const verifiedReturnCharge = payload.verifiedReturnCharge !== undefined ? payload.verifiedReturnCharge : (order.verifiedReturnCharges ?? 300);

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.status = 'RETURNED';
    order.courierDetails.deliveryStatus = 'RETURNED_TO_SENDER';
    order.courierDetails.returnedDate = returnDate;
    order.courierDetails.verifiedReturnCharges = verifiedReturnCharge;
    order.verifiedReturnCharges = verifiedReturnCharge;
    order.updatedAt = nowIso;

    const isCod = order.paymentMethod === 'CASH_ON_DELIVERY' || order.paymentMethod?.toLowerCase().includes('cash');
    if (isCod) {
      order.codCollectionStatus = 'COLLECTION_DISPUTED';
      order.courierDetails.codCollectionStatus = 'COLLECTION_DISPUTED';
      order.codFinancialStatus = 'COLLECTION_DISPUTED';
    }

    const itemRecords: ItemInspectionRecord[] = (payload.items || []).map((it) => {
      const matched = order.items.find((oi) => oi.variantId === it.variantId);
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
      inspectionId: `INSP-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`,
      returnDate,
      parcelCondition: payload.parcelCondition,
      decision: payload.decision,
      inspector: inspectorUser,
      returnCharges: verifiedReturnCharge,
      courierExpenses: {
        returnFee: verifiedReturnCharge,
        initialDeliveryFee: order.shippingFee || 0,
        totalCourierExpense: (order.shippingFee || 0) + verifiedReturnCharge,
        notes: payload.notes,
      },
      items: itemRecords,
      notes: payload.notes,
      inspectedAt: nowIso,
    };

    order.returnInspection = inspectionRecord;
    order.courierDetails.returnInspection = inspectionRecord;
    order.isRestocked = true;

    order.unresolvedReturnAlert = undefined;
    if (order.courierDetails.unresolvedReturnAlert) {
      order.courierDetails.unresolvedReturnAlert = undefined;
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'RETURNED',
      time: nowIso,
      note: `Warehouse Return Inspection completed by ${inspectorUser}. Parcel Condition: ${payload.parcelCondition}. Restock Decision: ${payload.decision}. Restocked units: ${totalRestockedUnits}. Courier Return Charge: LKR ${verifiedReturnCharge.toLocaleString()}.${payload.notes ? ` Notes: ${payload.notes}` : ''}`,
      admin: inspectorUser,
      reason: payload.decision,
    });

    this.writeToDisk(orders);
    return order;
  }

  async getUnresolvedCases(): Promise<UnresolvedReturnCase[]> {
    const orders = this.readFromDisk();
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

  async getFailedAndReturnOrders(filters?: {
    status?: string;
    reason?: string;
    parcelCondition?: string;
    unresolvedOnly?: boolean;
  }): Promise<OrderRecord[]> {
    const orders = this.readFromDisk();
    return orders.filter((order) => {
      const courier = order.courierDetails;
      const attempts = courier?.deliveryAttempts || [];
      const hasFailedAttempts = attempts.length > 0;
      const isReturnedOrReturning =
        courier?.deliveryStatus === 'RETURNING_TO_SENDER' ||
        courier?.deliveryStatus === 'RETURNED_TO_SENDER' ||
        order.status === 'RETURNED';

      if (!hasFailedAttempts && !isReturnedOrReturning) {
        return false;
      }

      if (filters?.status && courier?.deliveryStatus !== filters.status && order.status !== filters.status) {
        return false;
      }

      if (filters?.reason && courier?.failureReason !== filters.reason && courier?.returnReason !== filters.reason) {
        return false;
      }

      if (filters?.parcelCondition && order.returnInspection?.parcelCondition !== filters.parcelCondition) {
        return false;
      }

      if (filters?.unresolvedOnly && !order.unresolvedReturnAlert && (!isReturnedOrReturning || order.returnInspection)) {
        return false;
      }

      return true;
    });
  }
}

