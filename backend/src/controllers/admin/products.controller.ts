/**
 * Admin Products Controller
 * Product CRUD, file uploads
 */

import type { Context } from 'hono';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and, desc, count, ilike, or } from 'drizzle-orm';
import { success, paginated } from '../../utils/response';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { storageService } from '../../services/storage.service';
import { auditService } from '../../services/audit.service';
import {
    idParamSchema,
    paginationSchema,
    createProductSchema,
    updateProductSchema,
} from '../../schemas';

export const productsController = {
    async getAllProducts(c: Context) {
        const query = c.req.query();
        const { page, limit, search, category, isFlashSale } = paginationSchema.extend({
            search: z.string().optional(),
            category: z.string().optional(),
            isFlashSale: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
        }).parse(query);
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const offset = (pageNum - 1) * limitNum;

        const filters = [];
        if (search) {
            filters.push(
                or(
                    ilike(schema.products.name, `%${search}%`),
                    ilike(schema.products.slug, `%${search}%`),
                    ilike(schema.products.description, `%${search}%`)
                )
            );
        }

        if (category) {
            filters.push(eq(schema.products.category, category.toUpperCase() as any));
        }

        if (isFlashSale !== undefined) {
            filters.push(eq(schema.products.isFlashSale, isFlashSale));
        }

        const where = filters.length > 0 ? and(...filters) : undefined;

        const [productsData, totalResult] = await Promise.all([
            db.query.products.findMany({
                where,
                offset,
                limit: limitNum,
                orderBy: [desc(schema.products.createdAt)],
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
                    downloadKey: true,
                    isActive: true,
                    version: true,
                    createdAt: true,
                    updatedAt: true,
                }
            }),
            db.select({ value: count() }).from(schema.products).where(where),
        ]);

        return paginated(c, productsData, pageNum, limitNum, totalResult[0]?.value ?? 0);
    },

    async createProduct(c: Context) {
        const data = createProductSchema.parse(await c.req.json());
        const [product] = await db.insert(schema.products).values({
            ...data,
            thumbnail: data.thumbnail || null,
            images: data.images || [],
            features: data.features || [],
            tags: data.tags || [],
            downloadUrl: data.downloadUrl || null,
            downloadFileKey: data.downloadFileKey || null,
            isDownloadable: data.isDownloadable || false,
            flashSaleEnds: data.flashSaleEnds ? new Date(data.flashSaleEnds) : null,
        } as any).returning();

        if (!product) throw new Error('Failed to create product');

        const admin = c.get('user') as any;
        await auditService.log({
            userId: admin?.id,
            action: 'CREATE_PRODUCT',
            entity: 'Product',
            entityId: product.id,
            newData: product,
        });
        return success(c, product, 'Product created successfully', 201);
    },

    async updateProduct(c: Context) {
        const { id } = idParamSchema.parse(c.req.param());
        const body = await c.req.json();
        console.log(`[ADMIN] Update Product request body for ${id}:`, JSON.stringify(body, null, 2));

        const data = updateProductSchema.parse(body);
        console.log(`[ADMIN] Parsed update data for ${id}:`, JSON.stringify(data, null, 2));

        const [oldProduct] = await db.select().from(schema.products).where(eq(schema.products.id, id));
        if (!oldProduct) throw new NotFoundError('Product not found');

        // If a new file is uploaded, delete the old one from R2
        if (data.downloadFileKey && oldProduct.downloadFileKey && data.downloadFileKey !== oldProduct.downloadFileKey) {
            try {
                await storageService.deleteFile(oldProduct.downloadFileKey);
                console.log(`[ADMIN] Deleted old product file: ${oldProduct.downloadFileKey}`);
            } catch (error) {
                console.error(`[ADMIN] Failed to delete old product file ${oldProduct.downloadFileKey}:`, error);
            }
        }

        const updateData: any = {
            ...data,
            thumbnail: data.thumbnail !== undefined ? data.thumbnail : oldProduct.thumbnail,
            downloadUrl: data.downloadUrl !== undefined ? data.downloadUrl : oldProduct.downloadUrl,
            downloadFileKey: data.downloadFileKey !== undefined ? data.downloadFileKey : oldProduct.downloadFileKey,
            isDownloadable: data.isDownloadable !== undefined ? data.isDownloadable : oldProduct.isDownloadable,
            isActive: data.isActive !== undefined ? data.isActive : oldProduct.isActive,
            updatedAt: new Date(),
        };

        console.log(`[ADMIN] Updating product ${id}. New isActive: ${updateData.isActive}`);

        if (data.flashSaleEnds !== undefined) {
            updateData.flashSaleEnds = data.flashSaleEnds ? new Date(data.flashSaleEnds) : null;
        }

        const [updatedProduct] = await db.update(schema.products)
            .set(updateData)
            .where(eq(schema.products.id, id))
            .returning();

        if (!updatedProduct) throw new Error('Failed to update product');

        const admin = c.get('user') as any;
        await auditService.log({
            userId: admin?.id,
            action: 'UPDATE_PRODUCT',
            entity: 'Product',
            entityId: id,
            oldData: oldProduct,
            newData: updatedProduct,
        });
        return success(c, updatedProduct, 'Product updated successfully');
    },

    async deleteProduct(c: Context) {
        const { id } = idParamSchema.parse(c.req.param());
        const [oldProduct] = await db.select().from(schema.products).where(eq(schema.products.id, id));
        if (!oldProduct) throw new NotFoundError('Product not found');

        // Perform Soft Delete (Archive) instead of Hard Delete
        const [updatedProduct] = await db.update(schema.products)
            .set({
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(schema.products.id, id))
            .returning();

        const admin = c.get('user') as any;
        await auditService.log({
            userId: admin?.id,
            action: 'ARCHIVE_PRODUCT',
            entity: 'Product',
            entityId: id,
            oldData: oldProduct,
            newData: updatedProduct,
        });
        return success(c, updatedProduct, 'Product archived successfully');
    },

    async hardDeleteProduct(c: Context) {
        const { id } = idParamSchema.parse(c.req.param());
        const [oldProduct] = await db.select().from(schema.products).where(eq(schema.products.id, id));
        if (!oldProduct) throw new NotFoundError('Product not found');

        // Delete files from R2 only on hard delete
        if (oldProduct.downloadFileKey) {
            try {
                await storageService.deleteFile(oldProduct.downloadFileKey);
                console.log(`[ADMIN] Deleted product file: ${oldProduct.downloadFileKey}`);
            } catch (error) {
                console.error(`[ADMIN] Failed to delete R2 file for product ${id}:`, error);
            }
        }

        if (oldProduct.slug) {
            try {
                await storageService.deleteFolder(`products/${oldProduct.slug}`);
            } catch (error) {
                console.error(`[ADMIN] Failed to delete R2 folder for product ${oldProduct.slug}:`, error);
            }
        }

        await db.delete(schema.products).where(eq(schema.products.id, id));

        const admin = c.get('user') as any;
        await auditService.log({
            userId: admin?.id,
            action: 'DELETE_PRODUCT',
            entity: 'Product',
            entityId: id,
            oldData: oldProduct,
        });
        return success(c, null, 'Product permanently deleted');
    },

    async uploadFile(c: Context) {
        const body = await c.req.parseBody();
        const file = body['file'] as File;
        const folder = (body['folder'] as string) || 'general';

        if (!file) {
            throw new BadRequestError('No file uploaded');
        }

        const extension = file.name.split('.').pop();
        const originalName = file.name.split('.').slice(0, -1).join('.')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase();

        const fileName = `${originalName}-${nanoid(6)}.${extension}`;
        const key = `${folder}/${fileName}`;

        const buffer = await file.arrayBuffer();
        const publicUrl = await storageService.uploadFile(key, new Uint8Array(buffer), file.type);

        return success(c, {
            url: publicUrl,
            key: key,
            name: file.name,
            type: file.type,
            size: file.size,
        }, 'File uploaded successfully');
    },
};
