"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { useIsMounted } from "@/hooks/useIsMounted";
import { ProductCard } from "./product-card";
import type { Product, ProductCategory } from "@/types";

interface RecentlyViewedProps {
  limit?: number;
  excludeId?: string;
}

export function RecentlyViewed({ limit = 4, excludeId }: RecentlyViewedProps) {
  const { t } = useTranslation("home");
  const { items } = useRecentlyViewedStore();
  const isMounted = useIsMounted();

  const filteredItems = useMemo(() => 
    items
      .filter((item) => item.id !== excludeId)
      .slice(0, limit),
    [items, excludeId, limit]
  );

  if (!isMounted) return null;

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
          <ProductCard 
            key={item.id} 
            product={{
              ...item,
              thumbnail: item.image,
              images: [item.image],
              description: item.description,
              rating: item.rating,
              reviewCount: item.reviewCount,
              isActive: true,
              createdAt: new Date(item.viewedAt),
              updatedAt: new Date(item.viewedAt),
              features: [],
              tags: [],
              category: item.category as ProductCategory
            } as Product} 
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
