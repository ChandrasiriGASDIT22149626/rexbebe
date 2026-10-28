import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  syncWishlist,
} from '../controllers/wishlistController';
import { optionalAuthenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuthenticateToken, getWishlist);
router.post('/', optionalAuthenticateToken, addToWishlist);
router.post('/sync', optionalAuthenticateToken, syncWishlist);
router.delete('/items/:id', optionalAuthenticateToken, removeFromWishlist);
router.delete('/:id', optionalAuthenticateToken, removeFromWishlist);
router.delete('/', optionalAuthenticateToken, clearWishlist);

export default router;
