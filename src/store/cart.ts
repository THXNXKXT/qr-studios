import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";
import { getProductPrice } from "@/lib/utils";

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

// Map legacy numeric IDs to new backend UUIDs
const ID_MAPPING: Record<string, string> = {
  "1": "72cc1289-b726-4d91-8f8a-d331807698ec", // Advanced Admin Panel
  "2": "2eb5f5a6-e62e-4d01-91eb-aa9da3308d46", // Modern UI Bundle
  "3": "08f6dd68-bc81-4a24-8f49-c5f441c27c35", // Inventory System Pro
  "4": "fe82c653-8f1d-404b-b8c1-f09e80e0f15d", // Banking System Pro
  "5": "8962344f-dafa-404b-89f5-82519739ae2c", // Custom Garage System
  "6": "932dc0c1-f9e8-4462-a3b0-730205ccc7b5", // Complete Server Bundle
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        const items = get().items;
        // Apply mapping if it's a legacy ID
        const productId = ID_MAPPING[product.id] || product.id;
        const existingItem = items.find((item) => (ID_MAPPING[item.product.id] || item.product.id) === productId);

        if (existingItem) {
          set({
            items: items.map((item) =>
              (ID_MAPPING[item.product.id] || item.product.id) === productId
                ? { ...item, product, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Normalize product ID before adding
          const normalizedProduct = { ...product, id: productId };
          set({ items: [...items, { product: normalizedProduct, quantity: 1 }] });
        }
      },

      removeItem: (productId: string) => {
        const normalizedId = ID_MAPPING[productId] || productId;
        set({
          items: get().items.filter((item) => (ID_MAPPING[item.product.id] || item.product.id) !== normalizedId),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const normalizedId = ID_MAPPING[productId] || productId;
        if (quantity <= 0) {
          get().removeItem(normalizedId);
          return;
        }

        set({
          items: get().items.map((item) =>
            (ID_MAPPING[item.product.id] || item.product.id) === normalizedId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => {
            const currentPrice = getProductPrice(item.product);
            return total + currentPrice * item.quantity;
          },
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "qr-studios-cart",
      onRehydrateStorage: () => (state) => {
        if (state && state.items) {
          // Migrate legacy IDs in the persisted store
          let hasMigration = false;
          const migratedItems = state.items.map(item => {
            if (ID_MAPPING[item.product.id]) {
              hasMigration = true;
              return {
                ...item,
                product: {
                  ...item.product,
                  id: ID_MAPPING[item.product.id]
                }
              };
            }
            return item;
          });

          if (hasMigration) {
            console.log("[Cart Migration] Migrated legacy product IDs to UUIDs");
            state.items = migratedItems;
          }
        }
      }
    }
  )
);
