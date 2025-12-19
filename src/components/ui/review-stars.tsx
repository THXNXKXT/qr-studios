"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function ReviewStars({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  interactive = false,
  onChange,
  className,
}: ReviewStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  };

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn("flex items-center", gapClasses[size], className)}>
      <div className={cn("flex", gapClasses[size])}>
        {[...Array(maxRating)].map((_, index) => {
          const value = index + 1;
          const isFilled = value <= displayRating;
          const isHalf = value - 0.5 === displayRating;

          return (
            <motion.button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(value)}
              onMouseEnter={() => interactive && setHoverRating(value)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              whileHover={interactive ? { scale: 1.2 } : {}}
              whileTap={interactive ? { scale: 0.9 } : {}}
              className={cn(
                "relative",
                interactive && "cursor-pointer"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors",
                  isFilled || isHalf
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-600"
                )}
              />
            </motion.button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm text-gray-400 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  distribution?: { [key: number]: number };
  className?: string;
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  distribution,
  className,
}: ReviewSummaryProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-white">
            {averageRating.toFixed(1)}
          </div>
          <ReviewStars rating={averageRating} size="sm" />
          <p className="text-sm text-gray-400 mt-1">
            {totalReviews.toLocaleString()} รีวิว
          </p>
        </div>

        {distribution && (
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-3">{stars}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: (5 - stars) * 0.1 }}
                      className="h-full bg-yellow-400 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
