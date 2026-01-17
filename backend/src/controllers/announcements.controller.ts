import type { Context } from 'hono';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, or, sql, desc, lte, gte } from 'drizzle-orm';
import { success } from '../utils/response';
import { idParamSchema } from '../schemas';

export const announcementsController = {
  async getActive(c: Context) {
    const now = new Date();
    
    const activeAnnouncements = await db.query.announcements.findMany({
      where: and(
        eq(schema.announcements.isActive, true),
        or(
          sql`${schema.announcements.startsAt} IS NULL`,
          lte(schema.announcements.startsAt, now)
        ),
        or(
          sql`${schema.announcements.endsAt} IS NULL`,
          gte(schema.announcements.endsAt, now)
        )
      ),
      columns: {
        id: true,
        title: true,
        content: true,
        media: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
      orderBy: [desc(schema.announcements.createdAt)],
    });

    c.header('Cache-Control', 'public, max-age=1800'); // Cache for 30 mins
    return success(c, activeAnnouncements);
  },

  async getById(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());

    const announcement = await db.query.announcements.findFirst({
      where: eq(schema.announcements.id, id),
      columns: {
        id: true,
        title: true,
        content: true,
        media: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
    });

    if (!announcement) {
      return c.json({ success: false, error: 'Announcement not found' }, 404);
    }

    return success(c, announcement);
  }
};
