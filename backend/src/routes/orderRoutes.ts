import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  confirmCodOrder,
  assignCourier,
  recordDeliveryAndPayment,
  recordCodRemittance,
  getCodReports,
  addOrderNote,
  refundOrder,
  getCourierConfig,
  getKoombiyoPortalPayload,
  bookCourierManual,
  updateCourierDeliveryStatus,
  addCourierNote,
  recordDeliveryAttempt,
  initiateReturnToSender,
  recordReturnInspection,
  getUnresolvedReturnCases,
  getFailedAndReturnOrders,
  getFailureReasonsCatalog,
  getCodAnalytics,
} from '../controllers/orderController';
import { recordCodCollection, recordSettlement } from '../controllers/settlementController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

// Customer Order Creation & Order Status Tracking
router.post('/', createOrder);
router.get('/:id', optionalAuthenticateToken, getOrderById);

// Administrative Order Management & Reports (Protected)
router.get('/', authenticateToken, requireAdmin, getOrders);
router.get('/reports/cod', authenticateToken, requireAdmin, getCodReports);
router.get('/reports/cod-analytics', authenticateToken, requireAdmin, getCodAnalytics);
router.get('/courier/config', authenticateToken, requireAdmin, getCourierConfig);

// Return and Failed Delivery Sub-routes
router.get('/returns/unresolved', authenticateToken, requireAdmin, getUnresolvedReturnCases);
router.get('/returns/failure-reasons', authenticateToken, requireAdmin, getFailureReasonsCatalog);
router.get('/returns/all', authenticateToken, requireAdmin, getFailedAndReturnOrders);

router.get('/:id/courier/portal-payload', authenticateToken, requireAdmin, getKoombiyoPortalPayload);

router.patch('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
router.patch('/:id/confirm-cod', authenticateToken, requireAdmin, confirmCodOrder);
router.patch('/:id/assign-courier', authenticateToken, requireAdmin, assignCourier);
router.patch('/:id/record-delivery', authenticateToken, requireAdmin, recordDeliveryAndPayment);
router.patch('/:id/record-remittance', authenticateToken, requireAdmin, recordCodRemittance);

// Dedicated Koombiyo & Courier Management Endpoints
router.post('/:id/courier/book', authenticateToken, requireAdmin, bookCourierManual);
router.patch('/:id/courier/delivery-status', authenticateToken, requireAdmin, updateCourierDeliveryStatus);
router.post('/:id/courier/notes', authenticateToken, requireAdmin, addCourierNote);

// Failed Delivery & Return-to-Sender Workflow Endpoints
router.post('/:id/delivery-attempt', authenticateToken, requireAdmin, recordDeliveryAttempt);
router.post('/:id/return-to-sender', authenticateToken, requireAdmin, initiateReturnToSender);
router.post('/:id/return-inspection', authenticateToken, requireAdmin, recordReturnInspection);

// COD Collection & Settlement Endpoints
router.patch('/:id/cod-collection', authenticateToken, requireAdmin, recordCodCollection);
router.post('/:id/settle', authenticateToken, requireAdmin, (req, res, next) => {
  req.body.orderId = req.params.id;
  return recordSettlement(req, res, next);
});

router.post('/:id/notes', authenticateToken, requireAdmin, addOrderNote);
router.post('/:id/refund', authenticateToken, requireAdmin, refundOrder);

export default router;
