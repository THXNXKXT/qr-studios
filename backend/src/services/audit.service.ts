import { db } from '../db';
import * as schema from '../db/schema';
import { logger } from '../utils/logger';

export interface AuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const auditService = {
  async log(data: AuditLogData) {
    try {
      await db.insert(schema.auditLogs).values({
        userId: data.userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error });
    }
  },
};
