import type { Context } from 'hono';
import { z } from 'zod';
import { commissionService } from '../services/commission.service';
import { licensesService } from '../services/licenses.service';
import { ordersService } from '../services/orders.service';
import { emailService } from '../services/email.service';
import { storageService } from '../services/storage.service';
import { auditService } from '../services/audit.service';
import { nanoid } from 'nanoid';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count, ilike, or, asc, avg, inArray, lte, gte } from 'drizzle-orm';
import { success, paginated } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { 
  idParamSchema, 
  paginationSchema, 
  commissionFilterSchema,
  createPromoCodeSchema,
  createAnnouncementSchema,
  updateUserRoleSchema,
  updateCommissionStatusSchema,
  updateOrderStatusSchema,
  createProductSchema,
  updateProductSchema,
  updateBalanceSchema,
  grantLicenseSchema
} from '../schemas';

// --- Internal Stat Helpers ---
async function getUserStatsInternal() {
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    totalResult,
    todayResult,
    thisWeekResult,
    thisMonthResult,
    allUsersWithOrders
  ] = await Promise.all([
    db.select({ value: count() }).from(schema.users),
    db.select({ value: count() }).from(schema.users).where(gte(schema.users.createdAt, startOfToday)),
    db.select({ value: count() }).from(schema.users).where(gte(schema.users.createdAt, sevenDaysAgo)),
    db.select({ value: count() }).from(schema.users).where(gte(schema.users.createdAt, startOfMonth)),
    db.query.users.findMany({
      with: {
        orders: {
          where: eq(schema.orders.status, 'COMPLETED'),
          columns: { total: true }
        }
      }
    })
  ]);

  const tiers = {
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    PLATINUM: 0,
    DIAMOND: 0,
    ELITE: 0,
    ROYAL: 0,
    LEGEND: 0
  };

  allUsersWithOrders.forEach(user => {
    const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0);
    if (totalSpent >= 100000) tiers.LEGEND++;
    else if (totalSpent >= 60000) tiers.ROYAL++;
    else if (totalSpent >= 30000) tiers.ELITE++;
    else if (totalSpent >= 15000) tiers.DIAMOND++;
    else if (totalSpent >= 7000) tiers.PLATINUM++;
    else if (totalSpent >= 3000) tiers.GOLD++;
    else if (totalSpent >= 1000) tiers.SILVER++;
    else tiers.BRONZE++;
  });

  return { 
    total: totalResult[0]?.value ?? 0, 
    today: todayResult[0]?.value ?? 0, 
    thisWeek: thisWeekResult[0]?.value ?? 0, 
    thisMonth: thisMonthResult[0]?.value ?? 0, 
    tiers 
  };
}

async function getOrderStatsInternal() {
  const [totalResult, pendingResult, completedResult, cancelledResult] = await Promise.all([
    db.select({ value: count() }).from(schema.orders),
    db.select({ value: count() }).from(schema.orders).where(eq(schema.orders.status, 'PENDING')),
    db.select({ value: count() }).from(schema.orders).where(eq(schema.orders.status, 'COMPLETED')),
    db.select({ value: count() }).from(schema.orders).where(eq(schema.orders.status, 'CANCELLED')),
  ]);
  return { 
    total: totalResult[0]?.value ?? 0, 
    pending: pendingResult[0]?.value ?? 0, 
    completed: completedResult[0]?.value ?? 0, 
    cancelled: cancelledResult[0]?.value ?? 0 
  };
}

async function getRevenueStatsInternal() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalRevenueResult, thisMonthRevenueResult] = await Promise.all([
    db.select({ total: sql<number>`sum(${schema.orders.total})` })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'COMPLETED')),
    db.select({ total: sql<number>`sum(${schema.orders.total})` })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.status, 'COMPLETED'),
          gte(schema.orders.createdAt, startOfMonth)
        )
      ),
  ]);

  return {
    total: Number(totalRevenueResult[0]?.total || 0),
    thisMonth: Number(thisMonthRevenueResult[0]?.total || 0),
  };
}

async function getReviewStatsInternal() {
  const [totalResult, verifiedResult, averageRatingResult] = await Promise.all([
    db.select({ value: count() }).from(schema.reviews),
    db.select({ value: count() }).from(schema.reviews).where(eq(schema.reviews.isVerified, true)),
    db.select({ avg: avg(schema.reviews.rating) }).from(schema.reviews),
  ]);
  return { 
    total: totalResult[0]?.value ?? 0, 
    verified: verifiedResult[0]?.value ?? 0, 
    avgRating: Number(Number(averageRatingResult[0]?.avg || 0).toFixed(1)) 
  };
}

async function getAnnouncementStatsInternal() {
  const [totalResult, activeResult, inactiveResult] = await Promise.all([
    db.select({ value: count() }).from(schema.announcements),
    db.select({ value: count() }).from(schema.announcements).where(eq(schema.announcements.isActive, true)),
    db.select({ value: count() }).from(schema.announcements).where(eq(schema.announcements.isActive, false)),
  ]);
  return { 
    total: totalResult[0]?.value ?? 0, 
    active: activeResult[0]?.value ?? 0, 
    inactive: inactiveResult[0]?.value ?? 0 
  };
}

async function getTopProductsInternal() {
  const productsResult = await db.query.products.findMany({
    limit: 5,
    with: {
      orderItems: {
        with: {
          order: {
            columns: { status: true }
          }
        },
        columns: {
          price: true,
          quantity: true,
        }
      }
    },
    columns: {
      id: true,
      name: true,
      images: true,
    }
  });

  return productsResult
    .map(p => {
      const completedOrderItems = p.orderItems.filter(item => item.order.status === 'COMPLETED');
      return {
        id: p.id,
        name: p.name,
        sales: completedOrderItems.length,
        revenue: completedOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        image: (p.images as string[])?.[0]
      };
    })
    .sort((a, b) => b.sales - a.sales);
}

