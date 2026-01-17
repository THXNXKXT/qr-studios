import { serve } from '@hono/node-server';
import * as Sentry from "@sentry/bun";
import app from './app';
import { env } from './config/env';
import { cronService } from './services/cron.service';
import { cacheService } from './services/cache.service';

// Initialize Sentry with enhanced configuration
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Capture 100% of transactions in development, 20% in production
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    // Capture 100% of errors
    sampleRate: 1.0,
    // Enable performance monitoring
    integrations: [
      Sentry.httpIntegration(),
    ],
    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
  console.log('🚀 Sentry initialized');
} else if (env.NODE_ENV === 'production') {
  console.warn('⚠️ SENTRY_DSN not configured - error monitoring disabled');
}

const port = env.PORT || 4001;

console.log(`🚀 Starting QR Studios Backend...`);
console.log(`📦 Environment: ${env.NODE_ENV}`);
console.log(`🔗 Server running on ${env.API_URL}`);

// Initialize cron jobs
cronService.init();

const server = serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down QR Studios Backend...');

  // 1. Stop accepting new connections
  server.close();

  // 2. Close cache/Redis connection
  await cacheService.shutdown();

  // 3. Flush Sentry events
  if (env.SENTRY_DSN) {
    await Sentry.close(2000);
  }

  console.log('✅ Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

