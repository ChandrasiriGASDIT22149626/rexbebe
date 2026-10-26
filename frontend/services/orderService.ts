import { fetchApi } from './api';

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

export type CourierDeliveryStatus =
  | 'NOT_BOOKED'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ATTEMPT_FAILED'
  | 'DELIVERED'
  | 'RETURNING_TO_SENDER'
  | 'RETURNED_TO_SENDER'
  | 'PENDING'
  | 'DISPATCHED'
  | 'RETURNED'
  | 'FAILED_ATTEMPT';

export interface DeliveryAttemptRecord {
  attemptNumber: number;
  date: string;
  reason: string;
  reasonCode?: string;
  admin?: string;
  notes?: string;
  nextAction?: string;
  scheduledRetryDate?: string;
}

export interface ManualCourierBookingPayload {
  courierProvider?: string;
  waybillNumber?: string;
  trackingNumber?: string;
  bookingDate?: string;
  pickupDate?: string;
  expectedDeliveryDate?: string;
  parcelWeight?: number;
  deliveryFee?: number;
  codAmountToCollect?: number;
  courierNotes?: string;
  admin?: string;
}

export interface DeliveryStatusUpdatePayload {
  deliveryStatus: CourierDeliveryStatus;
  date?: string;
  admin?: string;
  reason?: string;
  attemptNumber?: number;
  courierNotes?: string;
  collectedAmount?: number;
}

export type { CodFinancialStatus, CourierDeductionItem, SettlementRecord } from './settlementService';
import type { CodFinancialStatus, SettlementRecord } from './settlementService';

export interface CourierDetails {
  courierProvider?: string;
  bookingType?: 'MANUAL' | 'API';
  bookingDate?: string;
  pickupDate?: string;
  waybillNumber?: string;
  trackingUrl?: string;
  parcelWeight?: number;
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
  returnInspection?: import('./returnService').ReturnInspectionRecord;
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
  codCollectionStatus?:
    | 'COLLECTION_PENDING'
    | 'COLLECTED_BY_COURIER'
    | 'COLLECTED'
    | 'NOT_COLLECTED'
    | 'COLLECTION_DISPUTED'
    | 'PENDING'
    | string;
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
  carrier?: string;
  trackingNumber?: string;
  internalNotes?: string;
  timeline?: { status: string; time: string; note: string; admin?: string; reason?: string }[];
  items: {
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
  }[];
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
  courierDetails?: CourierDetails;
  returnInspection?: import('./returnService').ReturnInspectionRecord;
  verifiedReturnCharges?: number;
  unresolvedReturnAlert?: {
    type: string;
    summary: string;
    flaggedAt: string;
  };
  deliveryZoneSnapshot?: import('./deliveryService').DeliveryZoneSnapshot;
  requiresDeliveryReview?: boolean;
  isRestocked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CodReportSummary {
  totalCodOrders: number;
  totalAmountToCollect: number;
  amountCollectedFromCustomers: number;
  amountRemittedToBusiness: number;
  pendingRemittanceAmount: number;
  courierDeliveryCharges: number;
  returnCharges: number;
  outstandingDiscrepancies: number;
  deliveredCount: number;
  pendingRemittanceCount: number;
  remittedCount: number;
  returnedCount: number;
}

export interface CodReportResponse {
  summary: CodReportSummary;
  orders: OrderRecord[];
}

export const orderService = {
  async createOrder(orderPayload: any): Promise<OrderRecord> {
    return fetchApi<OrderRecord>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  },

  async getOrderById(id: string): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}`);
  },

  async getAllOrdersAdmin(params?: {
    status?: string;
    paymentStatus?: string;
    settlementStatus?: string;
    search?: string;
    country?: string;
    courier?: string;
    paymentMethod?: string;
    codCollectionStatus?: string;
    district?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OrderRecord[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params?.settlementStatus) query.set('settlementStatus', params.settlementStatus);
    if (params?.search) query.set('search', params.search);
    if (params?.country) query.set('country', params.country);
    if (params?.courier) query.set('courier', params.courier);
    if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    if (params?.codCollectionStatus) query.set('codCollectionStatus', params.codCollectionStatus);
    if (params?.district) query.set('district', params.district);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi<OrderRecord[]>(`/orders${qs}`);
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    carrier?: string,
    trackingNumber?: string,
    note?: string,
    admin?: string,
    reason?: string,
    extras?: { codCollectionStatus?: string; deliveryStatus?: string }
  ): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, carrier, trackingNumber, note, admin, reason, ...extras }),
    });
  },

  async confirmCodOrder(id: string, note?: string): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/confirm-cod`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },

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
  ): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/assign-courier`, {
      method: 'PATCH',
      body: JSON.stringify(details),
    });
  },

  async recordDeliveryAndPayment(
    id: string,
    details: {
      deliveryDate?: string;
      note?: string;
      collectedAmount?: number;
    }
  ): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/record-delivery`, {
      method: 'PATCH',
      body: JSON.stringify(details),
    });
  },

  async recordCodRemittance(
    id: string,
    remittance: {
      amountRemitted: number;
      remittanceDate: string;
      bankReference: string;
      isReconciled?: boolean;
      note?: string;
    }
  ): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/record-remittance`, {
      method: 'PATCH',
      body: JSON.stringify(remittance),
    });
  },

  async getCodReports(params?: {
    startDate?: string;
    endDate?: string;
    courier?: string;
    orderStatus?: string;
    paymentStatus?: string;
    settlementStatus?: string;
  }): Promise<CodReportResponse> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.courier) query.set('courier', params.courier);
    if (params?.orderStatus) query.set('orderStatus', params.orderStatus);
    if (params?.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params?.settlementStatus) query.set('settlementStatus', params.settlementStatus);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi<CodReportResponse>(`/orders/reports/cod${qs}`);
  },

  async addOrderNote(id: string, note: string): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async refundOrder(id: string, reason?: string): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getCourierConfig(): Promise<any> {
    return fetchApi('/orders/courier/config');
  },

  async getKoombiyoPortalPayload(id: string): Promise<{ text: string; structured: Record<string, any> }> {
    return fetchApi(`/orders/${id}/courier/portal-payload`);
  },

  async bookCourierManual(id: string, payload: ManualCourierBookingPayload): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/courier/book`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCourierDeliveryStatus(id: string, payload: DeliveryStatusUpdatePayload): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/courier/delivery-status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async addCourierNote(id: string, note: string, admin?: string): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/courier/notes`, {
      method: 'POST',
      body: JSON.stringify({ note, admin }),
    });
  },

  async recordDeliveryAttempt(id: string, payload: any): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/delivery-attempt`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async initiateReturnToSender(id: string, payload: any): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/return-to-sender`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async recordReturnInspection(id: string, payload: any): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${id}/return-inspection`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getUnresolvedReturnCases(): Promise<any[]> {
    return fetchApi<any[]>('/orders/returns/unresolved');
  },

  async getCodAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    zoneId?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (filters?.startDate) query.set('startDate', filters.startDate);
    if (filters?.endDate) query.set('endDate', filters.endDate);
    if (filters?.search) query.set('search', filters.search);
    if (filters?.zoneId) query.set('zoneId', filters.zoneId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/orders/reports/cod-analytics${qs}`);
  },

  async getNotificationStatus(): Promise<any> {
    return fetchApi('/notifications/status');
  },

  async getRecentNotifications(limit = 50): Promise<any[]> {
    return fetchApi<any[]>(`/notifications/recent?limit=${limit}`);
  },
};

