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
  applyCode: (code: string, cartTotal: number) => { success: boolean; message: string };
  removeCode: () => void;
  calculateDiscount: (total: number) => number;
}

export const usePromoStore = create<PromoStore>()(
  persist(
    (set, get) => ({
      appliedCode: null,

      applyCode: (code, cartTotal) => {
        const promo = promoCodes.find(
          (p) => p.code.toUpperCase() === code.toUpperCase()
        );

        if (!promo) {
          return { success: false, message: "รหัสโปรโมชั่นไม่ถูกต้อง" };
        }

        if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
          return { success: false, message: "รหัสโปรโมชั่นหมดอายุแล้ว" };
        }

        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
          return { success: false, message: "รหัสโปรโมชั่นถูกใช้งานครบแล้ว" };
        }

        if (promo.minPurchase && cartTotal < promo.minPurchase) {
          return {
            success: false,
            message: `ยอดสั่งซื้อขั้นต่ำ ฿${promo.minPurchase.toLocaleString()}`,
          };
        }

        set({ appliedCode: promo });
        return { success: true, message: "ใช้รหัสโปรโมชั่นสำเร็จ!" };
      },

      removeCode: () => {
        set({ appliedCode: null });
      },

      calculateDiscount: (total) => {
        const promo = get().appliedCode;
        if (!promo) return 0;

        let discount = 0;
        if (promo.type === "percentage") {
          discount = (total * promo.discount) / 100;
          if (promo.maxDiscount) {
            discount = Math.min(discount, promo.maxDiscount);
          }
        } else {
          discount = promo.discount;
        }

        return Math.min(discount, total);
      },
    }),
    {
      name: "qr-studio-promo",
    }
  )
);
