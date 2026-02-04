"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageOff, Star, Zap, Sparkles, ThumbsUp } from "lucide-react";
import { Card, StockCounter, ReviewStars, Badge } from "@/components/ui";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useTranslation } from "react-i18next";
import { formatPrice, getProductPrice, isProductOnFlashSale } from "@/lib/utils";
import type { Product } from "@/types";

const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { t } = useTranslation("home");
  const isMounted = useIsMounted();
  const [imageError, setImageError] = useState(false);
  const addToRecentlyViewed = useRecentlyViewedStore((state) => state.addItem);

  const handleClick = useCallback(() => {
    if (!product) return;
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.thumbnail || "",
      category: product.category,
      stock: product.stock,
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      isFlashSale: product.isFlashSale,
      flashSalePrice: product.flashSalePrice,
      flashSaleEnds: product.flashSaleEnds,
      rewardPoints: product.rewardPoints,
      expectedPoints: product.expectedPoints,
    });
  }, [addToRecentlyViewed, product]);

  const stock = product.stock;

  if (!isMounted) return null;

  const imageUrl = product.thumbnail || product.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/products/${product.id}`} onClick={handleClick}>
        <Card className="group overflow-hidden hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
          {/* Image */}
          <div className="relative aspect-video bg-linear-to-br from-red-900/50 to-black overflow-hidden">
            {/* Badges Container */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
              {/* Flash Sale Badge */}
              {isProductOnFlashSale(product) && (
                <Badge variant="destructive" className="gap-1 animate-pulse py-1 font-black uppercase tracking-widest text-[10px] w-fit">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  Flash Sale -{Math.round((1 - (product.flashSalePrice || product.price) / (product.originalPrice || product.price)) * 100)}%
                </Badge>
              )}
              {/* New Badge */}
              {product.isNew && (
                <Badge className="gap-1 py-1 font-black uppercase tracking-widest text-[10px] bg-green-600 text-white border-emerald-500/50 w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("products.card.new")}
                </Badge>
              )}
              {/* Featured Badge */}
              {product.isFeatured && (
                <Badge className="gap-1 py-1 font-black uppercase tracking-widest text-[10px] bg-amber-500 text-white border-amber-400/50 w-fit">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {t("products.card.featured")}
                </Badge>
              )}
            </div>
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                priority={index < 4}
                placeholder="blur"
                blurDataURL={blurDataURL}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                <ImageOff className="w-10 h-10 text-gray-600 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">No Image</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            <h3 className="text-base font-bold text-white group-hover:text-red-300 transition-colors line-clamp-1">
              {product.name}
            </h3>

            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            {/* Rating & Stock */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <ReviewStars rating={product.rating || 0} size="xs" />
                <span className="text-[10px] text-gray-500 font-bold">
                  ({product.reviewCount})
                </span>
              </div>
              <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                <StockCounter stock={stock} showIcon={false} />
              </div>
            </div>

            {/* Price & Points */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black text-red-500 tracking-tighter">
                  {formatPrice(getProductPrice(product))}
                </span>
                {isProductOnFlashSale(product) && (
                  <span className="text-[10px] text-gray-500 line-through opacity-50 font-bold">
                    {formatPrice(product.price)}
                  </span>
                )}
                {!isProductOnFlashSale(product) && product.originalPrice && (
                  <span className="text-[10px] text-gray-500 line-through opacity-50 font-bold">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Reward Points */}
              {product.expectedPoints !== undefined && product.expectedPoints > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-400/5 border border-yellow-400/10">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500/20" />
                  <span className="text-[10px] font-black text-yellow-500 tracking-tighter">
                    {product.expectedPoints.toLocaleString()} <span className="text-[8px] uppercase opacity-60">Pts</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
});
