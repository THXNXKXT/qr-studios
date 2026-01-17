import fs from 'fs';
import path from 'path';
import type { Context } from 'hono';
import { stream } from 'hono/streaming';
import { licensesService } from '../services/licenses.service';
import { success } from '../utils/response';
import { env } from '../config/env';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { storageService } from '../services/storage.service';
import {
  AppError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
  NotFoundError
} from '../utils/errors';
import {
  licenseVerifySchema,
  licenseDownloadSchema,
  idParamSchema,
  updateIPWhitelistSchema
} from '../schemas';

export const licensesController = {
  async getAll(c: Context) {
    const user = c.get('user');
    const licenses = await licensesService.getUserLicenses(user.id);
    return success(c, licenses);
  },

  async getById(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());

    const license = await licensesService.getLicenseById(id, user.id);
    return success(c, license);
  },

  async verify(c: Context) {
    const { key, resource } = licenseVerifySchema.parse(c.req.query());
    const ipAddress = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      c.req.header('cf-connecting-ip') ||
      'unknown';

    if (!key) {
      return c.json({ valid: false, error: 'License key required' }, 400);
    }

    try {
      const result = await licensesService.verifyLicense(key, ipAddress, resource);
      return c.json(result);
    } catch (error: any) {
      return c.json({
        valid: false,
        error: error.message || 'License verification failed'
      }, 401);
    }
  },

  /**
   * POST /verify - Legacy FiveM script compatibility
   * Accepts: { key, license, licenseKey, resName, resourceName }
   */
  async verifyPost(c: Context) {
    try {
      const body = await c.req.json();
      const { key, license, licenseKey, resName, resourceName } = body;

      // Support multiple param names for compatibility
      const actualKey = key || license || licenseKey;
      const actualResource = resName || resourceName || '';

      if (!actualKey) {
        return c.json({
          state: 'notfound',
          message: 'License key is required',
          a: 'unknown'
        });
      }

      const ipAddress = c.req.header('cf-connecting-ip') ||
        c.req.header('x-real-ip') ||
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown';

      const result = await licensesService.verifyLicense(actualKey, ipAddress, actualResource);

      // Return legacy format
      return c.json({
        state: result.state || 'actived',
        name: result.name || result.license?.user || 'Unknown',
        resname: result.resname || result.license?.product || actualResource,
        dev: result.dev || 'QR Studios',
        a: result.a || ipAddress,
      });
    } catch (error: any) {
      const ipAddress = c.req.header('cf-connecting-ip') ||
        c.req.header('x-real-ip') ||
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown';

      return c.json({
        state: 'notfound',
        message: error.message || 'License verification failed',
        a: ipAddress,
      });
    }
  },

  async updateIP(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());
    const { ipAddresses } = updateIPWhitelistSchema.parse(await c.req.json());

    const license = await licensesService.updateIPWhitelist(id, user.id, ipAddresses);
    return success(c, license, 'IP whitelist updated successfully');
  },

  async resetIP(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());

    const license = await licensesService.resetIPWhitelist(id, user.id);
    return success(c, license, 'IP whitelist reset successfully');
  },

  async getDownloadURL(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());

    const result = await licensesService.generateDownloadURL(id, user.id);
    return success(c, result);
  },

  async download(c: Context) {
    const { id } = idParamSchema.parse(c.req.param());
    const { token } = licenseDownloadSchema.parse(c.req.query());

    try {
      // 1. Cryptographic verification of the token
      const { licenseId, downloadKey, userId } = licensesService.verifyDownloadToken(token);

      if (licenseId !== id) {
        return c.json({ success: false, error: 'Invalid token for this license' }, 401);
      }

      // 2. Database verification (Defense in depth)
      // Check if license is still ACTIVE and belongs to the user in the token
      const license = await db.query.licenses.findFirst({
        where: eq(schema.licenses.id, licenseId),
        with: {
          user: {
            columns: { isBanned: true }
          },
          product: {
            columns: {
              downloadKey: true,
              downloadFileKey: true,
            }
          }
        },
        columns: {
          status: true,
          userId: true,
        }
      });

      if (!license || license.userId !== userId) {
        throw new UnauthorizedError('License ownership verification failed');
      }

      if (license.status !== 'ACTIVE') {
        throw new BadRequestError('License is no longer active');
      }

      if (license.user.isBanned) {
        throw new ForbiddenError('Account is banned');
      }

      // 3. Secure file serving logic
      // We try keys in this order: token key, product.downloadKey, product.downloadFileKey
      const potentialKeys = [
        downloadKey,
        license.product.downloadKey,
        license.product.downloadFileKey
      ].filter(Boolean) as string[];

      // Remove duplicates
      const uniqueKeys = [...new Set(potentialKeys)];

      for (const key of uniqueKeys) {
        const storagePath = path.resolve(env.STORAGE_PATH);
        const safeFileName = path.basename(key);
        const filePath = path.join(storagePath, safeFileName);

        // Try local storage first
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const fileName = path.basename(filePath);

          c.header('Content-Type', 'application/octet-stream');
          c.header('Content-Disposition', `attachment; filename="${fileName}"`);
          c.header('Content-Length', stats.size.toString());

          return stream(c, async (s) => {
            const fileStream = fs.createReadStream(filePath);
            for await (const chunk of fileStream) {
              await s.write(chunk);
            }
          });
        }

        // If not found locally, try Cloudflare R2
        try {
          console.log(`[DOWNLOAD] Local file not found, checking R2 for key: ${key}`);

          // Check if key exists in R2 before generating URL
          const exists = await storageService.fileExists(key);
          if (exists) {
            console.log(`[DOWNLOAD] File found in R2: ${key}`);
            const presignedUrl = await storageService.getDownloadUrl(key, 3600);
            return c.redirect(presignedUrl);
          }

          console.warn(`[DOWNLOAD] Key ${key} not found in R2`);
          // Continue to next key if any
        } catch (r2Error) {
          console.warn(`[DOWNLOAD] Error checking R2 for key: ${key}`, r2Error);
          // Continue to next key if any
        }
      }

      return c.json({ success: false, error: 'File not found on server' }, 404);
    } catch (error: any) {
      console.error('[DOWNLOAD] Error serving file:', error);
      if (error instanceof AppError) {
        return c.json({ success: false, error: error.message }, error.statusCode as any);
      }
      return c.json({ success: false, error: 'Download failed' }, 401);
    }
  },

  async getStats(c: Context) {
    const user = c.get('user');

    if (user.role !== 'ADMIN') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const stats = await licensesService.getActiveLicenseStats();
    return success(c, stats);
  },
};
