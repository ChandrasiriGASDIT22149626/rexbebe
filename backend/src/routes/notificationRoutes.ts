import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { AuditService } from '../services/auditService';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

router.use(authenticateToken, requireAdmin);

// 1. Get gateway configuration status
router.get('/status', (req: Request, res: Response) => {
  const config = NotificationService.getGatewayConfig();
  res.json({
    success: true,
    data: config,
  });
});

// 2. Get recent notifications
router.get('/recent', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const list = NotificationService.getRecentNotifications(limit);
  res.json({
    success: true,
    data: list,
    count: list.length,
  });
});

// 3. Get notifications for a specific order
router.get('/order/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const list = NotificationService.getNotificationsByOrder(orderId);
  res.json({
    success: true,
    data: list,
    count: list.length,
  });
});

// 4. Manually trigger / resend notification with audit trail
router.post('/resend', async (req: Request, res: Response) => {
  const { orderNumber, orderId, eventType, channel, recipient, message, admin } = req.body;
  if (!orderNumber || !eventType || !channel || !recipient || !message) {
    return res.status(400).json({
      success: false,
      message: 'Missing required notification fields (orderNumber, eventType, channel, recipient, message)',
    });
  }

  const record = await NotificationService.dispatch({
    orderNumber,
    orderId,
    eventType,
    channel,
    recipient,
    message,
    subject: `REXBEBE Notification #${orderNumber}`,
  });

  AuditService.record({
    actingAdministrator: admin || 'Manual Admin Trigger',
    affectedRecord: `Order #${orderNumber}`,
    action: 'MANUAL_NOTIFICATION_DISPATCH',
    reason: `Manual re-dispatch via ${channel}`,
    details: { record },
  });

  res.json({
    success: true,
    data: record,
    message: record.confirmedSuccess
      ? 'Notification delivered successfully through confirmed gateway'
      : `Notification logged as ${record.status}. Notice: ${record.failureReason || 'Provider unconfigured'}`,
  });
});

export default router;
