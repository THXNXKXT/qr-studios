"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Grid, 
  LayoutGrid, 
  Sparkles, 
  TrendingUp, 
  Clock,
  Star,
  ShoppingCart,
  Filter,
  X,
  ChevronDown
} from "lucide-react";
import { Button, Input, Badge, Card } from "@/components/ui";
import { ProductCard, RecentlyViewed } from "@/components/product";
import { mockProducts, getProductsByCategory, getFeaturedProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

const categories = [
  { value: "all", label: "ทั้งหมด", icon: LayoutGrid, count: mockProducts.length },
  { value: "script", label: "Script", icon: Sparkles, count: mockProducts.filter(p => p.category === "script").length },
  { value: "ui", label: "UI", icon: Grid, count: mockProducts.filter(p => p.category === "ui").length },
  { value: "bundle", label: "Bundle", icon: TrendingUp, count: mockProducts.filter(p => p.category === "bundle").length },
];

const sortOptions = [
  { value: "newest", label: "ใหม่ล่าสุด", icon: Clock },
  { value: "popular", label: "ยอดนิยม", icon: TrendingUp },
  { value: "price-low", label: "ราคาต่ำ-สูง", icon: ChevronDown },
  { value: "price-high", label: "ราคาสูง-ต่ำ", icon: ChevronDown },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const filteredProducts = useMemo(() => {
    let products = getProductsByCategory(selectedCategory);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    switch (sortBy) {
      case "newest":
        products = [...products].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        break;
      case "popular":
        products = [...products].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "price-low":
        products = [...products].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        products = [...products].sort((a, b) => b.price - a.price);
        break;
    }

    return products;
  }, [searchQuery, selectedCategory, sortBy]);

  const featuredProduct = getFeaturedProducts()[0];

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Banner */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-red-900/30 via-black to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-20 w-40 h-40 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                สินค้าคุณภาพ
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                ค้นหา{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 to-red-600">
                  Script & UI
                </span>
                <br />
                ที่ใช่สำหรับคุณ
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                เลือกจากคอลเลกชันสินค้าคุณภาพสูงกว่า {mockProducts.length} รายการ
                พร้อมอัพเดทและซัพพอร์ตตลอดชีพ
              </p>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-white/5 border-white/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Right - Featured Product */}
            {featuredProduct && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hidden lg:block"
              >
                <Card className="p-6 bg-linear-to-br from-white/10 to-white/5 border-red-500/20">
                  <div className="flex items-start gap-4">
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-linear-to-br from-red-900/50 to-black shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-red-400">
                          {featuredProduct.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Badge variant="destructive" className="mb-2">แนะนำ</Badge>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {featuredProduct.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-white">{featuredProduct.rating}</span>
                        <span className="text-gray-500">({featuredProduct.reviewCount})</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {featuredProduct.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-red-400">
                          {formatPrice(featuredProduct.price)}
                        </span>
                        <Button size="sm" onClick={() => addItem(featuredProduct)}>
                          <ShoppingCart className="w-4 h-4" />
                          เพิ่มลงตะกร้า
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

      {/* Categories & Filters */}
      <section className="py-6 border-y border-white/10 bg-black/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      selectedCategory === cat.value
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                    <span className={`px-1.5 py-0.5 rounded-md text-xs ${
                      selectedCategory === cat.value
                        ? "bg-white/20"
                        : "bg-white/10"
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-black">
                    {opt.label}
                  </option>
                ))}
              </select>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Results Info */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-gray-400">
                แสดง <span className="text-white font-semibold">{filteredProducts.length}</span> รายการ
                {selectedCategory !== "all" && (
                  <span> ในหมวด <span className="text-red-400">{categories.find(c => c.value === selectedCategory)?.label}</span></span>
                )}
              </p>
            </div>
          </div>

          {/* Products */}
          <AnimatePresence mode="wait">
            {filteredProducts.length > 0 ? (
              <motion.div
                key={selectedCategory + sortBy}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  ไม่พบสินค้า
                </h3>
                <p className="text-gray-400 mb-6">
                  ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่
                </p>
                <Button onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                  ดูสินค้าทั้งหมด
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </section>

      {/* Recently Viewed */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <RecentlyViewed limit={4} />
        </div>
      </section>
    </div>
  );
}
