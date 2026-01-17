import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { csrf } from 'hono/csrf';
import { etag } from 'hono/etag';
import { env } from './config/env';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorHandler } from './middleware/error.middleware';
import { cacheService } from './services/cache.service';

// Import routes
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import productsRoutes from './routes/products.routes';
import ordersRoutes from './routes/orders.routes';
import checkoutRoutes from './routes/checkout.routes';
import promoRoutes from './routes/promo.routes';
import topupRoutes from './routes/topup.routes';
import webhooksRoutes from './routes/webhooks.routes';
import licensesRoutes from './routes/licenses.routes';
import wishlistRoutes from './routes/wishlist.routes';
import commissionRoutes from './routes/commission.routes';
import statsRoutes from './routes/stats.routes';
import adminRoutes from './routes/admin.routes';
import announcementsRoutes from './routes/announcements.routes';
import luckyWheelRoutes from './routes/lucky-wheel.routes';
import docsApp from './docs';

import { apiRateLimit } from './middleware/rate-limit.middleware';
import { requestSizeLimit } from './middleware/size-limit.middleware';
import { visitorTracker } from './middleware/visitor.middleware';
import { httpsEnforcement } from './middleware/https.middleware';

const app = new Hono({ strict: false });

// Global middleware
app.use('*', corsMiddleware);
app.use('*', etag());
app.use('*', httpsEnforcement);
app.use('*', secureHeaders());
app.use('*', csrf({
  origin: (origin, c) => {
    const allowed = [
      env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:4001',
      'http://127.0.0.1:4001'
    ];

    if (allowed.includes(origin)) return true;

    const isLan = /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin);

    return isLan;
  }
}));
app.use('*', logger());
app.use('*', apiRateLimit);
app.use('*', requestSizeLimit(5 * 1024 * 1024)); // 5MB limit
app.use('*', visitorTracker);

// Simple health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Comprehensive health check for monitoring
app.get('/health/detailed', async (c) => {
  const startTime = Date.now();

  // Check cache/Redis
  const cacheHealth = await cacheService.healthCheck();
  const cacheStats = cacheService.getStats();

  const responseTime = Date.now() - startTime;

  // Determine overall status
  const isHealthy = cacheHealth.status === 'ok';
  const status = isHealthy ? 'healthy' : 'degraded';

  return c.json({
    status,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    responseTimeMs: responseTime,
    services: {
      cache: {
        status: cacheHealth.status,
        backend: cacheHealth.backend,
        memorySize: cacheStats.memorySize,
      },
      sentry: {
        enabled: !!env.SENTRY_DSN,
      },
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
    },
  }, isHealthy ? 200 : 503);
});

// API info
app.get('/api', (c) => {
  return c.json({
    message: 'QR Studios API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      checkout: '/api/checkout',
      promo: '/api/promo',
      topup: '/api/topup',
      webhooks: '/api/webhooks',
      licenses: '/api/licenses',
      wishlist: '/api/wishlist',
      commission: '/api/commission',
      admin: '/api/admin',
      announcements: '/api/announcements',
      luckyWheel: '/api/lucky-wheel',
      docs: '/api/docs/ui',
    },
  });
});

// Documentation
app.route('/api/docs', docsApp);

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/checkout', checkoutRoutes);
app.route('/api/promo', promoRoutes);
app.route('/api/topup', topupRoutes);
app.route('/api/webhooks', webhooksRoutes);
app.route('/api/licenses', licensesRoutes);
app.route('/api/wishlist', wishlistRoutes);
app.route('/api/commissions', commissionRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/announcements', announcementsRoutes);
app.route('/api/lucky-wheel', luckyWheelRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    path: c.req.path,
  }, 404);
});

// Error handler
app.onError(errorHandler);

export default app;
