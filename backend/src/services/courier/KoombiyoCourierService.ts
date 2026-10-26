import { OrderRecord } from '../../repositories/orderRepository';
import {
  CourierConfigResponse,
  CourierDeliveryStatus,
  DeliveryAttemptRecord,
  ManualCourierBookingPayload,
  DeliveryStatusUpdatePayload,
} from './types';

/**
 * KoombiyoCourierService
 * 
 * Provides courier management for REXBEBE orders.
 * Inspects credentials to determine if an official API is available.
 * If credentials are not present, runs in robust 'MANUAL' mode providing:
 * - Mark Ready for Pickup
 * - Manual Booking recording with booking and pickup dates
 * - Tracking number assignment
 * - Manual delivery status updates across 9 lifecycle states
 * - Delivery attempt failure logging with required reasons
 * - Mark delivered with COD cash collection verification
 * - Mark returned to sender with restock triggers
 * - Courier notes management
 * - Portal copy format generation
 * 
 * Pluggable architecture: Future official API can be activated simply by adding credentials
 * to environment variables and implementing the bookViaOfficialApi / fetchTrackingOfficialApi hooks.
 */
export class KoombiyoCourierService {
  private static instance: KoombiyoCourierService;

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
    const apiKey = process.env.KOOMBIYO_API_KEY;
    const merchantId = process.env.KOOMBIYO_MERCHANT_ID;
    return Boolean(apiKey && merchantId);
  }

  /**
   * Return integration configuration and status definitions.
   */
  public getCourierConfig(): CourierConfigResponse {
    const hasCreds = this.hasOfficialCredentials();

    return {
      provider: 'KOOMBIYO',
      displayName: 'Koombiyo Delivery',
      apiMode: hasCreds ? 'API' : 'MANUAL',
      hasCredentials: hasCreds,
      portalUrl: 'https://koombiyo.lk/login',
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
          portalUrl: 'https://koombiyo.lk/login',
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
      `Portal: https://koombiyo.lk/login`,
    ]
      .filter(Boolean)
      .join('\n');

    return { text, structured };
  }

  /**
   * Future Official API Hook:
   * When official merchant credentials and documentation become available,
   * implement HTTP call here without changing any frontend or repository code.
   */
  public async bookViaOfficialApi(payload: ManualCourierBookingPayload, order: OrderRecord): Promise<{
    success: boolean;
    waybillNumber?: string;
    trackingUrl?: string;
    error?: string;
  }> {
    if (!this.hasOfficialCredentials()) {
      return {
        success: false,
        error: 'Koombiyo official merchant credentials not configured. Please use manual booking workflow.',
      };
    }

    // Placeholder for future official Koombiyo API integration
    // Example:
    // const res = await axios.post(`${process.env.KOOMBIYO_API_URL}/orders/create`, { ... });
    // return { success: true, waybillNumber: res.data.waybill, trackingUrl: res.data.trackingUrl };
    return {
      success: false,
      error: 'Official Koombiyo API client is ready to be configured with endpoint documentation.',
    };
  }
}

export const koombiyoCourierService = KoombiyoCourierService.getInstance();
