import { db } from '../db';
import * as schema from '../db/schema';
import { eq, count, sql } from 'drizzle-orm';
import { trackedQuery, logger as baseLogger } from '../utils';

const logger = baseLogger.child('[StatsService]');

class StatsService {
  private logger = logger;

  async getPublicStats() {
    try {
      const [
        visitorStat,
        totalProductsResult,
        totalLicensesResult,
        totalMembersResult
      ] = await Promise.all([
        trackedQuery(async () => {
          return await db.query.systemStats.findFirst({
            where: eq(schema.systemStats.id, 'global')
          });
        }, 'stats.getPublicStats.visitorStat').catch(e => {
          this.logger.error('Error fetching visitorStat', { error: e });
          return null;
        }),
        trackedQuery(async () => {
          return await db.select({ value: count() }).from(schema.products);
        }, 'stats.getPublicStats.totalProducts').catch(e => {
          this.logger.error('Error fetching totalProducts', { error: e });
          return [{ value: 0 }];
        }),
        trackedQuery(async () => {
          return await db.select({ value: count() })
            .from(schema.licenses)
            .where(eq(schema.licenses.status, 'ACTIVE'));
        }, 'stats.getPublicStats.totalLicenses').catch(e => {
          this.logger.error('Error fetching totalLicenses', { error: e });
          return [{ value: 0 }];
        }),
        trackedQuery(async () => {
          return await db.select({ value: count() }).from(schema.users);
        }, 'stats.getPublicStats.totalMembers').catch(e => {
          this.logger.error('Error fetching totalMembers', { error: e });
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
      this.logger.error('Critical error in getPublicStats', { error });
      return {
        totalVisitors: 0,
        totalProducts: 0,
        totalLicenses: 0,
        totalMembers: 0
      };
    }
  }

  async incrementVisitors() {
    return await trackedQuery(async () => {
      return await db.insert(schema.systemStats)
        .values({ id: 'global', totalVisitors: 1 })
        .onConflictDoUpdate({
          target: schema.systemStats.id,
          set: {
            totalVisitors: sql`${schema.systemStats.totalVisitors} + 1`,
            updatedAt: new Date()
          }
        })
        .returning();
    }, 'stats.incrementVisitors');
  }
}

export const statsService = new StatsService();
