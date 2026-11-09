import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[Error] ${req.method} ${req.url} - ${err.message}`, err.stack);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err.status === 413 || err.type === 'entity.too.large') {
    return sendError(res, 'Payload too large. Maximum allowed size is 15MB.', 413);
  }

  const statusCode = err.status || err.statusCode || 500;
  return sendError(res, statusCode === 500 ? 'Internal Server Error' : err.message, statusCode, process.env.NODE_ENV === 'development' ? err.message : undefined);
};
