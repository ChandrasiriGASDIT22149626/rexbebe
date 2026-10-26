import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  syncWishlist,
} from '../controllers/wishlistController';

const router = Router();

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/sync', syncWishlist);
router.delete('/items/:id', removeFromWishlist);
router.delete('/:id', removeFromWishlist);
router.delete('/', clearWishlist);

export default router;
