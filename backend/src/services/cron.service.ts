import cron from 'node-cron';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, lt, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

import { authService } from './auth.service';

export const cronService = {
  init() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
      logger.info('Starting database cleanup');
      await Promise.all([
        cronService.cleanupExpiredTokens(),
        cronService.cleanupOldAuditLogs(),
        authService.cleanupExpiredBlacklistedTokens(),
      ]);
    });

    // Run every hour for blacklisted tokens (more frequent as they are small and critical)
    cron.schedule('0 * * * *', async () => {
      await authService.cleanupExpiredBlacklistedTokens();
    });

    // Run every minute to check and update expired flash sales
    cron.schedule('* * * * *', async () => {
      await cronService.updateExpiredFlashSales();
    });

    logger.info('Cron jobs initialized successfully');
  },

  async updateExpiredFlashSales() {
    try {
      const now = new Date();
      
      const result = await db.update(schema.products)
        .set({ isFlashSale: false })
        .where(
          and(
            eq(schema.products.isFlashSale, true),
            lt(schema.products.flashSaleEnds, now)
          )
        )
        .returning();

      if (result.length > 0) {
        logger.info(`Updated ${result.length} expired flash sales to inactive`);
      }
    } catch (error) {
      logger.error('Error updating expired flash sales', error as Error);
    }
  },

  async cleanupExpiredTokens() {
    try {
      const now = new Date();
      
      const result = await db.delete(schema.refreshTokens)
        .where(lt(schema.refreshTokens.expiresAt, now))
        .returning();

      logger.info(`Cleaned up ${result.length} expired refresh tokens`);
    } catch (error) {
      logger.error('Error cleaning up refresh tokens', error as Error);
    }
  },

  async cleanupOldAuditLogs() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const result = await db.delete(schema.auditLogs)
        .where(lt(schema.auditLogs.createdAt, ninetyDaysAgo))
        .returning();

      if (result.length > 0) {
        logger.info(`Cleaned up ${result.length} audit logs older than 90 days`);
      }
    } catch (error) {
      logger.error('Error cleaning up old audit logs', error as Error);
    }
  },

  async cleanupBlacklistedTokens() {
    try {
      await authService.cleanupExpiredBlacklistedTokens();
    } catch (error) {
      logger.error('Error cleaning up blacklisted tokens', error as Error);
    }
  },
};
