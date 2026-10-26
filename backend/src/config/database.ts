import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Instantiate PrismaClient with fallback error logging
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export const connectDatabase = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully via Prisma');
    return true;
  } catch (error) {
    logger.warn('Database connection unavailable - fallback in-memory database active for dev');
    return false;
  }
};
