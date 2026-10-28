import { OrderRecord, OrderRepository } from '../../repositories/orderRepository';
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

export interface OfficialDispatchPayload {
  waybillId?: string;
  notes?: string;
  admin?: string;
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
  private orderRepo: OrderRepository;

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
        {
          id: 'courier-promptx',
          name: 'PromptX Courier',
          code: 'PROMPTX',
          trackingUrlPattern: 'https://promptx.lk/track?waybill={trackingNumber}',
          portalUrl: 'https://portal.promptx.lk',
        },
        {
          id: 'courier-domex',
          name: 'Domex Express',
          code: 'DOMEX',
          trackingUrlPattern: 'https://domex.lk/tracking?id={trackingNumber}',
          portalUrl: 'https://domex.lk/login',
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
      .filter((wb) => !usedWaybills.has(wb));
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

    // Duplicate shipment guard
    if (existing.courierDetails?.waybillNumber && existing.status !== 'CANCELLED') {
      throw new Error(`Order #${existing.orderNumber} is already dispatched with Waybill #${existing.courierDetails.waybillNumber}. Duplicate dispatch prevented.`);
    }

    const adminUser = payload.admin || 'Admin Staff';
    const districtName = existing.shippingAddress?.district || 'Colombo';
    const cityName = existing.shippingAddress?.city || 'Colombo 03';

    // 1. Resolve address using official Koombiyo endpoints (districts, cities, delivery_rates)
    const resolved = await koombiyoApiClient.resolveAddress(districtName, cityName);
    if (!resolved) {
      throw new Error(`Unable to map customer delivery address ("${cityName}, ${districtName}") to official Koombiyo delivery locations. Please verify the address with the customer.`);
    }

    // 2. Obtain an active allocated waybill
    let waybillToUse = (payload.waybillId || '').trim();
    if (!waybillToUse) {
      const available = await this.getAvailableWaybills();
      if (available.length === 0) {
        throw new Error('No active Koombiyo waybills available on your account. Please request new waybills from Koombiyo portal or API.');
      }
      waybillToUse = available[0];
    }

    // 3. Prepare payload for /add_order
    const isCod =
      existing.paymentMethod === 'CASH_ON_DELIVERY' ||
      existing.paymentMethod?.toLowerCase().includes('cash') ||
      existing.paymentMethod?.toLowerCase().includes('cod');

    const codAmountToCollect = isCod ? (existing.amountToCollect ?? existing.totalAmount) : 0;
    const productVal = existing.totalAmount;
    const itemsSummary = existing.items?.map((i) => `${i.title} (${i.quantity}x)`).join(', ') || 'REXBEBE Babywear';

    const addOrderPayload: KoombiyoAddOrderPayload = {
      waybill_id: waybillToUse,
      order_number: existing.orderNumber,
      customer_name: existing.shippingAddress?.recipientName || existing.customerName,
      customer_phone: (existing.shippingAddress?.phone || existing.phone || '').replace(/[^0-9]/g, ''),
      customer_address: `${existing.shippingAddress?.street || ''}, ${existing.shippingAddress?.city || ''}`.trim(),
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

    // 4. Submit to Koombiyo API
    await koombiyoApiClient.addOrder(addOrderPayload);

    // 5. Update database order record atomically
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
    };

    if (!existing.timeline) existing.timeline = [];
    existing.timeline.push({
      status: 'READY_FOR_PICKUP',
      time: nowIso,
      note: `Official Koombiyo Order Dispatched. Waybill #${waybillToUse} assigned. Destination: ${resolved.cityName}, ${resolved.districtName} (Rate: LKR ${resolved.deliveryCharge}). Awaiting rider pickup.`,
      admin: adminUser,
    });

    const updated = await this.orderRepo.updateOrder(existing.id, existing);

    return {
      order: updated || existing,
      waybillId: waybillToUse,
      trackingUrl,
      resolvedAddress: resolved,
    };
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
   */
  public async handleWebhook(payload: KoombiyoWebhookPayload): Promise<{
    success: boolean;
    orderNumber?: string;
    newDeliveryStatus: CourierDeliveryStatus;
    message: string;
  }> {
    const waybillId = String(payload.waybill_id || '').trim();
    if (!waybillId) {
      throw new Error('Missing waybill_id in webhook payload');
    }

    const allOrders = await this.orderRepo.findAll();
    const order = allOrders.find(
      (o) =>
        (o.trackingNumber && o.trackingNumber.trim() === waybillId) ||
        (o.courierDetails?.waybillNumber && o.courierDetails.waybillNumber.trim() === waybillId)
    );

    const mappedStatus = this.mapKoombiyoStatus(payload.status, payload.status_id);

    if (!order) {
      // Order may be outside this database or created directly on portal
      console.warn(`[Koombiyo Webhook] Received status "${payload.status}" for unlinked waybill #${waybillId}`);
      return {
        success: true,
        newDeliveryStatus: mappedStatus,
        message: `Waybill #${waybillId} status recorded, but not linked to a local REXBEBE order record.`,
      };
    }

    const nowIso = new Date().toISOString();
    const statusDate = payload.status_date || nowIso;
    const isCod =
      order.paymentMethod === 'CASH_ON_DELIVERY' ||
      order.paymentMethod?.toLowerCase().includes('cash') ||
      order.paymentMethod?.toLowerCase().includes('cod');

    if (!order.courierDetails) {
      order.courierDetails = {};
    }

    order.courierDetails.deliveryStatus = mappedStatus;
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
        order.courierDetails.deliveredDate = statusDate;
        if (isCod) {
          // Parcel delivered and cash collected at doorstep by the courier rider.
          // IMPORTANT: Cash is in courier custody and has NOT yet been remitted to merchant's bank account.
          // Do not mark paymentStatus as PAID or COD as settled until actual bank remittance is verified!
          order.codCollectionStatus = 'COLLECTED_BY_COURIER';
          order.courierDetails.codCollectionStatus = 'COLLECTED_BY_COURIER';
          order.codSettlementStatus = 'PENDING_REMITTANCE';
          order.courierDetails.codRemittanceStatus = 'PENDING_REMITTANCE';
          order.codFinancialStatus = 'SETTLEMENT_PENDING';
          if (order.paymentStatus !== 'PAID') {
            order.paymentStatus = 'COD_PENDING';
          }
        } else {
          // Prepaid orders (Credit Card, Online Gateways) are confirmed paid
          order.paymentStatus = 'PAID';
        }
        break;

      case 'RETURNING_TO_SENDER':
        order.courierDetails.returnReason = payload.reason || 'Returned by courier via webhook';
        break;

      case 'RETURNED_TO_SENDER':
        order.status = 'RETURNED';
        order.courierDetails.returnedDate = statusDate;
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
          date: statusDate,
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
    };
  }
}

export const koombiyoCourierService = KoombiyoCourierService.getInstance();
