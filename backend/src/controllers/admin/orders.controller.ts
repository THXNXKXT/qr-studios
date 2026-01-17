/**
 * Admin Orders Controller
 * Order management: list, view, status updates, resend receipts
 */

import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, sql, desc, count, ilike, or } from 'drizzle-orm';
import { success, paginated } from '../../utils/response';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { ordersService } from '../../services/orders.service';
import { emailService } from '../../services/email.service';
import { auditService } from '../../services/audit.service';
import { idParamSchema, paginationSchema, updateOrderStatusSchema } from '../../schemas';

export const ordersController = {
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
};
