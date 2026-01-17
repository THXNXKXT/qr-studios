/**
 * Admin Controllers Index
 * Re-exports all admin sub-controllers as a unified adminController object
 * for backwards compatibility with existing routes
 */

import { statsController } from './stats.controller';
import { usersController } from './users.controller';
import { productsController } from './products.controller';
import { ordersController } from './orders.controller';
import { licensesController } from './licenses.controller';
import { promoController } from './promo.controller';
import { announcementsController } from './announcements.controller';
import { reviewsController } from './reviews.controller';
import { commissionsController } from './commissions.controller';
import { auditController } from './audit.controller';
import { settingsController } from './settings.controller';

// Re-export individual controllers for direct access
export {
    statsController,
    usersController,
    productsController,
    ordersController,
    licensesController,
    promoController,
    announcementsController,
    reviewsController,
    commissionsController,
    auditController,
    settingsController,
};

// Backwards-compatible unified adminController object
export const adminController = {
    // Stats & Dashboard
    getDashboardStats: statsController.getDashboardStats,
    getRevenueChartData: statsController.getRevenueChartData,
    getLowStockProducts: statsController.getLowStockProducts,
    getAnalyticsData: statsController.getAnalyticsData,

    // Settings
    getSystemSettings: settingsController.getSystemSettings,
    updateSystemSetting: settingsController.updateSystemSetting,

    // Users
    getAllUsers: usersController.getAllUsers,
    updateUserRole: usersController.updateUserRole,
    updateUserBalance: usersController.updateUserBalance,
    updateUserPoints: usersController.updateUserPoints,
    banUser: usersController.banUser,
    unbanUser: usersController.unbanUser,

    // Products
    getAllProducts: productsController.getAllProducts,
    createProduct: productsController.createProduct,
    updateProduct: productsController.updateProduct,
    deleteProduct: productsController.deleteProduct,
    hardDeleteProduct: productsController.hardDeleteProduct,
    uploadFile: productsController.uploadFile,

    // Orders
    getAllOrders: ordersController.getAllOrders,
    getOrderById: ordersController.getOrderById,
    updateOrderStatus: ordersController.updateOrderStatus,
    resendOrderReceipt: ordersController.resendOrderReceipt,

    // Commissions
    getAllCommissions: commissionsController.getAllCommissions,
    updateCommissionStatus: commissionsController.updateCommissionStatus,

    // Licenses
    getAllLicenses: licensesController.getAllLicenses,
    grantLicense: licensesController.grantLicense,
    revokeLicense: licensesController.revokeLicense,

    // Promo Codes
    getAllPromoCodes: promoController.getAllPromoCodes,
    createPromoCode: promoController.createPromoCode,
    updatePromoCode: promoController.updatePromoCode,
    deletePromoCode: promoController.deletePromoCode,
    togglePromoCode: promoController.togglePromoCode,

    // Announcements
    getAllAnnouncements: announcementsController.getAllAnnouncements,
    createAnnouncement: announcementsController.createAnnouncement,
    updateAnnouncement: announcementsController.updateAnnouncement,
    deleteAnnouncement: announcementsController.deleteAnnouncement,
    toggleAnnouncement: announcementsController.toggleAnnouncement,

    // Reviews
    getAllReviews: reviewsController.getAllReviews,
    toggleReviewVerification: reviewsController.toggleReviewVerification,
    deleteReview: reviewsController.deleteReview,

    // Audit Logs
    getAuditLogs: auditController.getAuditLogs,
};
