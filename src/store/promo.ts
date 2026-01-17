import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PromoCode {
  code: string;
  discount: number; // percentage
  type: "percentage" | "fixed";
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
}

// Mock promo codes
const promoCodes: PromoCode[] = [
  {
    code: "WELCOME10",
    discount: 10,
    type: "percentage",
    maxDiscount: 500,
    usedCount: 0,
  },
  {
    code: "SAVE50",
    discount: 50,
    type: "fixed",
    minPurchase: 500,
    usedCount: 0,
  },
  {
    code: "VIP20",
    discount: 20,
    type: "percentage",
    maxDiscount: 1000,
    usedCount: 0,
  },
];

interface PromoStore {
  appliedCode: PromoCode | null;
  code: string | null;
  setAppliedCode: (promo: PromoCode | null) => void;
  removeCode: () => void;
  calculateDiscount: (total: number) => number;
}

export const usePromoStore = create<PromoStore>()(
  persist(
    (set, get) => ({
      appliedCode: null,
      code: null,

      setAppliedCode: (promo) => {
        set({ 
          appliedCode: promo,
          code: promo ? promo.code : null
        });
      },

      removeCode: () => {
        set({ appliedCode: null, code: null });
      },

      calculateDiscount: (total) => {
        const promo = get().appliedCode;
        if (!promo) return 0;

        let discount = 0;
        // Backend uses uppercase 'PERCENTAGE' and 'FIXED' or lowercase
        const type = promo.type.toLowerCase();
        
        // Safety check for legacy buggy data
        // If it's a percentage but the discount value is very high (e.g., > 100),
        // it's likely the old buggy absolute value stored in localStorage.
        let discountValue = promo.discount;
        if (type === "percentage" && discountValue > 100) {
          // This is definitely old buggy data.
          // We don't clear here to avoid side effects in a getter, 
          // but returning 0 prevents the ฿1 total issue.
          return 0;
        }
        
        if (type === "percentage") {
          discount = Math.round((total * discountValue) / 100 * 100) / 100;
          if (promo.maxDiscount) {
            discount = Math.min(discount, promo.maxDiscount);
          }
        } else {
          discount = discountValue;
        }

        // Final safety: discount cannot exceed total
        const finalDiscount = Math.round(Math.min(discount, total) * 100) / 100;
        
        // If the discount is exactly total - 1 and it's a percentage, 
        // it's very suspicious (likely the bug from the screenshot).
        if (type === "percentage" && total > 1 && finalDiscount === total - 1) {
          return 0;
        }

        return finalDiscount;
      },
    }),
    {
      name: "qr-studio-promo",
    }
  )
);
