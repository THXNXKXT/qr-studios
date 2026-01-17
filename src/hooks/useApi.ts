import { useState, useCallback } from "react";

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T = any>(options?: UseApiOptions) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      url: string,
      config?: RequestInit
    ): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...config?.headers,
          },
          ...config,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        setState({ data, isLoading: false, error: null });
        options?.onSuccess?.(data);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
        setState({ data: null, isLoading: false, error: errorMessage });
        options?.onError?.(errorMessage);
        return null;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific API hooks
export function useProducts() {
  const api = useApi();

  const getProducts = useCallback(
    (params?: { category?: string; search?: string; sort?: string; page?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set("category", params.category.toUpperCase());
      if (params?.search) searchParams.set("search", params.search);
      if (params?.sort) searchParams.set("sort", params.sort);
      if (params?.page) searchParams.set("page", params.page.toString());

      return api.execute(`/api/products?${searchParams.toString()}`);
    },
    [api]
  );

  const getProduct = useCallback(
    (id: string) => api.execute(`/api/products/${id}`),
    [api]
  );

  return { ...api, getProducts, getProduct };
}

export function useOrders() {
  const api = useApi();

  const getOrders = useCallback(
    () => api.execute("/api/users/orders"),
    [api]
  );

  const getOrder = useCallback(
    (id: string) => api.execute(`/api/orders/${id}`),
    [api]
  );

  return { ...api, getOrders, getOrder };
}

export function useLicenses() {
  const api = useApi();

  const getLicenses = useCallback(
    () => api.execute("/api/licenses"),
    [api]
  );

  const updateLicenseIp = useCallback(
    (id: string, ipAddress: string) =>
      api.execute(`/api/licenses/${id}/ip`, {
        method: "PATCH",
        body: JSON.stringify({ ipAddress }),
      }),
    [api]
  );

  const getDownloadUrl = useCallback(
    (id: string) => api.execute(`/api/licenses/${id}/download`),
    [api]
  );

  return { ...api, getLicenses, updateLicenseIp, getDownloadUrl };
}

export function useCheckout() {
  const api = useApi();

  const createCheckout = useCallback(
    (items: any[], promoCode?: string) =>
      api.execute("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ items, promoCode }),
      }),
    [api]
  );

  const payWithBalance = useCallback(
    (orderId: string) =>
      api.execute("/api/checkout/balance", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      }),
    [api]
  );

  return { ...api, createCheckout, payWithBalance };
}

export function useTopup() {
  const api = useApi();

  const createTopup = useCallback(
    (amount: number, paymentMethod: string) =>
      api.execute("/api/topup/stripe", {
        method: "POST",
        body: JSON.stringify({ amount, paymentMethod }),
      }),
    [api]
  );

  return { ...api, createTopup };
}

export function useWishlistApi() {
  const api = useApi();

  const getWishlist = useCallback(
    () => api.execute("/api/wishlist"),
    [api]
  );

  const addToWishlist = useCallback(
    (productId: string) =>
      api.execute(`/api/wishlist/${productId}`, { method: "POST" }),
    [api]
  );

  const removeFromWishlist = useCallback(
    (productId: string) =>
      api.execute(`/api/wishlist/${productId}`, { method: "DELETE" }),
    [api]
  );

  return { ...api, getWishlist, addToWishlist, removeFromWishlist };
}

export function useReviews() {
  const api = useApi();

  const getReviews = useCallback(
    (productId: string) => api.execute(`/api/products/${productId}/reviews`),
    [api]
  );

  const addReview = useCallback(
    (productId: string, rating: number, comment: string) =>
      api.execute(`/api/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      }),
    [api]
  );

  return { ...api, getReviews, addReview };
}

export function usePromoApi() {
  const api = useApi();

  const validatePromo = useCallback(
    (code: string, cartTotal: number) =>
      api.execute("/api/promo/validate", {
        method: "POST",
        body: JSON.stringify({ code, cartTotal }),
      }),
    [api]
  );

  return { ...api, validatePromo };
}

export function useUser() {
  const api = useApi();

  const getProfile = useCallback(
    () => api.execute("/api/users/profile"),
    [api]
  );

  const updateProfile = useCallback(
    (data: { avatar?: string }) =>
      api.execute("/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    [api]
  );

  const getBalance = useCallback(
    () => api.execute("/api/users/balance"),
    [api]
  );

  return { ...api, getProfile, updateProfile, getBalance };
}

export function useNotificationsApi() {
  const api = useApi();

  const getNotifications = useCallback(
    () => api.execute("/api/users/notifications"),
    [api]
  );

  const markAsRead = useCallback(
    (id: string) =>
      api.execute(`/api/users/notifications/${id}/read`, { method: "PATCH" }),
    [api]
  );

  const markAllAsRead = useCallback(
    () => api.execute("/api/users/notifications/read-all", { method: "POST" }),
    [api]
  );

  return { ...api, getNotifications, markAsRead, markAllAsRead };
}
