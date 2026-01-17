import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { productsController } from '../controllers/products.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { reviewCreationRateLimit } from '../middleware/rate-limit.middleware';
import { addReviewSchema, productsQuerySchema, idParamSchema, searchSchema } from '../schemas';

const products = new Hono();

products.get('/categories', productsController.getCategories);
products.get('/:id/stock', zValidator('param', idParamSchema), productsController.checkStock);
products.get('/:id/reviews', zValidator('param', idParamSchema), productsController.getReviews);

// Protected routes
products.get('/', optionalAuthMiddleware, zValidator('query', productsQuerySchema), productsController.getAll);
products.get('/featured', optionalAuthMiddleware, productsController.getFeatured);
products.get('/flash-sale', optionalAuthMiddleware, productsController.getFlashSale);
products.get('/search', optionalAuthMiddleware, zValidator('query', searchSchema), productsController.search);
products.get('/:id', optionalAuthMiddleware, zValidator('param', idParamSchema), productsController.getById);

// Download route - needs auth for fetch but might be called differently
products.get('/:id/download', authMiddleware, zValidator('param', idParamSchema), productsController.download);

products.post('/:id/reviews', authMiddleware, reviewCreationRateLimit, zValidator('param', idParamSchema), zValidator('json', addReviewSchema), productsController.addReview);
products.patch('/reviews/:id', authMiddleware, zValidator('param', idParamSchema), zValidator('json', addReviewSchema.partial()), productsController.updateReview);
products.delete('/reviews/:id', authMiddleware, zValidator('param', idParamSchema), productsController.deleteReview);

export default products;
