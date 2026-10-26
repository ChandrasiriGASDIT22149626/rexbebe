import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  duplicateProduct,
  deleteProduct,
  toggleBestSeller,
  toggleNewArrival,
  toggleFeatured,
  updateProductStatus,
} from '../controllers/productController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

// Public Catalog Browsing
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Administrative Product Management (Protected)
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.post('/:id/duplicate', authenticateToken, requireAdmin, duplicateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);
router.patch('/:id/best-seller', authenticateToken, requireAdmin, toggleBestSeller);
router.patch('/:id/toggle-bestseller', authenticateToken, requireAdmin, toggleBestSeller);
router.patch('/:id/toggle-newarrival', authenticateToken, requireAdmin, toggleNewArrival);
router.patch('/:id/toggle-featured', authenticateToken, requireAdmin, toggleFeatured);
router.patch('/:id/status', authenticateToken, requireAdmin, updateProductStatus);

export default router;