export const adminController = {
  // --- Dashboard & Stats ---
  async getDashboardStats(c: Context) {
    const [
      userStats,
      orderStats,
      licenseStats,
      commissionStats,
      revenueStats,
      topProducts,
      announcementStats,
      reviewStats,
      systemStats,
    ] = await Promise.all([
      getUserStatsInternal(),
      getOrderStatsInternal(),
      licensesService.getActiveLicenseStats(),
      commissionService.getCommissionStats(),
      getRevenueStatsInternal(),
      getTopProductsInternal(),
      getAnnouncementStatsInternal(),
      getReviewStatsInternal(),
      db.query.systemStats.findFirst({ where: eq(schema.systemStats.id, 'global') }),
    ]);

    return success(c, {
      users: userStats,
      orders: orderStats,
      licenses: licenseStats,
      commissions: commissionStats,
      revenue: revenueStats,
      topProducts,
      announcements: announcementStats,
      reviews: reviewStats,
      visitors: systemStats?.totalVisitors || 0,
    });
  },

  async getRevenueChartData(c: Context) {
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const ordersResult = await db.query.orders.findMany({
      where: and(
        eq(schema.orders.status, 'COMPLETED'),
        gte(schema.orders.createdAt, startDate)
      ),
      columns: { total: true, createdAt: true },
      orderBy: [asc(schema.orders.createdAt)],
    });

    const chartData = Array.from({ length: Math.max(0, days + 1) }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayTotal = ordersResult
        .filter(o => o.createdAt.toISOString().split('T')[0] === dateStr)
        .reduce((sum, o) => sum + o.total, 0);
      return { date: dateStr, revenue: dayTotal };
    });
    return success(c, chartData);
  },

  async getLowStockProducts(c: Context) {
    const threshold = 10;
    const productsResult = await db.query.products.findMany({
      where: and(
        sql`${schema.products.stock} != -1`,
        lte(schema.products.stock, threshold)
      ),
      columns: {
        id: true,
        name: true,
        slug: true,
        price: true,
        category: true,
        images: true,
        stock: true,
        updatedAt: true,
      },
      orderBy: [asc(schema.products.stock)],
    });
    return success(c, productsResult);
  },

  async getAnalyticsData(c: Context) {
    const [
      ordersResult,
      usersResult,
      visitorsResult,
      productsResult,
      categoriesResult,
      promoCodesResult
    ] = await Promise.all([
      db.query.orders.findMany({
        where: eq(schema.orders.status, 'COMPLETED'),
        with: {
          items: {
            with: {
              product: {
                columns: { category: true }
              }
            },
            columns: {
              price: true,
              quantity: true,
            }
          }
        },
      }),
      db.query.users.findMany({
        with: {
          orders: {
            where: eq(schema.orders.status, 'COMPLETED'),
            columns: { total: true }
          }
        },
        columns: {
          id: true,
          username: true,
          avatar: true,
          createdAt: true,
        }
      }),
      db.query.systemStats.findFirst({ where: eq(schema.systemStats.id, 'global') }).then(s => s?.totalVisitors || 0),
      db.query.products.findMany({
        with: {
          orderItems: {
            with: {
              order: {
                columns: { status: true }
              }
            },
            columns: {
              price: true,
              quantity: true,
            }
          }
        },
        columns: {
          name: true,
          category: true,
          price: true,
        }
      }),
      db.select({ 
        category: schema.products.category, 
        count: count() 
      })
      .from(schema.products)
      .groupBy(schema.products.category),
      db.query.promoCodes.findMany({
        columns: {
          code: true,
          usedCount: true,
        }
      })
    ]);

    const totalRevenue = ordersResult.reduce((sum, o) => sum + o.total, 0);
    const [totalUsersResult] = await db.select({ value: count() }).from(schema.users);
    const totalUsers = totalUsersResult?.value ?? 0;

    const summary = {
      totalRevenue,
      totalOrders: ordersResult.length,
      totalUsers,
      avgOrderValue: ordersResult.length > 0 ? totalRevenue / ordersResult.length : 0,
    };

    const charts = {
      revenueData: Array.from({ length: Math.max(0, 12) }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const name = date.toLocaleString('default', { month: 'short' });
        const revenue = ordersResult
          .filter(o => o.createdAt.getMonth() === date.getMonth() && o.createdAt.getFullYear() === date.getFullYear())
          .reduce((sum, o) => sum + o.total, 0);
        return { name, revenue };
      }),
      dailyRevenueData: Array.from({ length: Math.max(0, 30) }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const name = date.getDate().toString();
        const revenue = ordersResult
          .filter(o => o.createdAt.toDateString() === date.toDateString())
          .reduce((sum, o) => sum + o.total, 0);
        return { name, revenue };
      }),
      categoryData: categoriesResult.map(cat => ({ name: cat.category, value: cat.count })),
      userGrowthData: Array.from({ length: Math.max(0, 12) }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return {
          name: date.toLocaleString('default', { month: 'short' }),
          users: usersResult.filter(u => u.createdAt <= date).length,
          newUsers: usersResult.filter(u => u.createdAt.getMonth() === date.getMonth() && u.createdAt.getFullYear() === date.getFullYear()).length,
        };
      }),
      hourlyOrdersData: Array.from({ length: Math.max(0, 24) }).map((_, hour) => ({
        hour: `${hour}:00`,
        orders: ordersResult.filter(o => o.createdAt.getHours() === hour).length,
      })),
      paymentMethodData: [
        { name: 'Stripe', value: ordersResult.filter(o => o.paymentMethod === 'STRIPE').length, color: '#6366f1' },
        { name: 'Balance', value: ordersResult.filter(o => o.paymentMethod === 'BALANCE').length, color: '#ef4444' },
        { name: 'PromptPay', value: ordersResult.filter(o => o.paymentMethod === 'PROMPTPAY').length, color: '#00BA00' },
      ],
      productSales: productsResult.map(p => {
        const completedItems = p.orderItems.filter(item => item.order.status === 'COMPLETED');
        return {
          name: p.name,
          category: p.category,
          price: p.price,
          sales: completedItems.length,
          revenue: completedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        };
      }).sort((a, b) => b.sales - a.sales).slice(0, 10),
      categoryRevenueData: Array.from({ length: Math.max(0, 6) }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthName = date.toLocaleString('default', { month: 'short' });
        const data: any = { month: monthName };
        ['SCRIPT', 'UI', 'BUNDLE'].forEach(cat => {
          data[cat] = ordersResult
            .filter(o => o.createdAt.getMonth() === date.getMonth() && o.createdAt.getFullYear() === date.getFullYear())
            .flatMap(o => o.items)
            .filter(item => item.product.category === cat)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        });
        return data;
      }),
      customerInsightsData: {
        newVsReturning: [
          { name: 'New Customers', value: usersResult.filter(u => u.orders.length === 1).length, color: '#ef4444' },
          { name: 'Returning', value: usersResult.filter(u => u.orders.length > 1).length, color: '#991b1b' },
        ],
        topBuyers: usersResult
          .map(u => ({
            name: u.username || u.id.substring(0, 8),
            avatar: u.avatar,
            orders: u.orders.length,
            spent: u.orders.reduce((sum, o) => sum + o.total, 0),
          }))
          .sort((a, b) => b.spent - a.spent)
          .slice(0, 5),
      },
      geographicData: [
        { country: 'Thailand', percentage: 85 },
        { country: 'Others', percentage: 15 },
      ],
      conversionData: [
        { name: 'Visitors', value: visitorsResult },
        { name: 'Orders', value: ordersResult.length },
        { name: 'Completed', value: ordersResult.filter(o => o.status === 'COMPLETED').length },
      ],
      promoPerformance: promoCodesResult.map(p => ({
        code: p.code,
        uses: p.usedCount,
        revenue: ordersResult.filter(o => o.promoCode === p.code).reduce((sum, o) => sum + o.total, 0),
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    };

    return success(c, { summary, charts });
  },

  // --- User Management ---
  async getAllUsers(c: Context) {
    const query = c.req.query();
    const { page, limit, search, role, tier } = paginationSchema.extend({
      search: z.string().optional(),
      role: z.string().optional(),
      tier: z.string().optional(),
    }).parse(query);
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const filters = [];
    if (search) {
      filters.push(
        or(
          ilike(schema.users.username, `%${search}%`),
          ilike(schema.users.email, `%${search}%`),
          ilike(schema.users.discordId, `%${search}%`)
        )
      );
    }
    if (role && role !== 'all') {
      filters.push(eq(schema.users.role, role.toUpperCase() as any));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    if (tier && tier !== 'all') {
      // Tier filtering requires calculating totalSpent for all users in memory
      // because totalSpent is not a field in the database but an aggregate of orders.
      const usersData = await db.query.users.findMany({
        where,
        orderBy: [desc(schema.users.createdAt)],
        with: {
          orders: {
            where: eq(schema.orders.status, 'COMPLETED'),
            columns: { total: true }
          }
        }
      });

      let formattedUsers = usersData.map(user => ({
        ...user,
        totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
        ordersCount: user.orders.length,
      }));

      const tierUpper = tier.toUpperCase();
      formattedUsers = formattedUsers.filter(u => {
        const ts = u.totalSpent;
        if (tierUpper === 'LEGEND') return ts >= 100000;
        if (tierUpper === 'ROYAL') return ts >= 60000 && ts < 100000;
        if (tierUpper === 'ELITE') return ts >= 30000 && ts < 60000;
        if (tierUpper === 'DIAMOND') return ts >= 15000 && ts < 30000;
        if (tierUpper === 'PLATINUM') return ts >= 7000 && ts < 15000;
        if (tierUpper === 'GOLD') return ts >= 3000 && ts < 7000;
        if (tierUpper === 'SILVER') return ts >= 1000 && ts < 3000;
        if (tierUpper === 'BRONZE') return ts < 1000;
        return true;
      });

      const totalCount = formattedUsers.length;
      const paginatedUsers = formattedUsers.slice(offset, offset + limitNum);

      return paginated(c, paginatedUsers, pageNum, limitNum, totalCount);
    } else {
      // Standard paginated fetch when no tier filter is applied
      const [usersData, totalResult] = await Promise.all([
        db.query.users.findMany({
          where,
          offset,
          limit: limitNum,
          orderBy: [desc(schema.users.createdAt)],
          with: {
            orders: {
              where: eq(schema.orders.status, 'COMPLETED'),
              columns: { total: true }
            }
          }
        }),
        db.select({ value: count() }).from(schema.users).where(where),
      ]);

      const formattedUsers = usersData.map(user => ({
        ...user,
        totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
        ordersCount: user.orders.length,
      }));

      return paginated(c, formattedUsers, pageNum, limitNum, totalResult[0]?.value ?? 0);
    }
  },

  async updateUserRole(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const { role } = updateUserRoleSchema.parse(await c.req.json());
    const [oldUser] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    
    const [updatedUser] = await db.update(schema.users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        discordId: schema.users.discordId,
        username: schema.users.username,
        email: schema.users.email,
        role: schema.users.role,
        updatedAt: schema.users.updatedAt,
      });

    if (!updatedUser) throw new NotFoundError('User not found');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'UPDATE_USER_ROLE',
      entity: 'User',
      entityId: id,
      oldData: { role: oldUser?.role },
      newData: { role: updatedUser.role },
    });
    return success(c, updatedUser, 'User role updated');
  },

  async updateUserBalance(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const { amount, operation } = updateBalanceSchema.parse(await c.req.json());
    const result = await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({ where: eq(schema.users.id, id) });
      if (!user) throw new NotFoundError('User not found');

      let updatedUser;
      if (operation === 'ADD') {
        const [res] = await tx.update(schema.users)
          .set({ 
            balance: sql`${schema.users.balance} + ${amount}`,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, id))
          .returning({ id: schema.users.id, username: schema.users.username, balance: schema.users.balance, updatedAt: schema.users.updatedAt });
        updatedUser = res;
      } else {
        // Atomic decrement with check
        const updateResult = await tx.update(schema.users)
          .set({ 
            balance: sql`${schema.users.balance} - ${amount}`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(schema.users.id, id),
              gte(schema.users.balance, amount)
            )
          )
          .returning({ id: schema.users.id, username: schema.users.username, balance: schema.users.balance, updatedAt: schema.users.updatedAt });

        if (updateResult.length === 0) {
          throw new BadRequestError('Insufficient balance or user not found');
        }
        updatedUser = updateResult[0];
      }

      await tx.insert(schema.transactions).values({
        userId: id,
        type: operation === 'ADD' ? 'BONUS' : 'PURCHASE',
        amount,
        status: 'COMPLETED',
        paymentMethod: 'admin_manual',
        paymentRef: `manual_${Date.now()}`,
      });
      return updatedUser;
    });

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'MANUAL_BALANCE_ADJUST',
      entity: 'User',
      entityId: id,
      newData: { amount, operation, newBalance: result?.balance },
    });
    return success(c, result, 'Balance updated successfully');
  },

  async updateUserPoints(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const { amount, operation } = updateBalanceSchema.parse(await c.req.json());
    const result = await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({ where: eq(schema.users.id, id) });
      if (!user) throw new NotFoundError('User not found');

      let updatedUser;
      const pointsAmount = Math.floor(amount);

      if (operation === 'ADD') {
        const [res] = await tx.update(schema.users)
          .set({ 
            points: sql`${schema.users.points} + ${pointsAmount}`,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, id))
          .returning({ id: schema.users.id, username: schema.users.username, points: schema.users.points, updatedAt: schema.users.updatedAt });
        updatedUser = res;
      } else {
        // Atomic decrement with check
        const updateResult = await tx.update(schema.users)
          .set({ 
            points: sql`${schema.users.points} - ${pointsAmount}`,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(schema.users.id, id),
              gte(schema.users.points, pointsAmount)
            )
          )
          .returning({ id: schema.users.id, username: schema.users.username, points: schema.users.points, updatedAt: schema.users.updatedAt });

        if (updateResult.length === 0) {
          throw new BadRequestError('Insufficient points or user not found');
        }
        updatedUser = updateResult[0];
      }

      await tx.insert(schema.transactions).values({
        userId: id,
        type: operation === 'ADD' ? 'POINTS_EARNED' : 'POINTS_REDEEMED',
        amount: 0,
        bonus: 0,
        points: pointsAmount,
        status: 'COMPLETED',
        paymentMethod: 'admin_manual',
        paymentRef: `manual_points_${Date.now()}`,
      });
      return updatedUser;
    });

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'MANUAL_POINTS_ADJUST',
      entity: 'User',
      entityId: id,
      newData: { amount, operation, newPoints: result?.points },
    });
    return success(c, result, 'Points updated successfully');
  },

  async banUser(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [user] = await db.update(schema.users)
      .set({ isBanned: true, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        username: schema.users.username,
        isBanned: schema.users.isBanned,
        updatedAt: schema.users.updatedAt,
      });

    if (!user) throw new NotFoundError('User not found');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'BAN_USER',
      entity: 'User',
      entityId: id,
    });
    return success(c, user, 'User banned');
  },

  async unbanUser(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [user] = await db.update(schema.users)
      .set({ isBanned: false, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        username: schema.users.username,
        isBanned: schema.users.isBanned,
        updatedAt: schema.users.updatedAt,
      });

    if (!user) throw new NotFoundError('User not found');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'UNBAN_USER',
      entity: 'User',
      entityId: id,
    });
    return success(c, user, 'User unbanned');
  },

  // --- Product Management ---
  async getAllProducts(c: Context) {
    const query = c.req.query();
    const { page, limit, search, category, isFlashSale } = paginationSchema.extend({
      search: z.string().optional(),
      category: z.string().optional(),
      isFlashSale: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
    }).parse(query);
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const filters = [];
    if (search) {
      filters.push(
        or(
          ilike(schema.products.name, `%${search}%`),
          ilike(schema.products.slug, `%${search}%`),
          ilike(schema.products.description, `%${search}%`)
        )
      );
    }
    
    if (category) {
      filters.push(eq(schema.products.category, category.toUpperCase() as any));
    }

    if (isFlashSale !== undefined) {
      filters.push(eq(schema.products.isFlashSale, isFlashSale));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [productsData, totalResult] = await Promise.all([
      db.query.products.findMany({
        where,
        offset,
        limit: limitNum,
        orderBy: [desc(schema.products.createdAt)],
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          originalPrice: true,
          category: true,
          thumbnail: true,
          images: true,
          downloadUrl: true,
          isDownloadable: true,
          features: true,
          tags: true,
          stock: true,
          isNew: true,
          isFeatured: true,
          isFlashSale: true,
          flashSalePrice: true,
          flashSaleEnds: true,
          rewardPoints: true,
          downloadKey: true,
          isActive: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      db.select({ value: count() }).from(schema.products).where(where),
    ]);

    return paginated(c, productsData, pageNum, limitNum, totalResult[0]?.value ?? 0);
  },

  async createProduct(c: Context) {
    const data = createProductSchema.parse(await c.req.json());
    const [product] = await db.insert(schema.products).values({
      ...data,
      thumbnail: data.thumbnail || null,
      images: data.images || [],
      features: data.features || [],
      tags: data.tags || [],
      downloadUrl: data.downloadUrl || null,
      downloadFileKey: data.downloadFileKey || null,
      isDownloadable: data.isDownloadable || false,
      flashSaleEnds: data.flashSaleEnds ? new Date(data.flashSaleEnds) : null,
    } as any).returning();

    if (!product) throw new Error('Failed to create product');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      newData: product,
    });
    return success(c, product, 'Product created successfully', 201);
  },

  async updateProduct(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const body = await c.req.json();
    console.log(`[ADMIN] Update Product request body for ${id}:`, JSON.stringify(body, null, 2));
    
    const data = updateProductSchema.parse(body);
    console.log(`[ADMIN] Parsed update data for ${id}:`, JSON.stringify(data, null, 2));
    
    const [oldProduct] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    if (!oldProduct) throw new NotFoundError('Product not found');

    // If a new file is uploaded, delete the old one from R2
    if (data.downloadFileKey && oldProduct.downloadFileKey && data.downloadFileKey !== oldProduct.downloadFileKey) {
      try {
        await storageService.deleteFile(oldProduct.downloadFileKey);
        console.log(`[ADMIN] Deleted old product file: ${oldProduct.downloadFileKey}`);
      } catch (error) {
        console.error(`[ADMIN] Failed to delete old product file ${oldProduct.downloadFileKey}:`, error);
      }
    }

    const updateData: any = {
      ...data,
      thumbnail: data.thumbnail !== undefined ? data.thumbnail : oldProduct.thumbnail,
      downloadUrl: data.downloadUrl !== undefined ? data.downloadUrl : oldProduct.downloadUrl,
      downloadFileKey: data.downloadFileKey !== undefined ? data.downloadFileKey : oldProduct.downloadFileKey,
      isDownloadable: data.isDownloadable !== undefined ? data.isDownloadable : oldProduct.isDownloadable,
      isActive: data.isActive !== undefined ? data.isActive : oldProduct.isActive,
      updatedAt: new Date(),
    };

    console.log(`[ADMIN] Updating product ${id}. New isActive: ${updateData.isActive}`);

    if (data.flashSaleEnds !== undefined) {
      updateData.flashSaleEnds = data.flashSaleEnds ? new Date(data.flashSaleEnds) : null;
    }

    const [updatedProduct] = await db.update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, id))
      .returning();

    if (!updatedProduct) throw new Error('Failed to update product');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: id,
      oldData: oldProduct,
      newData: updatedProduct,
    });
    return success(c, updatedProduct, 'Product updated successfully');
  },

  async deleteProduct(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [oldProduct] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    if (!oldProduct) throw new NotFoundError('Product not found');
    
    // Perform Soft Delete (Archive) instead of Hard Delete
    const [updatedProduct] = await db.update(schema.products)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(schema.products.id, id))
      .returning();

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'ARCHIVE_PRODUCT',
      entity: 'Product',
      entityId: id,
      oldData: oldProduct,
      newData: updatedProduct,
    });
    return success(c, updatedProduct, 'Product archived successfully');
  },

  async hardDeleteProduct(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [oldProduct] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    if (!oldProduct) throw new NotFoundError('Product not found');
    
    // Delete files from R2 only on hard delete
    if (oldProduct.downloadFileKey) {
      try {
        await storageService.deleteFile(oldProduct.downloadFileKey);
        console.log(`[ADMIN] Deleted product file: ${oldProduct.downloadFileKey}`);
      } catch (error) {
        console.error(`[ADMIN] Failed to delete R2 file for product ${id}:`, error);
      }
    }

    if (oldProduct.slug) {
      try {
        await storageService.deleteFolder(`products/${oldProduct.slug}`);
      } catch (error) {
        console.error(`[ADMIN] Failed to delete R2 folder for product ${oldProduct.slug}:`, error);
      }
    }

    await db.delete(schema.products).where(eq(schema.products.id, id));
    
    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: id,
      oldData: oldProduct,
    });
    return success(c, null, 'Product permanently deleted');
  },

  async uploadFile(c: Context) {
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    const folder = (body['folder'] as string) || 'general';

    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    const extension = file.name.split('.').pop();
    const originalName = file.name.split('.').slice(0, -1).join('.')
      .replace(/[^a-zA-Z0-9]/g, '-') // Sanitize: replace non-alphanumeric with hyphen
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .toLowerCase();
    
    // Use original name + short 6-char unique ID for readability and collision prevention
    const fileName = `${originalName}-${nanoid(6)}.${extension}`;
    const key = `${folder}/${fileName}`;

    const buffer = await file.arrayBuffer();
    const publicUrl = await storageService.uploadFile(key, new Uint8Array(buffer), file.type);

    return success(c, {
      url: publicUrl,
      key: key,
      name: file.name,
      type: file.type,
      size: file.size,
    }, 'File uploaded successfully');
  },

  async getAllOrders(c: Context) {
    const query = c.req.query();
    const { page, limit, search, status } = paginationSchema.extend({
      search: z.string().optional(),
      status: z.string().optional(),
    }).parse(query);
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const filters = [];
    if (search) {
      filters.push(
        or(
          ilike(schema.orders.id, `%${search}%`),
          sql`EXISTS (
            SELECT 1 FROM ${schema.users} u 
            WHERE u.id = ${schema.orders.userId} 
            AND (u.username ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})
          )`
        )
      );
    }
    if (status) {
      filters.push(eq(schema.orders.status, status.toUpperCase() as any));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [ordersData, totalResult] = await Promise.all([
      db.query.orders.findMany({
        where,
        offset,
        limit: limitNum,
        orderBy: [desc(schema.orders.createdAt)],
        with: {
          user: {
            columns: { id: true, username: true, email: true, discordId: true }
          },
          items: {
            with: {
              product: {
                columns: { id: true, name: true, slug: true, category: true }
              }
            }
          }
        },
      }),
      db.select({ value: count() }).from(schema.orders).where(where),
    ]);

    return paginated(c, ordersData, pageNum, limitNum, totalResult[0]?.value ?? 0);
  },

  async getOrderById(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, id),
      with: {
        user: {
          columns: { id: true, username: true, email: true, discordId: true, avatar: true }
        },
        items: {
          with: {
            product: {
              columns: { id: true, name: true, slug: true, category: true, version: true, downloadKey: true }
            }
          }
        },
        licenses: {
          columns: {
            id: true,
            licenseKey: true,
            status: true,
            expiresAt: true,
            ipAddress: true,
            createdAt: true,
          }
        },
      },
    });

    if (!order) throw new NotFoundError('Order not found');
    return success(c, order);
  },

  async updateOrderStatus(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const { status } = updateOrderStatusSchema.parse(await c.req.json());
    const [oldOrder] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (!oldOrder) throw new NotFoundError('Order not found');
    
    let order;
    if (status === 'COMPLETED' && oldOrder.status !== 'COMPLETED') {
      // Use completeOrder logic to ensure points, licenses, etc. are awarded
      order = await ordersService.completeOrder(id);
    } else {
      order = await ordersService.updateOrderStatus(id, status);
    }

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'UPDATE_ORDER_STATUS',
      entity: 'Order',
      entityId: id,
      oldData: { status: oldOrder.status },
      newData: { status: order.status },
    });
    return success(c, order, 'Order status updated');
  },

  async resendOrderReceipt(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, id),
      with: {
        user: { columns: { email: true } },
        items: {
          with: {
            product: { columns: { id: true, name: true, price: true } }
          }
        }
      }
    });

    if (!order) throw new NotFoundError('Order not found');
    if (!order.user?.email) throw new BadRequestError('User does not have an email address');
    
    await emailService.sendOrderConfirmation(order.user.email, {
      orderId: order.id,
      items: order.items.map((item: any) => ({
        name: item.product.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: order.total
    });
    return success(c, null, 'Receipt resent successfully');
  },

  // --- Commission Management ---
  async getAllCommissions(c: Context) {
    const query = c.req.query();
    const { page, limit, status, userId } = commissionFilterSchema.merge(paginationSchema).parse(query);
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const result = await commissionService.getAllCommissions({ status: status as any, userId, page: pageNum, limit: limitNum });
    return paginated(c, result.commissions, pageNum, limitNum, result.pagination.total);
  },

  async updateCommissionStatus(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const { status, adminNotes } = updateCommissionStatusSchema.parse(await c.req.json());
    const [oldCommission] = await db.select().from(schema.commissions).where(eq(schema.commissions.id, id));
    if (!oldCommission) throw new NotFoundError('Commission not found');
    const commission = await commissionService.updateCommissionStatus(id, status as any, adminNotes);
    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'UPDATE_COMMISSION_STATUS',
      entity: 'Commission',
      entityId: id,
      oldData: { status: oldCommission.status },
      newData: { status: commission.status, adminNotes },
    });
    return success(c, commission, 'Commission status updated');
  },

  // --- License Management ---
  async getAllLicenses(c: Context) {
    const query = c.req.query();
    const { page, limit, search, status, productId, userId } = paginationSchema.extend({
      search: z.string().optional(),
      status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED']).optional(),
      productId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
    }).parse(query);
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const filters = [];
    if (status) filters.push(eq(schema.licenses.status, status));
    if (productId) filters.push(eq(schema.licenses.productId, productId));
    if (userId) filters.push(eq(schema.licenses.userId, userId));
    if (search) {
      filters.push(ilike(schema.licenses.licenseKey, `%${search}%`));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [licensesData, totalResult] = await Promise.all([
      db.query.licenses.findMany({
        where,
        offset,
        limit: limitNum,
        orderBy: [desc(schema.licenses.createdAt)],
        with: {
          user: { columns: { id: true, username: true, email: true, discordId: true } },
          product: { columns: { id: true, name: true, slug: true, category: true } },
          // cross-reference orderId if needed or fetch order via relations if defined
        },
      }),
      db.select({ value: count() }).from(schema.licenses).where(where),
    ]);

    // Format if needed or fetch order separately since relations were simplified
    const formattedLicenses = await Promise.all(licensesData.map(async (license) => {
      const order = await db.query.orders.findFirst({
        where: eq(schema.orders.id, license.orderId),
        columns: { id: true, createdAt: true, total: true, status: true }
      });
      return { ...license, order };
    }));

    return paginated(c, formattedLicenses, pageNum, limitNum, totalResult[0]?.value ?? 0);
  },

  async grantLicense(c: Context) {
    const { userId, productId, expiresAt } = grantLicenseSchema.parse(await c.req.json());
    const license = await licensesService.grantLicense(userId, productId, expiresAt ? new Date(expiresAt) : null);
    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'GRANT_LICENSE_MANUAL',
      entity: 'License',
      entityId: license.id,
      newData: { userId, productId, expiresAt },
    });
    return success(c, license, 'License granted successfully', 201);
  },

  async revokeLicense(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [license] = await db.update(schema.licenses)
      .set({ status: 'REVOKED' })
      .where(eq(schema.licenses.id, id))
      .returning();

    if (!license) throw new NotFoundError('License not found');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'REVOKE_LICENSE',
      entity: 'License',
      entityId: id,
    });
    return success(c, license, 'License revoked successfully');
  },

  // --- Promo Code Management ---
  async getAllPromoCodes(c: Context) {
    const promoCodesData = await db.query.promoCodes.findMany({
      columns: {
        id: true,
        code: true,
        discount: true,
        type: true,
        minPurchase: true,
        maxDiscount: true,
        usageLimit: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [desc(schema.promoCodes.createdAt)],
    });
    return success(c, promoCodesData);
  },

  async createPromoCode(c: Context) {
    const data = createPromoCodeSchema.parse(await c.req.json());
    const [promoCode] = await db.insert(schema.promoCodes).values({
      ...data,
      code: data.code.toUpperCase(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    } as any).returning();

    if (!promoCode) throw new Error('Failed to create promo code');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'CREATE_PROMO_CODE',
      entity: 'PromoCode',
      entityId: promoCode.id,
      newData: promoCode,
    });
    return success(c, promoCode, 'Promo code created successfully', 201);
  },

  async updatePromoCode(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const data = createPromoCodeSchema.partial().parse(await c.req.json());
    const [oldPromo] = await db.select().from(schema.promoCodes).where(eq(schema.promoCodes.id, id));
    if (!oldPromo) throw new NotFoundError('Promo code not found');
    
    const [updatedPromoCode] = await db.update(schema.promoCodes)
      .set({
        ...data,
        code: data.code?.toUpperCase(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      } as any)
      .where(eq(schema.promoCodes.id, id))
      .returning();

    if (!updatedPromoCode) throw new Error('Failed to update promo code');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'UPDATE_PROMO_CODE',
      entity: 'PromoCode',
      entityId: id,
      oldData: oldPromo,
      newData: updatedPromoCode,
    });
    return success(c, updatedPromoCode, 'Promo code updated successfully');
  },

  async deletePromoCode(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [oldPromo] = await db.select().from(schema.promoCodes).where(eq(schema.promoCodes.id, id));
    if (!oldPromo) throw new NotFoundError('Promo code not found');
    
    await db.delete(schema.promoCodes).where(eq(schema.promoCodes.id, id));
    
    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'DELETE_PROMO_CODE',
      entity: 'PromoCode',
      entityId: id,
      oldData: oldPromo,
    });
    return success(c, null, 'Promo code deleted successfully');
  },

  async togglePromoCode(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [promo] = await db.select().from(schema.promoCodes).where(eq(schema.promoCodes.id, id));
    if (!promo) throw new NotFoundError('Promo code not found');
    
    const [updated] = await db.update(schema.promoCodes)
      .set({ isActive: !promo.isActive })
      .where(eq(schema.promoCodes.id, id))
      .returning();

    if (!updated) throw new Error('Failed to toggle promo code');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'TOGGLE_PROMO_CODE',
      entity: 'PromoCode',
      entityId: id,
      newData: { isActive: updated.isActive },
    });
    return success(c, updated, `Promo code ${updated.isActive ? 'enabled' : 'disabled'}`);
  },

  // --- Announcement Management ---
  async getAllAnnouncements(c: Context) {
    const announcementsData = await db.query.announcements.findMany({
      columns: {
        id: true,
        title: true,
        content: true,
        media: true,
        isActive: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
      orderBy: [desc(schema.announcements.createdAt)],
    });
    return success(c, announcementsData);
  },

  async createAnnouncement(c: Context) {
    const data = createAnnouncementSchema.parse(await c.req.json());
    const [announcement] = await db.insert(schema.announcements).values({
      ...data,
      media: data.media || [],
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    } as any).returning();

    if (!announcement) throw new Error('Failed to create announcement');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'CREATE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: announcement.id,
      newData: announcement,
    });
    return success(c, announcement, 'Announcement created successfully', 201);
  },

  async updateAnnouncement(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const data = createAnnouncementSchema.partial().parse(await c.req.json());
    const [oldAnn] = await db.select().from(schema.announcements).where(eq(schema.announcements.id, id));
    if (!oldAnn) throw new NotFoundError('Announcement not found');
    
    const [updatedAnnouncement] = await db.update(schema.announcements)
      .set({
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      } as any)
      .where(eq(schema.announcements.id, id))
      .returning();

    if (!updatedAnnouncement) throw new Error('Failed to update announcement');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'UPDATE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: id,
      oldData: oldAnn,
      newData: updatedAnnouncement,
    });
    return success(c, updatedAnnouncement, 'Announcement updated successfully');
  },

  async deleteAnnouncement(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [oldAnn] = await db.select().from(schema.announcements).where(eq(schema.announcements.id, id));
    if (!oldAnn) throw new NotFoundError('Announcement not found');
    
    await db.delete(schema.announcements).where(eq(schema.announcements.id, id));
    
    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'DELETE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: id,
      oldData: oldAnn,
    });
    return success(c, null, 'Announcement deleted successfully');
  },

  async toggleAnnouncement(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [announcement] = await db.select().from(schema.announcements).where(eq(schema.announcements.id, id));
    if (!announcement) throw new NotFoundError('Announcement not found');
    
    const [updated] = await db.update(schema.announcements)
      .set({ isActive: !announcement.isActive })
      .where(eq(schema.announcements.id, id))
      .returning();

    if (!updated) throw new Error('Failed to toggle announcement');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'TOGGLE_ANNOUNCEMENT',
      entity: 'Announcement',
      entityId: id,
      newData: { isActive: updated.isActive },
    });
    return success(c, updated, `Announcement ${updated.isActive ? 'enabled' : 'disabled'}`);
  },

  // --- Review Management ---
  async getAllReviews(c: Context) {
    const query = c.req.query();
    const { page, limit, rating, productId, userId, search } = paginationSchema.extend({
      rating: z.string().regex(/^\d+$/).transform(Number).optional(),
      productId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      search: z.string().optional(),
    }).parse(query);
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const filters = [];
    if (rating) filters.push(eq(schema.reviews.rating, rating));
    if (productId) filters.push(eq(schema.reviews.productId, productId));
    if (userId) filters.push(eq(schema.reviews.userId, userId));
    if (search) {
      filters.push(ilike(schema.reviews.comment, `%${search}%`));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [reviewsData, totalResult] = await Promise.all([
      db.query.reviews.findMany({
        where,
        offset,
        limit: limitNum,
        orderBy: [desc(schema.reviews.createdAt)],
        with: {
          user: { columns: { id: true, username: true, avatar: true, email: true } },
          product: { columns: { id: true, name: true, slug: true } },
        },
      }),
      db.select({ value: count() }).from(schema.reviews).where(where),
    ]);

    return paginated(c, reviewsData, pageNum, limitNum, totalResult[0]?.value ?? 0);
  },

  async toggleReviewVerification(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [review] = await db.select().from(schema.reviews).where(eq(schema.reviews.id, id));
    if (!review) throw new NotFoundError('Review not found');
    
    const [updated] = await db.update(schema.reviews)
      .set({ isVerified: !review.isVerified })
      .where(eq(schema.reviews.id, id))
      .returning();

    if (!updated) throw new Error('Failed to toggle review verification');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'TOGGLE_REVIEW_VERIFICATION',
      entity: 'Review',
      entityId: id,
      newData: { isVerified: updated.isVerified },
    });
    return success(c, updated, `Review ${updated.isVerified ? 'verified' : 'unverified'}`);
  },

  async deleteReview(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const [oldReview] = await db.select().from(schema.reviews).where(eq(schema.reviews.id, id));
    if (!oldReview) throw new NotFoundError('Review not found');
    
    await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
    
    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'DELETE_REVIEW',
      entity: 'Review',
      entityId: id,
      oldData: oldReview,
    });
    return success(c, null, 'Review deleted successfully');
  },

  // --- Audit Logs ---
  async getAuditLogs(c: Context) {
    const query = c.req.query();
    const { page, limit, userId, action, search } = paginationSchema.extend({
      userId: z.string().uuid().optional(),
      action: z.string().optional(),
      search: z.string().optional(),
    }).parse(query);
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    
    const filters = [];
    if (userId) filters.push(eq(schema.auditLogs.userId, userId));
    if (action) filters.push(eq(schema.auditLogs.action, action));
    if (search) {
      filters.push(
        or(
          ilike(schema.auditLogs.entity, `%${search}%`),
          ilike(schema.auditLogs.entityId, `%${search}%`)
        )
      );
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [logsData, totalResult] = await Promise.all([
      db.query.auditLogs.findMany({
        where,
        offset,
        limit: limitNum,
        orderBy: [desc(schema.auditLogs.createdAt)],
        with: {
          user: { columns: { username: true, email: true } },
        },
      }),
      db.select({ value: count() }).from(schema.auditLogs).where(where),
    ]);

    return paginated(c, logsData, pageNum, limitNum, totalResult[0]?.value ?? 0);
  },

  // --- System Settings ---
  async getSystemSettings(c: Context) {
    const settings = await db.query.systemSettings.findMany({
      orderBy: [asc(schema.systemSettings.key)],
    });
    const settingsObj = settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    return success(c, settingsObj);
  },

  async updateSystemSetting(c: Context) {
    const key = c.req.param('key');
    if (typeof key !== 'string') throw new BadRequestError('Setting key is required');
    
    const { value } = await c.req.json();
    const [oldSetting] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, key));
    
    const [setting] = await db.insert(schema.systemSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.systemSettings.key,
        set: { value, updatedAt: new Date() }
      })
      .returning();

    if (!setting) throw new Error('Failed to update system setting');

    const admin = c.get('user') as any;
    await auditService.log({
      userId: admin?.id,
      action: 'UPDATE_SYSTEM_SETTING',
      entity: 'SystemSetting',
      entityId: key,
      oldData: { value: oldSetting?.value },
      newData: { value: setting.value },
    });
    return success(c, setting, 'Setting updated successfully');
  },
};
