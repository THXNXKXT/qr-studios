import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authService } from '../services/auth.service';

export interface AuthUser {
  id: string;
  discordId: string;
  username: string;
  email?: string;
  role: string;
  balance?: number;
  points?: number;
  avatar?: string;
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.substring(7);

  // Check if token is blacklisted
  const isBlacklisted = await authService.isTokenBlacklisted(token);
  if (isBlacklisted) {
    console.warn(`[SECURITY] Blacklisted token used: ${token.substring(0, 10)}...`);
    
    // Log suspicious activity
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.id) {
        await db.insert(schema.auditLogs).values({
          userId: decoded.id,
          action: 'BLACKLISTED_TOKEN_USE_ATTEMPT',
          entity: 'User',
          entityId: decoded.id,
          newData: { token: token.substring(0, 10) + '...' },
          ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || null,
          userAgent: c.req.header('user-agent') || null,
        });
      }
    } catch (e) {
      // Ignore decode errors
    }

    throw new UnauthorizedError('Token has been revoked');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, decoded.id),
      columns: {
        id: true,
        discordId: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        balance: true,
        points: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isBanned) {
      throw new UnauthorizedError('User is banned');
    }

    c.set('user', user);
    await next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw error;
  }
};

export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return await next();
  }

  const token = authHeader.substring(7);

  try {
    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return await next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, decoded.id),
      columns: {
        id: true,
        discordId: true,
        username: true,
        email: true,
        role: true,
        isBanned: true,
        balance: true,
        points: true,
        avatar: true,
      },
    });

    if (user && !user.isBanned) {
      c.set('user', user);
    }
  } catch (error) {
    // Ignore error and continue as guest
  }
  
  await next();
};

export const adminMiddleware = async (c: Context, next: Next) => {
  const user = c.get('user') as AuthUser;
  
  if (!user) {
    console.warn('[SECURITY] Admin access attempt without user session');
    throw new UnauthorizedError('Authentication required');
  }

  const isWhitelisted = env.ADMIN_DISCORD_IDS.includes(user.discordId);
  const isAuthorized = user.role === 'ADMIN' || user.role === 'MODERATOR' || isWhitelisted;

  if (!isAuthorized) {
    console.warn(`[SECURITY] Unauthorized admin access attempt by user: ${user.username} (${user.discordId})`);
    
    // Log unauthorized attempt
    try {
      await db.insert(schema.auditLogs).values({
        userId: user.id,
        action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
        entity: 'User',
        entityId: user.id,
        newData: { role: user.role, discordId: user.discordId },
        ipAddress: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || null,
        userAgent: c.req.header('user-agent') || null,
      });
    } catch (e) {
      // Ignore logging errors
    }

    throw new UnauthorizedError('Admin access required');
  }

  await next();
};
