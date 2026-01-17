"use client";

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Loader2,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  Star
} from "lucide-react";
import { Button, Card, Confetti, useConfetti, Badge } from "@/components/ui";
import { checkoutApi } from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "react-i18next";

function CheckoutSuccessContent() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, verifyPayment, isVerifyingPayment, verifiedSessions } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const { items, clearCart } = useCartStore();
  const { isActive: showConfetti, trigger: triggerConfetti } = useConfetti();
  const verificationStarted = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderTranslation = (key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  const handleVerification = useCallback(async () => {
    if (!sessionId || verificationStarted.current) return;

    // Check if already verified in the current session state
    const alreadyVerified = useAuthStore.getState().verifiedSessions.includes(sessionId);
    if (alreadyVerified) {
      setStatus("success");
      return;
    }

    // If currently verifying from useAuth hook, just wait
    if (isVerifyingPayment) return;

    verificationStarted.current = true;
    const result = await verifyPayment(sessionId);

    if (result.success) {
      setStatus("success");
      clearCart();
      triggerConfetti();
    } else {
      // Only show error if we haven't succeeded in the meantime
      if (!useAuthStore.getState().verifiedSessions.includes(sessionId)) {
        setStatus("error");
        setError(result.error || renderTranslation("checkout.errors.balance_failed"));
      } else {
        setStatus("success");
      }
    }
  }, [sessionId, isVerifyingPayment, verifyPayment, clearCart, triggerConfetti, renderTranslation]);

  useEffect(() => {
    handleVerification();
  }, [handleVerification]);

  if (status === "loading") {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center px-4 pb-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-black" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>

        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-inner">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
        </div>
        <div className="text-center space-y-3 relative z-10">
          <h2 className="text-2xl font-black text-white tracking-tight">{renderTranslation("common.loading")}</h2>
          <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
            {renderTranslation("checkout.processing")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen pt-32 flex items-start justify-center px-4 pb-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-black" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[128px] animate-pulse" />
        </div>

        <Card className="p-8 max-w-md w-full text-center border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">{renderTranslation("common.error")}</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            {error || renderTranslation("checkout.errors.balance_failed")}
          </p>
          <div className="space-y-3">
            <Link href="/checkout" className="block group">
              <Button size="xl" className="w-full bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-xl shadow-red-600/20 transition-all active:scale-95 group text-sm h-12">
                <span>{renderTranslation("checkout.back_to_cart")}</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/contact" className="block">
              <Button variant="secondary" size="xl" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-95 text-sm h-12">
                {renderTranslation("nav.contact")}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-start justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[160px] opacity-50" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>
      <Confetti isActive={showConfetti} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <Card className="p-8 md:p-10 text-center border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />

          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner relative">
            <Check className="w-10 h-10 text-red-500" />
            <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20" />
          </div>

          <h1 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">{renderTranslation("checkout.success.title")}</h1>
          <p className="text-gray-400 mb-8 leading-relaxed text-xs">
            {renderTranslation("checkout.success.desc")}
          </p>

          <div className="bg-white/2 rounded-2xl p-6 mb-8 border border-white/5 relative group overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="space-y-4 relative z-10 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">{renderTranslation("checkout.success.payment_status")}</span>
                <Badge className="bg-red-500/20 text-red-400 border-none font-bold py-0.5 text-[10px]">{renderTranslation("checkout.success.status_success")}</Badge>
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-gray-400 text-xs">{renderTranslation("checkout.success.remaining_balance")}</span>
                <div className="text-right">
                  <p className="text-xl font-black text-red-500 tracking-tighter">
                    ฿{(user?.balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-gray-400 text-xs">{renderTranslation("nav.balance")} (Points):</span>
                <div className="text-right flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
                  <p className="text-xl font-black text-yellow-500 tracking-tighter">
                    {(user?.points || 0).toLocaleString()} <span className="text-[10px] uppercase">Pts</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard/licenses" className="block">
              <Button size="xl" className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-xl shadow-red-600/40 transition-all active:scale-95 group text-sm">
                {renderTranslation("checkout.success.view_my_licenses")}
              </Button>
            </Link>
            <Link href="/products" className="block">
              <Button size="xl" className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black rounded-xl transition-all active:scale-95 group text-sm">
                {renderTranslation("checkout.success.shop_more")}
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center px-4 pb-20 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-inner">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
