import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[Error] ${req.method} ${req.url} - ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  return sendError(res, 'Internal Server Error', 500, process.env.NODE_ENV === 'development' ? err.message : undefined);
};
