import { Request, Response, NextFunction } from 'express';
import { CustomerRepository } from '../repositories/customerRepository';
import { OrderRepository } from '../repositories/orderRepository';
import { sendSuccess } from '../utils/response';

const customerRepo = new CustomerRepository();
const orderRepo = new OrderRepository();

export const getMeCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const customer = await customerRepo.findById('cust-1');
    return sendSuccess(res, customer, 'Customer profile retrieved');
  } catch (err) {
    next(err);
  }
};

export const getMyOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const orders = await orderRepo.findAll();
    return sendSuccess(res, orders, 'Customer orders retrieved');
  } catch (err) {
    next(err);
  }
};

export const getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await customerRepo.findAll();
    return sendSuccess(res, customers, 'All customers retrieved for admin');
  } catch (err) {
    next(err);
  }
};
