"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, ShoppingCart, ArrowRight, Flame, Star, ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Card, Badge, FlashSaleTimer, WishlistButton, ReviewStars } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { formatPrice, getProductPrice, isProductOnFlashSale } from "@/lib/utils";
import { productsApi } from "@/lib/api";
import type { Product } from "@/types";

export const FlashSaleSection = memo(function FlashSaleSection() {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchFlashSale = useCallback(async () => {
    try {
      const { data } = await productsApi.getFlashSale();
      if (data && (data as any).success) {
        setProducts((data as any).data || []);
      }
    } catch (err) {
      console.error("Failed to fetch flash sale products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlashSale();
  }, [fetchFlashSale]);

  const handleAddToCart = useCallback((product: Product) => {
    addItem({
      ...product,
      isFlashSale: true, // Explicitly set since it's from the flash sale section
    });
  }, [addItem]);

  const flashSaleProducts = useMemo(() => products.slice(0, 4), [products]);

  const renderTranslation = (key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  if (!mounted) return null;

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-red-950/50 via-black to-red-900/30" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-red-600/10 border border-red-500/30 mb-6 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)] group">
            <Flame className="w-5 h-5 text-red-500 animate-pulse group-hover:scale-110 transition-transform" />
            <span className="text-red-500 font-black uppercase tracking-widest text-sm">Flash Sale</span>
            <Flame className="w-5 h-5 text-red-500 animate-pulse group-hover:scale-110 transition-transform" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            {renderTranslation("flash_sale.title")}{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-red-400 to-red-700 animate-gradient">
              {renderTranslation("flash_sale.up_to")} 40%
            </span>
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-10 leading-relaxed">
            {renderTranslation("flash_sale.desc")}
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loading ? (
          Array.from({ length: Math.max(0, 4) }).map((_, i) => (
            <div key={i} className="aspect-video rounded-3xl bg-white/5 animate-pulse" />
          ))
        ) : (
            flashSaleProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group overflow-hidden hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 relative">
                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="destructive" className="gap-1 animate-pulse px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      Flash Sale -{Math.round((1 - (product.flashSalePrice || product.price) / (product.originalPrice || product.price)) * 100)}%
                    </Badge>
                  </div>

                  {/* Wishlist */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton
                      item={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.images[0] || "",
                        category: product.category,
                        description: product.description || "",
                        stock: product.stock,
                      }}
                      size="sm"
                    />
                  </div>

                  {/* Image */}
                  <Link href={`/products/${product.id}`}>
                    <div className="relative aspect-video bg-linear-to-br from-red-900/50 to-black overflow-hidden">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
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
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Individual Timer */}
                      {product.flashSaleEnds && (
                        <div className="absolute bottom-3 left-3 right-3 z-10">
                          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{renderTranslation("flash_sale.ends_in")}</span>
                            <FlashSaleTimer 
                              endTime={product.flashSaleEnds} 
                              variant="compact" 
                              className="scale-90 origin-right"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-6 space-y-5">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-3">
        <ReviewStars rating={product.rating || 0} size="xs" />
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        {product.reviewCount || 0} {renderTranslation("flash_sale.reviews")}
                      </span>
                    </div>

                    {/* Price & Points */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black text-red-500 tracking-tighter">
                          {formatPrice(getProductPrice(product))}
                        </span>
                        {isProductOnFlashSale(product) && (
                          <span className="text-xs text-gray-500 line-through opacity-50 font-bold">
                            {formatPrice(product.price)}
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

                    {/* Progress Bar - Stock */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end text-[10px] uppercase font-black tracking-widest">
                        {product.stock === -1 ? (
                          <span className="text-red-400">{renderTranslation("flash_sale.in_stock")}</span>
                        ) : (
                          <span className="text-gray-500">{renderTranslation("flash_sale.limited_stock", { count: product.stock })}</span>
                        )}
                        <span className="text-gray-400">{product.stock === -1 ? renderTranslation("flash_sale.unlimited") : renderTranslation("flash_sale.limited")}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: product.stock === -1 ? "100%" : `${Math.min(100, Math.max(10, (product.stock / 50) * 100))}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.1 }}
                          className="h-full bg-linear-to-r from-red-600 via-red-500 to-red-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        />
                      </div>
                    </div>

                    {/* Add to Cart */}
                    <Button
                      size="lg"
                      className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-600/20 group/btn transition-all active:scale-95"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2 transition-transform group-hover/btn:scale-110 group-hover/btn:-rotate-12" />
                      <span>{renderTranslation("flash_sale.add_to_cart")}</span>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link href="/products?sale=true">
            <Button variant="secondary" size="xl" className="group h-12 px-8 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 font-bold transition-all text-sm">
              <span>{renderTranslation("flash_sale.view_all_promotions")}</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});
