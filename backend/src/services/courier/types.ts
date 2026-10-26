/**
 * Koombiyo Courier Management Types
 * Extensible interface supporting both Manual Workflow and future Official API integration.
 */

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
  // Legacy backward compatibility aliases:
  | 'PENDING'
  | 'DISPATCHED'
  | 'RETURNED'
  | 'FAILED_ATTEMPT';

export type DeliveryFailureReason =
  | 'CUSTOMER_UNAVAILABLE'
  | 'INCORRECT_ADDRESS'
  | 'PHONE_UNREACHABLE'
  | 'CUSTOMER_REFUSED'
  | 'COURIER_ISSUE'
  | 'OTHER';

export const FAILURE_REASONS_CATALOG: {
  code: DeliveryFailureReason;
  label: string;
  description: string;
  supportsRetry: boolean;
}[] = [
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

export interface DeliveryAttemptRecord {
  attemptNumber: number;
  date: string;
  reason: DeliveryFailureReason | string;
  reasonCode?: DeliveryFailureReason;
  admin?: string;
  notes?: string;
  location?: string;
  nextAction?: 'SCHEDULE_RETRY' | 'INITIATE_RETURN' | 'PENDING_CUSTOMER_CONTACT';
  scheduledRetryDate?: string;
}

export interface RecordDeliveryAttemptPayload {
  reason: DeliveryFailureReason | string;
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
  deliveryStatus: CourierDeliveryStatus;
  failedAttemptsCount: number;
  lastAttemptDate?: string;
  lastFailureReason?: string;
  unresolvedType:
    | 'MULTIPLE_FAILED_ATTEMPTS'
    | 'CUSTOMER_REFUSAL'
    | 'NEEDS_RETRY_SCHEDULING'
    | 'PENDING_WAREHOUSE_INSPECTION'
    | 'STALLED_IN_TRANSIT';
  flaggedAt: string;
  summary: string;
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
  receivedBy?: string;
  verifiedReturnCharge?: number;
}

export interface CourierConfigResponse {
  provider: 'KOOMBIYO';
  displayName: string;
  apiMode: 'MANUAL' | 'API';
  hasCredentials: boolean;
  portalUrl: string;
  trackingUrlPattern: string;
  supportedStatuses: {
    status: CourierDeliveryStatus;
    label: string;
    description: string;
    badgeVariant: 'stone' | 'indigo' | 'blue' | 'cyan' | 'amber' | 'rose' | 'emerald' | 'orange' | 'red';
  }[];
  activeCarriers: {
    id: string;
    name: string;
    code: string;
    trackingUrlPattern: string;
    portalUrl: string;
  }[];
}
