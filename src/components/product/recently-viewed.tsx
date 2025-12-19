"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { Card } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface RecentlyViewedProps {
  limit?: number;
  excludeId?: string;
}

export function RecentlyViewed({ limit = 4, excludeId }: RecentlyViewedProps) {
  const { items } = useRecentlyViewedStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filteredItems = items
    .filter((item) => item.id !== excludeId)
    .slice(0, limit);

  if (filteredItems.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">สินค้าที่เพิ่งดู</h2>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          ดูทั้งหมด
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={`/products/${item.id}`}>
              <Card className="group overflow-hidden hover:border-red-500/50 transition-all">
                <div className="relative aspect-video">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.category}</p>
                  <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-red-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-red-400 font-semibold text-sm mt-1">
                    {formatPrice(item.price)}
                  </p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
