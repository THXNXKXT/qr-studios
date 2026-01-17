/**
 * Admin Licenses Controller
 * License management: list, grant, revoke
 */

import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, desc, count, ilike } from 'drizzle-orm';
import { success, paginated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { licensesService } from '../../services/licenses.service';
import { auditService } from '../../services/audit.service';
import { idParamSchema, paginationSchema, grantLicenseSchema } from '../../schemas';

export const licensesController = {
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
                },
            }),
            db.select({ value: count() }).from(schema.licenses).where(where),
        ]);

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
};
