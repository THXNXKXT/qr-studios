// API Configuration and Helper Functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Generic fetch wrapper with error handling
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.message || `HTTP Error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
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
  getProfile: () => apiFetch("/api/users/me"),
  updateProfile: (data: { username?: string; email?: string }) =>
    apiFetch("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getBalance: () => apiFetch<{ balance: number }>("/api/users/me/balance"),
  getOrders: () => apiFetch("/api/users/me/orders"),
  getLicenses: () => apiFetch("/api/users/me/licenses"),
  getNotifications: () => apiFetch("/api/users/me/notifications"),
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
    if (params?.category) searchParams.set("category", params.category);
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
};

// Orders API
export const ordersApi = {
  getAll: () => apiFetch("/api/users/me/orders"),
  getById: (id: string) => apiFetch(`/api/orders/${id}`),
  create: (items: any[], promoCode?: string) =>
    apiFetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ items, promoCode }),
    }),
};

// Licenses API
export const licensesApi = {
  getAll: () => apiFetch("/api/licenses"),
  getById: (id: string) => apiFetch(`/api/licenses/${id}`),
  updateIp: (id: string, ipAddress: string) =>
    apiFetch(`/api/licenses/${id}/ip`, {
      method: "PATCH",
      body: JSON.stringify({ ipAddress }),
    }),
  getDownloadUrl: (id: string) => apiFetch(`/api/licenses/${id}/download`),
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
};

// Promo API
export const promoApi = {
  validate: (code: string, cartTotal: number) =>
    apiFetch("/api/promo/validate", {
      method: "POST",
      body: JSON.stringify({ code, cartTotal }),
    }),
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
    apiFetch(`/api/wishlist/${productId}`, { method: "POST" }),
  remove: (productId: string) =>
    apiFetch(`/api/wishlist/${productId}`, { method: "DELETE" }),
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
  getAll: () => apiFetch("/api/users/me/notifications"),
  markAsRead: (id: string) =>
    apiFetch(`/api/users/me/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: () =>
    apiFetch("/api/users/me/notifications/read-all", { method: "POST" }),
};

// Announcements API
export const announcementsApi = {
  getActive: () => apiFetch("/api/announcements/active"),
};
