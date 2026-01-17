"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, ShoppingCart, MessageSquare, AlertCircle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export default function CheckoutCancelPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderTranslation = (key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-start justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[160px] opacity-50" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <Card className="p-8 md:p-10 text-center border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
          
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner group">
            <AlertCircle className="w-10 h-10 text-red-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
          </div>
          
          <h1 className="text-xl font-black text-white mb-2 tracking-tight">
            {renderTranslation("checkout.cancel.title")}
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed text-xs">
            {renderTranslation("checkout.cancel.desc")}
          </p>

          <div className="space-y-3">
            <Link href="/cart" className="block">
              <Button size="xl" className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-xl shadow-red-600/40 transition-all active:scale-95 group text-sm">
                {renderTranslation("checkout.cancel.back_to_cart")}
              </Button>
            </Link>
            <Link href="/products" className="block">
              <Button size="xl" className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black rounded-xl transition-all active:scale-95 group text-sm">
                {renderTranslation("checkout.cancel.shop_more")}
              </Button>
            </Link>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              {renderTranslation("checkout.cancel.back_dashboard")}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
