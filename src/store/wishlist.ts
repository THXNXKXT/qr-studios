import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wishlistApi } from "@/lib/api";
import type { Product } from "@/types";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  stock: number;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: Date | string;
}

interface WishlistStore {
  items: WishlistItem[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (item: WishlistItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
}

interface WishlistResponse {
  success: boolean;
  data: Array<{
    product: Product;
  }>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      fetchWishlist: async () => {
        set({ loading: true });
        try {
          const { data } = await wishlistApi.getAll();
          const response = data as WishlistResponse;
          
          if (response?.success && Array.isArray(response.data)) {
            const backendItems = response.data.map((item) => ({
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              image: item.product.thumbnail || item.product.images?.[0] || "",
              category: item.product.category,
              description: item.product.description,
              stock: item.product.stock,
              isFlashSale: item.product.isFlashSale,
              flashSalePrice: item.product.flashSalePrice,
              flashSaleEnds: item.product.flashSaleEnds,
            }));
            set({ items: backendItems });
          }
        } catch (error) {
          console.error("Failed to fetch wishlist:", error);
        } finally {
          set({ loading: false });
        }
      },

      addItem: async (item) => {
        const items = get().items;
        const exists = items.find((i) => i.id === item.id);
        
        if (!exists) {
          // Optimistic update
          const newItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image || "",
            category: item.category,
            description: item.description,
            stock: item.stock,
            isFlashSale: item.isFlashSale,
            flashSalePrice: item.flashSalePrice,
            flashSaleEnds: item.flashSaleEnds,
          };
          set({ items: [...items, newItem] });

          try {
            await wishlistApi.add(item.id);
          } catch (error) {
            console.error("Failed to add to wishlist:", error);
            // Revert on error
            set({ items });
          }
        }
      },

      removeItem: async (productId) => {
        const items = get().items;
        set({
          items: items.filter((item) => item.id !== productId),
        });

        try {
          await wishlistApi.remove(productId);
        } catch (error) {
          console.error("Failed to remove from wishlist:", error);
          // Revert on error
          set({ items });
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },

      clearWishlist: async () => {
        const items = get().items;
        set({ items: [] });

        try {
          await wishlistApi.clear();
        } catch (error) {
          console.error("Failed to clear wishlist:", error);
          // Revert on error
          set({ items });
        }
      },
    }),
    {
      name: "qr-studio-wishlist",
      // Only persist the items themselves
      partialize: (state) => ({ items: state.items }),
    }
  )
);
