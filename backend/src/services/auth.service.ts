import jwt, { type SignOptions } from 'jsonwebtoken';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, lt } from 'drizzle-orm';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { trackedQuery, logger as baseLogger } from '../utils';

export interface TokenPayload {
  id: string;
  discordId: string;
  username: string;
  email?: string;
  role: string;
  points: number;
  avatar?: string;
}

const logger = baseLogger.child('[AuthService]');

class AuthService {
  private logger = logger;

  async syncUser(accessToken: string) {
    this.logger.info('Syncing user with Discord access token...');
    try {
      // 1. Verify token with Discord API
      const discordResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!discordResponse.ok) {
        this.logger.error('Discord API verification failed', { status: discordResponse.statusText });
        throw new UnauthorizedError('Failed to verify Discord access token');
      }

      const discordData = await discordResponse.json() as {
        id: string;
        username: string;
        email?: string;
        avatar?: string;
      };

      this.logger.info('Discord data verified for user', { username: discordData.username });

      // Use upsert-like logic with Drizzle to handle race conditions during concurrent syncs for the same user
      const avatarUrl = discordData.avatar ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png` : null;
      
      const usersResult = await trackedQuery(async () => {
        return await db.insert(schema.users)
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
      }, 'auth.syncUser.upsert');
      
      const user = usersResult[0];
      if (!user) throw new Error('Failed to sync user');
      
      this.logger.info('Generating token pair for user', { userId: user.id });
      const tokens = await this.generateTokenPair({
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        email: user.email || undefined,
        role: user.role,
        points: user.points,
        avatar: user.avatar || undefined,
      });

      this.logger.info('Sync successful', { userId: user.id });
      return { user, ...tokens };
    } catch (error: any) {
      this.logger.error('Sync failed', error);
      throw error;
    }
  }

  async refreshToken(token: string, ipAddress?: string, userAgent?: string) {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const storedToken = await trackedQuery(async () => {
      return await db.query.refreshTokens.findFirst({
        where: eq(schema.refreshTokens.token, token),
        with: {
          user: true,
        },
      });
    }, 'auth.refreshToken.find');

    if (!storedToken) {
      // REUSE DETECTION: Token is validly signed but not in DB
      // This means it was either revoked or already used (rotated)
      this.logger.warn('Refresh token reuse detected', { userId: payload.id });
      
      await this.revokeRefreshTokens(payload.id);
      
      // Log security event
      await trackedQuery(async () => {
        return await db.insert(schema.auditLogs).values({
          userId: payload.id,
          action: 'REFRESH_TOKEN_REUSE_ATTEMPT',
          entity: 'User',
          entityId: payload.id,
          newData: { token: token.substring(0, 10) + '...' },
          ipAddress,
          userAgent,
        });
      }, 'auth.refreshToken.logReuse');

      throw new UnauthorizedError('Security breach detected. Please sign in again.');
    }

    if (storedToken.expiresAt < new Date()) {
      await trackedQuery(async () => {
        return await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, token));
      }, 'auth.refreshToken.deleteExpired');
      throw new UnauthorizedError('Refresh token expired');
    }

    // Generate new pair (Rotation)
    await trackedQuery(async () => {
      return await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, token));
    }, 'auth.refreshToken.deleteOld');
    
    const user = storedToken.user as any;
    const tokens = await this.generateTokenPair({
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      email: user.email || undefined,
      role: user.role,
      points: user.points,
      avatar: user.avatar || undefined,
    });

    return tokens;
  }

  async blacklistToken(token: string) {
    const decoded = jwt.decode(token) as { exp: number };
    if (decoded && decoded.exp) {
      await trackedQuery(async () => {
        return await db.insert(schema.blacklistedTokens).values({
          token,
          expiresAt: new Date(decoded.exp * 1000),
        }).onConflictDoNothing();
      }, 'auth.blacklistToken');
    }
  }

  async cleanupExpiredBlacklistedTokens() {
    const now = new Date();
    await trackedQuery(async () => {
      return await db.delete(schema.blacklistedTokens)
        .where(lt(schema.blacklistedTokens.expiresAt, now));
    }, 'auth.cleanupExpiredTokens');
  }

  async isTokenBlacklisted(token: string) {
    return await trackedQuery(async () => {
      const blacklisted = await db.query.blacklistedTokens.findFirst({
        where: eq(schema.blacklistedTokens.token, token),
      });
      return !!blacklisted;
    }, 'auth.isTokenBlacklisted');
  }

  async revokeRefreshTokens(userId: string) {
    await trackedQuery(async () => {
      return await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
    }, 'auth.revokeRefreshTokens');
  }

  async generateTokenPair(user: TokenPayload) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

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

    await trackedQuery(async () => {
      return await db.insert(schema.refreshTokens).values({
        token: refreshToken,
        userId: user.id,
        expiresAt,
      });
    }, 'auth.generateTokenPair.insert');

    return { accessToken, refreshToken };
  }

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
  }

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
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}

export const authService = new AuthService();
