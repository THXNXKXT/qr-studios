/**
 * Admin Audit Controller
 * Audit logs: list
 */

import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, desc, count, ilike, or } from 'drizzle-orm';
import { paginated } from '../../utils/response';
import { paginationSchema } from '../../schemas';

export const auditController = {
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
};
