import cron from 'node-cron';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, lt, and } from 'drizzle-orm';

export const cronService = {
  init() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('[CRON] Starting database cleanup...');
      await Promise.all([
        cronService.cleanupExpiredTokens(),
        cronService.cleanupOldAuditLogs(),
      ]);
    });

    // Run every hour for blacklisted tokens (more frequent as they are small and critical)
    cron.schedule('0 * * * *', async () => {
      await cronService.cleanupBlacklistedTokens();
    });

    // Run every minute to check and update expired flash sales
    cron.schedule('* * * * *', async () => {
      await cronService.updateExpiredFlashSales();
    });

    console.log('[CRON] Jobs initialized successfully');
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
        console.log(`[CRON] Updated ${result.length} expired flash sales to inactive`);
      }
    } catch (error) {
      console.error('[CRON] Error updating expired flash sales:', error);
    }
  },

  async cleanupExpiredTokens() {
    try {
      const now = new Date();
      
      const result = await db.delete(schema.refreshTokens)
        .where(lt(schema.refreshTokens.expiresAt, now))
        .returning();

      console.log(`[CRON] Cleaned up ${result.length} expired refresh tokens`);
    } catch (error) {
      console.error('[CRON] Error cleaning up refresh tokens:', error);
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
        console.log(`[CRON] Cleaned up ${result.length} audit logs older than 90 days`);
      }
    } catch (error) {
      console.error('[CRON] Error cleaning up old audit logs:', error);
    }
  },

  async cleanupBlacklistedTokens() {
    try {
      const now = new Date();
      
      const result = await db.delete(schema.blacklistedTokens)
        .where(lt(schema.blacklistedTokens.expiresAt, now))
        .returning();

      if (result.length > 0) {
        console.log(`[CRON] Cleaned up ${result.length} expired blacklisted tokens`);
      }
    } catch (error) {
      console.error('[CRON] Error cleaning up blacklisted tokens:', error);
    }
  },
};
