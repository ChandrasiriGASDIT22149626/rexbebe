import { OrderRecord, OrderRepository } from '../../repositories/orderRepository';
import { postgresWaybillRepository } from '../../repositories/postgres/PostgresWaybillRepository';
import {
  CourierConfigResponse,
  CourierDeliveryStatus,
  DeliveryAttemptRecord,
  ManualCourierBookingPayload,
  DeliveryStatusUpdatePayload,
} from './types';
import {
  koombiyoApiClient,
  KoombiyoAddOrderPayload,
  KoombiyoWebhookPayload,
  ResolvedKoombiyoAddress,
} from './KoombiyoApiClient';
import { withWaybillLock } from '../../utils/waybillLock';

export interface OfficialDispatchPayload {
  waybillId?: string;
  notes?: string;
  admin?: string;
}

// In-memory set tracking waybills currently reserved / in-flight during API calls
const inFlightWaybills = new Set<string>();

/**
 * Reusable Sri Lankan phone number normalizer and validator for courier delivery.
 *
 * Accepted inputs:
 * - Local 10-digit: "0771234567" -> "0771234567"
 * - International with +: "+94771234567" -> "0771234567"
 * - International without +: "94771234567" -> "0771234567"
 * - 9-digit without leading 0: "771234567" -> "0771234567"
 * - Formatted with spaces/hyphens: "077 123 4567" -> "0771234567"
 *
 * Throws a clear Error for invalid numbers (e.g., non-numeric, too short/long, invalid prefix).
 */
export function normalizeSriLankanPhone(rawPhone: string | undefined | null): string {
  if (!rawPhone || typeof rawPhone !== 'string' || !rawPhone.trim()) {
    throw new Error('Customer phone number is required for courier delivery.');
  }

  // Strip all non-digit characters (+, spaces, hyphens, brackets)
  let digits = rawPhone.replace(/\D/g, '');

  // Strip international country code prefix 94
  if (digits.startsWith('94')) {
    digits = digits.slice(2);
  }

  // If 9 digits provided (missing leading 0, e.g. 771234567), prepend 0
  if (digits.length === 9) {
    digits = '0' + digits;
  }

  // Sri Lankan phone numbers must be exactly 10 digits starting with 0 followed by 1-9 (e.g., 07XXXXXXXX)
  if (!/^0[1-9]\d{8}$/.test(digits)) {
    // Do not expose the raw input in the error message for privacy
    throw new Error('Invalid Sri Lankan phone number format. Must be a valid 10-digit number (e.g., 07XXXXXXXX or +947XXXXXXXX).');
  }

  return digits;
}

/**
 * KoombiyoCourierService
 * 
 * Provides courier management for REXBEBE orders.
 * Automatically switches between official Koombiyo Client API mode and manual mode.
 * When official credentials (KOOMBIYO_API_KEY & KOOMBIYO_API_PASSWORD) are present:
 * - Real-time active waybill fetching and validation
 * - Dynamic district & city mapping without guessing IDs
 * - Order submission via POST /add_order
 * - Real-time tracking retrieval via POST /order_details and /order_timeline
 * - POD barcode PDF document streaming via POST /single_pod
 * - Automated Webhook ingestion with status synchronization
 */
export class KoombiyoCourierService {
  private static instance: KoombiyoCourierService;
  public orderRepo: OrderRepository;

  private constructor() {
    this.orderRepo = new OrderRepository();
  }

  public static getInstance(): KoombiyoCourierService {
    if (!KoombiyoCourierService.instance) {
      KoombiyoCourierService.instance = new KoombiyoCourierService();
    }
    return KoombiyoCourierService.instance;
  }

  /**
   * Inspect environment variables to check if official Koombiyo credentials are provided.
   */
  public hasOfficialCredentials(): boolean {
    return koombiyoApiClient.hasCredentials();
  }

