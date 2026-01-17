"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Key, Shield, Zap, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui";

export default function LicensePolicyPage() {
  const { t } = useTranslation("home");
  const sections = [
    {
      title: t("legal.license.sections.s1.title"),
      content: t("legal.license.sections.s1.content"),
    },
    {
      title: t("legal.license.sections.s2.title"),
      content: t("legal.license.sections.s2.content"),
    },
    {
      title: t("legal.license.sections.s3.title"),
      content: t("legal.license.sections.s3.content"),
    },
    {
      title: t("legal.license.sections.s4.title"),
      content: t("legal.license.sections.s4.content"),
    },
    {
      title: t("legal.license.sections.s5.title"),
      content: t("legal.license.sections.s5.content"),
    },
  ];
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
            {t("legal.terms.back")}
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-xl">
              <Key className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">{t("legal.license.title")}</h1>
              <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">{t("legal.license.subtitle")}</p>
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
              {t("legal.license.hero_desc")}
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

            <div className="mt-16 pt-8 border-t border-white/5">
              <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/10 flex items-start gap-4">
                <Shield className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                <div>
                  <p className="text-white font-bold mb-1 uppercase tracking-tight text-sm">{t("legal.license.protection_title")}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {t("legal.license.protection_desc")}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
