import jwt, { type SignOptions } from 'jsonwebtoken';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface TokenPayload {
  id: string;
  discordId: string;
  username: string;
  email?: string;
  role: string;
  points: number;
  avatar?: string;
}

export const authService = {
  async syncUser(accessToken: string) {
    logger.info('Syncing user with Discord access token...');
    try {
      // 1. Verify token with Discord API
      const discordResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!discordResponse.ok) {
        logger.error('Discord API verification failed', { status: discordResponse.statusText });
        throw new UnauthorizedError('Failed to verify Discord access token');
      }

      const discordData = await discordResponse.json() as {
        id: string;
        username: string;
        email?: string;
        avatar?: string;
      };

      logger.info('Discord data verified for user', { username: discordData.username });

      // Use upsert-like logic with Drizzle to handle race conditions during concurrent syncs for the same user
      const avatarUrl = discordData.avatar ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png` : null;
      
      const usersResult = await db.insert(schema.users)
        .values({
          discordId: discordData.id,
          username: discordData.username,
          email: discordData.email,
          avatar: avatarUrl,
        })
        .onConflictDoUpdate({
          target: schema.users.discordId,
          set: {
            username: discordData.username,
            email: discordData.email,
            avatar: avatarUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      
      const user = usersResult[0];
      if (!user) throw new Error('Failed to sync user');
      
      logger.info('Generating token pair for user', { userId: user.id });
      const tokens = await authService.generateTokenPair({
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        email: user.email || undefined,
        role: user.role,
        points: user.points,
        avatar: user.avatar || undefined,
      });

      logger.info('Sync successful', { userId: user.id });
      return { user, ...tokens };
    } catch (error: any) {
      logger.error('Sync failed', error);
      throw error;
    }
  },

  async refreshToken(token: string, ipAddress?: string, userAgent?: string) {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const storedToken = await db.query.refreshTokens.findFirst({
      where: eq(schema.refreshTokens.token, token),
      with: {
        user: true,
      },
    });

    if (!storedToken) {
      // REUSE DETECTION: Token is validly signed but not in DB
      // This means it was either revoked or already used (rotated)
      logger.warn('Refresh token reuse detected', { userId: payload.id });
      
      await authService.revokeRefreshTokens(payload.id);
      
      // Log security event
      await db.insert(schema.auditLogs).values({
        userId: payload.id,
        action: 'REFRESH_TOKEN_REUSE_ATTEMPT',
        entity: 'User',
        entityId: payload.id,
        newData: { token: token.substring(0, 10) + '...' },
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedError('Security breach detected. Please sign in again.');
    }

    if (storedToken.expiresAt < new Date()) {
      await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, token));
      throw new UnauthorizedError('Refresh token expired');
    }

    // Generate new pair (Rotation)
    await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, token));
    
    const user = storedToken.user as any; // Cast to any temporarily if relations are not strictly typed
    const tokens = await authService.generateTokenPair({
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      email: user.email || undefined,
      role: user.role,
      points: user.points,
      avatar: user.avatar || undefined,
    });

    return tokens;
  },

  async blacklistToken(token: string) {
    const decoded = jwt.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      await db.insert(schema.blacklistedTokens).values({
        token,
        expiresAt: new Date(decoded.exp * 1000),
      }).onConflictDoNothing();
    }
  },

  async cleanupExpiredBlacklistedTokens() {
    const now = new Date();
    await db.delete(schema.blacklistedTokens)
      .where(lt(schema.blacklistedTokens.expiresAt, now));
  },

  async isTokenBlacklisted(token: string) {
    const blacklisted = await db.query.blacklistedTokens.findFirst({
      where: eq(schema.blacklistedTokens.token, token),
    });
    return !!blacklisted;
  },

  async revokeRefreshTokens(userId: string) {
    await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
  },

  async generateTokenPair(user: TokenPayload) {
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    const expiresAt = new Date();
    // Parse JWT_REFRESH_EXPIRES_IN (e.g., '7d', '1h', '30m') to milliseconds
    const expiresInMatch = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhm])$/);
    if (expiresInMatch) {
      const value = parseInt(expiresInMatch[1]!);
      const unit = expiresInMatch[2]!;
      const multiplier = unit === 'd' ? 24 * 60 * 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 60 * 1000;
      expiresAt.setTime(expiresAt.getTime() + value * multiplier);
    } else {
      // Default to 7 days if parsing fails
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await db.insert(schema.refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  },

  generateAccessToken(user: TokenPayload): string {
    // Minimal payload - only essential data for auth
    const payload = {
      id: user.id,
      discordId: user.discordId,
      role: user.role,
    };
    
    const options: SignOptions = {
      expiresIn: (env.JWT_EXPIRES_IN as any) || '15m'
    };
    
    return jwt.sign(payload, env.JWT_SECRET, options);
  },

  generateRefreshToken(user: TokenPayload): string {
    // Minimal payload for refresh token
    const payload = {
      id: user.id,
      discordId: user.discordId,
    };
    
    const options: SignOptions = {
      expiresIn: (env.JWT_REFRESH_EXPIRES_IN as any) || '7d'
    };
    
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
  },

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  },
};
