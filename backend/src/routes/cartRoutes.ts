import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCart,
} from '../controllers/cartController';

const router = Router();

router.get('/', getCart);
router.post('/', addToCart);
router.post('/validate', validateCart);
router.put('/items/:id', updateCartItem);
router.patch('/items/:id', updateCartItem);
router.delete('/items/:id', removeFromCart);
router.delete('/', clearCart);

export default router;
