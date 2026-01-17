import type { Context } from 'hono';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { productsService } from '../services/products.service';
import { storageService } from '../services/storage.service';
import { success, paginated } from '../utils/response';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { 
  productsQuerySchema, 
  idParamSchema, 
  searchSchema, 
  paginationSchema,
  addReviewSchema 
} from '../schemas';

export const productsController = {
  async getAll(c: Context) {
    const user = c.get('user');
    const query = productsQuerySchema.parse(c.req.query());
    const { category, search, sort, page = 1, limit = 12 } = query;

    const result = await productsService.getAllProducts({
      category,
      search,
      sort,
      page,
      limit,
      userId: user?.id,
    });

    return paginated(c, result.products, page, limit, result.pagination.total);
  },

  async getById(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());
    const product = await productsService.getProductById(id, user?.id);
    return success(c, product);
  },

  async getFeatured(c: Context) {
    const user = c.get('user');
    const products = await productsService.getFeaturedProducts(user?.id);
    return success(c, products);
  },

  async getFlashSale(c: Context) {
    const user = c.get('user');
    const products = await productsService.getFlashSaleProducts(user?.id);
    return success(c, products);
  },

  async getReviews(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const { page, limit } = paginationSchema.parse(c.req.query());
    
    const result = await productsService.getProductReviews(id, { page, limit });
    return paginated(c, result.reviews, page, limit, result.pagination.total);
  },

  async addReview(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());
    const body = await c.req.json();
    const { rating, comment } = body;

    const review = await productsService.addProductReview(id, user.id, {
      rating,
      comment,
    });

    return success(c, review, 'Review added successfully', 201);
  },

  async updateReview(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());
    const data = addReviewSchema.partial().parse(await c.req.json());

    const review = await productsService.updateProductReview(id, user.id, data);
    return success(c, review, 'Review updated successfully');
  },

  async deleteReview(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());

    await productsService.deleteProductReview(id, user.id);
    return success(c, null, 'Review deleted successfully');
  },

  async search(c: Context) {
    const user = c.get('user');
    const { q } = searchSchema.parse(c.req.query());
    const products = await productsService.searchProducts(q, user?.id);
    return success(c, products);
  },

  async getCategories(c: Context) {
    const categories = await productsService.getCategories();
    c.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return success(c, categories);
  },

  async checkStock(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const result = await productsService.checkStock(id);
    return success(c, result);
  },

  async download(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());

    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, id),
      columns: {
        id: true,
        isDownloadable: true,
        downloadFileKey: true,
        downloadUrl: true,
      }
    });

    if (!product || !product.isDownloadable) {
      throw new BadRequestError('This product is not downloadable');
    }

    const hasPurchased = await productsService.hasUserPurchasedProduct(user.id, id);
    if (!hasPurchased) {
      throw new ForbiddenError('You must purchase this product before downloading');
    }

    let downloadUrl = product.downloadUrl;

    // If we have a file key, generate a secure presigned URL
    if (product.downloadFileKey) {
      try {
        downloadUrl = await storageService.getDownloadUrl(product.downloadFileKey, 3600); // 1 hour expiry
      } catch (error) {
        console.error("Error generating presigned URL:", error);
        // Fallback to stored downloadUrl if presigned fails
      }
    }

    if (!downloadUrl) {
      throw new BadRequestError('Download link not found');
    }

    return success(c, { url: downloadUrl }, 'Download link generated');
  },
};
