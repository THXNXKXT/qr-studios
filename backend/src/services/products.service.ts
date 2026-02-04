import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count, ilike, or, asc, avg, inArray, type InferSelectModel } from 'drizzle-orm';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { getTierInfo } from '../utils/tiers';
import { BaseService, cache, trackedQuery, sanitizeString, logger as baseLogger } from '../utils';

export type Product = InferSelectModel<typeof schema.products>;

interface ProductWithRating {
  rating: number;
  reviewCount: number;
  expectedPoints: number;
}

const logger = baseLogger.child('[ProductsService]');

class ProductsService extends BaseService<typeof schema.products, Product> {
  protected table = schema.products;
  protected tableName = 'products';
  protected logger = logger;

  // Column selections for different use cases
  private readonly fullColumns = {
    id: true, name: true, slug: true, description: true, price: true,
    originalPrice: true, category: true, thumbnail: true, images: true,
    downloadUrl: true, downloadFileKey: true, downloadKey: true,
    isDownloadable: true, features: true, tags: true,
    stock: true, isNew: true, isFeatured: true, isFlashSale: true,
    flashSalePrice: true, flashSaleEnds: true, rewardPoints: true,
    version: true, isActive: true, createdAt: true, updatedAt: true,
  } as const;

  private readonly listColumns = {
    id: true, name: true, slug: true, price: true, originalPrice: true,
    category: true, thumbnail: true, images: true, isNew: true,
    isFeatured: true, isFlashSale: true, flashSalePrice: true,
    flashSaleEnds: true, rewardPoints: true, stock: true,
    version: true, isActive: true,
  } as const;

  async getUserTierInfo(userId?: string) {
    if (!userId) return null;
    return await trackedQuery(async () => {
      const [totalSpentResult] = await db.select({
        total: sql<number>`sum(${schema.orders.total})`
      })
      .from(schema.orders)
      .where(and(
        eq(schema.orders.userId, userId),
        eq(schema.orders.status, 'COMPLETED')
      ));
      const totalSpent = Number(totalSpentResult?.total || 0);
      return getTierInfo(totalSpent);
    }, 'products.getUserTierInfo');
  }

  calculateProductExpectedPoints(product: { rewardPoints: number | null }) {
    if (product.rewardPoints !== null && product.rewardPoints !== undefined && product.rewardPoints > 0) {
      return product.rewardPoints;
    }
    return 0;
  }

  async calculateExpectedPoints(product: Product) {
    return this.calculateProductExpectedPoints(product);
  }

  getSortOrder(sort: string) {
    switch (sort) {
      case 'price-asc': return [asc(schema.products.price)];
      case 'price-desc': return [desc(schema.products.price)];
      case 'name': return [asc(schema.products.name)];
      case 'newest': return [desc(schema.products.createdAt)];
      default: return [desc(schema.products.createdAt)];
    }
  }

  private async enrichWithRatings<T extends { id: string; rewardPoints: number | null }>(
    products: T[]
  ): Promise<Array<T & ProductWithRating>> {
    if (products.length === 0) return [];
    
    const productIds = products.map(p => p.id);
    const ratingsData = await trackedQuery(() => db.select({
      productId: schema.reviews.productId,
      avgRating: avg(schema.reviews.rating),
      reviewCount: count(),
    }).from(schema.reviews).where(inArray(schema.reviews.productId, productIds)).groupBy(schema.reviews.productId), 'products.enrichRatings');

    const ratingsMap = new Map(ratingsData.map(r => [r.productId, r]));
    
    return products.map(product => {
      const ratingInfo = ratingsMap.get(product.id);
      return {
        ...product,
        rating: Number(ratingInfo?.avgRating || 0),
        reviewCount: ratingInfo?.reviewCount ?? 0,
        expectedPoints: this.calculateProductExpectedPoints(product),
      };
    });
  }

