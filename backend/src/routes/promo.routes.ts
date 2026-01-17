import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { promoValidationRateLimit } from '../middleware/rate-limit.middleware';
import { promoController } from '../controllers/promo.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { validatePromoSchema, applyPromoSchema } from '../schemas';

const promo = new Hono();

promo.post('/validate', optionalAuthMiddleware, promoValidationRateLimit, zValidator('json', validatePromoSchema), promoController.validate);
promo.post('/apply', authMiddleware, zValidator('json', applyPromoSchema), promoController.apply);

export default promo;