  /**
   * Return integration configuration and status definitions.
   */
  public async getCourierConfigAsync(): Promise<CourierConfigResponse & {
    activeWaybillsCount?: number;
    apiBaseUrl?: string;
    hasActiveWaybills?: boolean;
  }> {
    const hasCreds = this.hasOfficialCredentials();
    let waybillsCount = 0;

    if (hasCreds) {
      try {
        const waybillsData = await koombiyoApiClient.getActiveWaybills();
        waybillsCount = waybillsData.count;
      } catch (err) {
        console.warn('[Koombiyo] Failed to fetch active waybills count:', (err as any).message);
      }
    }

    return {
      provider: 'KOOMBIYO',
      displayName: 'Koombiyo Delivery',
      apiMode: hasCreds ? 'API' : 'MANUAL',
      hasCredentials: hasCreds,
      portalUrl: 'https://client.koombiyodelivery.lk/',
      trackingUrlPattern: 'https://koombiyodelivery.lk/track/{trackingNumber}',
      activeWaybillsCount: waybillsCount,
      hasActiveWaybills: waybillsCount > 0,
      supportedStatuses: [
        {
          status: 'NOT_BOOKED',
          label: 'Not Booked',
          description: 'Package has not yet been booked with Koombiyo.',
          badgeVariant: 'stone',
        },
        {
          status: 'READY_FOR_PICKUP',
          label: 'Ready for Pickup',
          description: 'Package is packed and awaiting courier pickup by Koombiyo dispatch rider.',
          badgeVariant: 'indigo',
        },
        {
          status: 'PICKED_UP',
          label: 'Picked Up',
          description: 'Koombiyo courier driver has collected parcel from REXBEBE warehouse.',
          badgeVariant: 'blue',
        },
        {
          status: 'IN_TRANSIT',
          label: 'In Transit',
          description: 'Parcel is travelling between Koombiyo central sorting hubs.',
          badgeVariant: 'cyan',
        },
        {
          status: 'OUT_FOR_DELIVERY',
          label: 'Out for Delivery',
          description: 'Rider is en route to customer doorstep for delivery and COD collection.',
          badgeVariant: 'amber',
        },
        {
          status: 'DELIVERY_ATTEMPT_FAILED',
          label: 'Delivery Attempt Failed',
          description: 'Courier attempted delivery but could not complete it (requires failure reason).',
          badgeVariant: 'rose',
        },
        {
          status: 'DELIVERED',
          label: 'Delivered',
          description: 'Package delivered to recipient and COD cash collected.',
          badgeVariant: 'emerald',
        },
        {
          status: 'RETURNING_TO_SENDER',
          label: 'Returning to Sender',
          description: 'Parcel could not be delivered and is being routed back to REXBEBE warehouse.',
          badgeVariant: 'orange',
        },
        {
          status: 'RETURNED_TO_SENDER',
          label: 'Returned to Sender',
          description: 'Parcel safely received back at REXBEBE warehouse; stock restocked.',
          badgeVariant: 'red',
        },
      ],
      activeCarriers: [
        {
          id: 'courier-koombiyo',
          name: 'Koombiyo Delivery',
          code: 'KOOMBIYO',
          trackingUrlPattern: 'https://koombiyodelivery.lk/track/{trackingNumber}',
          portalUrl: 'https://client.koombiyodelivery.lk/',
        },
      ],
    };
  }

  /**
   * Synchronous config for existing backwards compatibility.
   */
  public getCourierConfig(): CourierConfigResponse {
    const hasCreds = this.hasOfficialCredentials();

    return {
      provider: 'KOOMBIYO',
      displayName: 'Koombiyo Delivery',
      apiMode: hasCreds ? 'API' : 'MANUAL',
      hasCredentials: hasCreds,
      portalUrl: 'https://client.koombiyodelivery.lk/',
      trackingUrlPattern: 'https://koombiyodelivery.lk/track/{trackingNumber}',
      supportedStatuses: [
        {
          status: 'NOT_BOOKED',
          label: 'Not Booked',
          description: 'Package has not yet been booked with Koombiyo.',
          badgeVariant: 'stone',
        },
        {
          status: 'READY_FOR_PICKUP',
          label: 'Ready for Pickup',
          description: 'Package is packed and awaiting courier pickup by Koombiyo dispatch rider.',
          badgeVariant: 'indigo',
        },
        {
          status: 'PICKED_UP',
          label: 'Picked Up',
          description: 'Koombiyo courier driver has collected parcel from REXBEBE warehouse.',
          badgeVariant: 'blue',
        },
        {
          status: 'IN_TRANSIT',
          label: 'In Transit',
          description: 'Parcel is travelling between Koombiyo central sorting hubs.',
          badgeVariant: 'cyan',
        },
        {
          status: 'OUT_FOR_DELIVERY',
          label: 'Out for Delivery',
          description: 'Rider is en route to customer doorstep for delivery and COD collection.',
          badgeVariant: 'amber',
        },
        {
          status: 'DELIVERY_ATTEMPT_FAILED',
          label: 'Delivery Attempt Failed',
          description: 'Courier attempted delivery but could not complete it (requires failure reason).',
          badgeVariant: 'rose',
        },
        {
          status: 'DELIVERED',
          label: 'Delivered',
          description: 'Package delivered to recipient and COD cash collected.',
          badgeVariant: 'emerald',
        },
        {
          status: 'RETURNING_TO_SENDER',
          label: 'Returning to Sender',
          description: 'Parcel could not be delivered and is being routed back to REXBEBE warehouse.',
          badgeVariant: 'orange',
        },
        {
          status: 'RETURNED_TO_SENDER',
          label: 'Returned to Sender',
          description: 'Parcel safely received back at REXBEBE warehouse; stock restocked.',
          badgeVariant: 'red',
        },
      ],
      activeCarriers: [
        {
          id: 'courier-koombiyo',
          name: 'Koombiyo Delivery',
          code: 'KOOMBIYO',
          trackingUrlPattern: 'https://koombiyodelivery.lk/track/{trackingNumber}',
          portalUrl: 'https://client.koombiyodelivery.lk/',
        },
      ],
    };
  }

