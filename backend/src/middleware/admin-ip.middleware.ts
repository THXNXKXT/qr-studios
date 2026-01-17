import type { Context, Next } from 'hono';
import { UnauthorizedError } from '../utils/errors';
import { env } from '../config/env';
import { db } from '../db';
import * as schema from '../db/schema';

export const adminIpMiddleware = async (c: Context, next: Next) => {
  const adminIps = env.ALLOWED_ADMIN_IPS;
  const isProd = env.NODE_ENV === 'production';

  // Only apply in production or if ALLOWED_ADMIN_IPS is set
  if (!isProd && adminIps.length === 0) {
    return await next();
  }

  // Skip check if no IPs are configured even in production
  if (adminIps.length === 0) {
    return await next();
  }

  const forwardedFor = c.req.header('x-forwarded-for');
  const clientIp = forwardedFor?.split(',')[0]?.trim() || 
                   c.req.header('x-real-ip') || 
                   'unknown';

  if (!adminIps.includes(clientIp)) {
    console.warn(`[SECURITY] Blocked admin access attempt from unauthorized IP: ${clientIp}`);
    
    // Log security event
    const user = c.get('user');
    await db.insert(schema.auditLogs).values({
      userId: user?.id || 'anonymous',
      action: 'UNAUTHORIZED_ADMIN_IP_ACCESS',
      entity: 'AdminAccess',
      entityId: clientIp,
      newData: { 
        path: c.req.path,
        method: c.req.method,
        headers: {
          'user-agent': c.req.header('user-agent'),
          'x-forwarded-for': forwardedFor
        }
      },
      ipAddress: clientIp,
      userAgent: c.req.header('user-agent') || null,
    });

    throw new UnauthorizedError('IP address not authorized for admin access');
  }

  await next();
};
