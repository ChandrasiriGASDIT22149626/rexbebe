const isProductionEnvironment =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  (typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('rexbebe.com')));

const DEFAULT_PROD_API_URL = 'https://rexbebe.vercel.app/api';
const DEFAULT_DEV_API_URL = 'http://localhost:5000/api';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isProductionEnvironment ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);

export const STORE_NAME = 'REXBEBE';
export const STORE_TAGLINE = 'Luxury Baby & Toddler Boutique';
export const FREE_SHIPPING_THRESHOLD = 50000;
