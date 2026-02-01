"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Badge } from "@/components/ui";
import { ProductCard } from "@/components/product";
import { productsApi } from "@/lib/api";
import type { Product } from "@/types";
import { createLogger } from "@/lib/logger";

const featuredProductsLogger = createLogger("home:featured-products");

export function FeaturedProducts() {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchFeatured = useCallback(async () => {
    try {
      const { data } = await productsApi.getFeatured();
      if (data && (data as any).success) {
        setProducts((data as any).data || []);
      }
    } catch (err) {
      featuredProductsLogger.error('Failed to fetch featured products', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const renderedProducts = useMemo(() => products.slice(0, 4).map((product, index) => (
    <ProductCard key={product.id} product={product} index={index} />
  )), [products]);

  const renderTranslation = (key: string) => {
    if (!mounted) return "";
    return t(key);
  };

  if (!mounted) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-[128px]" />
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16"
        >
          <div className="space-y-4">
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1 text-[10px] uppercase font-black tracking-widest">
              <Sparkles className="w-3 h-3 mr-1.5" />
              {renderTranslation("featured.handpicked")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {renderTranslation("featured.title")}
            </h2>
            <p className="text-gray-400 text-base max-w-xl">
              {renderTranslation("featured.desc")}
            </p>
          </div>
          <Link href="/products" className="group">
            <Button variant="secondary" size="lg" className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl px-6 h-12 font-bold transition-all text-sm">
              <span>{renderTranslation("featured.view_all_products")}</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array.from({ length: Math.max(0, 4) }).map((_, i) => (
              <div key={i} className="aspect-video rounded-3xl bg-white/5 animate-pulse" />
            ))
          ) : (
            renderedProducts
          )}
        </div>
      </div>
    </section>
  );
}
