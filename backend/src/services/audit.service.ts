import { db } from '../db';
import * as schema from '../db/schema';
import { trackedQuery, logger as baseLogger } from '../utils';

const logger = baseLogger.child('[AuditService]');

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

class AuditService {
  private logger = logger;

  async log(data: AuditLogData) {
    try {
      await trackedQuery(async () => {
        return await db.insert(schema.auditLogs).values({
          userId: data.userId || null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          oldData: data.oldData || null,
          newData: data.newData || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        });
      }, 'audit.log');
    } catch (error) {
      this.logger.error('Failed to create audit log', { error });
    }
  }
}

export const auditService = new AuditService();
