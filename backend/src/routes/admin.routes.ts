import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { adminController } from '../controllers/admin';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { adminIpMiddleware } from '../middleware/admin-ip.middleware';
import {
  updateUserRoleSchema,
  updateCommissionStatusSchema,
  updateOrderStatusSchema,
  createPromoCodeSchema,
  createAnnouncementSchema,
  idParamSchema,
  createProductSchema,
  updateProductSchema,
  updateBalanceSchema,
  grantLicenseSchema,
  updateSystemSettingSchema,
  addToBlacklistSchema,
  auditLogQuerySchema,
  adminOrdersQuerySchema,
  adminUsersQuerySchema,
  adminLicensesQuerySchema,
  adminReviewsQuerySchema,
  adminCommissionsQuerySchema,
} from '../schemas';

const admin = new Hono();

admin.use('*', authMiddleware);
admin.use('*', adminMiddleware);
admin.use('*', adminIpMiddleware);

admin.get('/stats', adminController.getDashboardStats);
admin.get('/stats/revenue-chart', adminController.getRevenueChartData);
admin.get('/stats/low-stock', adminController.getLowStockProducts);
admin.get('/stats/analytics', adminController.getAnalyticsData);
admin.get('/settings', adminController.getSystemSettings);
admin.patch('/settings/:key', zValidator('json', updateSystemSettingSchema), adminController.updateSystemSetting);
admin.get('/audit-logs', zValidator('query', auditLogQuerySchema), adminController.getAuditLogs);

admin.post('/upload', adminController.uploadFile);

admin.get('/reviews', zValidator('query', adminReviewsQuerySchema), adminController.getAllReviews);
admin.get('/licenses', zValidator('query', adminLicensesQuerySchema), adminController.getAllLicenses);

admin.get('/products', adminController.getAllProducts);
admin.post('/products', zValidator('json', createProductSchema), adminController.createProduct);
admin.patch('/products/:id', zValidator('param', idParamSchema), zValidator('json', updateProductSchema), adminController.updateProduct);
admin.delete('/products/:id', zValidator('param', idParamSchema), adminController.deleteProduct);
admin.delete('/products/:id/permanent', zValidator('param', idParamSchema), adminController.hardDeleteProduct);

admin.get('/users', zValidator('query', adminUsersQuerySchema), adminController.getAllUsers);
admin.patch('/users/:id/balance', zValidator('param', idParamSchema), zValidator('json', updateBalanceSchema), adminController.updateUserBalance);
admin.patch('/users/:id/points', zValidator('param', idParamSchema), zValidator('json', updateBalanceSchema), adminController.updateUserPoints);
admin.patch('/users/:id/role', zValidator('param', idParamSchema), zValidator('json', updateUserRoleSchema), adminController.updateUserRole);
admin.post('/users/:id/ban', zValidator('param', idParamSchema), adminController.banUser);
admin.post('/users/:id/unban', zValidator('param', idParamSchema), adminController.unbanUser);

admin.get('/commissions', zValidator('query', adminCommissionsQuerySchema), adminController.getAllCommissions);
admin.patch('/commissions/:id/status', zValidator('param', idParamSchema), zValidator('json', updateCommissionStatusSchema), adminController.updateCommissionStatus);

admin.get('/orders', zValidator('query', adminOrdersQuerySchema), adminController.getAllOrders);
admin.get('/orders/:id', zValidator('param', idParamSchema), adminController.getOrderById);
admin.post('/orders/:id/resend-receipt', zValidator('param', idParamSchema), adminController.resendOrderReceipt);
admin.patch('/orders/:id/status', zValidator('param', idParamSchema), zValidator('json', updateOrderStatusSchema), adminController.updateOrderStatus);

admin.post('/licenses/grant', zValidator('json', grantLicenseSchema), adminController.grantLicense);
admin.post('/licenses/:id/revoke', zValidator('param', idParamSchema), adminController.revokeLicense);
admin.post('/licenses/:id/reset-ip', zValidator('param', idParamSchema), adminController.resetLicenseIp);

// IP Blacklist management
admin.get('/licenses/blacklist', adminController.getBlacklist);
admin.post('/licenses/blacklist', zValidator('json', addToBlacklistSchema), adminController.addToBlacklist);
admin.delete('/licenses/blacklist/:ip', adminController.removeFromBlacklist);

admin.patch('/reviews/:id/verify', zValidator('param', idParamSchema), adminController.toggleReviewVerification);
admin.delete('/reviews/:id', zValidator('param', idParamSchema), adminController.deleteReview);

admin.get('/promo-codes', adminController.getAllPromoCodes);
admin.post('/promo-codes', zValidator('json', createPromoCodeSchema), adminController.createPromoCode);
admin.patch('/promo-codes/:id', zValidator('param', idParamSchema), zValidator('json', createPromoCodeSchema.partial()), adminController.updatePromoCode);
admin.delete('/promo-codes/:id', zValidator('param', idParamSchema), adminController.deletePromoCode);
admin.patch('/promo-codes/:id/toggle', zValidator('param', idParamSchema), adminController.togglePromoCode);

admin.get('/announcements', adminController.getAllAnnouncements);
admin.post('/announcements', zValidator('json', createAnnouncementSchema), adminController.createAnnouncement);
admin.patch('/announcements/:id', zValidator('param', idParamSchema), zValidator('json', createAnnouncementSchema.partial()), adminController.updateAnnouncement);
admin.delete('/announcements/:id', zValidator('param', idParamSchema), adminController.deleteAnnouncement);
admin.patch('/announcements/:id/toggle', zValidator('param', idParamSchema), adminController.toggleAnnouncement);

export default admin;
