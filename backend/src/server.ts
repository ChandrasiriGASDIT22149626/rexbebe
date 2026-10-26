import app from './app';
import { config } from './config/environment';
import { connectDatabase } from './config/database';
import { adminUserService } from './services/adminUserService';
import { logger } from './utils/logger';

const startServer = async () => {
  await connectDatabase();
  await adminUserService.ensurePrimaryAdmin();

  const PORT = Number(config.port) || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`==================================================`);
    logger.info(` REXBEBE REST API Server running on port ${PORT}`);
    logger.info(` Health Check: http://localhost:${PORT}/api/health`);
    logger.info(` Environment:  ${config.nodeEnv}`);
    logger.info(`==================================================`);
  });
};

startServer();
