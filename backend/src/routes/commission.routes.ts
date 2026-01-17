import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { commissionController } from '../controllers/commission.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { commissionCreationRateLimit } from '../middleware/rate-limit.middleware';
import { createCommissionSchema, idParamSchema } from '../schemas';

const commission = new Hono();

commission.use('*', authMiddleware);

commission.get('/', commissionController.getAll);
commission.post('/upload', commissionController.uploadAttachment);
commission.post('/', commissionCreationRateLimit, zValidator('json', createCommissionSchema), commissionController.create);
commission.get('/:id', zValidator('param', idParamSchema), commissionController.getById);
commission.delete('/:id', zValidator('param', idParamSchema), commissionController.delete);

export default commission;
