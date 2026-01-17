import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { topupController } from '../controllers/topup.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { topupCreationRateLimit } from '../middleware/rate-limit.middleware';
import { createTopupSessionSchema, sessionIdParamSchema } from '../schemas';

const topup = new Hono();

topup.get('/packages', topupController.getPackages);
topup.post('/stripe', authMiddleware, topupCreationRateLimit, zValidator('json', createTopupSessionSchema), topupController.createStripeSession);
topup.get('/history', authMiddleware, topupController.getHistory);
topup.get('/verify/:sessionId', authMiddleware, zValidator('param', sessionIdParamSchema), topupController.verifySession);

export default topup;
