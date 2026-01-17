import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count, ilike, or, asc, avg, type InferSelectModel } from 'drizzle-orm';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { getTierInfo } from '../utils/tiers';

export type Product = InferSelectModel<typeof schema.products>;

export const productsService = {
  async getUserTierInfo(userId?: string) {
    if (!userId) return null;
    const [totalSpentResult] = await db.select({
      total: sql<number>`sum(${schema.orders.total})`
    })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.userId, userId),
        eq(schema.orders.status, 'COMPLETED')
      )
    );
    const totalSpent = Number(totalSpentResult?.total || 0);
    return getTierInfo(totalSpent);
  },

  calculateProductExpectedPoints(product: { rewardPoints: number | null }) {
    // Reward Point logic: 
    // If rewardPoints is set (> 0), use that value exactly.
    // If rewardPoints is null or 0, do not show points (return 0).
    if (product.rewardPoints !== null && product.rewardPoints !== undefined && product.rewardPoints > 0) {
      return product.rewardPoints;
    }

    return 0;
  },

  async calculateExpectedPoints(product: Product) {
    return this.calculateProductExpectedPoints(product);
  },

  async getAllProducts(params: {
    category?: string;
    search?: string;
    sort?: string;
    isFlashSale?: boolean;
    page?: number;
    limit?: number;
    userId?: string;
  }) {
    const { category, search, sort = 'createdAt', isFlashSale, page = 1, limit = 12 } = params;
    const offset = (page - 1) * limit;

    const filters = [eq(schema.products.isActive, true)];

    if (category) {
      filters.push(eq(schema.products.category, category.toUpperCase() as any));
    }

    if (isFlashSale !== undefined) {
      filters.push(eq(schema.products.isFlashSale, isFlashSale));
    }

    if (search) {
      const searchFilter = or(
        ilike(schema.products.name, `%${search}%`),
        ilike(schema.products.description, `%${search}%`)
      );
      if (searchFilter) filters.push(searchFilter);
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [productsData, totalResult] = await Promise.all([
      db.query.products.findMany({
        where,
        offset,
        limit,
        orderBy: productsService.getSortOrder(sort),
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          originalPrice: true,
          category: true,
          thumbnail: true,
          images: true,
          downloadUrl: true,
          isDownloadable: true,
          features: true,
          tags: true,
          stock: true,
          isNew: true,
          isFeatured: true,
          isFlashSale: true,
          flashSalePrice: true,
          flashSaleEnds: true,
          rewardPoints: true,
          version: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      db.select({ value: count() }).from(schema.products).where(where ?? sql`TRUE`),
    ]);

    const total = totalResult[0]?.value ?? 0;

    const productsWithPoints = productsData.map((product) => ({
      ...product,
      expectedPoints: this.calculateProductExpectedPoints(product as any),
    }));

    return {
      products: productsWithPoints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getSortOrder(sort: string) {
    switch (sort) {
      case 'price-asc':
        return [asc(schema.products.price)];
      case 'price-desc':
        return [desc(schema.products.price)];
      case 'name':
        return [asc(schema.products.name)];
      case 'newest':
        return [desc(schema.products.createdAt)];
      default:
        return [desc(schema.products.createdAt)];
    }
  },

  async getProductById(id: string, userId?: string) {
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, id),
      with: {
        reviews: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: [desc(schema.reviews.createdAt)],
          limit: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // If product is archived, check if user has purchased it
    if (!product.isActive) {
      if (!userId) {
        throw new NotFoundError('Product not found');
      }
      const hasPurchased = await this.hasUserPurchasedProduct(userId, id);
      if (!hasPurchased) {
        throw new NotFoundError('Product not found');
      }
    }

    const [ratingResult] = await db.select({
      avgRating: avg(schema.reviews.rating),
      count: count(),
    })
    .from(schema.reviews)
    .where(eq(schema.reviews.productId, id));

    return {
      ...product,
      rating: Number(ratingResult?.avgRating || 0),
      reviewCount: ratingResult?.count ?? 0,
      expectedPoints: this.calculateProductExpectedPoints(product as any),
    };
  },

  async getFeaturedProducts(userId?: string) {
    const productsData = await db.query.products.findMany({
      where: and(
        eq(schema.products.isFeatured, true),
        eq(schema.products.isActive, true)
      ),
      limit: 8,
      orderBy: [desc(schema.products.createdAt)],
      columns: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        category: true,
        images: true,
        isNew: true,
        isFeatured: true,
        isFlashSale: true,
        flashSalePrice: true,
        flashSaleEnds: true,
        rewardPoints: true,
        version: true,
        isActive: true,
      }
    });

    return productsData.map((product) => ({
      ...product,
      expectedPoints: this.calculateProductExpectedPoints(product as any),
    }));
  },

  async getFlashSaleProducts(userId?: string) {
    const now = new Date();
    
    const productsData = await db.query.products.findMany({
      where: and(
        eq(schema.products.isFlashSale, true),
        eq(schema.products.isActive, true),
        sql`${schema.products.flashSaleEnds} >= ${now}`
      ),
      orderBy: [asc(schema.products.flashSaleEnds)],
      columns: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        category: true,
        images: true,
        isNew: true,
        isFeatured: true,
        isFlashSale: true,
        flashSalePrice: true,
        flashSaleEnds: true,
        rewardPoints: true,
        version: true,
        isActive: true,
      }
    });

    return productsData.map((product) => ({
      ...product,
      expectedPoints: this.calculateProductExpectedPoints(product as any),
    }));
  },

  async searchProducts(query: string, userId?: string) {
    const productsData = await db.query.products.findMany({
      where: and(
        eq(schema.products.isActive, true),
        or(
          ilike(schema.products.name, `%${query}%`),
          ilike(schema.products.description, `%${query}%`)
        )
      ),
      limit: 20,
      columns: {
        id: true,
        name: true,
        slug: true,
        price: true,
        category: true,
        images: true,
        isFlashSale: true,
        flashSalePrice: true,
        flashSaleEnds: true,
        rewardPoints: true,
        version: true,
        isActive: true,
      }
    });

    return productsData.map((product) => ({
      ...product,
      expectedPoints: this.calculateProductExpectedPoints(product as any),
    }));
  },

  async getProductReviews(productId: string, params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    const [reviewsData, totalResult] = await Promise.all([
      db.query.reviews.findMany({
        where: eq(schema.reviews.productId, productId),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: [desc(schema.reviews.createdAt)],
        offset,
        limit,
      }),
      db.select({ value: count() }).from(schema.reviews).where(eq(schema.reviews.productId, productId)),
    ]);

    const total = totalResult[0]?.value ?? 0;

    return {
      reviews: reviewsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async addProductReview(productId: string, userId: string, data: { rating: number; comment: string }) {
    return await db.transaction(async (tx) => {
      const product = await tx.query.products.findFirst({
        where: eq(schema.products.id, productId),
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      // Check for existing review
      const existingReview = await tx.query.reviews.findFirst({
        where: and(
          eq(schema.reviews.productId, productId),
          eq(schema.reviews.userId, userId)
        ),
      });

      if (existingReview) {
        throw new BadRequestError('You have already reviewed this product');
      }

      // Check if user purchased the product
      const hasPurchased = await tx.query.orders.findFirst({
        where: and(
          eq(schema.orders.userId, userId),
          eq(schema.orders.status, 'COMPLETED')
        ),
        with: {
          items: {
            where: eq(schema.orderItems.productId, productId),
            limit: 1,
          },
        },
      });

      if (!hasPurchased || (hasPurchased.items && hasPurchased.items.length === 0)) {
        throw new ForbiddenError('You must purchase this product before leaving a review');
      }

      try {
        const [review] = await tx.insert(schema.reviews)
          .values({
            productId,
            userId,
            rating: data.rating,
            comment: data.comment,
            isVerified: true,
          })
          .returning();

        // Get user details for response
        const user = await tx.query.users.findFirst({
          where: eq(schema.users.id, userId),
          columns: {
            id: true,
            username: true,
            avatar: true,
          },
        });

        return { ...review, user };
      } catch (error: any) {
        // Unique constraint error in PostgreSQL/Drizzle
        if (error.message.includes('unique constraint') || error.code === '23505') {
          throw new BadRequestError('You have already reviewed this product');
        }
        throw error;
      }
    });
  },

  async updateProductReview(reviewId: string, userId: string, data: { rating?: number; comment?: string }) {
    const [review] = await db.select()
      .from(schema.reviews)
      .where(eq(schema.reviews.id, reviewId));

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenError('Unauthorized to update this review');
    }

    const [updatedReview] = await db.update(schema.reviews)
      .set({
        rating: data.rating,
        comment: data.comment,
      })
      .where(eq(schema.reviews.id, reviewId))
      .returning();

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        id: true,
        username: true,
        avatar: true,
      },
    });

    return { ...updatedReview, user };
  },

  async deleteProductReview(reviewId: string, userId: string, isAdmin: boolean = false) {
    const [review] = await db.select()
      .from(schema.reviews)
      .where(eq(schema.reviews.id, reviewId));

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenError('Unauthorized to delete this review');
    }

    await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId));

    return { success: true };
  },

  async checkStock(productId: string) {
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, productId),
      columns: { stock: true },
    });
    if (!product) throw new NotFoundError('Product not found');
    return {
      inStock: product.stock === -1 || product.stock > 0,
      stock: product.stock,
    };
  },

  async hasUserPurchasedProduct(userId: string, productId: string) {
    const [purchase] = await db
      .select({ id: schema.orderItems.id })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .where(
        and(
          eq(schema.orders.userId, userId),
          eq(schema.orderItems.productId, productId),
          eq(schema.orders.status, 'COMPLETED')
        )
      )
      .limit(1);
    
    return !!purchase;
  },

  async getCategories() {
    return ['SCRIPT', 'UI', 'BUNDLE'];
  },
};
