import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { trackedQuery, logger as baseLogger } from '../utils';

const logger = baseLogger.child('[WishlistService]');

class WishlistService {
  private logger = logger;

  async getUserWishlist(userId: string) {
    return await trackedQuery(async () => {
      return await db.query.wishlists.findMany({
        where: eq(schema.wishlists.userId, userId),
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              originalPrice: true,
              category: true,
              images: true,
              isNew: true,
              isFeatured: true,
              isFlashSale: true,
              flashSalePrice: true,
              flashSaleEnds: true,
            },
          },
        },
        orderBy: [desc(schema.wishlists.createdAt)],
      });
    }, 'wishlist.getUserWishlist');
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await trackedQuery(async () => {
      return await db.query.products.findFirst({
        where: eq(schema.products.id, productId),
      });
    }, 'wishlist.addToWishlist.findProduct');

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    try {
      const wishlistsResult = await trackedQuery(async () => {
        return await db.insert(schema.wishlists)
          .values({ userId, productId })
          .returning();
      }, 'wishlist.addToWishlist.insert');

      const wishlistItem = wishlistsResult[0];
      if (!wishlistItem) throw new Error('Failed to add item to wishlist');

      // Get full wishlist item with product details for response
      const finalItem = await trackedQuery(async () => {
        return await db.query.wishlists.findFirst({
          where: eq(schema.wishlists.id, wishlistItem.id),
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
                price: true,
                category: true,
                images: true,
              }
            }
          },
        });
      }, 'wishlist.addToWishlist.getFinalItem');

      return finalItem;
    } catch (error: any) {
      // Unique constraint error in PostgreSQL/Drizzle
      if (error.message.includes('unique constraint') || error.code === '23505') {
        throw new BadRequestError('Product already in wishlist');
      }
      throw error;
    }
  }

  async removeFromWishlist(userId: string, productId: string) {
    const result = await trackedQuery(async () => {
      return await db.delete(schema.wishlists)
        .where(
          and(
            eq(schema.wishlists.userId, userId),
            eq(schema.wishlists.productId, productId)
          )
        )
        .returning();
    }, 'wishlist.removeFromWishlist');

    if (result.length === 0) {
      throw new NotFoundError('Product not in wishlist');
    }

    return { success: true };
  }

  async isInWishlist(userId: string, productId: string) {
    const wishlistItem = await trackedQuery(async () => {
      return await db.query.wishlists.findFirst({
        where: and(
          eq(schema.wishlists.userId, userId),
          eq(schema.wishlists.productId, productId)
        ),
      });
    }, 'wishlist.isInWishlist');

    return { inWishlist: !!wishlistItem };
  }

  async clearWishlist(userId: string) {
    await trackedQuery(async () => {
      return await db.delete(schema.wishlists).where(eq(schema.wishlists.userId, userId));
    }, 'wishlist.clearWishlist');

    return { success: true };
  }

  async getWishlistCount(userId: string) {
    const [result] = await trackedQuery(async () => {
      return await db.select({ value: count() })
        .from(schema.wishlists)
        .where(eq(schema.wishlists.userId, userId));
    }, 'wishlist.getWishlistCount');

    return { count: result?.value ?? 0 };
  }
}

export const wishlistService = new WishlistService();