  /**
   * Build the official Koombiyo tracking URL for a given waybill / tracking number.
   */
  public generateTrackingUrl(trackingNumber: string): string {
    if (!trackingNumber) return '';
    return `https://koombiyodelivery.lk/track/${encodeURIComponent(trackingNumber.trim())}`;
  }

  /**
   * Generate formatted clipboard payload for Koombiyo Merchant Portal.
   */
  public generatePortalPayload(order: OrderRecord): { text: string; structured: Record<string, any> } {
    const itemsDescription = order.items
      ?.map((i) => `${i.title} (${i.size ? i.size + ', ' : ''}${i.quantity}x)`)
      .join(', ') || 'Babywear items';

    const recipient = order.shippingAddress?.recipientName || order.customerName;
    const phone = order.shippingAddress?.phone || order.phone || '';
    const street = order.shippingAddress?.street || '';
    const city = order.shippingAddress?.city || '';
    const district = order.shippingAddress?.district || 'Colombo';
    const postalCode = order.shippingAddress?.postalCode || '';
    const codAmount = order.amountToCollect ?? order.totalAmount;
    const weight = order.courierDetails?.parcelWeight || 0.5;

    const structured = {
      orderReference: order.orderNumber,
      recipientName: recipient,
      phone,
      address: `${street}, ${city}`,
      city,
      district,
      postalCode,
      codAmount,
      weightKg: weight,
      remarks: order.shippingAddress?.deliveryInstructions || 'Doorstep COD collection by REXBEBE',
      items: itemsDescription,
    };

    const text = [
      `--- KOOMBIYO MERCHANT PORTAL BOOKING SLIP ---`,
      `Merchant: REXBEBE Luxury Babywear`,
      `Order Ref: ${order.orderNumber}`,
      `Recipient: ${recipient}`,
      `Phone: ${phone}`,
      `Delivery Address: ${street}, ${city}`,
      `District: ${district} ${postalCode ? `(${postalCode})` : ''}`,
      `Payment Type: CASH ON DELIVERY (COD)`,
      `COD Amount to Collect: LKR ${codAmount.toLocaleString()}`,
      `Weight: ${weight} kg`,
      `Parcel Contents: ${itemsDescription}`,
      order.shippingAddress?.deliveryInstructions
        ? `Customer Instructions: ${order.shippingAddress.deliveryInstructions}`
        : '',
      `Portal: https://client.koombiyodelivery.lk/`,
    ]
      .filter(Boolean)
      .join('\n');

    return { text, structured };
  }

  // =========================================================================
  // OFFICIAL API ORDER DISPATCH
  // =========================================================================

  /**
   * Find available, unassigned active waybills for dispatch.
   * Checks database records and active in-flight allocations.
   */
  public async getAvailableWaybills(): Promise<string[]> {
    if (!this.hasOfficialCredentials()) {
      return [];
    }

    const [activeRes, allOrders] = await Promise.all([
      koombiyoApiClient.getActiveWaybills(),
      this.orderRepo.findAll(),
    ]);

    const usedWaybills = new Set<string>();
    for (const ord of allOrders) {
      if (ord.trackingNumber) usedWaybills.add(String(ord.trackingNumber).trim());
      if (ord.courierDetails?.waybillNumber) usedWaybills.add(String(ord.courierDetails.waybillNumber).trim());
    }

    return (activeRes.waybills || [])
      .map((w) => String(w.waybill_id).trim())
      .filter((wb) => !usedWaybills.has(wb) && !inFlightWaybills.has(wb));
  }

