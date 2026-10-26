import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/errorMiddleware';
import { rateLimiter } from './middleware/rateLimitMiddleware';

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import customerRoutes from './routes/customerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import couponRoutes from './routes/couponRoutes';
import returnRoutes from './routes/returnRoutes';

import deliveryRoutes from './routes/deliveryRoutes';
import adminRoutes from './routes/adminRoutes';
import navigationRoutes from './routes/navigationRoutes';
import uploadRoutes from './routes/uploadRoutes';
import collectionRoutes from './routes/collectionRoutes';
import pageRoutes from './routes/pageRoutes';
import contactRoutes from './routes/contactRoutes';
import fabricRoutes from './routes/fabricRoutes';
import settlementRoutes from './routes/settlementRoutes';
import notificationRoutes from './routes/notificationRoutes';
import wishlistRoutes from './routes/wishlistRoutes';

const app = express();

// Global Middlewares
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(rateLimiter);

// Serve uploads statically with long-term immutable caching & ETag
const backendUploads = path.resolve(__dirname, '../uploads');
const frontendUploads = path.resolve(__dirname, '../../frontend/public/uploads');
app.use('/uploads', express.static(backendUploads, { maxAge: '30d', etag: true }));
app.use('/uploads', express.static(frontendUploads, { maxAge: '30d', etag: true }));

// Root API Index & Health Check
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'REXBEBE REST API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      categories: '/api/categories',
      auth: '/api/auth',
      cart: '/api/cart',
      orders: '/api/orders',
      delivery: '/api/delivery-settings',
      payments: '/api/payments',
      customers: '/api/customers',
      inventory: '/api/inventory',
      coupons: '/api/coupons',
      returns: '/api/returns',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'REXBEBE E-Commerce Backend Service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// REST API Routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-settings', deliveryRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fabric', fabricRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
