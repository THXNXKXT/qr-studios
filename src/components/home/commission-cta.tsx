"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Palette, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

const benefits = [
  "ออกแบบตามความต้องการ",
  "รองรับทุก Framework",
  "แก้ไขฟรีไม่จำกัด",
  "ส่งมอบงานตรงเวลา",
];

export function CommissionCTA() {
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
              <div className="shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-red-600 to-red-400 flex items-center justify-center">
                  <Palette className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  ต้องการ UI แบบเฉพาะ?
                </h2>
                <p className="text-gray-400 mb-6">
                  เราพร้อมออกแบบและพัฒนา UI ตามความต้องการของคุณ 
                  ด้วยทีมงานมืออาชีพที่มีประสบการณ์
                </p>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      <span className="text-sm text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Link href="/commission">
                  <Button size="lg" className="group">
                    สั่งทำ UI เลย
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
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
