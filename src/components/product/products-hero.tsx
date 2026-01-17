"use client";

import { motion } from "framer-motion";
import { Sparkles, X, Search, ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Input, Card, Button } from "@/components/ui";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductsHeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  featuredProduct?: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductsHero({
  searchQuery,
  setSearchQuery,
  featuredProduct,
  onAddToCart,
}: ProductsHeroProps) {
  const { t } = useTranslation("home");
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-red-900/30 via-black to-black" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="absolute top-20 left-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-20 w-40 h-40 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" />
              {t("products.hero_badge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
              {t("products.title_1")}{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-red-400 to-red-600 animate-gradient">
                {t("products.title_2")}
              </span>
              <br />
              {t("products.title_3")}
            </h1>
            <p className="text-gray-400 text-base mb-8 max-w-md leading-relaxed">
              {t("products.hero_desc")}
            </p>

            <div className="relative max-w-md group">
              <div className="absolute -inset-1 bg-linear-to-r from-red-600 to-red-900 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
              <Input
                placeholder={t("products.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative pl-12 h-14 text-base bg-black/50 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 transition-all rounded-2xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          {featuredProduct && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="absolute -inset-4 bg-red-500/5 blur-3xl rounded-full animate-pulse" />
              <Card className="relative p-6 bg-black/40 backdrop-blur-xl border-white/5 group hover:border-red-500/30 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start gap-6 relative z-10">
                  <div className="relative w-40 h-40 rounded-2xl overflow-hidden bg-linear-to-br from-red-900/40 to-black shrink-0 border border-white/5 shadow-2xl">
                    {featuredProduct.images?.[0] ? (
                      <Image 
                        src={featuredProduct.images[0]} 
                        alt={featuredProduct.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                        <ImageOff className="w-12 h-12 text-gray-600 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="flex-1 py-1">
                    <Badge variant="success" className="mb-3 bg-red-500/20 text-red-400 border-red-500/30">
                      {t("products.featured_badge")}
                    </Badge>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                      {featuredProduct.name}
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-2 mb-6 leading-relaxed">
                      {featuredProduct.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t("products.start_at")}</span>
                        <span className="text-2xl font-black text-white group-hover:text-red-400 transition-colors tracking-tighter">
                          {formatPrice(featuredProduct.price)}
                        </span>
                      </div>
                      <Button onClick={() => onAddToCart(featuredProduct)} className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 px-5 h-11 rounded-xl font-black text-sm">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {t("products.buy_now")}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
