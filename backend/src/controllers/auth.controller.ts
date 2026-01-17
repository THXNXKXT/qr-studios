import type { Context } from 'hono';
import { authService } from '../services/auth.service';
import { success } from '../utils/response';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { UnauthorizedError } from '../utils/errors';
import { refreshTokenSchema, syncUserSchema } from '../schemas';

export const authController = {
  async getSession(c: Context) {
    const user = c.get('user');
    
    // Calculate total spent for tier info
    const [totalSpentResult] = await db.select({
      total: sql<number>`sum(${schema.orders.total})`
    })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.userId, user.id),
        eq(schema.orders.status, 'COMPLETED')
      )
    );

    const userWithBalance = {
      ...user,
      balance: user?.balance || 0,
      points: user?.points || 0,
      totalSpent: Number(totalSpentResult?.total || 0)
    };
    return success(c, { user: userWithBalance });
  },

  async createSession(c: Context) {
    try {
      const body = await c.req.json();
      
      const parsed = syncUserSchema.safeParse(body);
      if (!parsed.success) {
        console.error('[AUTH] Schema validation failed:', parsed.error.format());
        return c.json({ success: false, error: 'Invalid authentication data', details: parsed.error.format() }, 400);
      }

      const { accessToken } = parsed.data;
      const result = await authService.syncUser(accessToken);
      
      console.log('[AUTH] Session created for user:', result.user.username);
      return success(c, result, 'Session created successfully');
    } catch (error: any) {
      console.error('[AUTH] Failed to create session:', error);
      if (error instanceof UnauthorizedError) {
        return c.json({ success: false, error: error.message }, 401);
      }
      return c.json({ 
        success: false, 
        error: 'Internal Server Error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      }, 500);
    }
  },

  async signOut(c: Context) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await authService.blacklistToken(token);
    }

    const user = c.get('user');
    if (user) {
      await authService.revokeRefreshTokens(user.id);
    }

    return success(c, null, 'Signed out successfully');
  },

  async refresh(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = refreshTokenSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ success: false, error: 'Invalid refresh token data', details: parsed.error.format() }, 400);
      }

      const { refreshToken } = parsed.data;
      const forwardedFor = c.req.header('x-forwarded-for');
      const ipAddress = forwardedFor?.split(',')[0]?.trim() || c.req.header('x-real-ip');
      const userAgent = c.req.header('user-agent');

      const tokens = await authService.refreshToken(refreshToken, ipAddress, userAgent);
      return success(c, tokens, 'Token refreshed successfully');
    } catch (error: any) {
      console.error('[AUTH] Refresh failed:', error);
      if (error instanceof UnauthorizedError) {
        return c.json({ success: false, error: error.message }, 401);
      }
      return c.json({ 
        success: false, 
        error: 'Internal Server Error', 
        message: error.message 
      }, 500);
    }
  },
};
