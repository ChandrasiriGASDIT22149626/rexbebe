import { Router } from 'express';
import {
  getReturns,
  getUnresolvedReturns,
  getFailureReasons,
  recordDeliveryAttempt,
  initiateReturnToSender,
  processReturnInspection,
  createReturnRequest,
} from '../controllers/returnController';

const router = Router();

router.get('/', getReturns);
router.get('/unresolved', getUnresolvedReturns);
router.get('/failure-reasons', getFailureReasons);

router.post('/:id/delivery-attempt', recordDeliveryAttempt);
router.post('/:id/initiate-rts', initiateReturnToSender);
router.post('/:id/inspection', processReturnInspection);
router.post('/', createReturnRequest);

export default router;
