import { Router, Request, Response } from 'express';
import { promotionService } from '../services/promotionService';
import { sendSuccess, sendError } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

// Public: Get active promotional popup for storefront
router.get('/popup', async (req: Request, res: Response) => {
  try {
    const config = await promotionService.getPublicPopupConfig();
    return sendSuccess(res, config, 'Active promotional popup configuration');
  } catch (err: any) {
    return sendError(res, err.message || 'Error fetching popup configuration', 500);
  }
});

// Admin: Get full promotional popup configuration
router.get('/popup/admin', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await promotionService.getPopupConfig();
    return sendSuccess(res, config, 'Promotional popup management details retrieved');
  } catch (err: any) {
    return sendError(res, err.message || 'Error fetching admin popup configuration', 500);
  }
});

// Admin: Update promotional popup configuration
router.put('/popup/admin', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return sendError(res, 'Invalid configuration payload', 400);
    }

    const updated = await promotionService.updatePopupConfig(payload);
    return sendSuccess(res, updated, 'Promotional popup configuration saved and published successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Error updating popup configuration', 500);
  }
});

export default router;

