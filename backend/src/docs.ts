import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { env } from './config/env';

// Schema Definitions
const UserSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  discordId: z.string().openapi({ example: '123456789012345678' }),
  username: z.string().openapi({ example: 'johndoe' }),
  email: z.string().email().optional().openapi({ example: 'john@example.com' }),
  avatar: z.string().optional().openapi({ example: 'https://cdn.discordapp.com/avatars/...' }),
  balance: z.number().openapi({ example: 1500.50 }),
  points: z.number().openapi({ example: 100 }),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).openapi({ example: 'USER' }),
  createdAt: z.string().datetime().openapi({ example: '2024-01-15T10:30:00Z' }),
}).openapi('User');

const ProductSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440001' }),
  name: z.string().openapi({ example: 'Advanced HUD System' }),
  slug: z.string().openapi({ example: 'advanced-hud-system' }),
  description: z.string().optional().openapi({ example: 'Professional HUD for FiveM' }),
  price: z.number().openapi({ example: 29.99 }),
  originalPrice: z.number().optional().openapi({ example: 39.99 }),
  category: z.enum(['SCRIPT', 'UI', 'BUNDLE']).openapi({ example: 'UI' }),
  thumbnail: z.string().optional(),
  images: z.array(z.string()).openapi({ example: ['image1.jpg', 'image2.jpg'] }),
  features: z.array(z.string()).openapi({ example: ['Feature 1', 'Feature 2'] }),
  tags: z.array(z.string()).openapi({ example: ['hud', 'ui', 'fivem'] }),
  stock: z.number().openapi({ example: -1 }),
  isNew: z.boolean().openapi({ example: true }),
  isFeatured: z.boolean().openapi({ example: false }),
  isFlashSale: z.boolean().openapi({ example: false }),
  flashSalePrice: z.number().optional(),
  flashSaleEnds: z.string().datetime().optional(),
  rewardPoints: z.number().optional().openapi({ example: 10 }),
  version: z.string().optional().openapi({ example: '1.2.0' }),
  isDownloadable: z.boolean().openapi({ example: true }),
  isActive: z.boolean().openapi({ example: true }),
  createdAt: z.string().datetime(),
}).openapi('Product');

const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  total: z.number().openapi({ example: 59.98 }),
  discount: z.number().openapi({ example: 5.00 }),
  promoCode: z.string().optional().openapi({ example: 'SAVE10' }),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).openapi({ example: 'COMPLETED' }),
  paymentMethod: z.enum(['STRIPE', 'BALANCE', 'PROMPTPAY']).openapi({ example: 'STRIPE' }),
  createdAt: z.string().datetime(),
}).openapi('Order');

const LicenseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  orderId: z.string().uuid(),
  licenseKey: z.string().openapi({ example: 'QR-XXXX-XXXX-XXXX' }),
  status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED']).openapi({ example: 'ACTIVE' }),
  ipAddress: z.string().optional(),
  maxIps: z.number().openapi({ example: 1 }),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
}).openapi('License');

const ErrorSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string().openapi({ example: 'Error message' }),
  requestId: z.string().optional(),
}).openapi('Error');

const SuccessSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.any().optional(),
}).openapi('Success');

const app = new OpenAPIHono();

// Swagger UI endpoint
app.get('/ui', swaggerUI({ url: '/api/docs/doc' }));

// OpenAPI Specification
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'QR Studios API',
    description: 'API Documentation for QR Studios - FiveM Scripts & UI Marketplace',
    contact: {
      name: 'QR Studios Support',
      url: 'https://qrstudios.com',
    },
  },
  servers: [
    { url: env.API_URL, description: 'Current Environment' },
    { url: 'http://localhost:4001', description: 'Local Development' },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and session management' },
    { name: 'Users', description: 'User profile and account management' },
    { name: 'Products', description: 'Product catalog and management' },
    { name: 'Orders', description: 'Order processing and history' },
    { name: 'Licenses', description: 'License key management and verification' },
    { name: 'Checkout', description: 'Payment processing and checkout flow' },
    { name: 'Topup', description: 'Balance top-up functionality' },
    { name: 'Promo Codes', description: 'Discount and promo code management' },
    { name: 'Wishlist', description: 'User wishlist functionality' },
    { name: 'Commissions', description: 'Affiliate commission system' },
    { name: 'Lucky Wheel', description: 'Gamification and rewards' },
    { name: 'Admin', description: 'Administrative endpoints' },
    { name: 'System', description: 'Health checks and system info' },
  ],
});

export default app;
