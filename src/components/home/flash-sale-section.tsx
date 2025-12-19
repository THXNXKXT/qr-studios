"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, ShoppingCart, ArrowRight, Clock, Flame } from "lucide-react";
import { Button, Card, Badge, FlashSaleTimer, WishlistButton } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { mockProducts } from "@/data/products";

// Flash sale ends in 24 hours from now
const flashSaleEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Get random products for flash sale with discounts
const flashSaleProducts = mockProducts.slice(0, 4).map((product) => ({
  ...product,
  originalPrice: product.price,
  price: Math.round(product.price * 0.6), // 40% off
  discount: 40,
}));

export function FlashSaleSection() {
  const addItem = useCartStore((state) => state.addItem);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (product: (typeof flashSaleProducts)[0]) => {
    addItem(product);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-red-950/50 via-black to-orange-950/30" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
            <Flame className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-red-400 font-semibold">Flash Sale</span>
            <Flame className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ลดกระหน่ำ{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 via-orange-400 to-yellow-400">
              สูงสุด 40%
            </span>
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            โปรโมชั่นพิเศษ! รีบคว้าก่อนหมดเวลา สินค้าคุณภาพในราคาสุดพิเศษ
          </p>

          {/* Timer */}
          {mounted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-red-400" />
                <span className="text-gray-400 text-sm">สิ้นสุดใน</span>
                <FlashSaleTimer endTime={flashSaleEndTime} variant="compact" />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {flashSaleProducts.map((product, index) => (
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
                  <Badge variant="destructive" className="gap-1 animate-pulse">
                    <Zap className="w-3 h-3" />
                    -{product.discount}%
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-red-400">
                            {product.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-400 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-red-400">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  </div>

                  {/* Progress Bar - Stock */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">ขายแล้ว 67%</span>
                      <span className="text-orange-400">เหลือ 12 ชิ้น</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "67%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-linear-to-r from-red-500 to-orange-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Add to Cart */}
                  <Button
                    size="sm"
                    className="w-full group/btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                    เพิ่มลงตะกร้า
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/products?sale=true">
            <Button variant="secondary" size="lg" className="group">
              ดูสินค้าลดราคาทั้งหมด
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
