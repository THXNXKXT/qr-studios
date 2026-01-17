"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, CreditCard, Smartphone, Wallet, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useTranslation, Trans } from "react-i18next";
import { useMemo, useState, useEffect } from "react";

export default function PaymentGuidePage() {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderTranslation = (key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  const steps = useMemo(() => [
    {
      title: renderTranslation("payment_guide.steps.step1.title"),
      content: renderTranslation("payment_guide.steps.step1.content"),
      icon: Zap,
    },
    {
      title: renderTranslation("payment_guide.steps.step2.title"),
      content: renderTranslation("payment_guide.steps.step2.content"),
      icon: CheckCircle2,
    },
    {
      title: renderTranslation("payment_guide.steps.step3.title"),
      content: renderTranslation("payment_guide.steps.step3.content"),
      icon: Wallet,
    },
    {
      title: renderTranslation("payment_guide.steps.step4.title"),
      content: renderTranslation("payment_guide.steps.step4.content"),
      icon: ShieldCheck,
    },
  ], [mounted, t]);

  const paymentMethods = useMemo(() => [
    {
      name: "Stripe / Credit Card",
      desc: renderTranslation("checkout.pay_with_stripe"),
      icon: CreditCard,
    },
    {
      name: "PromptPay QR Code",
      desc: renderTranslation("payment_guide.steps.step3.content"),
      icon: Smartphone,
    },
    {
      name: "Account Balance",
      desc: renderTranslation("checkout.pay_with_balance"),
      icon: Wallet,
    },
  ], [mounted, t]);
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
            {renderTranslation("payment_guide.back")}
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-xl">
              <CreditCard className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">{renderTranslation("payment_guide.title")}</h1>
              <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">{renderTranslation("payment_guide.desc")}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* Steps */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-8 border-white/5 bg-black/40 backdrop-blur-xl h-full hover:border-red-500/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <step.icon className="w-10 h-10 text-red-500 mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.content}</p>
                </Card>
              </motion.div>
            ))}
          </section>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 md:p-12 border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
              <h2 className="text-2xl font-black text-white mb-10 uppercase tracking-tight flex items-center gap-3">
                <span className="w-1.5 h-8 bg-red-600 rounded-full" />
                {renderTranslation("payment_guide.methods_title")}
              </h2>

              <div className="grid grid-cols-1 gap-6">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/20 transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
                      <method.icon className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{method.name}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{method.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                <p className="text-gray-400 text-sm">
                  <Trans
                    i18nKey="payment_guide.support_msg"
                    components={[<Link key="0" href="/contact" className="text-red-400 font-bold hover:underline ml-1" />]}
                  />
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
