"use client";

import { motion } from "framer-motion";
import { Users, Package, Key, Eye } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const stats = [
  { icon: Eye, label: "ผู้เข้าชม", value: 125430, suffix: "+" },
  { icon: Package, label: "สินค้า", value: 48, suffix: "" },
  { icon: Key, label: "License", value: 3250, suffix: "+" },
  { icon: Users, label: "สมาชิก", value: 1890, suffix: "+" },
];

export function StatsSection() {
  return (
    <section className="py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-red-900/10 to-transparent" />

      <div className="container mx-auto relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-linear-to-br from-red-600/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-center hover:border-red-500/50 transition-colors">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <stat.icon className="w-7 h-7 text-red-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {formatNumber(stat.value)}{stat.suffix}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
