import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
    if (missing.length > 0) {
      return next(new BadRequestError(`Missing required fields: ${missing.join(', ')}`));
    }
    next();
  };
};
