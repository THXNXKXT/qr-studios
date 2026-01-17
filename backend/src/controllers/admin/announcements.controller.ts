/**
 * Admin Announcements Controller
 * Announcement management: list, create, update, delete, toggle
 */

import type { Context } from 'hono';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { success } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { auditService } from '../../services/audit.service';
import { idParamSchema, createAnnouncementSchema } from '../../schemas';

export const announcementsController = {
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
};
