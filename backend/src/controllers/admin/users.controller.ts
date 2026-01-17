/**
 * Admin Users Controller
 * User management: list, role updates, balance/points, ban/unban
 */

import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, sql, desc, count, ilike, or, gte } from 'drizzle-orm';
import { success, paginated } from '../../utils/response';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { auditService } from '../../services/audit.service';
import {
    idParamSchema,
    paginationSchema,
    updateUserRoleSchema,
    updateBalanceSchema,
} from '../../schemas';

export const usersController = {
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
};
