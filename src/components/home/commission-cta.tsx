"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Palette, CheckCircle, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Badge } from "@/components/ui";
import { useIsMounted } from "@/hooks/useIsMounted";

export function CommissionCTA() {
  const { t } = useTranslation("common");
  const mounted = useIsMounted();

  const benefits = [
    t("commission.benefits.custom"),
    t("commission.benefits.framework"),
    t("commission.benefits.unlimited"),
    t("commission.benefits.ontime"),
  ];
  const renderTranslation = (key: string) => {
    if (!mounted) return "";
    return t(key);
  };

  if (!mounted) return null;

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-r from-red-900/30 via-red-600/20 to-red-900/30" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="container mx-auto relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Icon */}
              <div className="shrink-0 relative group">
                <div className="absolute -inset-4 bg-red-600/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-24 h-20 rounded-3xl bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center shadow-2xl shadow-red-600/40 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 border border-white/10">
                  <Palette className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 mb-4 px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                  {renderTranslation("commission.badge")}
                </Badge>
                <h2 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tighter">
                  {renderTranslation("commission.title")}
                </h2>
                <p className="text-gray-400 text-base mb-8 leading-relaxed">
                  {renderTranslation("commission.desc")}
                </p>

                {/* Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 group/item">
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover/item:bg-red-500 group-hover/item:border-red-500 transition-all duration-300">
                        <CheckCircle className="w-3.5 h-3.5 text-red-500 group-hover/item:text-white transition-colors" />
                      </div>
                      <span className="text-sm font-bold text-gray-300 group-hover/item:text-white transition-colors">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Link href="/commission">
                  <Button size="xl" className="group bg-red-600 hover:bg-red-500 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-red-600/20 transition-all text-sm">
                    <span>{renderTranslation("commission.cta")}</span>
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
