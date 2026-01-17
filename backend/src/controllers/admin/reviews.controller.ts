/**
 * Admin Reviews Controller
 * Review management: list, toggle verification, delete
 */

import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, desc, count, ilike } from 'drizzle-orm';
import { success, paginated } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { auditService } from '../../services/audit.service';
import { idParamSchema, paginationSchema } from '../../schemas';

export const reviewsController = {
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
};
