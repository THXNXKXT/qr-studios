"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ArrowRight, ImageOff } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { WishlistSkeleton } from "@/components/dashboard/wishlist-skeleton";
import { useWishlistStore, type WishlistItem } from "@/store/wishlist";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { useIsMounted } from "@/hooks/useIsMounted";
import { getAuthToken } from "@/lib/auth-helper";
import { useTranslation } from "react-i18next";
import { formatPrice } from "@/lib/utils";
import type { ProductCategory } from "@/types";

const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";

export default function WishlistPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced } = useAuth();
  const { items, loading: wishlistLoading, fetchWishlist, removeItem, clearWishlist } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addItem);
  const mounted = useIsMounted();

  const handleAddToCart = useCallback((item: WishlistItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      images: item.image ? [item.image] : [],
      description: item.description || "",
      category: (item.category as ProductCategory) || "SCRIPT",
      isFlashSale: item.isFlashSale,
      flashSalePrice: item.flashSalePrice,
      flashSaleEnds: item.flashSaleEnds,
      rating: 0,
      reviewCount: 0,
      features: [],
      tags: [],
      stock: item.stock,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, [addToCart]);

  useEffect(() => {
    async function initWishlist() {
      const token = getAuthToken();

      // If auth is still working, wait for it
      if (!isSynced && !user?.id && token) return;

      // If we have a user or at least a token, fetch the wishlist
      if (user?.id || token) {
        await fetchWishlist();
      }
    }

    initWishlist();
  }, [user?.id, isSynced, fetchWishlist]);

  // Handle redirect in useEffect to avoid react-hooks/immutability error
  useEffect(() => {
    if (!user && !authLoading && !getAuthToken()) {
      if (typeof window !== 'undefined') {
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      }
    }
  }, [user, authLoading]);

  const renderTranslation = (key: string, options?: Record<string, unknown>): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  // Use optimistic loading check
  const isAuthInitializing = !isSynced && !user?.id && !!getAuthToken();
  const isLoading = (authLoading || isAuthInitializing || (wishlistLoading && items.length === 0) || !mounted) && !user;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white mb-2">{renderTranslation("nav.wishlist")}</h1>
              <p className="text-gray-400">{renderTranslation("common.loading")}</p>
            </div>
            <Button variant="secondary" disabled>
              <Trash2 className="w-4 h-4" />
              {renderTranslation("common.delete")}
            </Button>
          </div>

          <WishlistSkeleton />
        </div>
      </div>
    );
  }

  // Robust redirect logic - now handled in useEffect above
  if (!user && !authLoading && !getAuthToken()) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
            <Heart className="w-12 h-12 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {renderTranslation("dashboard.wishlist.empty_title")}
          </h1>
          <p className="text-gray-400 mb-6">
            {renderTranslation("dashboard.wishlist.empty_desc")}
          </p>
          <Link href="/products">
            <Button>
              <ShoppingCart className="w-5 h-5" />
              {renderTranslation("dashboard.wishlist.shop_now")}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{renderTranslation("nav.wishlist")}</h1>
            <p className="text-gray-400">
              {renderTranslation("dashboard.wishlist.items_count", { count: items.length })}
            </p>
          </div>
          <Button variant="secondary" onClick={clearWishlist}>
            <Trash2 className="w-4 h-4" />
            {renderTranslation("dashboard.wishlist.clear_all")}
          </Button>
        </motion.div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden border-white/5 hover:border-red-500/50 bg-white/5 transition-all duration-300">
                  <div className="relative aspect-video">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={index < 4}
                        placeholder="blur"
                        blurDataURL={blurDataURL}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('image-error');
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                        <ImageOff className="w-10 h-10 text-gray-600 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">No Image</span>
                      </div>
                    )}
                    {/* Fallback for failed images */}
                    <div className="absolute inset-0 flex-col items-center justify-center bg-white/5 image-error hidden">
                      <ImageOff className="w-10 h-10 text-gray-600 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">No Image</span>
                    </div>
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>

                    {/* Category */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <Link href={`/products/${item.id}`}>
                      <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-400">
                        {formatPrice(item.price)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {renderTranslation("products.detail.add_to_cart_btn")}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Continue Shopping */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link href="/products">
            <Button variant="secondary" size="lg" className="group">
              {renderTranslation("cart.continue_shopping")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
