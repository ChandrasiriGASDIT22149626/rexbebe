import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlistService';
import { sendSuccess } from '../utils/response';

const wishlistService = new WishlistService();

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wishlistId = (req.query.wishlistId as string) || (req.headers['x-wishlist-id'] as string) || 'wishlist-default';
    const wishlist = await wishlistService.getWishlist(wishlistId);
    return sendSuccess(res, wishlist, 'Wishlist retrieved');
  } catch (err) {
    next(err);
  }
};

export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wishlistId = req.body.wishlistId || (req.headers['x-wishlist-id'] as string) || 'wishlist-default';
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const wishlist = await wishlistService.addItem(wishlistId, productId);
    return sendSuccess(res, wishlist, 'Product added to wishlist');
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: productId } = req.params;
    const wishlistId = (req.query.wishlistId as string) || (req.headers['x-wishlist-id'] as string) || 'wishlist-default';
    const wishlist = await wishlistService.removeItem(wishlistId, productId);
    return sendSuccess(res, wishlist, 'Product removed from wishlist');
  } catch (err) {
    next(err);
  }
};

export const clearWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wishlistId = (req.query.wishlistId as string) || (req.body.wishlistId as string) || (req.headers['x-wishlist-id'] as string) || 'wishlist-default';
    const wishlist = await wishlistService.clearWishlist(wishlistId);
    return sendSuccess(res, wishlist, 'Wishlist cleared');
  } catch (err) {
    next(err);
  }
};

export const syncWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wishlistId = req.body.wishlistId || (req.headers['x-wishlist-id'] as string) || 'wishlist-default';
    const productIds = req.body.productIds || [];
    const wishlist = await wishlistService.syncWishlist(wishlistId, productIds);
    return sendSuccess(res, wishlist, 'Wishlist synchronized successfully');
  } catch (err) {
    next(err);
  }
};
