"use client";

import { memo, useCallback, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Eye, ImageOff, Zap, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Badge, Card, WishlistButton, StockCounter, ReviewStars, FlashSaleTimer } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { formatPrice, getProductPrice, isProductOnFlashSale } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = memo(function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const addToRecentlyViewed = useRecentlyViewedStore((state) => state.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderTranslation = (key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  const categoryLabels: Record<string, string> = {
    SCRIPT: "Script",
    UI: "UI",
    BUNDLE: "Bundle",
  };

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  }, [addItem, product]);

  const handleClick = useCallback(() => {
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.thumbnail || product.images[0] || "",
      category: product.category,
      stock: product.stock,
      isFlashSale: product.isFlashSale,
      flashSalePrice: product.flashSalePrice,
      flashSaleEnds: product.flashSaleEnds,
      rewardPoints: product.rewardPoints,
      expectedPoints: product.expectedPoints,
    });
  }, [addToRecentlyViewed, product]);

  const stock = product.stock;

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
            {(product.thumbnail || product.images[0]) ? (
              <Image
                src={product.thumbnail || product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                <ImageOff className="w-10 h-10 text-gray-600 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">No Image</span>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

            {/* Badges & Timer */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
              {product.isNew && (
                <Badge variant="success" className="w-fit px-3 py-1 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-500/20">
                  {renderTranslation("products.card.new")}
                </Badge>
              )}
              {isProductOnFlashSale(product) && (
                <div className="flex flex-col gap-1.5">
                  <Badge variant="destructive" className="gap-1 animate-pulse px-3 py-1 font-black uppercase tracking-widest text-[10px] w-fit shadow-lg shadow-red-500/30">
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    Flash Sale -{Math.round((1 - (product.flashSalePrice || product.price) / (product.originalPrice || product.price)) * 100)}%
                  </Badge>
                  {product.flashSaleEnds && (
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 flex items-center gap-2 w-fit transition-opacity duration-300 group-hover:opacity-0">
                      <FlashSaleTimer
                        endTime={product.flashSaleEnds}
                        variant="compact"
                        className="scale-75 origin-left"
                      />
                    </div>
                  )}
                </div>
              )}
              {!isProductOnFlashSale(product) && product.originalPrice && (
                <Badge variant="destructive" className="w-fit px-3 py-1 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/30">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </Badge>
              )}
            </div>

            {/* Wishlist Button */}
            <div className="absolute top-3 right-3 z-10">
              <WishlistButton
                item={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.thumbnail || product.images[0] || "",
                  category: product.category,
                  description: product.description,
                  stock: product.stock,
                  isFlashSale: product.isFlashSale,
                  flashSalePrice: product.flashSalePrice,
                  flashSaleEnds: product.flashSaleEnds,
                }}
                size="sm"
              />
            </div>

            {/* Quick Actions */}
            <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-300 z-10">
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4" />
                {renderTranslation("products.detail.add_to_cart_btn")}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="shrink-0 bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10"
              >
                <Eye className="w-4 h-4 text-white" />
              </Button>
            </div>
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
