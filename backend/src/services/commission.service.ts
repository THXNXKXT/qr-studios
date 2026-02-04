import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../utils/errors';

import { BaseService, trackedQuery, logger as baseLogger } from '../utils';
import type { InferSelectModel } from 'drizzle-orm';

export type Commission = InferSelectModel<typeof schema.commissions>;

const logger = baseLogger.child('[CommissionService]');

class CommissionService extends BaseService<typeof schema.commissions, Commission> {
  protected table = schema.commissions;
  protected tableName = 'commissions';
  protected logger = logger;

  async getUserCommissions(userId: string, params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    return await trackedQuery(async () => {
      const [commissionsData, totalResult] = await Promise.all([
        db.query.commissions.findMany({
          where: eq(schema.commissions.userId, userId),
          orderBy: [desc(schema.commissions.createdAt)],
          offset,
          limit,
          columns: {
            id: true,
            userId: true,
            title: true,
            description: true,
            budget: true,
            status: true,
            attachments: true,
            adminNotes: true,
            createdAt: true,
            updatedAt: true,
          }
        }),
        db.select({ value: count() }).from(schema.commissions).where(eq(schema.commissions.userId, userId)),
      ]);

      const total = totalResult[0]?.value ?? 0;

      return {
        commissions: commissionsData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }, 'commission.getUserCommissions');
  }

  async getCommissionById(commissionId: string, userId?: string) {
    const commission = await db.query.commissions.findFirst({
      where: eq(schema.commissions.id, commissionId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            email: true,
            discordId: true,
          },
        },
      },
    });

    if (!commission) {
      throw new NotFoundError('Commission not found');
    }

    if (userId && commission.userId !== userId) {
      throw new UnauthorizedError('Unauthorized access to commission');
    }

    return commission;
  }

  async createCommission(
    userId: string,
    data: {
      title: string;
      description: string;
      budget?: number;
      attachments?: string[];
    }
  ) {
    const [commission] = await db.insert(schema.commissions).values({
      userId,
      title: data.title,
      description: data.description,
      budget: data.budget,
      attachments: data.attachments || [],
      status: 'PENDING',
    }).returning();

    if (!commission) throw new Error('Failed to create commission');

    await db.insert(schema.notifications).values({
      userId,
      title: 'Commission Submitted',
      message: `Your commission request "${data.title}" has been submitted and is pending review.`,
      type: 'SYSTEM',
    });

    return commission;
  }

  async updateCommissionStatus(
    commissionId: string,
    status: any,
    adminNotes?: string
  ) {
    return await db.transaction(async (tx) => {
      const commission = await tx.query.commissions.findFirst({
        where: eq(schema.commissions.id, commissionId),
      });

      if (!commission) {
        throw new NotFoundError('Commission not found');
      }

      // If status is the same, just return
      if (commission.status === status) {
        return commission;
      }

      const [updatedCommission] = await tx.update(schema.commissions)
        .set({
          status,
          adminNotes,
          updatedAt: new Date(),
        })
        .where(eq(schema.commissions.id, commissionId))
        .returning();

      if (!updatedCommission) throw new Error('Failed to update commission status');

      let notificationMessage = '';
      switch (status) {
        case 'ACCEPTED':
          notificationMessage = `Your commission "${updatedCommission.title}" has been accepted!`;
          break;
        case 'IN_PROGRESS':
          notificationMessage = `Work has started on your commission "${updatedCommission.title}".`;
          break;
        case 'COMPLETED':
          notificationMessage = `Your commission "${updatedCommission.title}" has been completed!`;
          break;
        case 'CANCELLED':
          notificationMessage = `Your commission "${updatedCommission.title}" has been cancelled.`;
          break;
      }

      if (notificationMessage) {
        await tx.insert(schema.notifications).values({
          userId: updatedCommission.userId,
          title: 'Commission Update',
          message: notificationMessage,
          type: 'SYSTEM',
        });
      }

      return updatedCommission;
    });
  }

  async deleteCommission(commissionId: string, userId: string) {
    const result = await db.delete(schema.commissions)
      .where(
        and(
          eq(schema.commissions.id, commissionId),
          eq(schema.commissions.userId, userId),
          eq(schema.commissions.status, 'PENDING')
        )
      )
      .returning();

    if (result.length === 0) {
      // Check if it exists but is not pending, or belongs to another user
      const commission = await db.query.commissions.findFirst({ where: eq(schema.commissions.id, commissionId) });
      if (!commission) throw new NotFoundError('Commission not found');
      if (commission.userId !== userId) throw new UnauthorizedError('Unauthorized');
      throw new BadRequestError('Can only delete pending commissions');
    }

    return { success: true };
  }

  async getAllCommissions(params: {
    status?: any;
    userId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, userId, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    const filters = [];
    if (status) filters.push(eq(schema.commissions.status, status));
    if (userId) filters.push(eq(schema.commissions.userId, userId));

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [commissionsData, totalResult] = await Promise.all([
      db.query.commissions.findMany({
        where,
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
              discordId: true,
              avatar: true,
            },
          },
        },
        orderBy: [desc(schema.commissions.createdAt)],
        offset,
        limit,
      }),
      db.select({ value: count() }).from(schema.commissions).where(where),
    ]);

    const total = totalResult[0]?.value ?? 0;

    return {
      commissions: commissionsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCommissionStats() {
    return await trackedQuery(async () => {
      const [
        totalResult, pendingResult, acceptedResult, inProgressResult, completedResult, cancelledResult
      ] = await Promise.all([
        db.select({ value: count() }).from(schema.commissions),
        db.select({ value: count() }).from(schema.commissions).where(eq(schema.commissions.status, 'PENDING')),
        db.select({ value: count() }).from(schema.commissions).where(eq(schema.commissions.status, 'ACCEPTED')),
        db.select({ value: count() }).from(schema.commissions).where(eq(schema.commissions.status, 'IN_PROGRESS')),
        db.select({ value: count() }).from(schema.commissions).where(eq(schema.commissions.status, 'COMPLETED')),
        db.select({ value: count() }).from(schema.commissions).where(eq(schema.commissions.status, 'CANCELLED')),
      ]);

      return {
        total: totalResult[0]?.value ?? 0, pending: pendingResult[0]?.value ?? 0,
        accepted: acceptedResult[0]?.value ?? 0, inProgress: inProgressResult[0]?.value ?? 0,
        completed: completedResult[0]?.value ?? 0, cancelled: cancelledResult[0]?.value ?? 0,
      };
    }, 'commission.getStats');
  }
}

export const commissionService = new CommissionService();
