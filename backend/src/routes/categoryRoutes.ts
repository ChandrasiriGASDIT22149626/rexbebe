import { Router } from 'express';
import {
  getCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryDescendants,
  getCategoryAncestors,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

// Public Category Hierarchy Browsing
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:id', getCategoryById);
router.get('/:id/descendants', getCategoryDescendants);
router.get('/:id/ancestors', getCategoryAncestors);
router.get('/:id', getCategoryById);

// Administrative Category Management (Protected)
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.patch('/:id/status', authenticateToken, requireAdmin, updateCategoryStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

export default router;
