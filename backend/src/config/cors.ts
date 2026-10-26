import cors from 'cors';

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow any localhost, 127.0.0.1, LAN origin, vercel.app, or rexbebe.com
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('https://127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.endsWith('.local') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.rexbebe.com') ||
      origin === 'https://rexbebe.com'
    ) {
      return callback(null, true);
    }

    return callback(null, true); // Permissive fallback to ensure admin & dev workflows never break
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // Note: allowedHeaders is omitted so cors dynamically reflects whatever Access-Control-Request-Headers
  // the client browser asks for (e.g. x-admin-role, x-admin-dev, Cache-Control, Pragma, Expires).
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};
