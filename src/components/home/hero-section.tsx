"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Code, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { useIsMounted } from "@/hooks/useIsMounted";

export const HeroSection = memo(function HeroSection() {
  const { t } = useTranslation("common");
  const mounted = useIsMounted();

  const renderTranslation = (key: string) => {
    if (!mounted) return "";
    return t(key);
  };

  if (!mounted) return null;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/Query.Design.jpg"
          alt="QR Studio Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-400/20 rounded-full blur-[128px] animate-pulse delay-1000" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="container mx-auto relative z-10 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              {renderTranslation("hero.badge")}
            </span>
          </motion.div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
              {renderTranslation("hero.title_1")}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-red-400 to-red-700 animate-gradient">
                {renderTranslation("hero.title_2")}
              </span>
            </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-xl text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            {renderTranslation("hero.description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/products">
              <Button size="xl" className="group bg-red-600 hover:bg-red-500 text-white border-none shadow-2xl shadow-red-600/40 h-14 px-8 text-base font-black rounded-2xl">
                {renderTranslation("hero.cta_shop")}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/commission">
              <Button variant="secondary" size="xl" className="h-14 px-8 text-base font-bold rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md">
                <Palette className="w-5 h-5 mr-2 text-red-500" />
                {renderTranslation("hero.cta_ui")}
              </Button>
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              { icon: Code, label: renderTranslation("hero.features.script.title"), desc: renderTranslation("hero.features.script.desc") },
              { icon: Palette, label: renderTranslation("hero.features.ui.title"), desc: renderTranslation("hero.features.ui.desc") },
              { icon: Sparkles, label: renderTranslation("hero.features.update.title"), desc: renderTranslation("hero.features.update.desc") },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="font-semibold text-white">{feature.label}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator - Removed because it looks like a loading dot */}
      {/* 
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: 99999 }}
            className="w-1.5 h-1.5 rounded-full bg-red-400"
          />
        </div>
      </motion.div>
      */}
    </section>
  );
});
