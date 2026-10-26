import { Router } from 'express';
import {
  getDeliverySettings,
  updateDeliverySettings,
  calculateDelivery,
  getDeliveryZones,
  getDeliveryZoneById,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  addTownToZone,
  removeTownFromZone,
  reassignTown,
  updatePolicy,
  lookupZone,
} from '../controllers/deliveryController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

// General Delivery Settings & Pricing (Public for checkout calculations)
router.get('/', getDeliverySettings);
router.post('/calculate', calculateDelivery);
router.post('/lookup-zone', lookupZone);
router.get('/zones', getDeliveryZones);
router.get('/zones/:id', getDeliveryZoneById);

// Administrative Delivery Management (Protected)
router.put('/', authenticateToken, requireAdmin, updateDeliverySettings);
router.put('/policy', authenticateToken, requireAdmin, updatePolicy);
router.post('/zones', authenticateToken, requireAdmin, createDeliveryZone);
router.post('/zones/reassign-town', authenticateToken, requireAdmin, reassignTown);
router.put('/zones/:id', authenticateToken, requireAdmin, updateDeliveryZone);
router.delete('/zones/:id', authenticateToken, requireAdmin, deleteDeliveryZone);
router.post('/zones/:id/towns', authenticateToken, requireAdmin, addTownToZone);
router.delete('/zones/:id/towns/:town', authenticateToken, requireAdmin, removeTownFromZone);

export default router;
