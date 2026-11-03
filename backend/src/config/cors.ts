import cors from 'cors';

const ALLOWED_PRODUCTION_ORIGINS = [
  'https://rexbebe-mz3p.vercel.app',
  'https://rexbebe.vercel.app',
  'https://rexbebe.com',
  'https://www.rexbebe.com',
];

if (process.env.FRONTEND_URL) {
  const customOrigin = process.env.FRONTEND_URL.replace(/\/$/, '');
  if (!ALLOWED_PRODUCTION_ORIGINS.includes(customOrigin)) {
    ALLOWED_PRODUCTION_ORIGINS.push(customOrigin);
  }
}

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server, webhooks)
    if (!origin) return callback(null, true);

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    // In development, allow localhost, 127.0.0.1, and local area network origins
    if (!isProduction) {
      if (
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('https://127.0.0.1') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.endsWith('.local')
      ) {
        return callback(null, true);
      }
    }

    // In production, strictly allow only approved REXBEBE frontend domains
    if (ALLOWED_PRODUCTION_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // In development mode only, allow fallback
    if (!isProduction) {
      return callback(null, true);
    }

    // Reject all other unauthorized domains in production
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};
