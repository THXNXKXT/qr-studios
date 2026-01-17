import type { Context } from 'hono';
import { commissionService } from '../services/commission.service';
import { success, paginated } from '../utils/response';
import { idParamSchema, createCommissionSchema, paginationSchema } from '../schemas';
import { storageService } from '../services/storage.service';
import { nanoid } from 'nanoid';
import { BadRequestError } from '../utils/errors';

export const commissionController = {
  async getAll(c: Context) {
    const user = c.get('user');
    const { page, limit } = paginationSchema.parse(c.req.query());
    
    const result = await commissionService.getUserCommissions(user.id, { page, limit });
    return paginated(c, result.commissions, page, limit, result.pagination.total);
  },

  async getById(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());
    
    const commission = await commissionService.getCommissionById(id, user.id);
    return success(c, commission);
  },

  async create(c: Context) {
    const user = c.get('user');
    const { title, description, budget, attachments } = createCommissionSchema.parse(await c.req.json());

    const commission = await commissionService.createCommission(user.id, {
      title,
      description,
      budget,
      attachments,
    });

    return success(c, commission, 'Commission created successfully', 201);
  },

  async delete(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());

    await commissionService.deleteCommission(id, user.id);
    return success(c, null, 'Commission deleted successfully');
  },

  async uploadAttachment(c: Context) {
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    const extension = file.name.split('.').pop();
    const fileName = `${nanoid()}.${extension}`;
    const key = `commissions/attachments/${fileName}`;

    const buffer = await file.arrayBuffer();
    const publicUrl = await storageService.uploadFile(key, new Uint8Array(buffer), file.type);

    return success(c, {
      url: publicUrl,
      key: key,
      name: file.name,
    }, 'Attachment uploaded successfully');
  },
};
