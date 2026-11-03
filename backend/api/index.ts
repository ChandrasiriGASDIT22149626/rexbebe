import app from '../src/app';
import { adminUserService } from '../src/services/adminUserService';

let isInitialized = false;

async function initServerless() {
  if (!isInitialized) {
    try {
      if (process.env.USE_POSTGRES === 'true' && process.env.DATABASE_URL) {
        await adminUserService.ensurePrimaryAdmin();
      }
    } catch (e) {
      console.warn('[Vercel Serverless] Cold-start admin check warning:', e);
    }
    isInitialized = true;
  }
}

export default async function handler(req: any, res: any) {
  await initServerless();
  return app(req, res);
}

