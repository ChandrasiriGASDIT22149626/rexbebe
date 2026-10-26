import { Request, Response, NextFunction } from 'express';
import { SettlementService } from '../services/settlementService';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError } from '../utils/errors';

const settlementService = new SettlementService();

export const getSettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      orderNumber: req.query.orderNumber as string,
      batchRef: req.query.batchRef as string,
      financialStatus: req.query.financialStatus as any,
      courier: req.query.courier as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };
    const settlements = await settlementService.getAllSettlements(filters);
    return sendSuccess(res, settlements, 'Settlement records retrieved');
  } catch (err) {
    next(err);
  }
};

export const getSettlementByOrderId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const settlement = await settlementService.getSettlementByOrderId(orderId);
    if (!settlement) {
      throw new NotFoundError(`No settlement record found for order ${orderId}`);
    }
    return sendSuccess(res, settlement, 'Settlement record retrieved');
  } catch (err) {
    next(err);
  }
};

export const recordSettlement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      orderId,
      orderNumber,
      courierProvider,
      expectedCodAmount,
      courierReportedAmount,
      collectionDate,
      settlementBatchRef,
      settlementDate,
      bankReference,
      documentedDeductions,
      actualAmountReceived,
      discrepancyReason,
      authorizedBy,
      notes,
    } = req.body;

    if (!orderId) {
      throw new BadRequestError('orderId is required');
    }
    if (!settlementBatchRef || !settlementBatchRef.trim()) {
      throw new BadRequestError('Settlement batch or reference number is required');
    }
    if (!bankReference || !bankReference.trim()) {
      throw new BadRequestError('Bank deposit or statement reference is required');
    }
    if (!authorizedBy || !authorizedBy.trim()) {
      throw new BadRequestError('Authorized administrator confirmation is required to record funds received');
    }

    const result = await settlementService.recordSettlement({
      orderId,
      orderNumber,
      courierProvider,
      expectedCodAmount: expectedCodAmount !== undefined ? Number(expectedCodAmount) : undefined,
      courierReportedAmount: courierReportedAmount !== undefined ? Number(courierReportedAmount) : 0,
      collectionDate,
      settlementBatchRef,
      settlementDate,
      bankReference,
      documentedDeductions: documentedDeductions || [],
      actualAmountReceived: Number(actualAmountReceived) || 0,
      discrepancyReason,
      authorizedBy,
      notes,
    });

    const msg = result.isUpdate
      ? `Settlement batch ${settlementBatchRef} updated successfully`
      : `Authorized settlement confirmed & recorded under batch ${settlementBatchRef}`;

    return sendSuccess(res, result, msg, result.isUpdate ? 200 : 201);
  } catch (err) {
    next(err);
  }
};

export const recordCodCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, courierReportedAmount, collectionDate, disputeReason, admin, notes } = req.body;

    if (!status) {
      throw new BadRequestError('status is required (COLLECTION_PENDING, COLLECTED_BY_COURIER, COLLECTION_DISPUTED)');
    }

    const updated = await settlementService.recordCodCollection(id, {
      status,
      courierReportedAmount: courierReportedAmount !== undefined ? Number(courierReportedAmount) : undefined,
      collectionDate,
      disputeReason,
      admin: admin || (req as any).user?.email || 'Admin Staff',
      notes,
    });

    return sendSuccess(res, updated, `COD collection status recorded as '${status}'`);
  } catch (err) {
    next(err);
  }
};

export const getMerchantAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agreement = await settlementService.getMerchantAgreement();
    return sendSuccess(res, agreement, 'Courier merchant agreement retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateMerchantAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await settlementService.updateMerchantAgreement(req.body);
    return sendSuccess(res, updated, 'Courier merchant agreement updated');
  } catch (err) {
    next(err);
  }
};

export const getCodFinancialLedger = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      courier: req.query.courier as string,
      financialStatus: req.query.financialStatus as any,
      search: req.query.search as string,
    };
    const ledger = await settlementService.getCodFinancialLedger(filters);
    return sendSuccess(res, ledger, 'COD financial ledger retrieved');
  } catch (err) {
    next(err);
  }
};
