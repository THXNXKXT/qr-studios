"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Eye } from "lucide-react";
import { Button, Badge, Card, WishlistButton, StockCounter, ReviewStars } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const addToRecentlyViewed = useRecentlyViewedStore((state) => state.addItem);

  const categoryLabels = {
    script: "Script",
    ui: "UI",
    bundle: "Bundle",
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleClick = () => {
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      category: categoryLabels[product.category],
    });
  };

  // Mock stock based on product id (deterministic to avoid hydration mismatch)
  const stock = useMemo(() => {
    const hash = product.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 25) + 5; // 5-30 range
  }, [product.id]);

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
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-red-400">
                    {product.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {product.isNew && (
                <Badge variant="success">ใหม่</Badge>
              )}
              {product.originalPrice && (
                <Badge variant="destructive">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </Badge>
              )}
            </div>

            {/* Wishlist Button */}
            <div className="absolute top-3 right-3">
              <WishlistButton
                item={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] || "",
                  category: categoryLabels[product.category],
                }}
                size="sm"
              />
            </div>

            {/* Quick Actions */}
            <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4" />
                เพิ่มลงตะกร้า
              </Button>
              <Button variant="secondary" size="icon" className="shrink-0">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors line-clamp-1">
              {product.name}
            </h3>

            <p className="text-sm text-gray-400 line-clamp-2">
              {product.description}
            </p>

            {/* Rating & Stock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReviewStars rating={product.rating} size="sm" />
                <span className="text-sm text-gray-500">
                  ({product.reviewCount})
                </span>
              </div>
              <StockCounter stock={stock} showIcon={false} />
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-400">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
