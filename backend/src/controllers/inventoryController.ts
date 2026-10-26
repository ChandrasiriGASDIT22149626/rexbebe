import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService';
import { sendSuccess } from '../utils/response';

const inventoryService = new InventoryService();

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await inventoryService.getInventoryList();
    const { category, stockStatus, search } = req.query;

    let filtered = list;
    if (category && category !== 'ALL') {
      filtered = filtered.filter(i => i.categoryName.toLowerCase().includes((category as string).toLowerCase()));
    }
    if (stockStatus && stockStatus !== 'ALL') {
      filtered = filtered.filter(i => i.stockStatus === stockStatus);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(i =>
        i.productName.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        (i.color && i.color.toLowerCase().includes(q)) ||
        (i.size && i.size.toLowerCase().includes(q))
      );
    }

    return sendSuccess(res, filtered, 'Inventory items retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { variantId, quantity, reason, adjustedBy } = req.body;
    const updated = await inventoryService.updateStock(variantId, quantity, reason, adjustedBy);
    return sendSuccess(res, updated, 'Inventory stock updated');
  } catch (err) {
    next(err);
  }
};

export const getAdjustments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await inventoryService.getAdjustments();
    return sendSuccess(res, logs, 'Stock adjustments retrieved');
  } catch (err) {
    next(err);
  }
};
