import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count, type InferSelectModel } from 'drizzle-orm';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { BaseService, cache, trackedQuery, logger as baseLogger } from '../utils';

export type User = InferSelectModel<typeof schema.users>;

interface UserProfile {
  id: string;
  discordId: string | null;
  username: string;
  email: string | null;
  avatar: string | null;
  balance: number;
  points: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  totalSpent: number;
}

const logger = baseLogger.child('[UsersService]');

class UsersService extends BaseService<typeof schema.users, User> {
  protected table = schema.users;
  protected tableName = 'users';
  protected logger = logger;

  private readonly profileColumns = {
    id: true, discordId: true, username: true, email: true, avatar: true,
    balance: true, points: true, role: true, createdAt: true, updatedAt: true,
  } as const;

  async getUserProfile(userId: string): Promise<UserProfile> {
    const cacheKey = `users:profile:${userId}`;
    const cached = cache.get<UserProfile>(cacheKey);
    if (cached) return cached;

    const result = await trackedQuery(async () => {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: this.profileColumns,
      });

      if (!user) throw new NotFoundError('User not found');

      const [totalSpentResult] = await db.select({ total: sql<number>`sum(${schema.orders.total})` })
        .from(schema.orders)
        .where(and(eq(schema.orders.userId, userId), eq(schema.orders.status, 'COMPLETED')));

      return { ...user, totalSpent: Number(totalSpentResult?.total || 0) };
    }, 'users.getUserProfile');

    cache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  async updateUserProfile(userId: string, data: { avatar?: string }) {
    const [user] = await db.update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id, discordId: schema.users.discordId,
        username: schema.users.username, email: schema.users.email,
        avatar: schema.users.avatar, balance: schema.users.balance,
        role: schema.users.role, updatedAt: schema.users.updatedAt,
      });

    if (!user) throw new NotFoundError('User not found');
    cache.delete(`users:profile:${userId}`);
    return user;
  }

  async getUserBalance(userId: string) {
    return await trackedQuery(async () => {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { balance: true },
      });
      if (!user) throw new NotFoundError('User not found');
      return { balance: user.balance };
    }, 'users.getUserBalance');
  }

  async updateUserBalance(userId: string, amount: number, operation: 'add' | 'subtract') {
    return await db.transaction(async (tx) => {
      if (operation === 'add') {
        const [updated] = await tx.update(schema.users)
          .set({ balance: sql`${schema.users.balance} + ${amount}`, updatedAt: new Date() })
          .where(eq(schema.users.id, userId))
          .returning({ balance: schema.users.balance });
        cache.delete(`users:profile:${userId}`);
        return updated;
      } else {
        const result = await tx.update(schema.users)
          .set({ balance: sql`${schema.users.balance} - ${amount}`, updatedAt: new Date() })
          .where(and(eq(schema.users.id, userId), sql`${schema.users.balance} >= ${amount}`))
          .returning({ balance: schema.users.balance });

        if (result.length === 0) {
          const user = await tx.query.users.findFirst({ where: eq(schema.users.id, userId) });
          if (!user) throw new NotFoundError('User not found');
          throw new BadRequestError('Insufficient balance');
        }
        cache.delete(`users:profile:${userId}`);
        return result[0];
      }
    });
  }

  async getUserOrders(userId: string) {
    return await trackedQuery(() => db.query.orders.findMany({
      where: eq(schema.orders.userId, userId),
      with: {
        items: {
          with: {
            product: { columns: { id: true, name: true, slug: true, thumbnail: true, category: true } },
          },
        },
      },
      orderBy: [desc(schema.orders.createdAt)],
    }), 'users.getUserOrders');
  }

  async getUserLicenses(userId: string) {
    return await trackedQuery(() => db.query.licenses.findMany({
      where: eq(schema.licenses.userId, userId),
      with: { product: { columns: { id: true, name: true, slug: true, thumbnail: true, category: true, version: true } } },
      orderBy: [desc(schema.licenses.createdAt)],
    }), 'users.getUserLicenses');
  }

  async getUserNotifications(userId: string) {
    return await trackedQuery(() => db.query.notifications.findMany({
      where: eq(schema.notifications.userId, userId),
      columns: { id: true, userId: true, title: true, message: true, type: true, isRead: true, createdAt: true },
      orderBy: [desc(schema.notifications.createdAt)],
      limit: 50,
    }), 'users.getUserNotifications');
  }

  async getUnreadNotificationsCount(userId: string) {
    const [result] = await db.select({ value: count() })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false)));
    return { count: result?.value ?? 0 };
  }

  async getTransactionHistory(userId: string) {
    return await trackedQuery(() => db.query.transactions.findMany({
      where: eq(schema.transactions.userId, userId),
      columns: { id: true, userId: true, type: true, amount: true, bonus: true, points: true, status: true, paymentMethod: true, paymentRef: true, createdAt: true },
      orderBy: [desc(schema.transactions.createdAt)],
      limit: 50,
    }), 'users.getTransactionHistory');
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    const [updated] = await db.update(schema.notifications)
      .set({ isRead: true })
      .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId)))
      .returning();

    if (!updated) throw new NotFoundError('Notification not found');
    return updated;
  }

  async markAllNotificationsAsRead(userId: string) {
    await db.update(schema.notifications)
      .set({ isRead: true })
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false)));
    return { success: true };
  }

  async getUserDashboardStats(userId: string) {
    return await trackedQuery(async () => {
      const [
        orderCountResult, licenseCountResult, unreadNotificationsResult, totalSpentResult
      ] = await Promise.all([
        db.select({ value: count() }).from(schema.orders).where(and(eq(schema.orders.userId, userId), eq(schema.orders.status, 'COMPLETED'))),
        db.select({ value: count() }).from(schema.licenses).where(and(eq(schema.licenses.userId, userId), eq(schema.licenses.status, 'ACTIVE'))),
        db.select({ value: count() }).from(schema.notifications).where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false))),
        db.select({ value: sql<number>`sum(${schema.orders.total})` }).from(schema.orders).where(and(eq(schema.orders.userId, userId), eq(schema.orders.status, 'COMPLETED')))
      ]);

      return {
        stats: {
          orders: orderCountResult[0]?.value ?? 0,
          licenses: licenseCountResult[0]?.value ?? 0,
          unreadNotifications: unreadNotificationsResult[0]?.value ?? 0,
          totalSpent: Number(totalSpentResult[0]?.value || 0)
        }
      };
    }, 'users.getUserDashboardStats');
  }
}

export const usersService = new UsersService();
