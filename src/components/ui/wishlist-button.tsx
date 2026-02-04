"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlistStore, WishlistItem } from "@/store/wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function WishlistButton({ item, className, size = "md" }: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(item.id);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeItem(item.id);
    } else {
      addItem(item);
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 600);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative rounded-full flex items-center justify-center transition-all",
        "bg-black/50 hover:bg-black/70 backdrop-blur-sm",
        sizeClasses[size],
        className
      )}
      aria-label={isWishlisted ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
    >
      <motion.div
        animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(
            iconSizes[size],
            "transition-colors",
            isWishlisted ? "fill-red-500 text-red-500" : "text-white"
          )}
        />
      </motion.div>

      {/* Heart burst animation */}
      <AnimatePresence>
        {showAnimation && (
          <>
            {[...Array(Math.max(0, 6))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: 2,
                  opacity: 0,
                  x: Math.cos((i * 60 * Math.PI) / 180) * 20,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 20,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute w-2 h-2 rounded-full bg-red-500"
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </button>
  );
}
