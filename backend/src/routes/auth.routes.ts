import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRefreshRateLimit, authSessionRateLimit } from '../middleware/rate-limit.middleware';
import { createSessionSchema, refreshTokenSchema, syncUserSchema } from '../schemas';

const auth = new Hono({ strict: false });

auth.get('/session', authMiddleware, authController.getSession);
auth.post('/session', authSessionRateLimit, zValidator('json', syncUserSchema), authController.createSession);
auth.post('/refresh', authRefreshRateLimit, zValidator('json', refreshTokenSchema), authController.refresh);
auth.post('/signout', authMiddleware, authController.signOut);

export default auth;
