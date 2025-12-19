"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { usePromoStore } from "@/store/promo";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PromoCodeInputProps {
  cartTotal: number;
  className?: string;
}

export function PromoCodeInput({ cartTotal, className }: PromoCodeInputProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { appliedCode, applyCode, removeCode, calculateDiscount } = usePromoStore();

  const handleApply = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setMessage(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = applyCode(code, cartTotal);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });

    if (result.success) {
      setCode("");
    }

    setIsLoading(false);

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Tag className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-400">{appliedCode.code}</p>
              <p className="text-sm text-gray-400">
                ลด {appliedCode.type === "percentage" ? `${appliedCode.discount}%` : `฿${appliedCode.discount}`}
                {appliedCode.maxDiscount && ` (สูงสุด ฿${appliedCode.maxDiscount})`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-400 font-semibold">
              -฿{discount.toLocaleString()}
            </span>
            <button
              onClick={handleRemove}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
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
                ? "bg-green-500/10 text-green-400"
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
