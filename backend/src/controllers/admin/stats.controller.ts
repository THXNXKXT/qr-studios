/**
 * Admin Stats Controller
 * Dashboard statistics, revenue charts, analytics
 */

import type { Context } from 'hono';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, sql, desc, count, asc, avg, lte, gte } from 'drizzle-orm';
import { success } from '../../utils/response';
import { licensesService } from '../../services/licenses.service';
import { commissionService } from '../../services/commission.service';

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
            thumbnail: true,
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
                image: p.thumbnail || (p.images as string[])?.[0],
            };
        })
        .sort((a, b) => b.sales - a.sales);
}

export const statsController = {
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
                    id: true,
                    name: true,
                    category: true,
                    price: true,
                    thumbnail: true, // Added: include thumbnail for images
                    images: true,    // Added: include images fallback
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
                    id: p.id, // Added: include id for dashboard best sellers
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    image: p.thumbnail || (p.images as string[])?.[0], // Fixed: include image for best sellers
                    sales: completedItems.length,
                    revenue: completedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                };
            }).sort((a, b) => b.sales - a.sales).slice(0, 10),
            categoryRevenueData: Array.from({ length: Math.max(0, 6) }).map((_, i) => {
                const date = new Date();
                date.setDate(1); // Set to day 1 to avoid month skipping on the 31st
                date.setMonth(date.getMonth() - (5 - i));
                const monthName = date.toLocaleString('default', { month: 'short' });
                const data: any = { month: monthName };
                
                // Map frontend display keys to database categories
                const categoryMap: Record<string, string> = {
                    'Script': 'SCRIPT',
                    'UI': 'UI',
                    'Bundle': 'BUNDLE'
                };

                Object.keys(categoryMap).forEach(displayKey => {
                    const dbCat = categoryMap[displayKey];
                    data[displayKey] = ordersResult
                        .filter(o => o.createdAt.getMonth() === date.getMonth() && o.createdAt.getFullYear() === date.getFullYear())
                        .flatMap(o => o.items)
                        .filter(item => item.product.category === dbCat)
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
};
