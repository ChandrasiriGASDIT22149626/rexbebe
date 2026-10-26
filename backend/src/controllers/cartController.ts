import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService';
import { sendSuccess } from '../utils/response';

const cartService = new CartService();

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = (req.query.cartId as string) || (req.headers['x-cart-id'] as string) || 'cart-session-default';
    const cart = await cartService.getCart(cartId);
    return sendSuccess(res, cart, 'Cart retrieved');
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = req.body.cartId || (req.headers['x-cart-id'] as string) || 'cart-session-default';
    const { variantId, quantity = 1 } = req.body;
    const cart = await cartService.addItem(cartId, variantId, Number(quantity) || 1);
    return sendSuccess(res, cart, 'Item added to cart');
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: variantId } = req.params;
    const cartId = req.body.cartId || (req.query.cartId as string) || (req.headers['x-cart-id'] as string) || 'cart-session-default';
    const { quantity } = req.body;
    const cart = await cartService.updateItemQuantity(cartId, variantId, Number(quantity));
    return sendSuccess(res, cart, 'Cart updated');
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: variantId } = req.params;
    const cartId = (req.query.cartId as string) || (req.headers['x-cart-id'] as string) || 'cart-session-default';
    const cart = await cartService.removeItem(cartId, variantId);
    return sendSuccess(res, cart, 'Item removed from cart');
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = (req.query.cartId as string) || (req.body.cartId as string) || (req.headers['x-cart-id'] as string) || 'cart-session-default';
    const cart = await cartService.clearCart(cartId);
    return sendSuccess(res, cart, 'Cart cleared');
  } catch (err) {
    next(err);
  }
};

export const validateCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = req.body.cartId || (req.headers['x-cart-id'] as string) || 'cart-session-default';
    const items = req.body.items || [];
    const cart = await cartService.validateAndSyncItems(cartId, items);
    return sendSuccess(res, cart, 'Cart validated successfully against live inventory');
  } catch (err) {
    next(err);
  }
};