  async getAllProducts(params: {
    category?: string; search?: string; sort?: string;
    isFlashSale?: boolean; page?: number; limit?: number; userId?: string;
  }): Promise<{
    products: Array<Product & ProductWithRating>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const cacheKey = `products:list:${JSON.stringify(params)}`;
    type ResultType = ReturnType<typeof this.getAllProducts> extends Promise<infer T> ? T : never;
    const cached = cache.get<ResultType>(cacheKey);
    if (cached) return cached;

    const { category, search, sort = 'createdAt', isFlashSale, page = 1, limit = 12 } = params;
    const offset = (page - 1) * limit;

    const result = await trackedQuery(async () => {
      const filters: (ReturnType<typeof eq> | ReturnType<typeof or>)[] = [eq(schema.products.isActive, true)];
      if (category) filters.push(eq(schema.products.category, category.toUpperCase() as 'SCRIPT' | 'UI' | 'BUNDLE'));
      if (isFlashSale !== undefined) filters.push(eq(schema.products.isFlashSale, isFlashSale));
      if (search) {
        const sanitized = sanitizeString(search);
        const searchCondition = or(
          ilike(schema.products.name, `%${sanitized}%`),
          ilike(schema.products.description, `%${sanitized}%`)
        );
        if (searchCondition) filters.push(searchCondition);
      }
      const where = and(...filters);

      const [productsData, totalResult] = await Promise.all([
        db.query.products.findMany({ where, offset, limit, orderBy: this.getSortOrder(sort), columns: this.fullColumns }),
        db.select({ value: count() }).from(schema.products).where(where ?? sql`TRUE`),
      ]);

      const total = totalResult[0]?.value ?? 0;
      const productsWithRatings = await this.enrichWithRatings(productsData);

      return {
        products: productsWithRatings,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, 'products.getAllProducts');

    cache.set(cacheKey, result, 2 * 60 * 1000); // Cache 2 minutes
    return result;
  }

  async getProductById(id: string, userId?: string) {
    return await trackedQuery(async () => {
      const product = await db.query.products.findFirst({
        where: eq(schema.products.id, id),
        with: {
          reviews: {
            with: { user: { columns: { id: true, username: true, avatar: true } } },
            orderBy: [desc(schema.reviews.createdAt)],
            limit: 10,
          },
        },
      });

      if (!product) throw new NotFoundError('Product not found');

      if (!product.isActive) {
        if (!userId) throw new NotFoundError('Product not found');
        const hasPurchased = await this.hasUserPurchasedProduct(userId, id);
        if (!hasPurchased) throw new NotFoundError('Product not found');
      }

      const [ratingResult] = await db.select({ avgRating: avg(schema.reviews.rating), count: count() })
        .from(schema.reviews).where(eq(schema.reviews.productId, id));

      return {
        ...product,
        rating: Number(ratingResult?.avgRating || 0),
        reviewCount: ratingResult?.count ?? 0,
        expectedPoints: this.calculateProductExpectedPoints(product as Product),
      };
    }, 'products.getProductById');
  }

  async getFeaturedProducts(_userId?: string): Promise<Array<Partial<Product> & ProductWithRating>> {
    const cacheKey = 'products:featured';
    const cached = cache.get<Array<Partial<Product> & ProductWithRating>>(cacheKey);
    if (cached) return cached;

    const result = await trackedQuery(async () => {
      const productsData = await db.query.products.findMany({
        where: and(eq(schema.products.isFeatured, true), eq(schema.products.isActive, true)),
        limit: 8,
        orderBy: [desc(schema.products.createdAt)],
        columns: this.listColumns,
      });
      return this.enrichWithRatings(productsData);
    }, 'products.getFeaturedProducts');

    cache.set(cacheKey, result, 10 * 60 * 1000); // Cache 10 minutes
    return result;
  }

  async getFlashSaleProducts(_userId?: string): Promise<Array<Partial<Product> & ProductWithRating>> {
    const cacheKey = 'products:flashsale';
    const cached = cache.get<Array<Partial<Product> & ProductWithRating>>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const result = await trackedQuery(async () => {
      const productsData = await db.query.products.findMany({
        where: and(
          eq(schema.products.isFlashSale, true),
          eq(schema.products.isActive, true),
          sql`${schema.products.flashSaleEnds} >= ${now}`
        ),
        orderBy: [asc(schema.products.flashSaleEnds)],
        columns: this.listColumns,
      });
      return this.enrichWithRatings(productsData);
    }, 'products.getFlashSaleProducts');

    cache.set(cacheKey, result, 5 * 60 * 1000); // Cache 5 minutes
    return result;
  }

  async searchProducts(query: string, _userId?: string) {
    const sanitized = sanitizeString(query);
    const result = await trackedQuery(async () => {
      const [productsData] = await Promise.all([
        db.query.products.findMany({
          where: and(
            eq(schema.products.isActive, true),
            or(ilike(schema.products.name, `%${sanitized}%`), ilike(schema.products.description, `%${sanitized}%`))
          ),
          limit: 20,
          columns: this.listColumns,
        }),
      ]);
      return this.enrichWithRatings(productsData);
    }, 'products.searchProducts');
    return result;
  }

  async getProductReviews(productId: string, params: { page?: number; limit?: number } = {}) {
    return await trackedQuery(async () => {
      const { page = 1, limit = 10 } = params;
      const offset = (page - 1) * limit;

      const [reviewsData, totalResult] = await Promise.all([
        db.query.reviews.findMany({
          where: eq(schema.reviews.productId, productId),
          with: { user: { columns: { id: true, username: true, avatar: true } } },
          orderBy: [desc(schema.reviews.createdAt)],
          offset,
          limit,
        }),
        db.select({ value: count() }).from(schema.reviews).where(eq(schema.reviews.productId, productId)),
      ]);

      const total = totalResult[0]?.value ?? 0;
      return {
        reviews: reviewsData,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, 'products.getProductReviews');
  }

  async addProductReview(productId: string, userId: string, data: { rating: number; comment: string }) {
    return await db.transaction(async (tx) => {
      const product = await tx.query.products.findFirst({ where: eq(schema.products.id, productId) });
      if (!product) throw new NotFoundError('Product not found');

      const existingReview = await tx.query.reviews.findFirst({
        where: and(eq(schema.reviews.productId, productId), eq(schema.reviews.userId, userId)),
      });
      if (existingReview) throw new BadRequestError('You have already reviewed this product');

      const hasPurchased = await tx.query.orders.findFirst({
        where: and(eq(schema.orders.userId, userId), eq(schema.orders.status, 'COMPLETED')),
        with: { items: { where: eq(schema.orderItems.productId, productId), limit: 1 } },
      });
      if (!hasPurchased?.items?.length) {
        throw new ForbiddenError('You must purchase this product before leaving a review');
      }

      try {
        const [review] = await tx.insert(schema.reviews).values({
          productId, userId, rating: data.rating, comment: data.comment, isVerified: true,
        }).returning();

        const user = await tx.query.users.findFirst({
          where: eq(schema.users.id, userId),
          columns: { id: true, username: true, avatar: true },
        });

        this.invalidateCache(productId);
        return { ...review, user };
      } catch (error: any) {
        if (error.message?.includes('unique constraint') || error.code === '23505') {
          throw new BadRequestError('You have already reviewed this product');
        }
        throw error;
      }
    });
  }

  async updateProductReview(reviewId: string, userId: string, data: { rating?: number; comment?: string }) {
    const review = await db.query.reviews.findFirst({ where: eq(schema.reviews.id, reviewId) });
    if (!review) throw new NotFoundError('Review not found');
    if (review.userId !== userId) throw new ForbiddenError('Unauthorized to update this review');

    const [updatedReview] = await db.update(schema.reviews)
      .set({ rating: data.rating, comment: data.comment })
      .where(eq(schema.reviews.id, reviewId))
      .returning();

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { id: true, username: true, avatar: true },
    });

    this.invalidateCache(review.productId);
    return { ...updatedReview, user };
  }

  async deleteProductReview(reviewId: string, userId: string, isAdmin: boolean = false) {
    const review = await db.query.reviews.findFirst({ where: eq(schema.reviews.id, reviewId) });
    if (!review) throw new NotFoundError('Review not found');
    if (!isAdmin && review.userId !== userId) throw new ForbiddenError('Unauthorized to delete this review');

    await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId));
    this.invalidateCache(review.productId);
    return { success: true };
  }

  async checkStock(productId: string) {
    const product = await this.findById(productId, { columns: ['stock'] });
    if (!product) throw new NotFoundError('Product not found');
    return { inStock: product.stock === -1 || product.stock > 0, stock: product.stock };
  }

  async hasUserPurchasedProduct(userId: string, productId: string) {
    return await trackedQuery(async () => {
      const [purchase] = await db.select({ id: schema.orderItems.id })
        .from(schema.orderItems)
        .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
        .where(and(
          eq(schema.orders.userId, userId),
          eq(schema.orderItems.productId, productId),
          eq(schema.orders.status, 'COMPLETED')
        )).limit(1);
      return !!purchase;
    }, 'products.hasUserPurchasedProduct');
  }

  getCategories() { return ['SCRIPT', 'UI', 'BUNDLE']; }

  private invalidateCache(productId?: string) {
    if (productId) {
      cache.delete(`products:list:*`);
      cache.delete('products:featured');
      cache.delete('products:flashsale');
    }
  }
}

export const productsService = new ProductsService();
