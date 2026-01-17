/**
 * Admin Settings Controller
 * System settings management
 */

import type { Context } from 'hono';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { success } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';
import { auditService } from '../../services/audit.service';

export const settingsController = {
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
