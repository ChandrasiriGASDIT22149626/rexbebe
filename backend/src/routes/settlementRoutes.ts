import { Router } from 'express';
import {
  getSettlements,
  getSettlementByOrderId,
  recordSettlement,
  recordCodCollection,
  getMerchantAgreement,
  updateMerchantAgreement,
  getCodFinancialLedger,
} from '../controllers/settlementController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

// Restrict all COD financial records and settlement operations to authorized administrators
router.use(authenticateToken, requireAdmin);

router.get('/', getSettlements);
router.post('/', recordSettlement);
router.get('/ledger', getCodFinancialLedger);
router.get('/reports', getCodFinancialLedger);
router.get('/agreement-config', getMerchantAgreement);
router.put('/agreement-config', updateMerchantAgreement);
router.patch('/orders/:id/cod-collection', recordCodCollection);
router.get('/orders/:orderId', getSettlementByOrderId);

export default router;
