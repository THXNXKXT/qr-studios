import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../utils/errors';
import { generateLicenseKey } from '../utils/license-generator';
import crypto from 'crypto';
import { env } from '../config/env';

export const licensesService = {
  async getUserLicenses(userId: string) {
    const licensesData = await db.query.licenses.findMany({
      where: eq(schema.licenses.userId, userId),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            images: true,
            category: true,
            version: true,
          },
        },
      },
      orderBy: [desc(schema.licenses.createdAt)],
    });

    return licensesData;
  },

  async getLicenseById(licenseId: string, userId?: string) {
    const license = await db.query.licenses.findFirst({
      where: eq(schema.licenses.id, licenseId),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            images: true,
            category: true,
            version: true,
            downloadFileKey: true,
            downloadKey: true,
          },
        },
        user: {
          columns: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundError('License not found');
    }

    if (userId && license.userId !== userId) {
      throw new UnauthorizedError('Unauthorized access to license');
    }

    return license;
  },

  async getLicenseByKey(licenseKey: string) {
    const license = await db.query.licenses.findFirst({
      where: eq(schema.licenses.licenseKey, licenseKey),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            category: true,
            version: true,
          },
        },
        user: {
          columns: {
            id: true,
            username: true,
            discordId: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundError('License not found');
    }

    return license;
  },

  async verifyLicense(licenseKey: string, ipAddress: string, resourceName?: string) {
    const license = await licensesService.getLicenseByKey(licenseKey);

    if (license.status === 'REVOKED') {
      throw new BadRequestError('License has been revoked');
    }

    if (license.status === 'EXPIRED') {
      throw new BadRequestError('License has expired');
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      await db.update(schema.licenses)
        .set({ status: 'EXPIRED' })
        .where(eq(schema.licenses.id, license.id));
      throw new BadRequestError('License has expired');
    }

    const allowedIPs = licensesService.parseIPWhitelist(license.ipAddress);

    if (allowedIPs.length > 0 && !allowedIPs.includes(ipAddress)) {
      throw new UnauthorizedError('IP address not whitelisted');
    }

    // If no IP is set yet, set the current IP as the first whitelisted IP (First-use)
    if (allowedIPs.length === 0 && !license.ipAddress) {
      await db.update(schema.licenses)
        .set({ ipAddress: ipAddress })
        .where(
          and(
            eq(schema.licenses.id, license.id),
            sql`${schema.licenses.ipAddress} IS NULL`
          )
        );
    }

    await licensesService.logLicenseVerification(license.id, ipAddress, true, resourceName);

    return {
      valid: true,
      license: {
        key: license.licenseKey,
        status: license.status,
        product: license.product.name,
        version: license.product.version,
        user: license.user.username,
        discordId: license.user.discordId,
        expiresAt: license.expiresAt,
      },
    };
  },

  async updateIPWhitelist(licenseId: string, userId: string, ipAddresses: string[]) {
    const license = await licensesService.getLicenseById(licenseId, userId);

    if (license.status !== 'ACTIVE') {
      throw new BadRequestError('Can only update IP for active licenses');
    }

    const validIPs = ipAddresses.filter((ip) => licensesService.isValidIP(ip));
    
    if (validIPs.length !== ipAddresses.length) {
      throw new BadRequestError('Invalid IP address format');
    }

    if (validIPs.length > 5) {
      throw new BadRequestError('Maximum 5 IP addresses allowed');
    }

    const ipString = validIPs.join(',');

    const [updated] = await db.update(schema.licenses)
      .set({ ipAddress: ipString })
      .where(eq(schema.licenses.id, licenseId))
      .returning();

    await licensesService.logLicenseAction(licenseId, 'IP_UPDATE', `Updated IPs: ${ipString}`);

    return updated;
  },

  async resetIPWhitelist(licenseId: string, userId: string) {
    const license = await licensesService.getLicenseById(licenseId, userId);

    if (license.status !== 'ACTIVE') {
      throw new BadRequestError('Can only reset IP for active licenses');
    }

    const [updated] = await db.update(schema.licenses)
      .set({ ipAddress: null })
      .where(eq(schema.licenses.id, licenseId))
      .returning();

    await licensesService.logLicenseAction(licenseId, 'IP_RESET', 'IP whitelist reset');

    return updated;
  },

  async generateDownloadURL(licenseId: string, userId: string) {
    const license = await licensesService.getLicenseById(licenseId, userId);

    if (license.status !== 'ACTIVE') {
      throw new BadRequestError('License is not active');
    }

    const downloadKey = license.product.downloadFileKey || license.product.downloadKey;
    if (!downloadKey) {
      throw new BadRequestError('No download available for this product');
    }

    const token = licensesService.generateDownloadToken(license.id, downloadKey, userId);
    const expiresIn = 3600;

    await licensesService.logLicenseAction(licenseId, 'DOWNLOAD', 'Download URL generated');

    return {
      downloadUrl: `/api/licenses/${licenseId}/download?token=${token}`,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  },

  generateDownloadToken(licenseId: string, downloadKey: string, userId: string): string {
    const payload = {
      licenseId,
      downloadKey,
      userId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const secret = env.JWT_SECRET;
    const token = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return Buffer.from(JSON.stringify({ ...payload, signature: token })).toString('base64');
  },

  verifyDownloadToken(token: string): { licenseId: string; downloadKey: string; userId: string } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedError('Download token expired');
      }

      const secret = env.JWT_SECRET;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify({ 
          licenseId: decoded.licenseId, 
          downloadKey: decoded.downloadKey, 
          userId: decoded.userId,
          exp: decoded.exp 
        }))
        .digest('hex');

      if (decoded.signature !== expectedSignature) {
        throw new UnauthorizedError('Invalid download token signature');
      }

      return {
        licenseId: decoded.licenseId,
        downloadKey: decoded.downloadKey,
        userId: decoded.userId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Invalid download token');
    }
  },

  parseIPWhitelist(ipString: string | null): string[] {
    if (!ipString) return [];
    return ipString.split(',').map((ip) => ip.trim()).filter(Boolean);
  },

  isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every((part) => parseInt(part) >= 0 && parseInt(part) <= 255);
    }
    
    return ipv6Regex.test(ip);
  },

  async logLicenseVerification(
    licenseId: string,
    ipAddress: string,
    success: boolean,
    resourceName?: string
  ) {
    console.log(`[LICENSE] Verification - License: ${licenseId}, IP: ${ipAddress}, Success: ${success}, Resource: ${resourceName || 'N/A'}`);
  },

  async logLicenseAction(licenseId: string, action: string, details: string) {
    console.log(`[LICENSE] ${action} - License: ${licenseId}, Details: ${details}`);
  },

  async getActiveLicenseStats() {
    const [totalResult, activeResult, expiredResult, revokedResult] = await Promise.all([
      db.select({ value: count() }).from(schema.licenses),
      db.select({ value: count() }).from(schema.licenses).where(eq(schema.licenses.status, 'ACTIVE')),
      db.select({ value: count() }).from(schema.licenses).where(eq(schema.licenses.status, 'EXPIRED')),
      db.select({ value: count() }).from(schema.licenses).where(eq(schema.licenses.status, 'REVOKED')),
    ]);

    return {
      total: totalResult[0]?.value ?? 0,
      active: activeResult[0]?.value ?? 0,
      expired: expiredResult[0]?.value ?? 0,
      revoked: revokedResult[0]?.value ?? 0,
    };
  },

  async grantLicense(userId: string, productId: string, expiresAt?: Date | null) {
    const licenseKey = generateLicenseKey();

    return await db.transaction(async (tx) => {
      const [order] = await tx.insert(schema.orders).values({
        userId,
        total: 0,
        status: 'COMPLETED',
        paymentMethod: 'STRIPE',
        promoCode: 'ADMIN_GRANT',
      }).returning();

      if (!order) throw new Error('Failed to create order for license grant');

      const [license] = await tx.insert(schema.licenses).values({
        userId,
        productId,
        orderId: order.id,
        licenseKey,
        expiresAt,
        status: 'ACTIVE',
      }).returning();

      if (!license) throw new Error('Failed to create license');

      const product = await tx.query.products.findFirst({
        where: eq(schema.products.id, productId),
        columns: { name: true },
      });

      await tx.insert(schema.notifications).values({
        userId,
        title: 'New License Granted',
        message: `You have been granted a license for ${product?.name}.`,
        type: 'SYSTEM',
      });

      return { ...license, product };
    });
  },

  async revokeLicense(licenseId: string) {
    const [license] = await db.select().from(schema.licenses).where(eq(schema.licenses.id, licenseId));

    if (!license) {
      throw new NotFoundError('License not found');
    }

    const [updated] = await db.update(schema.licenses)
      .set({ status: 'REVOKED' })
      .where(eq(schema.licenses.id, licenseId))
      .returning();

    await licensesService.logLicenseAction(licenseId, 'REVOKE', 'License revoked by admin');

    return updated;
  },
};
