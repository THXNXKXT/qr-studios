import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { wishlistController } from '../controllers/wishlist.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { addToWishlistSchema, productIdParamSchema } from '../schemas';

const wishlist = new Hono();

wishlist.use('*', authMiddleware);

wishlist.get('/', wishlistController.getAll);
wishlist.post('/', zValidator('json', addToWishlistSchema), wishlistController.add);
wishlist.get('/count', wishlistController.getCount);
wishlist.delete('/clear', wishlistController.clear);
wishlist.get('/:productId/check', zValidator('param', productIdParamSchema), wishlistController.check);
wishlist.delete('/:productId', zValidator('param', productIdParamSchema), wishlistController.remove);

export default wishlist;
