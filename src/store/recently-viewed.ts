import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: Date | string;
  rewardPoints?: number;
  expectedPoints?: number;
  viewedAt: number;
}

interface RecentlyViewedStore {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clearHistory: () => void;
  getRecentItems: (limit?: number) => RecentlyViewedItem[];
}

const MAX_ITEMS = 10;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Remove if already exists
          const filtered = state.items.filter((i) => i.id !== item.id);
          
          // Add to beginning with timestamp
          const newItems = [
            { ...item, viewedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_ITEMS);

          return { items: newItems };
        });
      },

      clearHistory: () => {
        set({ items: [] });
      },

      getRecentItems: (limit = 5) => {
        return get().items.slice(0, limit);
      },
    }),
    {
      name: "qr-studio-recently-viewed",
    }
  )
);
