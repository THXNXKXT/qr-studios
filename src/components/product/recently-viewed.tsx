"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, ArrowRight, ImageOff, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { Card } from "@/components/ui";
import { formatPrice, getProductPrice, isProductOnFlashSale } from "@/lib/utils";

interface RecentlyViewedProps {
  limit?: number;
  excludeId?: string;
}

export function RecentlyViewed({ limit = 4, excludeId }: RecentlyViewedProps) {
  const { t } = useTranslation("home");
  const { items } = useRecentlyViewedStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredItems = useMemo(() => 
    items
      .filter((item) => item.id !== excludeId)
      .slice(0, limit),
    [items, excludeId, limit]
  );

  if (!mounted) return null;

  if (filteredItems.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-red-500" />
          </div>
          <h2 className="text-lg font-black text-white tracking-tight">{t("products.recently_viewed")}</h2>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors"
        >
          <span>{t("products.view_all")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
              <Card className="group overflow-hidden border-white/5 bg-white/2 hover:border-red-500/50 transition-all duration-300">
                <div className="relative aspect-video">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                      <ImageOff className="w-8 h-8 text-gray-600 mb-1" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{item.category}</p>
                  <h3 className="font-bold text-white text-xs line-clamp-1 group-hover:text-red-400 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between gap-1.5 mt-1">
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-red-500 font-black text-xs tracking-tighter">
                        {formatPrice(getProductPrice(item))}
                      </p>
                      {isProductOnFlashSale(item) && (
                        <p className="text-[8px] text-gray-500 line-through opacity-50 font-bold">
                          {formatPrice(item.price)}
                        </p>
                      )}
                    </div>

                    {/* Reward Points */}
                    {item.expectedPoints !== undefined && item.expectedPoints > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-yellow-400/5 border border-yellow-400/10">
                        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500/20" />
                        <span className="text-[8px] font-black text-yellow-500 tracking-tighter">
                          {item.expectedPoints.toLocaleString()} <span className="opacity-60">PTS</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
