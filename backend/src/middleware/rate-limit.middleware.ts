import type { Context, Next } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { TooManyRequestsError } from '../utils/errors';
import { env } from '../config/env';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// Use environment-aware limits
const isDevelopment = env.NODE_ENV === 'development';

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  devMax?: number; // Optional higher limit for development
  message?: string;
  keyGenerator?: (c: Context) => string | Promise<string>;
}) => {
  const store: RateLimitStore = {};

  const {
    windowMs,
    max,
    devMax,
    message = 'Too many requests, please try again later',
    keyGenerator = async (c: Context) => {
      // Use user ID as key if authenticated to prevent IP-based collisions in Docker/proxies
      const user = c.get('user');
      if (user?.id) return `user:${user.id}`;

      const info = getConnInfo(c);
      const remoteAddr = info.remote.address || 'unknown';

      const cfIp = c.req.header('cf-connecting-ip');
      if (cfIp) return cfIp;

      const forwardedFor = c.req.header('x-forwarded-for');
      if (forwardedFor) {
        const firstIp = forwardedFor.split(',')[0];
        if (firstIp) return firstIp.trim();
      }

      const realIp = c.req.header('x-real-ip');
      if (realIp) return realIp;

      return remoteAddr;
    },
  } = options;

  // Use devMax in development if provided, otherwise use max
  const effectiveMax = isDevelopment && devMax !== undefined ? devMax : max;

  // Cleanup expired entries for this specific store
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      const entry = store[key];
      if (entry && entry.resetAt < now) {
        delete store[key];
      }
    });
  }, 60 * 1000);

  // Prevent memory leak in tests
  if (typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref();
  }

  return async (c: Context, next: Next) => {
    const key = await keyGenerator(c);
    const now = Date.now();

    // Only log in development
    if (isDevelopment) {
      console.log(`[RateLimit] Checking key: ${key} for route: ${c.req.path}`);
    }

    if (!store[key] || store[key].resetAt < now) {
      store[key] = {
        count: 1,
        resetAt: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    if (store[key].count > effectiveMax) {
      console.warn(`[RateLimit] Limit exceeded for key: ${key}. Count: ${store[key].count}, Max: ${effectiveMax}`);
      const retryAfter = Math.ceil((store[key].resetAt - now) / 1000);
      c.header('Retry-After', retryAfter.toString());
      c.header('X-RateLimit-Limit', effectiveMax.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', store[key].resetAt.toString());

      throw new TooManyRequestsError(message);
    }

    c.header('X-RateLimit-Limit', effectiveMax.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, effectiveMax - store[key].count).toString());
    c.header('X-RateLimit-Reset', store[key].resetAt.toString());

    await next();
  };
};

// License verification - strict limit
export const licenseVerifyRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many license verification attempts',
  keyGenerator: (c) => {
    const licenseKey = c.req.query('key') || c.req.header('x-license-key') || 'unknown';
    const info = getConnInfo(c);
    const remoteAddr = info.remote.address || 'unknown';
    return `license:${licenseKey}:${remoteAddr}`;
  },
});

// General API rate limit
export const apiRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150, // Production: 150 requests per 5 minutes
  devMax: 1000, // Development: higher for testing
});

// Auth refresh rate limit
export const authRefreshRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: 'Too many refresh attempts, please try again later',
});

// Auth session creation rate limit
export const authSessionRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  devMax: 30,
  message: 'Too many session creation attempts, please try again later',
});

// Order creation rate limit
export const orderCreationRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  devMax: 50,
  message: 'Too many orders created, please try again later',
});

// Review creation rate limit
export const reviewCreationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many reviews submitted, please try again later',
});

// Commission creation rate limit
export const commissionCreationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many commission requests, please try again later',
});

// Lucky wheel rate limit
export const luckyWheelRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10, // Production: 10 spins per 5 minutes
  devMax: 50,
  message: 'คุณหมุนวงล้อบ่อยเกินไป กรุณารอสักครู่',
});

// Promo validation rate limit
export const promoValidationRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: 'คุณตรวจสอบคูปองบ่อยเกินไป กรุณารอสักครู่',
});

// Top-up creation rate limit
export const topupCreationRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10, // Production: 10 top-up attempts per 5 minutes
  devMax: 100, // Development: higher for testing
  message: 'Too many top-up attempts, please try again later',
});
