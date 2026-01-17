import { cors } from 'hono/cors';
import { env } from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, c) => {
    // Only log in development
    if (env.NODE_ENV === 'development') {
      console.log(`[CORS] Request from origin: ${origin} for path: ${c.req.path}`);
    }
    const allowed = [
      env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:4001',
      'http://127.0.0.1:4001'
    ];

    // Check if origin is in allowed list or matches LAN IP patterns
    const isLan = origin && (
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
      /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin)
    );

    const isAllowed = allowed.includes(origin) || !origin || isLan;
    if (!isAllowed) console.warn(`[CORS] Origin ${origin} not allowed`);
    return isAllowed ? origin : env.FRONTEND_URL;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
});
