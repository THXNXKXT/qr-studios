import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { licensesController } from '../controllers/licenses.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { licenseVerifyRateLimit } from '../middleware/rate-limit.middleware';
import { updateIPWhitelistSchema, licenseVerifySchema, licenseDownloadSchema, idParamSchema } from '../schemas';

const licenses = new Hono();

// Public/Token-based routes (Must be before authMiddleware or use explicit protection)
licenses.get('/verify', zValidator('query', licenseVerifySchema), licenseVerifyRateLimit, licensesController.verify);
licenses.get('/:id/download', zValidator('param', idParamSchema), zValidator('query', licenseDownloadSchema), licensesController.download);

// Protected routes - explicit protection instead of use('*') to avoid catching the download route
licenses.get('/', authMiddleware, licensesController.getAll);
licenses.get('/stats', authMiddleware, licensesController.getStats);
licenses.get('/:id', authMiddleware, zValidator('param', idParamSchema), licensesController.getById);
licenses.patch('/:id/ip', authMiddleware, zValidator('param', idParamSchema), zValidator('json', updateIPWhitelistSchema), licensesController.updateIP);
licenses.post('/:id/ip/reset', authMiddleware, zValidator('param', idParamSchema), licensesController.resetIP);
licenses.get('/:id/download-url', authMiddleware, zValidator('param', idParamSchema), licensesController.getDownloadURL);

export default licenses;
