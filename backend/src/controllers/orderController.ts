import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { validateOrderInput } from '../validators/orderValidator';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';

const orderService = new OrderService();

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    validateOrderInput(req.body);
    const order = await orderService.createOrder(req.body);
    return sendSuccess(res, order, 'Order created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderService.getAllOrders();
    const {
      status,
      paymentStatus,
      settlementStatus,
      search,
      country,
      courier,
      paymentMethod,
      codCollectionStatus,
      district,
      startDate,
      endDate,
    } = req.query;

    let filtered = orders;
    if (status && status !== 'ALL') {
      filtered = filtered.filter(o => o.status.toUpperCase() === (status as string).toUpperCase());
    }
    if (paymentStatus && paymentStatus !== 'ALL') {
      filtered = filtered.filter(o => o.paymentStatus.toUpperCase() === (paymentStatus as string).toUpperCase());
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
      const pm = (paymentMethod as string).toUpperCase();
      if (pm === 'COD' || pm === 'CASH_ON_DELIVERY') {
        filtered = filtered.filter(
          o =>
            o.paymentMethod === 'CASH_ON_DELIVERY' ||
            o.paymentMethod?.toLowerCase().includes('cash') ||
            o.paymentMethod?.toLowerCase().includes('cod')
        );
      } else {
        filtered = filtered.filter(o => o.paymentMethod?.toUpperCase().includes(pm));
      }
    }
    if (codCollectionStatus && codCollectionStatus !== 'ALL') {
      const cs = (codCollectionStatus as string).toUpperCase();
      filtered = filtered.filter(
        o =>
          o.codCollectionStatus?.toUpperCase() === cs ||
          o.courierDetails?.codCollectionStatus?.toUpperCase() === cs
      );
    }
    if (district && district !== 'ALL') {
      const d = (district as string).toLowerCase();
      filtered = filtered.filter(o => o.shippingAddress?.district?.toLowerCase() === d);
    }
    if (settlementStatus && settlementStatus !== 'ALL') {
      filtered = filtered.filter(
        o => (o.codSettlementStatus || o.courierDetails?.codRemittanceStatus) === settlementStatus
      );
    }
    if (courier && courier !== 'ALL') {
      const c = (courier as string).toLowerCase();
      filtered = filtered.filter(
        o =>
          o.courierDetails?.courierProvider?.toLowerCase().includes(c) ||
          o.carrier?.toLowerCase().includes(c)
      );
    }
    if (country && country !== 'ALL') {
      filtered = filtered.filter(o => o.country?.toLowerCase() === (country as string).toLowerCase());
    }
    if (startDate) {
      const start = new Date(startDate as string).getTime();
      if (!isNaN(start)) {
        filtered = filtered.filter(o => new Date(o.createdAt).getTime() >= start);
      }
    }
    if (endDate) {
      let endStr = endDate as string;
      if (endStr.length === 10) endStr += 'T23:59:59.999Z';
      const end = new Date(endStr).getTime();
      if (!isNaN(end)) {
        filtered = filtered.filter(o => new Date(o.createdAt).getTime() <= end);
      }
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          (o.phone && o.phone.toLowerCase().includes(q)) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
          (o.courierDetails?.waybillNumber && o.courierDetails.waybillNumber.toLowerCase().includes(q)) ||
          (o.shippingAddress?.recipientName && o.shippingAddress.recipientName.toLowerCase().includes(q)) ||
          (o.shippingAddress?.street && o.shippingAddress.street.toLowerCase().includes(q)) ||
          (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(q)) ||
          (o.shippingAddress?.district && o.shippingAddress.district.toLowerCase().includes(q))
      );
    }

    return sendSuccess(res, filtered, 'Orders retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) {
      throw new NotFoundError(`Order ${id} not found`);
    }
    return sendSuccess(res, order, 'Order details retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, carrier, trackingNumber, note, admin, reason, codCollectionStatus, deliveryStatus } = req.body;

    if (!status) {
      throw new BadRequestError('Order status is required');
    }

    // Require reasons for cancellation and other exceptional actions
    if (status === 'CANCELLED') {
      const cancellationReason = (reason || note || '').trim();
      if (!cancellationReason || cancellationReason.length < 5) {
        throw new BadRequestError('A specific reason (minimum 5 characters) is required to cancel an order.');
      }
    }

    if (status === 'RETURNED') {
      const returnReason = (reason || note || '').trim();
      if (!returnReason || returnReason.length < 5) {
        throw new BadRequestError('A specific reason (minimum 5 characters) is required to mark an order as returned.');
      }
    }

    const adminUser = admin || (req as any).user?.email || 'Admin Staff';
    const finalNote = reason ? `${note ? note + ' - ' : ''}Reason: ${reason}` : note;

    const updated = await orderService.updateOrderStatus(
      id,
      status,
      carrier,
      trackingNumber,
      finalNote,
      adminUser,
      { codCollectionStatus, deliveryStatus }
    );
    return sendSuccess(res, updated, `Order status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

export const confirmCodOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const updated = await orderService.confirmCodOrder(id, note);
    return sendSuccess(res, updated, 'Cash on Delivery order confirmed');
  } catch (err) {
    next(err);
  }
};

export const assignCourier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await orderService.assignCourier(id, req.body);
    return sendSuccess(res, updated, 'Courier and tracking details assigned successfully');
  } catch (err) {
    next(err);
  }
};

export const recordDeliveryAndPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await orderService.recordDeliveryAndPayment(id, req.body);
    return sendSuccess(res, updated, 'Delivery & payment collection recorded');
  } catch (err) {
    next(err);
  }
};

export const recordCodRemittance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await orderService.recordCodRemittance(id, req.body);
    return sendSuccess(res, updated, 'Courier COD remittance recorded');
  } catch (err) {
    next(err);
  }
};

export const getCodReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await orderService.getCodReports(req.query as any);
    return sendSuccess(res, reports, 'COD reports and reconciliation data retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCodAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await orderService.getCodAnalytics(req.query as any);
    return sendSuccess(res, report, 'COD analytics and multi-dimensional reports retrieved');
  } catch (err) {
    next(err);
  }
};

export const addOrderNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const updated = await orderService.addInternalNote(id, note);
    return sendSuccess(res, updated, 'Internal note added');
  } catch (err) {
    next(err);
  }
};

export const refundOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await orderService.refundOrder(id, reason);
    return sendSuccess(res, updated, 'Order refund processed successfully');
  } catch (err) {
    next(err);
  }
};

export const getCourierConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = orderService.getCourierConfig();
    return sendSuccess(res, config, 'Courier configuration retrieved');
  } catch (err) {
    next(err);
  }
};

export const getKoombiyoPortalPayload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payload = await orderService.getKoombiyoPortalPayload(id);
    return sendSuccess(res, payload, 'Koombiyo portal payload generated');
  } catch (err) {
    next(err);
  }
};

export const bookCourierManual = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminUser = req.body.admin || (req as any).user?.email || 'Admin Staff';
    const updated = await orderService.bookCourierManual(id, req.body, adminUser);
    return sendSuccess(res, updated, 'Manual courier booking recorded successfully');
  } catch (err) {
    next(err);
  }
};

export const updateCourierDeliveryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminUser = req.body.admin || (req as any).user?.email || 'Admin Staff';
    const updated = await orderService.updateCourierDeliveryStatus(id, req.body, adminUser);
    return sendSuccess(res, updated, `Courier delivery status updated to ${req.body.deliveryStatus}`);
  } catch (err) {
    next(err);
  }
};

export const addCourierNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note, admin } = req.body;
    const adminUser = admin || (req as any).user?.email || 'Admin Staff';
    const updated = await orderService.addCourierNote(id, note, adminUser);
    return sendSuccess(res, updated, 'Courier note added successfully');
  } catch (err) {
    next(err);
  }
};

export const recordDeliveryAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminUser = req.body.admin || (req as any).user?.email || 'Logistics Admin';
    const updated = await orderService.recordDeliveryAttempt(id, req.body, adminUser);
    return sendSuccess(res, updated, 'Delivery attempt recorded successfully');
  } catch (err) {
    next(err);
  }
};

export const initiateReturnToSender = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminUser = req.body.admin || (req as any).user?.email || 'Logistics Admin';
    const updated = await orderService.initiateReturnToSender(id, req.body, adminUser);
    return sendSuccess(res, updated, 'Return-to-Sender initiated successfully');
  } catch (err) {
    next(err);
  }
};

export const recordReturnInspection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminUser = req.body.inspector || req.body.admin || (req as any).user?.email || 'Warehouse Staff';
    const updated = await orderService.processReturnInspection(id, req.body, adminUser);
    return sendSuccess(res, updated, 'Warehouse return inspection and conditional restocking completed successfully');
  } catch (err) {
    next(err);
  }
};

export const getUnresolvedReturnCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cases = await orderService.getUnresolvedReturns();
    return sendSuccess(res, cases, 'Unresolved delivery and return cases retrieved');
  } catch (err) {
    next(err);
  }
};

export const getFailedAndReturnOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderService.getReturnsAndFailedOrders(req.query);
    return sendSuccess(res, orders, 'Failed deliveries and return orders retrieved');
  } catch (err) {
    next(err);
  }
};

export const getFailureReasonsCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const catalog = orderService.getFailureReasonsCatalog();
    return sendSuccess(res, catalog, 'Delivery failure reasons catalog retrieved');
  } catch (err) {
    next(err);
  }
};