  /**
   * Dispatch an order to Koombiyo using the official POST /add_order endpoint.
   * Safeguards against duplicate shipments, verifies address mapping, assigns waybill,
   * updates order status atomically, and commits to database.
   */
  public async dispatchViaOfficialApi(
    orderId: string,
    payload: OfficialDispatchPayload = {}
  ): Promise<{
    order: OrderRecord;
    waybillId: string;
    trackingUrl: string;
    resolvedAddress: ResolvedKoombiyoAddress;
  }> {
    const existing = await this.orderRepo.findById(orderId);
    if (!existing) {
      throw new Error(`Order ${orderId} not found`);
    }

    // 1. Duplicate shipment guard
    if (existing.courierDetails?.waybillNumber && existing.status !== 'CANCELLED' && existing.courierDetails?.deliveryStatus !== 'DISPATCH_UNCERTAIN') {
      throw new Error(`Order #${existing.orderNumber} is already dispatched with Waybill #${existing.courierDetails.waybillNumber}. Duplicate dispatch prevented.`);
    }

    // Guard against pending uncertain dispatch
    if (existing.courierDetails?.dispatchUncertain) {
      throw new Error(
        `Order #${existing.orderNumber} has an uncertain dispatch outcome with Waybill #${existing.courierDetails.waybillNumber} from a previous request timeout. Please verify with the Koombiyo portal or run reconciliation before attempting to re-dispatch.`
      );
    }

    // 2. Payment Method Guard: Official Koombiyo automated API dispatch only supports COD orders
    const isCod =
      existing.paymentMethod === 'CASH_ON_DELIVERY' ||
      existing.paymentMethod?.toLowerCase().includes('cash') ||
      existing.paymentMethod?.toLowerCase().includes('cod');

    if (!isCod) {
      throw new Error(
        `Automated dispatch via Koombiyo API is restricted to Cash on Delivery (COD) orders (LKR 100 – 500,000) per official Koombiyo API specifications. Order #${existing.orderNumber} is prepaid via ${existing.paymentMethod}. Please book prepaid deliveries manually via the Koombiyo Merchant Portal, or contact Koombiyo support to verify prepaid API specifications.`
      );
    }

    const adminUser = payload.admin || 'Admin Staff';

    // 3. Customer Information Validation
    const customerName = (existing.shippingAddress?.recipientName || existing.customerName || '').trim();
    if (!customerName) {
      throw new Error('Customer recipient name is required for Koombiyo dispatch.');
    }

    const rawPhone = existing.shippingAddress?.phone || existing.phone;
    if (!rawPhone || !rawPhone.trim()) {
      throw new Error('Customer phone number is required for courier delivery.');
    }
    const normalizedPhone = normalizeSriLankanPhone(rawPhone);

    const streetAddress = (existing.shippingAddress?.street || '').trim();
    const districtName = (existing.shippingAddress?.district || '').trim();
    const cityName = (existing.shippingAddress?.city || '').trim();

    if (!streetAddress) {
      throw new Error('Customer delivery street address is required for Koombiyo dispatch.');
    }
    if (!districtName || !cityName) {
      throw new Error('Customer delivery district and city are required for Koombiyo dispatch.');
    }

    // 4. Validate COD limits as per Koombiyo documentation: LKR 100 to 500,000
    const codAmountToCollect = existing.amountToCollect ?? existing.totalAmount;
    if (codAmountToCollect < 100 || codAmountToCollect > 500000) {
      throw new Error(`Invalid COD amount: LKR ${codAmountToCollect}. Koombiyo limits are Minimum LKR 100, Maximum LKR 500,000.`);
    }

    // 5. Resolve address using official Koombiyo endpoints (districts, cities, delivery_rates)
    const resolved = await koombiyoApiClient.resolveAddress(districtName, cityName);
    if (!resolved || resolved.confidence === 'APPROXIMATE' || resolved.confidence === 'UNMAPPED') {
      throw new Error(
        `Unable to confidently match customer delivery location ("${cityName}", "${districtName}") to an official Koombiyo city (Match Confidence: ${resolved?.confidence || 'UNMAPPED'}). Automated dispatch is blocked to prevent routing errors. Please verify the destination city with the customer and select a confirmed Koombiyo city before dispatching.`
      );
    }

    // 6. Obtain and reserve an active allocated waybill under concurrency lock
    let waybillToUse = (payload.waybillId || '').trim();

    await withWaybillLock(async () => {
      // Re-check order status inside mutex to prevent race condition on the same order
      const freshOrder = await this.orderRepo.findById(orderId);
      if (freshOrder?.courierDetails?.waybillNumber && freshOrder.status !== 'CANCELLED' && freshOrder.courierDetails?.deliveryStatus !== 'DISPATCH_UNCERTAIN') {
        throw new Error(`Order #${freshOrder.orderNumber} is already dispatched with Waybill #${freshOrder.courierDetails.waybillNumber}. Duplicate dispatch prevented.`);
      }

      if (!waybillToUse) {
        if (process.env.USE_POSTGRES === 'true') {
          // Database-level locking: SELECT ... FOR UPDATE SKIP LOCKED
          waybillToUse = await postgresWaybillRepository.reserveNextAvailableWaybill('KOOMBIYO');
        } else {
          const available = await this.getAvailableWaybills();
          if (available.length === 0) {
            throw new Error('No active Koombiyo waybills available on your account. Please request new waybills from Koombiyo portal or API.');
          }
          waybillToUse = available[0];
        }
      } else {
        // Verify requested waybill is not already allocated or in flight
        const allOrders = await this.orderRepo.findAll();
        const inUse = allOrders.some(
          (o) =>
            o.id !== orderId &&
            ((o.trackingNumber && o.trackingNumber.trim() === waybillToUse) ||
              (o.courierDetails?.waybillNumber && o.courierDetails.waybillNumber.trim() === waybillToUse))
        ) || inFlightWaybills.has(waybillToUse);

        if (inUse) {
          throw new Error(`Waybill #${waybillToUse} is already assigned or in-use by another order.`);
        }
      }

      // Reserve waybill in flight
      inFlightWaybills.add(waybillToUse);
    });

    // 7. Prepare payload for /add_order
    const productVal = existing.totalAmount;
    const itemsSummary = existing.items?.map((i) => `${i.title} (${i.quantity}x)`).join(', ') || 'REXBEBE Babywear';

    const addOrderPayload: KoombiyoAddOrderPayload = {
      waybill_id: waybillToUse,
      order_number: existing.orderNumber,
      customer_name: customerName,
      customer_phone: normalizedPhone,
      customer_address: `${streetAddress}, ${cityName}`.trim(),
      customer_city_id: resolved.cityId,
      customer_city_name: resolved.cityName,
      customer_district_id: resolved.districtId,
      customer_postal_code: existing.shippingAddress?.postalCode || resolved.postalCode || '00300',
      description: itemsSummary,
      cod_amount: String(codAmountToCollect),
      product_value: String(productVal),
      special_note: [
        existing.shippingAddress?.deliveryInstructions,
        payload.notes,
      ].filter(Boolean).join(' | '),
    };

    // 8. Submit to Koombiyo API outside database locks
    try {
      await koombiyoApiClient.addOrder(addOrderPayload);

      // 9. Update database order record atomically
      const nowIso = new Date().toISOString();
      const trackingUrl = this.generateTrackingUrl(waybillToUse);

      existing.carrier = 'Koombiyo Delivery';
      existing.trackingNumber = waybillToUse;
      existing.status = 'READY_TO_SHIP';
      existing.updatedAt = nowIso;

      if (!existing.courierDetails) {
        existing.courierDetails = {};
      }

      existing.courierDetails = {
        ...existing.courierDetails,
        courierProvider: 'Koombiyo Delivery',
        bookingType: 'API',
        waybillNumber: waybillToUse,
        trackingUrl,
        deliveryStatus: 'READY_FOR_PICKUP',
        bookingDate: nowIso.slice(0, 10),
        pickupDate: nowIso.slice(0, 10),
        dispatchDate: nowIso.slice(0, 10),
        deliveryFee: resolved.deliveryCharge,
        codAmountToCollect: isCod ? codAmountToCollect : 0,
        codCollectionStatus: isCod ? 'COLLECTION_PENDING' : 'PENDING',
        codRemittanceStatus: 'PENDING_REMITTANCE',
        courierNotes: payload.notes || existing.courierDetails.courierNotes,
        dispatchUncertain: false,
      };

      if (!existing.timeline) existing.timeline = [];
      existing.timeline.push({
        status: 'READY_FOR_PICKUP',
        time: nowIso,
        note: `Official Koombiyo Order Dispatched. Waybill #${waybillToUse} assigned. Destination: ${resolved.cityName}, ${resolved.districtName} (Rate: LKR ${resolved.deliveryCharge}). Awaiting rider pickup.`,
        admin: adminUser,
      });

      const updated = await this.orderRepo.updateOrder(existing.id, existing);

      if (process.env.USE_POSTGRES === 'true') {
        await postgresWaybillRepository.assignWaybill(waybillToUse, existing.id, existing.orderNumber);
      }

      return {
        order: updated || existing,
        waybillId: waybillToUse,
        trackingUrl,
        resolvedAddress: resolved,
      };
    } catch (apiErr: any) {
      const isTimeout =
        apiErr.message?.includes('timed out') ||
        apiErr.name === 'TimeoutError' ||
        apiErr.name === 'AbortError';

      if (isTimeout) {
        // Handle uncertain API outcome safely: retain waybill to prevent duplicate dispatch
        const nowIso = new Date().toISOString();
        existing.courierDetails = {
          ...existing.courierDetails,
          courierProvider: 'Koombiyo Delivery',
          bookingType: 'API',
          waybillNumber: waybillToUse,
          deliveryStatus: 'DISPATCH_UNCERTAIN' as any,
          dispatchUncertain: true,
          uncertainReason: apiErr.message,
          dispatchAttemptedAt: nowIso,
        };
        if (!existing.timeline) existing.timeline = [];
        existing.timeline.push({
          status: 'DISPATCH_UNCERTAIN',
          time: nowIso,
          note: `Koombiyo API request timed out after 15 seconds for Waybill #${waybillToUse}. Dispatch status is UNCERTAIN. Order is retained with this waybill to prevent duplicate dispatch. Please verify in Koombiyo Merchant Portal or reconcile tracking before retrying.`,
          admin: adminUser,
        });
        await this.orderRepo.updateOrder(existing.id, existing);

        if (process.env.USE_POSTGRES === 'true') {
          await postgresWaybillRepository.markWaybillUncertain(waybillToUse, existing.id, existing.orderNumber, apiErr.message);
        }

        throw new Error(
          `Koombiyo API request timed out for Waybill #${waybillToUse}. Dispatch status is UNCERTAIN. To prevent duplicate shipments, the waybill has been retained on this order. Please verify if the order appears in the Koombiyo Merchant Portal or run live tracking reconciliation.`
        );
      } else {
        if (process.env.USE_POSTGRES === 'true') {
          await postgresWaybillRepository.releaseReservation(waybillToUse);
        }
        // Definite failure: re-throw error
        throw apiErr;
      }
    } finally {
      // Clean up in-flight reservation
      inFlightWaybills.delete(waybillToUse);
    }
  }

