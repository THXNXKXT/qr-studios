/**
 * Admin Promo Codes Controller
 * Promo code management: list, create, update, delete, toggle
 */

import type { Context } from 'hono';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { success } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { auditService } from '../../services/audit.service';
import { idParamSchema, createPromoCodeSchema } from '../../schemas';

export const promoController = {
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
};
