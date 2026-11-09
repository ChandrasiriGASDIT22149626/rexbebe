import cors from 'cors';

const ALLOWED_STATIC_ORIGINS = [
  'https://rexbebe-mz3p.vercel.app',
  'https://rexbebe.vercel.app',
  'https://rexbebe.com',
  'https://www.rexbebe.com',
];

// Dynamically integrate origins from environment variables (comma-separated or single)
function getCustomOrigins(): string[] {
  const origins: string[] = [];
  const envFrontend = process.env.FRONTEND_URL;
  const envAllowed = process.env.ALLOWED_ORIGINS;

  if (envFrontend) {
    envFrontend.split(',').forEach((o) => {
      const trimmed = o.trim().replace(/\/$/, '');
      if (trimmed && !origins.includes(trimmed)) origins.push(trimmed);
    });
  }

  if (envAllowed) {
    envAllowed.split(',').forEach((o) => {
      const trimmed = o.trim().replace(/\/$/, '');
      if (trimmed && !origins.includes(trimmed)) origins.push(trimmed);
    });
  }

  return origins;
}

// Check if an origin is an authorized REXBEBE production or preview domain
function isAuthorizedProductionOrigin(origin: string): boolean {
  const normalized = origin.toLowerCase().replace(/\/$/, '');
  const customOrigins = getCustomOrigins();

  if (ALLOWED_STATIC_ORIGINS.some((allowed) => allowed.toLowerCase() === normalized)) {
    return true;
  }

  if (customOrigins.some((allowed) => allowed.toLowerCase() === normalized)) {
    return true;
  }

  // Strictly match legitimate REXBEBE Vercel preview and branch deployments
  // Matches: https://rexbebe.vercel.app, https://rexbebe-*.vercel.app, https://rexbebe-mz3p-*.vercel.app
  const vercelRexbebePattern = /^https:\/\/rexbebe(-[a-z0-9_-]+)?\.vercel\.app$/;
  if (vercelRexbebePattern.test(normalized)) {
    return true;
  }

  return false;
}

// Check if an origin is an authorized local development domain
function isAuthorizedDevelopmentOrigin(origin: string): boolean {
  return (
    origin.startsWith('http://localhost') ||
    origin.startsWith('https://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    origin.startsWith('https://127.0.0.1') ||
    origin.startsWith('http://192.168.') ||
    origin.startsWith('http://10.') ||
    origin.endsWith('.local')
  );
}

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // 1. Allow server-to-server, curl, mobile apps, or webhooks without browser Origin header
    if (!origin) {
      return callback(null, true);
    }

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    // 2. Production domain validation
    if (isAuthorizedProductionOrigin(origin)) {
      return callback(null, true);
    }

    // 3. In non-production environments, allow local development ports and LAN devices
    if (!isProduction && isAuthorizedDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    // 4. Reject unauthorized origins safely by passing false (NOT throwing an Error)
    // Passing false sets no CORS headers so the browser cleanly blocks the request
    // without triggering Express 500 error handlers that pollute logs and break preflight.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Idempotency-Key',
    'x-admin-token',
    'x-access-token',
    'x-admin-role',
    'x-admin-dev',
    'Cache-Control',
    'Pragma',
    'Expires',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Idempotency-Key'],
  maxAge: 86400, // Cache preflight response for 24 hours
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204, standard modern browsers expect 204
};
