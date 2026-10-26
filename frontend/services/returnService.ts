import { fetchApi } from './api';
import { OrderRecord } from './orderService';

export type DeliveryFailureReason =
  | 'CUSTOMER_UNAVAILABLE'
  | 'INCORRECT_ADDRESS'
  | 'PHONE_UNREACHABLE'
  | 'CUSTOMER_REFUSED'
  | 'COURIER_ISSUE'
  | 'OTHER';

export interface FailureReasonOption {
  code: DeliveryFailureReason;
  label: string;
  description: string;
  supportsRetry: boolean;
}

export const DEFAULT_FAILURE_REASONS: FailureReasonOption[] = [
  {
    code: 'CUSTOMER_UNAVAILABLE',
    label: 'Customer unavailable',
    description: 'Customer not present at the delivery address at the time of doorstep visit.',
    supportsRetry: true,
  },
  {
    code: 'INCORRECT_ADDRESS',
    label: 'Incorrect address',
    description: 'Street address, landmark, town, or postal zone could not be located.',
    supportsRetry: true,
  },
  {
    code: 'PHONE_UNREACHABLE',
    label: 'Customer phone unreachable',
    description: 'Rider attempted calling customer phone multiple times but line was busy or unreachable.',
    supportsRetry: true,
  },
  {
    code: 'CUSTOMER_REFUSED',
    label: 'Customer refused the parcel',
    description: 'Recipient explicitly refused to accept delivery or refused COD payment at doorstep.',
    supportsRetry: false,
  },
  {
    code: 'COURIER_ISSUE',
    label: 'Courier delivery issue',
    description: 'Rider vehicle breakdown, weather delay, regional delivery network delay, or curfew.',
    supportsRetry: true,
  },
  {
    code: 'OTHER',
    label: 'Other documented reasons',
    description: 'Exceptional reason documented in notes by logistics coordinator.',
    supportsRetry: true,
  },
];

export type ParcelCondition =
  | 'INTACT_SEALED'
  | 'PACKAGING_OPENED'
  | 'DAMAGED_TRANSIT'
  | 'MISSING_ITEMS';

export type RestockDecision =
  | 'RESTOCK_APPROVED'
  | 'RESTOCK_REJECTED'
  | 'PARTIAL_RESTOCK';

export interface ItemInspectionRecord {
  itemId: string;
  variantId: string;
  title?: string;
  color?: string;
  size?: string;
  quantityReturned: number;
  quantityRestocked: number;
  condition: 'INTACT' | 'DAMAGED' | 'MISSING';
  restockApproved: boolean;
  notes?: string;
}

export interface ReturnInspectionRecord {
  inspectionId: string;
  returnDate: string;
  parcelCondition: ParcelCondition;
  decision: RestockDecision;
  inspector: string;
  returnCharges: number;
  courierExpenses?: {
    returnFee: number;
    initialDeliveryFee?: number;
    totalCourierExpense: number;
    notes?: string;
  };
  items: ItemInspectionRecord[];
  notes?: string;
  inspectedAt: string;
}

export interface RecordDeliveryAttemptPayload {
  reason: string;
  reasonCode?: DeliveryFailureReason;
  date?: string;
  admin?: string;
  notes?: string;
  nextAction?: 'SCHEDULE_RETRY' | 'INITIATE_RETURN' | 'PENDING_CUSTOMER_CONTACT';
  scheduledRetryDate?: string;
}

export interface InitiateReturnToSenderPayload {
  reason: string;
  verifiedReturnCharge?: number;
  admin?: string;
  notes?: string;
  date?: string;
}

export interface ReturnInspectionPayload {
  returnDate: string;
  parcelCondition: ParcelCondition;
  decision: RestockDecision;
  inspector?: string;
  admin?: string;
  verifiedReturnCharge?: number;
  notes?: string;
  items: {
    variantId: string;
    condition: 'INTACT' | 'DAMAGED' | 'MISSING';
    quantityReturned: number;
    quantityToRestock: number;
    restockApproved: boolean;
    notes?: string;
  }[];
}

export interface UnresolvedReturnCase {
  orderId: string;
  orderNumber: string;
  customerName: string;
  phone?: string;
  totalAmount: number;
  deliveryStatus: string;
  failedAttemptsCount: number;
  lastAttemptDate?: string;
  lastFailureReason?: string;
  unresolvedType:
    | 'MULTIPLE_FAILED_ATTEMPTS'
    | 'CUSTOMER_REFUSAL'
    | 'NEEDS_RETRY_SCHEDULING'
    | 'PENDING_WAREHOUSE_INSPECTION'
    | 'STALLED_IN_TRANSIT'
    | string;
  flaggedAt: string;
  summary: string;
}

export const returnService = {
  async getAllReturns(params?: {
    status?: string;
    reason?: string;
    parcelCondition?: string;
    unresolvedOnly?: boolean;
  }): Promise<OrderRecord[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.reason) qs.set('reason', params.reason);
    if (params?.parcelCondition) qs.set('parcelCondition', params.parcelCondition);
    if (params?.unresolvedOnly) qs.set('unresolvedOnly', 'true');
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchApi<OrderRecord[]>(`/orders/returns/all${query}`);
  },

  async getUnresolvedCases(): Promise<UnresolvedReturnCase[]> {
    return fetchApi<UnresolvedReturnCase[]>('/orders/returns/unresolved');
  },

  async getFailureReasons(): Promise<FailureReasonOption[]> {
    try {
      return await fetchApi<FailureReasonOption[]>('/orders/returns/failure-reasons');
    } catch {
      return DEFAULT_FAILURE_REASONS;
    }
  },

  async recordDeliveryAttempt(
    orderId: string,
    payload: RecordDeliveryAttemptPayload
  ): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${orderId}/delivery-attempt`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async initiateReturnToSender(
    orderId: string,
    payload: InitiateReturnToSenderPayload
  ): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${orderId}/return-to-sender`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async processReturnInspection(
    orderId: string,
    payload: ReturnInspectionPayload
  ): Promise<OrderRecord> {
    return fetchApi<OrderRecord>(`/orders/${orderId}/return-inspection`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
