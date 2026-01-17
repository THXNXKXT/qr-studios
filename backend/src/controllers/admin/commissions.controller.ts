/**
 * Admin Commissions Controller
 * Commission management: list, update status
 */

import type { Context } from 'hono';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { success, paginated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { commissionService } from '../../services/commission.service';
import { auditService } from '../../services/audit.service';
import { idParamSchema, paginationSchema, commissionFilterSchema, updateCommissionStatusSchema } from '../../schemas';

export const commissionsController = {
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
};
