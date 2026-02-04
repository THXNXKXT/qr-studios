"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Package, Key, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/utils";
import { statsApi } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const statsLogger = createLogger("home:stats");

export function StatsSection() {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);
  const [siteStats, setSiteStats] = useState({
    totalVisitors: 0,
    totalProducts: 0,
    totalLicenses: 0,
    totalMembers: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    const fetchStats = async () => {
      try {
        const { data: response, error } = await statsApi.getPublicStats();
        
        if (response && typeof response === 'object' && response.data) {
          const statsData = response.data;
          setSiteStats({
            totalVisitors: Number(statsData.totalVisitors) || 0,
            totalProducts: Number(statsData.totalProducts) || 0,
            totalLicenses: Number(statsData.totalLicenses) || 0,
            totalMembers: Number(statsData.totalMembers) || 0
          });
        }
        
        if (error && (error.message || error.status)) {
          statsLogger.error('Stats API Error', { error: error.message || 'Unknown error', status: error.status });
        }
      } catch (err) {
        statsLogger.error('Stats Fetch Error', { error: err });
      }
    };
    fetchStats();
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { icon: Eye, label: mounted ? t("stats.visitors") : "", value: siteStats.totalVisitors, suffix: "+" },
    { icon: Package, label: mounted ? t("stats.products") : "", value: siteStats.totalProducts, suffix: "" },
    { icon: Key, label: mounted ? t("stats.licenses") : "", value: siteStats.totalLicenses, suffix: "+" },
    { icon: Users, label: mounted ? t("stats.members") : "", value: siteStats.totalMembers, suffix: "+" },
  ];

  return (
    <section className="py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-red-900/10 to-transparent" />

      <div className="container mx-auto relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-linear-to-br from-red-600/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative p-6 rounded-4xl bg-white/2 backdrop-blur-xl border border-white/5 text-center hover:border-red-500/30 transition-all duration-500 group shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500 border border-white/5 shadow-inner">
                    <Icon className="w-6 h-6 text-red-500 group-hover:text-red-400 transition-colors" />
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tighter group-hover:text-red-500 transition-colors duration-500">
                    {formatNumber(stat.value)}{stat.suffix}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 group-hover:text-gray-400 transition-colors">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
