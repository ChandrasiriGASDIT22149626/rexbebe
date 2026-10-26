import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { OrderService } from '../services/orderService';

const orderService = new OrderService();

export const getReturns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const returnOrders = await orderService.getReturnsAndFailedOrders(req.query);
    return sendSuccess(res, returnOrders, 'Return orders and failed deliveries retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getUnresolvedReturns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cases = await orderService.getUnresolvedReturns();
    return sendSuccess(res, cases, 'Unresolved returns and failed delivery alerts retrieved');
  } catch (err) {
    next(err);
  }
};

export const getFailureReasons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const catalog = orderService.getFailureReasonsCatalog();
    return sendSuccess(res, catalog, 'Standardized delivery failure reasons catalog');
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

export const processReturnInspection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const inspector = req.body.inspector || req.body.admin || (req as any).user?.email || 'Warehouse Staff';
    const updated = await orderService.processReturnInspection(id, req.body, inspector);
    return sendSuccess(res, updated, 'Warehouse return inspection and conditional restocking completed successfully');
  } catch (err) {
    next(err);
  }
};

export const createReturnRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, reason, refundAmount } = req.body;
    const newReturn = {
      id: `ret-${Date.now()}`,
      orderId,
      customerName: req.body.customerName || 'Customer',
      reason,
      status: 'REQUESTED',
      refundAmount: refundAmount || 0,
      createdAt: new Date().toISOString(),
    };
    return sendSuccess(res, newReturn, 'Return request submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

