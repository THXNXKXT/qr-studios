"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useWishlistStore } from "@/store/wishlist";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addToCart = useCartStore((state) => state.addItem);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      images: [item.image],
      description: "",
      category: "script",
      rating: 0,
      reviewCount: 0,
      features: [],
      tags: [],
      stock: 99,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
            <Heart className="w-12 h-12 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ยังไม่มีรายการโปรด
          </h1>
          <p className="text-gray-400 mb-6">
            เพิ่มสินค้าที่ชอบลงในรายการโปรดเพื่อดูภายหลัง
          </p>
          <Link href="/products">
            <Button>
              <ShoppingCart className="w-5 h-5" />
              เลือกดูสินค้า
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">รายการโปรด</h1>
            <p className="text-gray-400">
              คุณมี {items.length} รายการในรายการโปรด
            </p>
          </div>
          <Button variant="secondary" onClick={clearWishlist}>
            <Trash2 className="w-4 h-4" />
            ล้างทั้งหมด
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
                <Card className="group overflow-hidden hover:border-red-500/50 transition-all">
                  <div className="relative aspect-video">
                    <Image
                      src={item.image || "/images/placeholder.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

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
                        เพิ่มลงตะกร้า
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
              ดูสินค้าเพิ่มเติม
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
