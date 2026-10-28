import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlistService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const wishlistService = new WishlistService();

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const customerId = authReq.user?.id;
    const wishlistId =
      (req.query.wishlistId as string) ||
      (req.headers['x-wishlist-id'] as string) ||
      (customerId ? `wl-${customerId}` : 'wishlist-default');

    const wishlist = await wishlistService.getWishlist(wishlistId, customerId);
    return sendSuccess(res, wishlist, 'Wishlist retrieved');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to retrieve wishlist', 500);
  }
};

export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const customerId = authReq.user?.id;
    const wishlistId =
      req.body.wishlistId ||
      (req.headers['x-wishlist-id'] as string) ||
      (customerId ? `wl-${customerId}` : 'wishlist-default');
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const wishlist = await wishlistService.addItem(wishlistId, productId, customerId);
    return sendSuccess(res, wishlist, 'Product added to wishlist');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to add item to wishlist', 500);
  }
};

export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const customerId = authReq.user?.id;
    const { id: productId } = req.params;
    const wishlistId =
      (req.query.wishlistId as string) ||
      (req.headers['x-wishlist-id'] as string) ||
      (customerId ? `wl-${customerId}` : 'wishlist-default');

    const wishlist = await wishlistService.removeItem(wishlistId, productId, customerId);
    return sendSuccess(res, wishlist, 'Product removed from wishlist');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to remove item from wishlist', 500);
  }
};

export const clearWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const customerId = authReq.user?.id;
    const wishlistId =
      (req.query.wishlistId as string) ||
      (req.body?.wishlistId as string) ||
      (req.headers['x-wishlist-id'] as string) ||
      (customerId ? `wl-${customerId}` : 'wishlist-default');

    const wishlist = await wishlistService.clearWishlist(wishlistId, customerId);
    return sendSuccess(res, wishlist, 'Wishlist cleared');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to clear wishlist', 500);
  }
};

export const syncWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const customerId = authReq.user?.id;
    const wishlistId =
      req.body.wishlistId ||
      (req.headers['x-wishlist-id'] as string) ||
      (customerId ? `wl-${customerId}` : 'wishlist-default');
    const productIds = Array.isArray(req.body.productIds) ? req.body.productIds : [];

    const wishlist = await wishlistService.syncWishlist(wishlistId, productIds, customerId);
    return sendSuccess(res, wishlist, 'Wishlist synchronized successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to synchronize wishlist', 500);
  }
};
