// API Configuration and Helper Functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4001";

import { getAuthToken as getAuthTokenHelper } from "./auth-helper";
import { ApiResponse, PaginatedResponse, AdminUsersParams } from "@/types/api";

// Generic fetch wrapper with error handling and timeout
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs: number = 30000 // Increased to 30s default
): Promise<{ data: T | null; error: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort("Request timed out");
    } catch (e) {
      controller.abort();
    }
  }, timeoutMs);

  try {
    const token = getAuthTokenHelper();

    const headers: Record<string, string> = {};

    if (options?.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
      cache: options?.cache || (token ? 'no-store' : 'default'),
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `HTTP Error: ${response.status}`;
      return {
        data: null,
        error: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg),
      };
    }

    return { data, error: null };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'))) {
      return { data: null, error: "Request timed out or was cancelled" };
    }
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Auth API
export const authApi = {
  getSession: () => apiFetch("/api/auth/session"),
  signOut: () => apiFetch("/api/auth/signout", { method: "POST" }),
};

// User API
export const userApi = {
  getProfile: () => apiFetch("/api/users/profile"),
  updateProfile: (data: { avatar?: string }) =>
    apiFetch("/api/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getBalance: () => apiFetch<{ balance: number }>("/api/users/balance"),
  getOrders: () => apiFetch("/api/users/orders"),
  getLicenses: () => apiFetch("/api/users/licenses"),
  getNotifications: () => apiFetch("/api/users/notifications"),
  getTransactions: () => apiFetch("/api/users/transactions"),
};

// Products API
export const productsApi = {
  getAll: (params?: {
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category.toUpperCase());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    return apiFetch(`/api/products?${searchParams.toString()}`);
  },
  getById: (id: string) => apiFetch(`/api/products/${id}`),
  getFeatured: () => apiFetch("/api/products/featured"),
  getFlashSale: () => apiFetch("/api/products/flash-sale"),
  getReviews: (id: string) => apiFetch(`/api/products/${id}/reviews`),
  addReview: (id: string, rating: number, comment: string) =>
    apiFetch(`/api/products/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),
  download: (id: string) => apiFetch<{ url: string }>(`/api/products/${id}/download`),
};

// Orders API
export const ordersApi = {
  getAll: () => apiFetch("/api/users/orders"),
  getById: (id: string) => apiFetch(`/api/orders/${id}`),
  create: (items: any[], paymentMethod: string = 'STRIPE', promoCode?: string) =>
    apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({ items, paymentMethod, promoCode }),
    }),
};

// Licenses API
export const licensesApi = {
  getAll: () => apiFetch("/api/licenses"),
  getById: (id: string) => apiFetch(`/api/licenses/${id}`),
  updateIp: (id: string, ipAddresses: string[]) =>
    apiFetch(`/api/licenses/${id}/ip`, {
      method: "PATCH",
      body: JSON.stringify({ ipAddresses }),
    }),
  resetIp: (id: string) =>
    apiFetch(`/api/licenses/${id}/ip/reset`, {
      method: "POST",
    }),
  getDownloadUrl: (id: string) => apiFetch(`/api/licenses/${id}/download-url`),
  verify: (licenseKey: string, serverIp: string, resourceName: string) =>
    apiFetch("/api/licenses/verify", {
      method: "POST",
      body: JSON.stringify({ licenseKey, serverIp, resourceName }),
    }),
};

// Checkout API
export const checkoutApi = {
  createStripeSession: (items: any[], promoCode?: string) =>
    apiFetch("/api/checkout/stripe", {
      method: "POST",
      body: JSON.stringify({ items, promoCode }),
    }),
  payWithBalance: (orderId: string) =>
    apiFetch("/api/checkout/balance", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    }),
  verifyPayment: (orderId: string) =>
    apiFetch(`/api/checkout/verify/${orderId}`),
  verifyStripePayment: (sessionId: string) =>
    apiFetch(`/api/checkout/verify-stripe/${sessionId}`),
};

// Topup API
export const topupApi = {
  getPackages: () => apiFetch("/api/topup/packages"),
  createStripeSession: (amount: number) =>
    apiFetch("/api/topup/stripe", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  createPromptPay: (amount: number) =>
    apiFetch("/api/topup/promptpay", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  getHistory: () => apiFetch("/api/topup/history"),
  verifySession: (sessionId: string) => apiFetch(`/api/topup/verify/${sessionId}`),
};

// Promo API
export const promoApi = {
  validate: (code: string, cartTotal: number, token?: string) => {
    return apiFetch<any>(`/api/promo/validate`, {
      method: "POST",
      body: JSON.stringify({ code, cartTotal }),
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
    });
  },
  apply: (code: string, orderId: string) =>
    apiFetch("/api/promo/apply", {
      method: "POST",
      body: JSON.stringify({ code, orderId }),
    }),
};

// Wishlist API
export const wishlistApi = {
  getAll: () => apiFetch("/api/wishlist"),
  add: (productId: string) =>
    apiFetch("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  remove: (productId: string) =>
    apiFetch(`/api/wishlist/${productId}`, { method: "DELETE" }),
  clear: () => apiFetch("/api/wishlist/clear", { method: "DELETE" }),
};

// Commission API
export const commissionApi = {
  getAll: () => apiFetch("/api/commissions"),
  getById: (id: string) => apiFetch(`/api/commissions/${id}`),
  create: (data: {
    title: string;
    description: string;
    budget: number;
    attachments?: string[];
  }) =>
    apiFetch("/api/commissions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiFetch(`/api/commissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  cancel: (id: string) =>
    apiFetch(`/api/commissions/${id}`, { method: "DELETE" }),
};

// Notifications API
export const notificationsApi = {
  getAll: () => apiFetch("/api/users/notifications"),
  markAsRead: (id: string) =>
    apiFetch(`/api/users/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: () =>
    apiFetch("/api/users/notifications/read-all", { method: "POST" }),
};

// Announcements API
export const announcementsApi = {
  getActive: () => apiFetch("/api/announcements"),
  getById: (id: string) => apiFetch(`/api/announcements/${id}`),
};

// Admin API
export const adminApi = {
  getStats: () => apiFetch<any>("/api/admin/stats"),
  getRevenueChart: () => apiFetch<any[]>("/api/admin/stats/revenue-chart"),
  getLowStock: () => apiFetch<any[]>("/api/admin/stats/low-stock"),
  getAnalytics: () => apiFetch<any>("/api/admin/stats/analytics"),
  getSettings: () => apiFetch<any>("/api/admin/settings"),
  updateSetting: (key: string, value: any) =>
    apiFetch(`/api/admin/settings/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    }),
  getAuditLogs: (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    return apiFetch(`/api/admin/audit-logs?${searchParams.toString()}`);
  },

  // Products
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; isFlashSale?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category.toUpperCase());
    if (params?.isFlashSale !== undefined) searchParams.set("isFlashSale", params.isFlashSale.toString());
    return apiFetch(`/api/admin/products?${searchParams.toString()}`);
  },
  createProduct: (data: any) => apiFetch("/api/admin/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => apiFetch(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProduct: (id: string) => apiFetch(`/api/admin/products/${id}`, { method: "DELETE" }),
  hardDeleteProduct: (id: string) => apiFetch(`/api/admin/products/${id}/permanent`, { method: "DELETE" }),

  // Users
  getUsers: (params?: AdminUsersParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.role) searchParams.set("role", params.role);
    if (params?.tier) searchParams.set("tier", params.tier);
    return apiFetch(`/api/admin/users?${searchParams.toString()}`);
  },
  updateUserBalance: (id: string, data: { amount: number; operation: "ADD" | "SUBTRACT" }) =>
    apiFetch(`/api/admin/users/${id}/balance`, { method: "PATCH", body: JSON.stringify(data) }),
  updateUserPoints: (id: string, data: { amount: number; operation: "ADD" | "SUBTRACT" }) =>
    apiFetch(`/api/admin/users/${id}/points`, { method: "PATCH", body: JSON.stringify(data) }),
  updateUserRole: (id: string, role: string) =>
    apiFetch(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  banUser: (id: string) => apiFetch(`/api/admin/users/${id}/ban`, { method: "POST" }),
  unbanUser: (id: string) => apiFetch(`/api/admin/users/${id}/unban`, { method: "POST" }),

  // Storage/Upload
  uploadFile: (file: File, folder: string = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return apiFetch<{ url: string; key: string; name: string }>("/api/admin/upload", {
      method: "POST",
      body: formData,
      // Note: Hono/apiFetch might need special handling for FormData if it default-sets JSON content-type
    });
  },

  // Orders
  getOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    return apiFetch(`/api/admin/orders?${searchParams.toString()}`);
  },
  getOrderById: (id: string) => apiFetch(`/api/admin/orders/${id}`),
  resendOrderReceipt: (id: string) => apiFetch(`/api/admin/orders/${id}/resend-receipt`, { method: "POST" }),
  updateOrderStatus: (id: string, status: string) =>
    apiFetch(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Licenses
  getLicenses: (params?: { page?: number; limit?: number; status?: string; productId?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.productId) searchParams.set("productId", params.productId);
    if (params?.search) searchParams.set("search", params.search);
    return apiFetch(`/api/admin/licenses?${searchParams.toString()}`);
  },
  grantLicense: (data: { userId: string; productId: string; expiresAt?: string }) =>
    apiFetch("/api/admin/licenses/grant", { method: "POST", body: JSON.stringify(data) }),
  revokeLicense: (id: string) => apiFetch(`/api/admin/licenses/${id}/revoke`, { method: "POST" }),
  resetLicenseIp: (id: string) => apiFetch(`/api/admin/licenses/${id}/reset-ip`, { method: "POST" }),

  // IP Blacklist
  getBlacklist: () => apiFetch<any[]>("/api/admin/licenses/blacklist"),
  addToBlacklist: (ipAddress: string, reason?: string) =>
    apiFetch("/api/admin/licenses/blacklist", { method: "POST", body: JSON.stringify({ ipAddress, reason }) }),
  removeFromBlacklist: (ip: string) => apiFetch(`/api/admin/licenses/blacklist/${ip}`, { method: "DELETE" }),

  // Promo Codes
  getPromoCodes: () => apiFetch<any[]>("/api/admin/promo-codes"),
  createPromoCode: (data: any) => apiFetch("/api/admin/promo-codes", { method: "POST", body: JSON.stringify(data) }),
  updatePromoCode: (id: string, data: any) => apiFetch(`/api/admin/promo-codes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePromoCode: (id: string) => apiFetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" }),
  togglePromoCode: (id: string) => apiFetch(`/api/admin/promo-codes/${id}/toggle`, { method: "PATCH" }),

  // Announcements
  getAnnouncements: () => apiFetch<any[]>("/api/admin/announcements"),
  createAnnouncement: (data: any) => apiFetch("/api/admin/announcements", { method: "POST", body: JSON.stringify(data) }),
  updateAnnouncement: (id: string, data: any) => apiFetch(`/api/admin/announcements/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAnnouncement: (id: string) => apiFetch(`/api/admin/announcements/${id}`, { method: "DELETE" }),
  toggleAnnouncement: (id: string) => apiFetch(`/api/admin/announcements/${id}/toggle`, { method: "PATCH" }),

  // Reviews
  getReviews: (params?: { page?: number; limit?: number; rating?: number; productId?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.rating) searchParams.set("rating", params.rating.toString());
    if (params?.productId) searchParams.set("productId", params.productId);
    if (params?.search) searchParams.set("search", params.search);
    return apiFetch(`/api/admin/reviews?${searchParams.toString()}`);
  },
  toggleReviewVerification: (id: string) => apiFetch(`/api/admin/reviews/${id}/verify`, { method: "PATCH" }),
  deleteReview: (id: string) => apiFetch(`/api/admin/reviews/${id}`, { method: "DELETE" }),

  // Flash Sale
  getFlashSaleProducts: () => apiFetch<any[]>("/api/products/flash-sale"),
  updateFlashSale: (id: string, data: { isFlashSale: boolean; flashSalePrice?: number; flashSaleEnds?: string | null }) =>
    apiFetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Commissions
  getCommissions: (params?: { page?: number; limit?: number; status?: string; userId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.userId) searchParams.set("userId", params.userId);
    return apiFetch(`/api/admin/commissions?${searchParams.toString()}`);
  },
  updateCommissionStatus: (id: string, data: { status: string; adminNotes?: string }) =>
    apiFetch(`/api/admin/commissions/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
};

// Lucky Wheel API
export const luckyWheelApi = {
  getStatus: () => apiFetch<{ enabled: boolean }>("/api/lucky-wheel/status"),
  getRewards: () => apiFetch<any[]>("/api/lucky-wheel/rewards"),
  spin: () => apiFetch<any>("/api/lucky-wheel/spin", { method: "POST" }),
  getHistory: () => apiFetch<any[]>("/api/lucky-wheel/history"),

  // Admin
  adminGetAllRewards: () => apiFetch<any[]>("/api/lucky-wheel/admin/rewards"),
  adminCreateReward: (data: any) =>
    apiFetch("/api/lucky-wheel/admin/rewards", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminUpdateReward: (id: string, data: any) =>
    apiFetch(`/api/lucky-wheel/admin/rewards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminDeleteReward: (id: string) =>
    apiFetch(`/api/lucky-wheel/admin/rewards/${id}`, { method: "DELETE" }),
};

// Stats API
export const statsApi = {
  getPublicStats: () => apiFetch<ApiResponse<{
    totalVisitors: number;
    totalProducts: number;
    totalLicenses: number;
    totalMembers: number;
  }>>("/api/stats"),
};
