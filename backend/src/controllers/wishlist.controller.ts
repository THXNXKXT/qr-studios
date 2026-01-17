import type { Context } from 'hono';
import { wishlistService } from '../services/wishlist.service';
import { success } from '../utils/response';
import { productIdParamSchema, addToWishlistSchema } from '../schemas';

export const wishlistController = {
  async getAll(c: Context) {
    const user = c.get('user');
    const wishlist = await wishlistService.getUserWishlist(user.id);
    return success(c, wishlist);
  },

  async add(c: Context) {
    const user = c.get('user');
    const { productId } = addToWishlistSchema.parse(await c.req.json());

    const wishlistItem = await wishlistService.addToWishlist(user.id, productId);
    return success(c, wishlistItem, 'Added to wishlist', 201);
  },

  async remove(c: Context) {
    const user = c.get('user');
    const { productId } = productIdParamSchema.parse(c.req.param());

    await wishlistService.removeFromWishlist(user.id, productId);
    return success(c, null, 'Removed from wishlist');
  },

  async check(c: Context) {
    const user = c.get('user');
    const { productId } = productIdParamSchema.parse(c.req.param());

    const result = await wishlistService.isInWishlist(user.id, productId);
    return success(c, result);
  },

  async clear(c: Context) {
    const user = c.get('user');
    await wishlistService.clearWishlist(user.id);
    return success(c, null, 'Wishlist cleared');
  },

  async getCount(c: Context) {
    const user = c.get('user');
    const result = await wishlistService.getWishlistCount(user.id);
    return success(c, result);
  },
};
