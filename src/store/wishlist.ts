import { create } from "zustand";
import { persist } from "zustand/middleware";
import { wishlistApi } from "@/lib/api";

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
  addItem: (product: any) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      fetchWishlist: async () => {
        set({ loading: true });
        try {
          const { data, error } = await wishlistApi.getAll();
          
          if (data && (data as any).success) {
            const backendItems = (data as any).data.map((item: any) => ({
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              image: Array.isArray(item.product.images) ? item.product.images[0] : item.product.images,
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

      addItem: async (product) => {
        const items = get().items;
        const exists = items.find((i) => i.id === product.id);
        
        if (!exists) {
          // Optimistic update
          const newItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: Array.isArray(product.images) ? product.images[0] : product.images,
            category: product.category,
            description: product.description,
            stock: product.stock,
            isFlashSale: product.isFlashSale,
            flashSalePrice: product.flashSalePrice,
            flashSaleEnds: product.flashSaleEnds,
          };
          set({ items: [...items, newItem] });

          try {
            await wishlistApi.add(product.id);
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
