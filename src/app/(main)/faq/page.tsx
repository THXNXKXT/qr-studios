"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown, MessageSquare, Zap, ShieldCheck, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function FAQPage() {
  const { t } = useTranslation("home");
  const faqs = [
    {
      category: t("misc.faq.categories.general", { defaultValue: "General" }),
      questions: [
        {
          q: t("misc.faq.items.scripts.q", { defaultValue: "FiveM Scripts ของ QR Studio รองรับ Framework ไหนบ้าง?" }),
          a: t("misc.faq.items.scripts.a", { defaultValue: "สคริปต์ส่วนใหญ่ของเรารองรับทั้ง ESX และ QB-Core โดยจะมีการระบุไว้ในรายละเอียดสินค้าแต่ละรายการอย่างชัดเจน" }),
        },
        {
          q: t("misc.faq.items.updates.q", { defaultValue: "สินค้าที่ซื้อไปแล้วจะได้รับอัพเดทฟรีหรือไม่?" }),
          a: t("misc.faq.items.updates.a", { defaultValue: "ใช่ครับ! เมื่อคุณซื้อสินค้าไปแล้ว คุณจะได้รับสิทธิ์ดาวน์โหลดเวอร์ชันอัพเดทใหม่ๆ ฟรีตลอดอายุการใช้งานผ่านหน้า Dashboard ของคุณ" }),
        },
        {
          q: t("misc.faq.items.install.q", { defaultValue: "มีบริการติดตั้งให้ด้วยหรือไม่?" }),
          a: t("misc.faq.items.install.a", { defaultValue: "เรามีคู่มือการติดตั้ง (Documentation) อย่างละเอียดให้ทุกสินค้า หากติดปัญหาการติดตั้งสามารถสอบถามผ่าน Discord Support ได้ฟรี" }),
        },
      ],
    },
    {
      category: t("misc.faq.categories.licensing", { defaultValue: "Licensing" }),
      questions: [
        {
          q: t("misc.faq.items.license_limit.q", { defaultValue: "License Key หนึ่งชุดสามารถใช้ได้กี่เซิร์ฟเวอร์?" }),
          a: t("misc.faq.items.license_limit.a", { defaultValue: "โดยปกติ License Key จะผูกติดกับ IP Address ชุดเดียว หากต้องการย้ายเครื่องหรือเปลี่ยน IP สามารถทำได้ด้วยตนเองผ่านหน้า Dashboard ตามโควตาที่กำหนด" }),
        },
        {
          q: t("misc.faq.items.license_security.q", { defaultValue: "ระบบความปลอดภัยของ License เป็นอย่างไร?" }),
          a: t("misc.faq.items.license_security.a", { defaultValue: "เราใช้ระบบ IP Whitelist ในการตรวจสอบสิทธิ์การใช้งาน เพื่อป้องกันการนำสคริปต์ไปใช้โดยไม่ได้รับอนุญาต" }),
        },
      ],
    },
    {
      category: t("misc.faq.categories.payment", { defaultValue: "Payment" }),
      questions: [
        {
          q: t("misc.faq.items.delivery.q", { defaultValue: "ชำระเงินแล้วจะได้รับสินค้าเมื่อไหร่?" }),
          a: t("misc.faq.items.delivery.a", { defaultValue: "ระบบของเราทำงานแบบอัตโนมัติ 100% หลังจากการชำระเงินเสร็จสมบูรณ์ คุณจะได้รับ License และลิงก์ดาวน์โหลดทันที" }),
        },
        {
          q: t("misc.faq.items.payment_methods.q", { defaultValue: "รองรับการชำระเงินช่องทางไหนบ้าง?" }),
          a: t("misc.faq.items.payment_methods.a", { defaultValue: "เราเตอร์รองรับการชำระผ่าน Stripe (บัตรเครดิต/เดบิต), PromptPay QR Code และการใช้ยอดเงินคงเหลือในบัญชี" }),
        },
      ],
    },
  ];
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");

  const toggleFAQ = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen pt-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-red-900/10 via-black to-black pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t("misc.faq.back_home")}
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-xl">
              <HelpCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">{t("misc.faq.title")}</h1>
              <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">{t("misc.faq.subtitle")}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-12">
          {faqs.map((category, catIndex) => (
            <div key={category.category} className="space-y-6">
              <h2 className="text-xl font-black text-red-500 uppercase tracking-widest flex items-center gap-3 ml-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                {category.category}
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {category.questions.map((faq, qIndex) => {
                  const index = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === index;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: qIndex * 0.05 }}
                    >
                      <Card className={cn(
                        "border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300 overflow-hidden",
                        isOpen ? "border-red-500/30 ring-1 ring-red-500/20" : "hover:border-white/10"
                      )}>
                        <button
                          onClick={() => toggleFAQ(index)}
                          className="w-full p-6 text-left flex items-center justify-between gap-4 group"
                        >
                          <span className={cn(
                            "text-lg font-bold transition-colors",
                            isOpen ? "text-red-400" : "text-gray-200 group-hover:text-white"
                          )}>
                            {faq.q}
                          </span>
                          <ChevronDown className={cn(
                            "w-5 h-5 text-gray-500 transition-transform duration-300",
                            isOpen ? "rotate-180 text-red-500" : ""
                          )} />
                        </button>
                        
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                              <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <Card className="p-8 md:p-12 border-white/5 bg-linear-to-br from-red-600/10 to-transparent backdrop-blur-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <MessageSquare className="w-12 h-12 text-red-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{t("misc.faq.no_answer_title")}</h3>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto font-medium">
              {t("misc.faq.no_answer_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 font-black uppercase tracking-widest h-14">
                {t("misc.faq.join_discord")}
              </Button>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 text-white rounded-xl px-8 font-black uppercase tracking-widest h-14">
                  {t("misc.faq.contact_support")}
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
