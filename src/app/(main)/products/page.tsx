"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Grid, 
  LayoutGrid, 
  Sparkles, 
  TrendingUp, 
  Clock,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui";
import { 
  ProductCard, 
  RecentlyViewed, 
  ProductsHero, 
  ProductFilters, 
  ProductGridSkeleton 
} from "@/components/product";
import { useCartStore } from "@/store/cart";
import { productsApi } from "@/lib/api";
import type { Product } from "@/types";
import { useTranslation } from "react-i18next";

function ProductsContent() {
  const { t } = useTranslation("home");
  const searchParams = useSearchParams();

  const categories = [
    { value: "all", label: t("products.categories.all"), icon: LayoutGrid },
    { value: "SCRIPT", label: t("products.categories.script"), icon: Sparkles },
    { value: "UI", label: t("products.categories.ui"), icon: Grid },
    { value: "BUNDLE", label: t("products.categories.bundle"), icon: TrendingUp },
  ];

  const sortOptions = [
    { value: "newest", label: t("products.sort.newest"), icon: Clock },
    { value: "popular", label: t("products.sort.popular"), icon: TrendingUp },
    { value: "price-low", label: t("products.sort.price_low"), icon: ChevronDown },
    { value: "price-high", label: t("products.sort.price_high"), icon: ChevronDown },
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category")?.toUpperCase() || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [showFilters, setShowFilters] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  // Sync with URL params on mount
  useEffect(() => {
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    if (category) setSelectedCategory(category.toUpperCase());
    if (search) setSearchQuery(search);
    if (sort) setSortBy(sort);
  }, [searchParams]);

  const fetchProducts = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const { data } = await productsApi.getAll({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: searchQuery || undefined,
        sort: sortBy
      });
      
      if (data && (data as any).success) {
        setProducts((data as any).data || []);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(products.length === 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts, products.length]);

  const featuredProduct = useMemo(() => products.find(p => p.isFeatured), [products]);

  const handleAddToCart = useCallback((product: Product) => {
    addItem(product);
  }, [addItem]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
  }, []);

  return (
    <div className="min-h-screen pt-16">
      <ProductsHero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        featuredProduct={featuredProduct}
        onAddToCart={handleAddToCart}
      />

      <ProductFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        sortOptions={sortOptions}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <ProductGridSkeleton />
          ) : (
            <AnimatePresence mode="wait">
              {products.length > 0 ? (
                <motion.div
                  key={selectedCategory + sortBy + searchQuery}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Search className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {t("products.no_products")}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {t("products.no_products_desc")}
                  </p>
                  <Button onClick={handleClearFilters} className="h-11 px-6 rounded-xl font-bold text-sm">
                    {t("products.view_all")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-4">
          <RecentlyViewed limit={4} />
        </div>
      </section>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
