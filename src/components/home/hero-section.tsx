"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Code, Palette } from "lucide-react";
import { Button } from "@/components/ui";

export function HeroSection() {
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
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              แหล่งรวม Script & UI คุณภาพสูง
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
          >
            ยกระดับเซิร์ฟเวอร์ของคุณ
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 to-red-600">
              ด้วย QR STUDIO
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            พบกับ Script และ UI สำหรับ FiveM ที่ออกแบบมาอย่างพิถีพิถัน 
            พร้อมบริการรับทำ UI ตามความต้องการของคุณ
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/products">
              <Button size="xl" className="group">
                ดูสินค้าทั้งหมด
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/commission">
              <Button variant="secondary" size="xl">
                <Palette className="w-5 h-5" />
                รับทำ UI
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
              { icon: Code, label: "Script คุณภาพ", desc: "โค้ดสะอาด ประสิทธิภาพสูง" },
              { icon: Palette, label: "UI สวยงาม", desc: "ดีไซน์ทันสมัย ใช้งานง่าย" },
              { icon: Sparkles, label: "อัพเดทฟรี", desc: "รับอัพเดทตลอดชีพ" },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-semibold text-white">{feature.label}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-red-400"
          />
        </div>
      </motion.div>
    </section>
  );
}
