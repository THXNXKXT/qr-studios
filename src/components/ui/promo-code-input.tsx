"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { usePromoStore } from "@/store/promo";
import { promoApi } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-helper";
import { Button } from "./button";
import { Input } from "./input";
import { cn, formatPrice } from "@/lib/utils";

interface PromoCodeInputProps {
  cartTotal: number;
  className?: string;
}

export function PromoCodeInput({ cartTotal, className }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { appliedCode, setAppliedCode, removeCode, calculateDiscount } = usePromoStore();

  const handleApply = async () => {
    const codeToValidate = code.trim().toUpperCase();
    if (!codeToValidate) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const token = getAuthToken();
      // Ensure cartTotal is a valid number
      const validTotal = Number(cartTotal);
      
      console.log("[PromoCodeInput] Request Payload:", { 
        code: codeToValidate, 
        cartTotal: validTotal,
        cartTotalType: typeof validTotal 
      });
      
      const { data, error } = await promoApi.validate(codeToValidate, validTotal, token || undefined);
      
      if (data && (data as any).success) {
        setAppliedCode((data as any).data);
        setMessage({
          type: "success",
          text: (data as any).message || "ใช้รหัสโปรโมชั่นสำเร็จ!",
        });
        setCode("");
      } else {
        setMessage({
          type: "error",
          text: error || "รหัสโปรโมชั่นไม่ถูกต้อง",
        });
      }
    } catch (err) {
      console.error("Promo validation error:", err);
      setMessage({
        type: "error",
        text: "เกิดข้อผิดพลาดในการตรวจสอบรหัส",
      });
    } finally {
      setIsLoading(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRemove = () => {
    removeCode();
    setMessage(null);
  };

  const discount = calculateDiscount(cartTotal);

  return (
    <div className={cn("space-y-3", className)}>
      {appliedCode ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/20 relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shadow-inner">
              <Tag className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-black text-white uppercase tracking-tight leading-none mb-1">{appliedCode.code}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                ลด {appliedCode.type.toLowerCase() === "percentage" ? `${appliedCode.discount}%` : `฿${appliedCode.discount.toLocaleString()}`}
                {appliedCode.maxDiscount && ` (สูงสุด ฿${appliedCode.maxDiscount.toLocaleString()})`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <span className="text-xl font-black text-red-500 tracking-tighter">
              -{formatPrice(discount)}
            </span>
            <button
              onClick={handleRemove}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="รหัสโปรโมชั่น"
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
            />
          </div>
          <Button
            onClick={handleApply}
            disabled={isLoading || !code.trim()}
            variant="secondary"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "ใช้โค้ด"
            )}
          </Button>
        </div>
      )}

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
              message.type === "success"
                ? "bg-red-500/10 text-red-400"
                : "bg-red-500/10 text-red-400"
            )}
          >
            {message.type === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available codes hint */}
      {!appliedCode && (
        <p className="text-xs text-gray-500">
          ลอง: WELCOME10, SAVE50, VIP20
        </p>
      )}
    </div>
  );
}
