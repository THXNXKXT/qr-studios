import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ordersController } from '../controllers/orders.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { orderCreationRateLimit } from '../middleware/rate-limit.middleware';
import { createOrderSchema, idParamSchema } from '../schemas';

const orders = new Hono();

orders.use('*', authMiddleware);

orders.get('/', ordersController.getAll);
orders.post('/', orderCreationRateLimit, zValidator('json', createOrderSchema), ordersController.create);
orders.get('/:id', zValidator('param', idParamSchema), ordersController.getById);
orders.patch('/:id/cancel', zValidator('param', idParamSchema), ordersController.cancel);

export default orders;
