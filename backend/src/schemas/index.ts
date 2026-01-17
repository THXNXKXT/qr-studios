import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid('Invalid Product ID format'),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid('Invalid Order ID format'),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const syncUserSchema = z.object({
  accessToken: z.string().min(1, 'Discord access token is required'),
});

export const createCommissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  budget: z.number().positive('Budget must be a positive number').optional(),
  attachments: z.array(z.string()).max(10).optional(),
});

export const createSessionSchema = z.object({
  code: z.string().min(1, 'Discord auth code is required'),
  redirect_uri: z.string().url('Invalid redirect URI').optional(),
});

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive().default(1),
  })).min(1, 'At least one item is required'),
  promoCode: z.string().optional(),
  paymentMethod: z.enum(['STRIPE', 'BALANCE']).default('STRIPE'),
});

export const updateIPWhitelistSchema = z.object({
  ipAddresses: z.array(z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address')).max(5, 'Maximum 5 IP addresses allowed'),
});

export const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(20),
  discount: z.number().positive(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  minPurchase: z.number().nonnegative().optional().nullable(),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1),
  media: z.array(z.string().url()).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']),
});

export const updateCommissionStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  adminNotes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']),
});

export const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export const createStripeSessionSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive().default(1),
  })).min(1, 'At least one item is required'),
  promoCode: z.string().optional(),
});

export const payWithBalanceSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export const updateProfileSchema = z.object({
  // Users cannot change username/email as they are synced from Discord
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const updateBalanceSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  operation: z.enum(['ADD', 'SUBTRACT']),
});

export const grantLicenseSchema = z.object({
  userId: z.string().uuid('Invalid User ID'),
  productId: z.string().uuid('Invalid Product ID'),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const addReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(500),
});

export const createTopupSessionSchema = z.object({
  amount: z.number().int().min(100, 'Minimum top-up is 100 THB').max(1000001),
  paymentMethod: z.string().optional(),
});

export const validatePromoSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  cartTotal: z.number().positive('Cart total must be positive'),
});

export const applyPromoSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  orderId: z.string().min(1, 'Order ID is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const productsQuerySchema = z.object({
  category: z.enum(['SCRIPT', 'UI', 'BUNDLE']).optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  isFlashSale: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export const commissionFilterSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  userId: z.string().uuid().optional(),
});

export const licenseVerifySchema = z.object({
  key: z.string().min(1, 'License key is required'),
  resource: z.string().optional(),
});

export const licenseDownloadSchema = z.object({
  token: z.string().min(1, 'Download token is required'),
});

export const baseProductSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().min(1).nullable().optional(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().nullable().optional(),
  category: z.enum(['SCRIPT', 'UI', 'BUNDLE']),
  thumbnail: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  downloadUrl: z.string().nullable().optional(),
  downloadFileKey: z.string().nullable().optional(),
  isDownloadable: z.boolean().default(false),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(-1),
  isNew: z.boolean(),
  isFeatured: z.boolean(),
  isFlashSale: z.boolean(),
  flashSalePrice: z.number().nonnegative().nullable().optional(),
  flashSaleEnds: z.string().nullable().optional(),
  rewardPoints: z.number().int().min(0).nullable().optional(),
  downloadKey: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createProductSchema = baseProductSchema.extend({
  stock: z.number().int().min(-1).default(-1),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = baseProductSchema.partial();
