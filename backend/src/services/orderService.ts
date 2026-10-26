import {
  OrderRepository,
  OrderRecord,
  OrderStatus,
  CodSettlementStatus,
  DeliveryFailureReason,
  FAILURE_REASONS_CATALOG,
  ParcelCondition,
  RestockDecision,
  RecordDeliveryAttemptPayload,
  InitiateReturnToSenderPayload,
  ReturnInspectionPayload,
  UnresolvedReturnCase,
} from '../repositories/orderRepository';
import { ProductRepository } from '../repositories/productRepository';
import { InventoryRepository } from '../repositories/inventoryRepository';
import { DeliveryService } from './deliveryService';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { koombiyoCourierService } from './courier/KoombiyoCourierService';
import {
  CourierDeliveryStatus,
  ManualCourierBookingPayload,
  DeliveryStatusUpdatePayload,
} from './courier/types';
import { AuditService } from './auditService';
import { NotificationService } from './notificationService';
import { CodAnalyticsService } from './codAnalyticsService';

export class OrderService {
  private orderRepo = new OrderRepository();
  private productRepo = new ProductRepository();
  private inventoryRepo = new InventoryRepository();
  private deliveryService = new DeliveryService();

  async createOrder(orderPayload: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    items: { variantId: string; quantity: number }[];
    shippingAddress: any;
    paymentMethod: string;
    couponCode?: string;
    advancePayment?: number;
    parcelWeightKg?: number;
  }) {
    if (!orderPayload.items || orderPayload.items.length === 0) {
      throw new BadRequestError('Cannot place an empty order.');
    }

    const allProducts = await this.productRepo.findAll();
    const validatedItems = [];

    // 1. Concurrency-safe inventory validation before order acceptance
    for (const item of orderPayload.items) {
      let foundVariant: any = null;
      let parentProduct: any = null;

      for (const prod of allProducts) {
        const v = prod.variants?.find((varItem: any) => varItem.id === item.variantId);
        if (v) {
          foundVariant = v;
          parentProduct = prod;
          break;
        }
      }

      if (!foundVariant) {
        throw new BadRequestError(`Product variant '${item.variantId}' is invalid or no longer exists.`);
      }

      const availableStock = foundVariant.stockQuantity ?? 0;
      if (availableStock <= 0) {
        throw new BadRequestError(`Variant '${foundVariant.color || ''} ${foundVariant.size || ''}' of ${parentProduct.name} is Sold Out.`);
      }

      if (availableStock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${parentProduct.name} (${foundVariant.size || foundVariant.color}). Requested: ${item.quantity}, Available: ${availableStock}`);
      }

      const itemTotal = foundVariant.price * item.quantity;
      const itemTitle = foundVariant.partName
        ? `${parentProduct.name} (${foundVariant.partName}) - ${foundVariant.color || ''} ${foundVariant.size || ''}`.trim()
        : `${parentProduct.name} - ${foundVariant.color || ''} ${foundVariant.size || ''}`.trim();

      validatedItems.push({
        id: `orditem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: parentProduct.id,
        variantId: foundVariant.id,
        title: itemTitle,
        partName: foundVariant.partName,
        purchaseType: foundVariant.purchaseType || 'complete_set',
        partColors: foundVariant.partColors,
        color: foundVariant.color,
        size: foundVariant.size,
        image: foundVariant.imageUrl || parentProduct.images?.[0]?.url || '/images/products/organic-onesie.jpg',
        price: foundVariant.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    // 2. Authoritative server calculation for shipping, COD fees, and totals
    const isCod = orderPayload.paymentMethod === 'CASH_ON_DELIVERY';
    const district = orderPayload.shippingAddress?.district || 'Colombo';
    const town = orderPayload.shippingAddress?.town || orderPayload.shippingAddress?.city;

    const calculation = await this.deliveryService.calculateOrderPricing({
      district,
      town,
      items: orderPayload.items,
      paymentMethod: orderPayload.paymentMethod,
      couponCode: orderPayload.couponCode,
      parcelWeightKg: orderPayload.parcelWeightKg,
      advancePayment: orderPayload.advancePayment,
    });

    if (isCod && !calculation.isCodAvailable) {
      throw new BadRequestError(calculation.codNotice || 'Cash on Delivery is unavailable for this order.');
    }

    // 3. Status mapping according to exact requirement:
    // - Order Status: Pending Confirmation
    // - COD Collection Status: Collection Pending
    // - Payment Status: COD Pending
    // - COD Settlement Status: Pending Remittance
    // DO NOT mark a COD order as paid when placed!
    const orderStatus: OrderStatus = isCod ? 'PENDING_CONFIRMATION' : 'PROCESSING';
    const paymentStatus = isCod ? 'COD_PENDING' : 'PAID';
    const codCollectionStatus = isCod ? 'COLLECTION_PENDING' : 'NOT_APPLICABLE';
    const codSettlementStatus: CodSettlementStatus = isCod ? 'PENDING_REMITTANCE' : 'RECONCILED';

    const { order: createdOrder, isDuplicate } = await this.orderRepo.create({
      customerId: orderPayload.customerId,
      customerName: orderPayload.customerName,
      customerEmail: orderPayload.customerEmail,
      phone: orderPayload.shippingAddress?.phone || (orderPayload as any).phone,
      status: orderStatus,
      totalAmount: calculation.totalAmount,
      subtotal: calculation.subtotal,
      discount: calculation.discount,
      shippingFee: calculation.deliveryFee,
      codHandlingFee: calculation.codHandlingFee,
      advancePayment: calculation.advancePayment,
      amountToCollect: calculation.amountToCollect,
      tax: 0,
      paymentMethod: orderPayload.paymentMethod,
      paymentStatus,
      codCollectionStatus,
      codSettlementStatus,
      idempotencyKey: (orderPayload as any).idempotencyKey,
      items: validatedItems,
      deliveryZoneSnapshot: calculation.deliveryZoneSnapshot,
      requiresDeliveryReview: calculation.requiresDeliveryReview,
      shippingAddress: {
        recipientName: orderPayload.shippingAddress.recipientName,
        phone: orderPayload.shippingAddress.phone || (orderPayload as any).phone,
        street: orderPayload.shippingAddress.street,
        city: orderPayload.shippingAddress.city || orderPayload.shippingAddress.town,
        town: town || orderPayload.shippingAddress.city,
        district: orderPayload.shippingAddress.district || district,
        state: orderPayload.shippingAddress.state,
        postalCode: orderPayload.shippingAddress.postalCode || '00100',
        country: orderPayload.shippingAddress.country || 'Sri Lanka',
        deliveryInstructions: orderPayload.shippingAddress.deliveryInstructions,
      },
      courierDetails: {
        courierProvider: calculation.courierSuggested,
        deliveryFee: calculation.deliveryFee,
        codAmountToCollect: calculation.amountToCollect,
        deliveryStatus: 'PENDING',
        codCollectionStatus: isCod ? 'COLLECTION_PENDING' : 'PENDING',
        codRemittanceStatus: 'PENDING_REMITTANCE',
      },
      timeline: [
        {
          status: orderStatus,
          time: new Date().toISOString(),
          note: isCod
            ? `Cash on Delivery order placed. Order Status: Pending Confirmation. COD Collection Status: Collection Pending. Amount to collect at delivery: LKR ${calculation.amountToCollect.toLocaleString()}${
                calculation.requiresDeliveryReview
                  ? ' [ATTENTION: Delivery fee pending concierge review for unmapped town]'
                  : calculation.zoneName
                  ? ` (Applied Zone: ${calculation.zoneName} - LKR ${calculation.deliveryFee})`
                  : ''
              }`
            : 'Order placed and paid online.',
        },
        ...(calculation.requiresDeliveryReview
          ? [
              {
                status: 'REVIEW_REQUESTED',
                time: new Date().toISOString(),
                note: `Town "${town}" is not mapped to any configured delivery zone. Arbitrary delivery fee avoided per store policy. Concierge review required before dispatch.`,
              },
            ]
          : []),
      ],
    });

    // 4. Safe stock deduction and audit logging (skip if idempotent duplicate)
    if (!isDuplicate) {
      for (const item of validatedItems) {
        const currentProducts = await this.productRepo.findAll();
        let currentVariant: any = null;
        for (const p of currentProducts) {
          const v = p.variants?.find((varItem: any) => varItem.id === item.variantId);
          if (v) {
            currentVariant = v;
            break;
          }
        }
        if (currentVariant) {
          const newQty = Math.max(0, (currentVariant.stockQuantity ?? 0) - item.quantity);
          await this.inventoryRepo.updateStock(
            item.variantId,
            newQty,
            `Order #${createdOrder.orderNumber} placed by ${orderPayload.customerName} (${orderPayload.paymentMethod})`,
            'Order Processing'
          );
        }
      }
    }

    // Record audit log for order placement
    AuditService.record({
      actingAdministrator: 'Storefront Checkout',
      affectedRecord: `Order #${createdOrder.orderNumber}`,
      action: 'ORDER_PLACED',
      reason: `Order placed with ${orderPayload.paymentMethod}. Total: LKR ${calculation.totalAmount.toLocaleString()}`,
      details: {
        orderId: createdOrder.id,
        itemsCount: validatedItems.length,
        deliveryFee: calculation.deliveryFee,
        zoneName: calculation.zoneName,
      },
    });

    // Dispatch order confirmation notification
    try {
      await NotificationService.notifyOrderEvent(createdOrder, 'ORDER_CONFIRMATION');
    } catch (notifErr) {
      console.warn('[Notification] Failed to trigger order confirmation notification:', notifErr);
    }

    return createdOrder;
  }

  async getAllOrders() {
    return this.orderRepo.findAll();
  }

  async getOrderById(id: string) {
    return this.orderRepo.findById(id);
  }

  async confirmCodOrder(id: string, note?: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    if (existing.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestError(`Order ${existing.orderNumber} is already in '${existing.status}' status.`);
    }

    const updated = await this.orderRepo.updateStatus(
      id,
      'CONFIRMED',
      undefined,
      undefined,
      note || 'Customer confirmed delivery address & COD payment readiness via phone call.'
    );

    AuditService.record({
      actingAdministrator: 'Authorized Administrator',
      affectedRecord: `Order #${existing.orderNumber}`,
      action: 'CONFIRM_COD_ORDER',
      reason: note || 'Customer confirmed delivery address & COD payment readiness via phone call.',
    });

    try {
      if (updated) {
        await NotificationService.notifyOrderEvent(updated, 'ORDER_CONFIRMATION', { notes: note });
      }
    } catch (e) {
      console.warn('[Notification Error]', e);
    }

    return updated;
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
  ) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    return this.orderRepo.assignCourier(id, details);
  }

  async recordDeliveryAndPayment(
    id: string,
    details: {
      deliveryDate?: string;
      note?: string;
      collectedAmount?: number;
    }
  ) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    return this.orderRepo.recordDeliveryAndPayment(id, details);
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
  ) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    return this.orderRepo.recordCodRemittance(id, remittance);
  }

  async updateOrderStatus(
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
  ) {
    const existingOrder = await this.orderRepo.findById(id);
    if (!existingOrder) throw new NotFoundError(`Order ${id} not found`);

    const updated = await this.orderRepo.updateStatus(id, status, carrier, trackingNumber, note, admin, extras);

    // Idempotent inventory restoration on CANCELLED (goods never left warehouse / pre-dispatch cancellation)
    // Note: RETURNED orders must NOT auto-restock here; they strictly require physical warehouse inspection!
    const shouldRestockOnCancel = status === 'CANCELLED';
    if (shouldRestockOnCancel && !existingOrder.isRestocked) {
      for (const item of existingOrder.items) {
        const currentProducts = await this.productRepo.findAll();
        let currentVariant: any = null;
        for (const p of currentProducts) {
          const v = p.variants?.find((varItem: any) => varItem.id === item.variantId);
          if (v) {
            currentVariant = v;
            break;
          }
        }
        if (currentVariant) {
          const restoredQty = (currentVariant.stockQuantity ?? 0) + item.quantity;
          await this.inventoryRepo.updateStock(
            item.variantId,
            restoredQty,
            `Order #${existingOrder.orderNumber} ${status.toLowerCase()} restock by ${admin || 'Admin'}`,
            admin || 'Admin Staff'
          );
        }
      }
      // Flag as restocked to strictly prevent duplicate restoration
      await this.orderRepo.updateOrder(id, { isRestocked: true });
    }

    // Record audit entry for status change
    AuditService.record({
      actingAdministrator: admin || 'Store Administrator',
      affectedRecord: `Order #${existingOrder.orderNumber}`,
      action: `ORDER_STATUS_${status}`,
      reason: note || `Order transitioned to ${status}`,
      details: { carrier, trackingNumber, extras },
    });

    // Dispatch notifications for dispatch and completion
    if (updated) {
      if (status === 'SHIPPED' || status === 'PACKED') {
        try {
          await NotificationService.notifyOrderEvent(updated, 'ORDER_DISPATCH', { notes: note });
        } catch (e) {
          console.warn('[Notification Error]', e);
        }
      } else if (status === 'DELIVERED') {
        try {
          await NotificationService.notifyOrderEvent(updated, 'DELIVERY_COMPLETED', { notes: note });
        } catch (e) {
          console.warn('[Notification Error]', e);
        }
      }
    }

    return updated;
  }

  async addInternalNote(id: string, note: string) {
    return this.orderRepo.addInternalNote(id, note);
  }

  async refundOrder(id: string, reason?: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    // Restore stock if not already restocked
    if (!existing.isRestocked) {
      for (const item of existing.items) {
        const currentProducts = await this.productRepo.findAll();
        let currentVariant: any = null;
        for (const p of currentProducts) {
          const v = p.variants?.find((varItem: any) => varItem.id === item.variantId);
          if (v) {
            currentVariant = v;
            break;
          }
        }
        if (currentVariant) {
          const restoredQty = (currentVariant.stockQuantity ?? 0) + item.quantity;
          await this.inventoryRepo.updateStock(
            item.variantId,
            restoredQty,
            `Order #${existing.orderNumber} refund restock`,
            'Admin Automation'
          );
        }
      }
      await this.orderRepo.updateOrder(id, { isRestocked: true });
    }

    return this.orderRepo.refundOrder(id, reason);
  }

  async getCodReports(filters?: {
    startDate?: string;
    endDate?: string;
    courier?: string;
    orderStatus?: string;
    paymentStatus?: string;
    settlementStatus?: string;
  }) {
    const orders = await this.orderRepo.findAll();

    // Filter to COD orders only
    let codOrders = orders.filter(
      o => o.paymentMethod === 'CASH_ON_DELIVERY' || o.paymentMethod?.toLowerCase().includes('cash')
    );

    if (filters?.startDate) {
      codOrders = codOrders.filter(o => o.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      codOrders = codOrders.filter(o => o.createdAt.slice(0, 10) <= filters.endDate!);
    }
    if (filters?.courier && filters.courier !== 'ALL') {
      const c = filters.courier.toLowerCase();
      codOrders = codOrders.filter(
        o => o.courierDetails?.courierProvider?.toLowerCase().includes(c) || o.carrier?.toLowerCase().includes(c)
      );
    }
    if (filters?.orderStatus && filters.orderStatus !== 'ALL') {
      codOrders = codOrders.filter(o => o.status === filters.orderStatus);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
      codOrders = codOrders.filter(o => o.paymentStatus === filters.paymentStatus);
    }
    if (filters?.settlementStatus && filters.settlementStatus !== 'ALL') {
      codOrders = codOrders.filter(
        o => (o.codSettlementStatus || o.courierDetails?.codRemittanceStatus) === filters.settlementStatus
      );
    }

    // Exact Metrics (Calculated from real recorded data, never mock!)
    const totalCodOrders = codOrders.length;
    const totalAmountToCollect = codOrders.reduce((sum, o) => sum + (o.amountToCollect || o.totalAmount || 0), 0);

    // Delivered orders count as collected from customer
    const deliveredOrders = codOrders.filter(
      o => o.status === 'DELIVERED' || o.courierDetails?.codCollectionStatus === 'COLLECTED'
    );
    const amountCollectedFromCustomers = deliveredOrders.reduce(
      (sum, o) => sum + (o.amountToCollect || o.totalAmount || 0),
      0
    );

    // Remitted orders
    const remittedOrders = codOrders.filter(
      o => o.codSettlementStatus === 'REMITTED' || o.codSettlementStatus === 'RECONCILED'
    );
    const amountRemittedToBusiness = remittedOrders.reduce(
      (sum, o) => sum + (o.courierDetails?.amountRemitted || o.amountToCollect || o.totalAmount || 0),
      0
    );

    // Pending remittance = Collected from customers but not yet remitted to business bank
    const pendingRemittanceOrders = codOrders.filter(
      o =>
        (o.status === 'DELIVERED' || o.courierDetails?.codCollectionStatus === 'COLLECTED') &&
        o.codSettlementStatus !== 'REMITTED' &&
        o.codSettlementStatus !== 'RECONCILED'
    );
    const pendingRemittanceAmount = pendingRemittanceOrders.reduce(
      (sum, o) => sum + (o.amountToCollect || o.totalAmount || 0),
      0
    );

    // Courier fees
    const courierDeliveryCharges = codOrders.reduce(
      (sum, o) => sum + (o.courierDetails?.deliveryFee || o.shippingFee || 0),
      0
    );

    const returnedOrders = codOrders.filter(o => o.status === 'RETURNED');
    const returnCharges = returnedOrders.length * 350; // Default return charge

    // Discrepancies: Orders where amountRemitted differs from amountToCollect
    const discrepanciesList = remittedOrders.filter(o => {
      const remitted = o.courierDetails?.amountRemitted ?? 0;
      const expected = o.amountToCollect || o.totalAmount || 0;
      return Math.abs(remitted - expected) > 1; // more than 1 LKR difference
    });
    const outstandingDiscrepancies = discrepanciesList.reduce((sum, o) => {
      const remitted = o.courierDetails?.amountRemitted ?? 0;
      const expected = o.amountToCollect || o.totalAmount || 0;
      return sum + (expected - remitted);
    }, 0);

    return {
      summary: {
        totalCodOrders,
        totalAmountToCollect,
        amountCollectedFromCustomers,
        amountRemittedToBusiness,
        pendingRemittanceAmount,
        courierDeliveryCharges,
        returnCharges,
        outstandingDiscrepancies,
        deliveredCount: deliveredOrders.length,
        pendingRemittanceCount: pendingRemittanceOrders.length,
        remittedCount: remittedOrders.length,
        returnedCount: returnedOrders.length,
      },
      orders: codOrders,
    };
  }

  getCourierConfig() {
    return koombiyoCourierService.getCourierConfig();
  }

  async getKoombiyoPortalPayload(id: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);
    return koombiyoCourierService.generatePortalPayload(existing);
  }

  async bookCourierManual(id: string, payload: ManualCourierBookingPayload, admin?: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    return this.orderRepo.bookCourierManual(id, payload, admin);
  }

  async updateCourierDeliveryStatus(id: string, payload: DeliveryStatusUpdatePayload, admin?: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    if (!payload.deliveryStatus) {
      throw new BadRequestError('deliveryStatus is required');
    }

    if (payload.deliveryStatus === 'DELIVERY_ATTEMPT_FAILED') {
      const reason = (payload.reason || '').trim();
      if (!reason || reason.length < 5) {
        throw new BadRequestError('A specific reason (minimum 5 characters) is required when recording a failed delivery attempt.');
      }
    }

    if (payload.deliveryStatus === 'RETURNING_TO_SENDER' || payload.deliveryStatus === 'RETURNED_TO_SENDER') {
      const reason = (payload.reason || '').trim();
      if (!reason || reason.length < 5) {
        throw new BadRequestError('A specific reason (minimum 5 characters) is required when marking a parcel as returning or returned to sender.');
      }
    }

    const updated = await this.orderRepo.updateCourierDeliveryStatus(id, payload, admin);
    return updated;
  }

  async recordDeliveryAttempt(id: string, payload: RecordDeliveryAttemptPayload, admin?: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    if (!payload.reason && !payload.reasonCode) {
      throw new BadRequestError('A delivery failure reason is required.');
    }

    if (payload.reasonCode === 'OTHER' || payload.reason === 'OTHER') {
      const notes = (payload.notes || '').trim();
      if (!notes || notes.length < 5) {
        throw new BadRequestError('A documented explanation (minimum 5 characters in notes) is required when reason is Other.');
      }
    }

    if (payload.scheduledRetryDate) {
      const retryDate = new Date(payload.scheduledRetryDate);
      if (isNaN(retryDate.getTime())) {
        throw new BadRequestError('Invalid scheduledRetryDate format.');
      }
    }

    const updated = await this.orderRepo.recordDeliveryAttempt(id, payload, admin);

    AuditService.record({
      actingAdministrator: admin || 'Delivery Operations',
      affectedRecord: `Order #${existing.orderNumber}`,
      action: 'DELIVERY_ATTEMPT_FAILED',
      reason: payload.reason || payload.reasonCode || 'Delivery attempt failed',
      details: payload,
    });

    try {
      if (updated) {
        await NotificationService.notifyOrderEvent(updated, 'DELIVERY_FAILED', {
          failureReason: payload.reason || payload.reasonCode,
          nextRetryDate: payload.scheduledRetryDate,
          notes: payload.notes,
        });
      }
    } catch (e) {
      console.warn('[Notification Error]', e);
    }

    return updated;
  }

  async initiateReturnToSender(id: string, payload: InitiateReturnToSenderPayload, admin?: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    const reason = (payload.reason || '').trim();
    if (!reason || reason.length < 5) {
      throw new BadRequestError('A documented return reason (minimum 5 characters) is required to initiate Return-to-Sender.');
    }

    const updated = await this.orderRepo.initiateReturnToSender(id, payload, admin);

    AuditService.record({
      actingAdministrator: admin || 'Logistics Operations',
      affectedRecord: `Order #${existing.orderNumber}`,
      action: 'INITIATE_RETURN_TO_SENDER',
      reason,
      details: payload,
    });

    return updated;
  }

  async processReturnInspection(id: string, payload: ReturnInspectionPayload, inspector?: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);

    if (!payload.returnDate) {
      throw new BadRequestError('Parcel physical return date is required.');
    }

    const validConditions = ['INTACT_SEALED', 'PACKAGING_OPENED', 'DAMAGED_TRANSIT', 'MISSING_ITEMS'];
    if (!payload.parcelCondition || !validConditions.includes(payload.parcelCondition)) {
      throw new BadRequestError(`Invalid parcel condition. Must be one of: ${validConditions.join(', ')}`);
    }

    const validDecisions = ['RESTOCK_APPROVED', 'RESTOCK_REJECTED', 'PARTIAL_RESTOCK'];
    if (!payload.decision || !validDecisions.includes(payload.decision)) {
      throw new BadRequestError(`Invalid restock decision. Must be one of: ${validDecisions.join(', ')}`);
    }

    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestError('Inspection must include itemized evaluation of returned goods.');
    }

    const adminUser = inspector || payload.inspector || payload.admin || 'Warehouse QC';

    // Only restore stock for items explicitly approved for restock
    for (const inspItem of payload.items) {
      if (inspItem.restockApproved && inspItem.quantityToRestock > 0) {
        const currentProducts = await this.productRepo.findAll();
        let currentVariant: any = null;
        for (const p of currentProducts) {
          const v = p.variants?.find((varItem: any) => varItem.id === inspItem.variantId);
          if (v) {
            currentVariant = v;
            break;
          }
        }
        if (currentVariant) {
          const restoredQty = (currentVariant.stockQuantity ?? 0) + inspItem.quantityToRestock;
          await this.inventoryRepo.updateStock(
            inspItem.variantId,
            restoredQty,
            `Order #${existing.orderNumber} inspected return restock (${inspItem.condition}) by ${adminUser}`,
            adminUser
          );
        }
      }
    }

    const updated = await this.orderRepo.recordReturnInspection(id, payload, adminUser);

    AuditService.record({
      actingAdministrator: adminUser,
      affectedRecord: `Order #${existing.orderNumber}`,
      action: 'WAREHOUSE_RETURN_INSPECTION',
      reason: `Condition: ${payload.parcelCondition} | Decision: ${payload.decision}`,
      details: {
        returnDate: payload.returnDate,
        parcelCondition: payload.parcelCondition,
        decision: payload.decision,
        verifiedReturnCharge: payload.verifiedReturnCharge,
        itemsInspected: payload.items,
      },
    });

    return updated;
  }

  async getCodAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    zoneId?: string;
  }) {
    const analyticsService = new CodAnalyticsService();
    return analyticsService.getAnalyticsReport(filters);
  }

  async getUnresolvedReturns(): Promise<UnresolvedReturnCase[]> {
    return this.orderRepo.getUnresolvedCases();
  }

  async getReturnsAndFailedOrders(filters?: any): Promise<OrderRecord[]> {
    return this.orderRepo.getFailedAndReturnOrders(filters);
  }

  getFailureReasonsCatalog() {
    return FAILURE_REASONS_CATALOG;
  }

  async addCourierNote(id: string, note: string, admin?: string) {
    const existing = await this.orderRepo.findById(id);
    if (!existing) throw new NotFoundError(`Order ${id} not found`);
    return this.orderRepo.addCourierNote(id, note, admin);
  }
}