  /**
   * Reconcile an order whose dispatch outcome was uncertain due to API timeout.
   * Checks Koombiyo API for the waybill. If order exists on Koombiyo, marks order as dispatched.
   * If order does not exist (404), clears waybill so it can be re-dispatched safely.
   */
  public async reconcileUncertainDispatch(
    orderId: string,
    admin: string = 'Admin Staff',
    forceClear: boolean = false
  ): Promise<{ reconciled: boolean; status: string; message: string }> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const waybill = order.courierDetails?.waybillNumber || order.trackingNumber;
    if (!waybill) {
      return { reconciled: false, status: 'NO_WAYBILL', message: 'Order has no waybill to reconcile.' };
    }

    try {
      const details = await koombiyoApiClient.getOrderDetails(waybill);
      const nowIso = new Date().toISOString();

      if (details && details.orderDetails) {
        // Order was confirmed on Koombiyo
        order.courierDetails = {
          ...order.courierDetails,
          deliveryStatus: 'READY_FOR_PICKUP',
          dispatchUncertain: false,
          uncertainReason: undefined,
        };
        order.status = 'READY_TO_SHIP';
        order.timeline = order.timeline || [];
        order.timeline.push({
          status: 'READY_FOR_PICKUP',
          time: nowIso,
          note: `Reconciliation confirmed: Order was accepted by Koombiyo (Waybill #${waybill}). Marked Ready to Ship.`,
          admin,
        });
        await this.orderRepo.updateOrder(order.id, order);
        return {
          reconciled: true,
          status: 'CONFIRMED_DISPATCHED',
          message: `Reconciliation successful: Waybill #${waybill} was confirmed on Koombiyo. Order marked Ready to Ship.`,
        };
      } else {
        // Order was not found on Koombiyo
        if (!forceClear) {
          // DEFENSIVE GUARD: Avoid blindly wiping waybill due to possible asynchronous ingestion delays on Koombiyo
          order.timeline = order.timeline || [];
          order.timeline.push({
            status: 'DISPATCH_UNCERTAIN',
            time: nowIso,
            note: `Reconciliation query: Waybill #${waybill} was NOT found on Koombiyo API. Status remains DISPATCH_UNCERTAIN to prevent duplicate dispatches in case of ingestion delays. Verify in Koombiyo Merchant Portal before force-clearing.`,
            admin,
          });
          await this.orderRepo.updateOrder(order.id, order);

          return {
            reconciled: false,
            status: 'STILL_UNCERTAIN',
            message: `Waybill #${waybill} was not found on Koombiyo API. It may still be processing. Order remains marked DISPATCH_UNCERTAIN to prevent duplicate dispatches. Please check the Koombiyo Merchant Portal manually. If confirmed absent, pass forceClear: true to clear the waybill for re-dispatch.`,
          };
        }

        // Admin confirmed absent with forceClear
        order.courierDetails = {
          ...order.courierDetails,
          waybillNumber: undefined,
          deliveryStatus: 'NOT_BOOKED',
          dispatchUncertain: false,
          uncertainReason: undefined,
        };
        order.trackingNumber = undefined;
        order.timeline = order.timeline || [];
        order.timeline.push({
          status: 'NOT_BOOKED',
          time: nowIso,
          note: `Manual reconciliation override: Waybill #${waybill} confirmed absent and force-cleared by ${admin}. Order reset for safe re-dispatch.`,
          admin,
        });
        await this.orderRepo.updateOrder(order.id, order);
        return {
          reconciled: true,
          status: 'CLEARED_FOR_REDISPATCH',
          message: `Manual override complete: Waybill #${waybill} confirmed absent and force-cleared. Order cleared for safe re-dispatch.`,
        };
      }
    } catch (err: any) {
      throw new Error(`Reconciliation query failed: ${err.message}`);
    }
  }

  // =========================================================================
  // LIVE TRACKING & POD
  // =========================================================================

  /**
   * Fetch live order tracking details and external chronological event log directly from Koombiyo API.
   */
  public async getLiveTracking(waybillId: string | number): Promise<{
    waybillId: string;
    trackingUrl: string;
    orderDetails: any;
    customerDetails: any;
    branchDetails: any;
    timeline: any[];
  }> {
    const cleanWb = String(waybillId).trim();
    const [details, timeline] = await Promise.all([
      koombiyoApiClient.getOrderDetails(cleanWb).catch(() => null),
      koombiyoApiClient.getOrderTimeline(cleanWb).catch(() => []),
    ]);

    return {
      waybillId: cleanWb,
      trackingUrl: this.generateTrackingUrl(cleanWb),
      orderDetails: details?.orderDetails || null,
      customerDetails: details?.customerDetails || null,
      branchDetails: details?.branchDetails || null,
      timeline: timeline || [],
    };
  }

  /**
   * Generate Proof of Delivery (POD) document binary PDF.
   */
  public async generatePodPdf(waybillId: string | number, format: 'POD' | 'A6' | 'THERMAL' | 'DOT' = 'A6'): Promise<{
    buffer: Buffer;
    contentType: string;
    filename: string;
  }> {
    const cleanWb = String(waybillId).trim();
    const { buffer, contentType } = await koombiyoApiClient.generateSinglePod(cleanWb, format);
    return {
      buffer,
      contentType,
      filename: `koombiyo_pod_${cleanWb}_${format.toLowerCase()}.pdf`,
    };
  }

  // =========================================================================
  // WEBHOOK HANDLER (Koombiyo -> REXBEBE)
  // =========================================================================

  /**
   * Map Koombiyo delivery status string or ID to internal CourierDeliveryStatus.
   */
  public mapKoombiyoStatus(status: string | number, statusId?: string | number): CourierDeliveryStatus {
    const clean = String(status || '').trim().toLowerCase();
    const sId = String(statusId ?? '').trim();

    if (sId === '5' || clean.includes('deliver') || clean === 'received by customer') {
      return 'DELIVERED';
    }
    if (sId === '9' || clean.includes('returning') || clean.includes('pending return') || clean.includes('return in transit')) {
      return 'RETURNING_TO_SENDER';
    }
    if (sId === '15' || clean.includes('returned') || clean.includes('client received')) {
      return 'RETURNED_TO_SENDER';
    }
    if (clean.includes('out for delivery') || clean.includes('with rider')) {
      return 'OUT_FOR_DELIVERY';
    }
    if (clean.includes('in transit') || clean.includes('dispatch') || clean.includes('sorting')) {
      return 'IN_TRANSIT';
    }
    if (clean.includes('picked up') || clean.includes('collected')) {
      return 'PICKED_UP';
    }
    if (clean.includes('attempt') || clean.includes('reschedule') || clean.includes('failed') || clean.includes('unreachable')) {
      return 'DELIVERY_ATTEMPT_FAILED';
    }
    if (sId === '1' || clean.includes('pending') || clean.includes('ready')) {
      return 'READY_FOR_PICKUP';
    }

    return 'IN_TRANSIT';
  }

  /**
   * Process inbound webhook status notification sent from Koombiyo servers.
   * Enforces payload validation, idempotency/duplicate event protection, and lifecycle synchronization.
   */
  public async handleWebhook(payload: KoombiyoWebhookPayload): Promise<{
    success: boolean;
    orderNumber?: string;
    newDeliveryStatus: CourierDeliveryStatus;
    message: string;
    isDuplicate?: boolean;
  }> {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid webhook payload structure');
    }

    const waybillId = String(payload.waybill_id || '').trim();
    if (!waybillId) {
      throw new Error('Missing waybill_id in webhook payload');
    }

    if (!payload.status && payload.status_id === undefined) {
      throw new Error('Missing status or status_id in webhook payload');
    }

    const allOrders = await this.orderRepo.findAll();
    const order = allOrders.find(
      (o) =>
        (o.trackingNumber && o.trackingNumber.trim() === waybillId) ||
        (o.courierDetails?.waybillNumber && o.courierDetails.waybillNumber.trim() === waybillId)
    );

    const mappedStatus = this.mapKoombiyoStatus(payload.status, payload.status_id);

    if (!order) {
      // Order is unlinked to any local order: refuse to modify any database record!
      console.warn(`[Koombiyo Webhook] Received status "${payload.status}" for unlinked waybill #${waybillId}. No order updated.`);
      return {
        success: false,
        newDeliveryStatus: mappedStatus,
        message: `Waybill #${waybillId} is not linked to any local REXBEBE order record. No order was updated.`,
      };
    }

    // Event deduplication using provider fields: waybill_id + status + status_date
    const statusDate = payload.status_date ? String(payload.status_date).trim() : '';
    const isAlreadyCurrentStatus = order.courierDetails?.deliveryStatus === mappedStatus;
    const lastProcessedDate = (order.courierDetails as any)?.lastWebhookStatusDate || '';

    const isDuplicateEvent =
      isAlreadyCurrentStatus &&
      ((statusDate && statusDate === lastProcessedDate) ||
        (!statusDate && (order.timeline || []).some((t) => t.note?.includes(`Status changed to "${payload.status}"`))));

    if (isDuplicateEvent) {
      return {
        success: true,
        orderNumber: order.orderNumber,
        newDeliveryStatus: mappedStatus,
        message: `Webhook event for waybill #${waybillId} with status "${payload.status}" was already processed (duplicate ignored).`,
        isDuplicate: true,
      };
    }

    const nowIso = new Date().toISOString();
    const effectiveStatusDate = statusDate || nowIso;
    const isCod =
      order.paymentMethod === 'CASH_ON_DELIVERY' ||
      order.paymentMethod?.toLowerCase().includes('cash') ||
      order.paymentMethod?.toLowerCase().includes('cod');

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.courierDetails.deliveryStatus = mappedStatus;
    (order.courierDetails as any).lastWebhookStatusDate = effectiveStatusDate;
    (order.courierDetails as any).lastWebhookProcessedAt = nowIso;

    if (payload.weight) {
      order.courierDetails.parcelWeight = Number(payload.weight);
    }
    if (payload.del_charge) {
      order.courierDetails.deliveryFee = Number(payload.del_charge);
    }

    let timelineNote = `Koombiyo Webhook: Status changed to "${payload.status}" (ID: ${payload.status_id || 'N/A'}).`;
    if (payload.reason) {
      timelineNote += ` Note: ${payload.reason}`;
    }

    // Lifecycle synchronization
    switch (mappedStatus) {
      case 'DELIVERED':
        order.status = 'DELIVERED';
        order.courierDetails.deliveredDate = effectiveStatusDate;
        if (isCod) {
          // Cash collected at doorstep by the courier rider.
          // Note: Cash is in courier custody and not yet remitted to bank account.
          order.codCollectionStatus = 'COLLECTED_BY_COURIER';
          order.courierDetails.codCollectionStatus = 'COLLECTED_BY_COURIER';
          order.codSettlementStatus = 'PENDING_REMITTANCE';
          order.courierDetails.codRemittanceStatus = 'PENDING_REMITTANCE';
          order.codFinancialStatus = 'SETTLEMENT_PENDING';
          if (order.paymentStatus !== 'PAID') {
            order.paymentStatus = 'COD_PENDING';
          }
        } else {
          // Prepaid orders confirmed paid
          order.paymentStatus = 'PAID';
        }
        break;

      case 'RETURNING_TO_SENDER':
        order.courierDetails.returnReason = payload.reason || 'Returned by courier via webhook';
        break;

      case 'RETURNED_TO_SENDER':
        order.status = 'RETURNED';
        order.courierDetails.returnedDate = effectiveStatusDate;
        order.courierDetails.returnReason = payload.reason || 'Returned to warehouse via webhook';
        if (isCod) {
          order.codCollectionStatus = 'COLLECTION_DISPUTED';
          order.courierDetails.codCollectionStatus = 'COLLECTION_DISPUTED';
          order.codFinancialStatus = 'COLLECTION_DISPUTED';
        }
        break;

      case 'DELIVERY_ATTEMPT_FAILED': {
        const attempts = order.courierDetails.deliveryAttempts || [];
        attempts.push({
          attemptNumber: attempts.length + 1,
          date: effectiveStatusDate,
          reason: payload.reason || 'Attempt failed reported by Koombiyo webhook',
          admin: 'Koombiyo Automated Webhook',
          notes: payload.reason,
        });
        order.courierDetails.deliveryAttempts = attempts;
        order.courierDetails.failureReason = payload.reason || 'Delivery attempt failed';
        break;
      }

      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        order.status = 'SHIPPED';
        break;

      default:
        break;
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: mappedStatus,
      time: nowIso,
      note: timelineNote,
      admin: 'Koombiyo Courier Webhook',
      reason: payload.reason,
    });

    order.updatedAt = nowIso;
    await this.orderRepo.updateOrder(order.id, order);

    return {
      success: true,
      orderNumber: order.orderNumber,
      newDeliveryStatus: mappedStatus,
      message: `Order #${order.orderNumber} successfully updated to "${mappedStatus}".`,
      isDuplicate: false,
    };
  }
}

export const koombiyoCourierService = KoombiyoCourierService.getInstance();
