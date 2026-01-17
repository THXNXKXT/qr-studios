import { db } from '../db';
import * as schema from '../db/schema';
import { eq, count, sql } from 'drizzle-orm';

export const statsService = {
  async getPublicStats() {
    try {
      const [
        visitorStat,
        totalProductsResult,
        totalLicensesResult,
        totalMembersResult
      ] = await Promise.all([
        db.query.systemStats.findFirst({ where: eq(schema.systemStats.id, 'global') }).catch(e => {
          console.error('[StatsService] Error fetching visitorStat:', e);
          return null;
        }),
        db.select({ value: count() }).from(schema.products).catch(e => {
          console.error('[StatsService] Error fetching totalProducts:', e);
          return [{ value: 0 }];
        }),
        db.select({ value: count() }).from(schema.licenses).where(eq(schema.licenses.status, 'ACTIVE')).catch(e => {
          console.error('[StatsService] Error fetching totalLicenses:', e);
          return [{ value: 0 }];
        }),
        db.select({ value: count() }).from(schema.users).catch(e => {
          console.error('[StatsService] Error fetching totalMembers:', e);
          return [{ value: 0 }];
        })
      ]);

      return {
        totalVisitors: visitorStat?.totalVisitors || 0,
        totalProducts: totalProductsResult[0]?.value ?? 0,
        totalLicenses: totalLicensesResult[0]?.value ?? 0,
        totalMembers: totalMembersResult[0]?.value ?? 0
      };
    } catch (error) {
      console.error('[StatsService] Critical error in getPublicStats:', error);
      return {
        totalVisitors: 0,
        totalProducts: 0,
        totalLicenses: 0,
        totalMembers: 0
      };
    }
  },

  async incrementVisitors() {
    return db.insert(schema.systemStats)
      .values({ id: 'global', totalVisitors: 1 })
      .onConflictDoUpdate({
        target: schema.systemStats.id,
        set: { 
          totalVisitors: sql`${schema.systemStats.totalVisitors} + 1`,
          updatedAt: new Date()
        }
      })
      .returning();
  }
};
