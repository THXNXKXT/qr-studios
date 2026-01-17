"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui";

export default function PrivacyPage() {
  const { t } = useTranslation("home");
  const sections = [
    {
      title: t("legal.privacy.sections.s1.title"),
      content: t("legal.privacy.sections.s1.content"),
    },
    {
      title: t("legal.privacy.sections.s2.title"),
      content: t("legal.privacy.sections.s2.content"),
    },
    {
      title: t("legal.privacy.sections.s3.title"),
      content: t("legal.privacy.sections.s3.content"),
    },
    {
      title: t("legal.privacy.sections.s4.title"),
      content: t("legal.privacy.sections.s4.content"),
    },
    {
      title: t("legal.privacy.sections.s5.title"),
      content: t("legal.privacy.sections.s5.content"),
    },
    {
      title: t("legal.privacy.sections.s6.title"),
      content: t("legal.privacy.sections.s6.content"),
    },
    {
      title: t("legal.privacy.sections.s7.title"),
      content: t("legal.privacy.sections.s7.content"),
    },
    {
      title: t("legal.privacy.sections.s8.title"),
      content: t("legal.privacy.sections.s8.content"),
    },
    {
      title: t("legal.privacy.sections.s9.title"),
      content: t("legal.privacy.sections.s9.content"),
    },
    {
      title: t("legal.privacy.sections.s10.title"),
      content: t("legal.privacy.sections.s10.content"),
    },
  ];
  return (
    <div className="min-h-screen pt-20 relative overflow-hidden">
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
            {t("legal.terms.back")}
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">{t("legal.privacy.title")}</h1>
              <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">{t("legal.privacy.subtitle")}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 md:p-12 border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
            
            <p className="text-gray-400 text-lg mb-12 leading-relaxed border-l-4 border-red-600 pl-6 py-2">
              {t("legal.privacy.hero_desc")}
            </p>

            <div className="space-y-10">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="group"
                >
                  <h2 className="text-xl font-black text-white mb-4 flex items-center gap-3 group-hover:text-red-400 transition-colors">
                    <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                    {section.title}
                  </h2>
                  <p className="text-gray-400 leading-relaxed pl-4.5">
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-white/5 text-center">
              <p className="text-sm text-gray-500">
                {t("legal.privacy.contact_hint")} <span className="text-red-400 font-bold">privacy@qrstudio.com</span>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
