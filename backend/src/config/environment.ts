import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'rexbebe_super_secure_admin_jwt_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  admin: {
    initialEmail: process.env.ADMIN_INITIAL_EMAIL || process.env.ADMIN_EMAIL || 'admin@rexbebe.com',
    initialUsername: process.env.ADMIN_INITIAL_USERNAME || process.env.ADMIN_USERNAME || 'admin',
    initialPassword: process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@Rexbebe2026!',
  },
  payments: {
    payhere: {
      merchantId: process.env.PAYHERE_MERCHANT_ID || '',
      secret: process.env.PAYHERE_SECRET || '',
    },
    onepay: {
      merchantId: process.env.ONEPAY_MERCHANT_ID || '',
      secret: process.env.ONEPAY_SECRET || '',
    },
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT) || 2525,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@rexbebe.com',
  },
};
