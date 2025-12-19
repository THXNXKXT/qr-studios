"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { ProductCard } from "@/components/product";
import { getFeaturedProducts } from "@/data/products";

export function FeaturedProducts() {
  const products = getFeaturedProducts();

  return (
    <section className="py-20 relative">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              สินค้าแนะนำ
            </h2>
            <p className="text-gray-400">
              Script และ UI ยอดนิยมที่ได้รับความไว้วางใจจากผู้ใช้งาน
            </p>
          </div>
          <Link href="/products">
            <Button variant="outline" className="group">
              ดูทั้งหมด
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
