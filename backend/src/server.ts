import app from './app';
import { config } from './config/environment';
import { connectDatabase, db } from './config/database';
import { adminUserService } from './services/adminUserService';
import { logger } from './utils/logger';

const startServer = async () => {
  await connectDatabase();
  await adminUserService.ensurePrimaryAdmin();

  const PORT = Number(config.port) || 5000;
  const server = app.listen(PORT, () => {
    logger.info(`==================================================`);
    logger.info(` REXBEBE REST API Server running on port ${PORT}`);
    logger.info(` Health Check: http://localhost:${PORT}/api/health`);
    logger.info(` Environment:  ${config.nodeEnv}`);
    logger.info(`==================================================`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully closing HTTP server and database pool...`);
    server.close(async () => {
      try {
        await db.close();
        logger.info('Database pool closed cleanly.');
      } catch (err) {
        logger.error('Error closing database pool:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
