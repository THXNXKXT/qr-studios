"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import {
  Wallet,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { TopupSkeleton } from "@/components/dashboard/topup-skeleton";
import { cn, formatPrice } from "@/lib/utils";
import { topupApi } from "@/lib/api";

const topupPackages = [
  { amount: 100, bonus: 0 },
  { amount: 300, bonus: 15 },
  { amount: 500, bonus: 30 },
  { amount: 1000, bonus: 80 },
  { amount: 2000, bonus: 200 },
  { amount: 5000, bonus: 600 },
];

const paymentMethods = [
  { id: "stripe", name: "Stripe", icon: CreditCard },
];

export default function TopupPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced, isSyncing, refresh } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);

  const [topupPackages, setTopupPackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    const token = getAuthToken();
    
    // Wait for auth to be ready if there is a token
    if (!isSynced && !user?.id && token) return;

    try {
      const { data, error } = await topupApi.getPackages();
      if (data && (data as any).success) {
        setTopupPackages((data as any).data);
      } else {
        console.error("Failed to fetch packages:", error);
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoadingPackages(false);
    }
  }, [user?.id, isSynced]);

  useEffect(() => {
    setMounted(true);
    fetchPackages();
  }, [fetchPackages]);

  // Use a more relaxed loading check to prevent infinite spinners
  const isAuthInitializing = !isSynced && !user?.id && !!getAuthToken();
  const isLoading = (authLoading || isAuthInitializing || (loadingPackages && topupPackages.length === 0) || !mounted) && !user;

  const selectedAmount = useMemo(() => {
    if (selectedPackage !== null && topupPackages[selectedPackage]) {
      return topupPackages[selectedPackage].amount;
    }
    return parseInt(customAmount) || 0;
  }, [selectedPackage, topupPackages, customAmount]);

  const bonus = useMemo(() => {
    if (selectedPackage !== null && topupPackages[selectedPackage]) {
      return topupPackages[selectedPackage].bonus;
    }
    // Dynamic bonus for custom amounts based on tiers (Adjusted rates, Max 10%)
    const amount = parseInt(customAmount) || 0;
    if (amount >= 5000) return Math.floor(amount * 0.10); // 10%
    if (amount >= 2000) return Math.floor(amount * 0.08); // 8%
    if (amount >= 1000) return Math.floor(amount * 0.05); // 5%
    if (amount >= 500) return Math.floor(amount * 0.03); // 3%
    return 0;
  }, [selectedPackage, topupPackages, customAmount]);

  const renderTranslation = useCallback((key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  }, [mounted, t]);

  const handleTopup = useCallback(async () => {
    const amount = selectedAmount;
    setError(null);
    
    if (amount < 100) {
      setError(renderTranslation("dashboard.topup_page.errors.min_amount"));
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error: apiError } = await topupApi.createStripeSession(amount);

      if (data && (data as any).success && (data as any).data?.url) {
        window.location.href = (data as any).data.url;
      } else {
        const msg = apiError || (data as any)?.message || (data as any)?.error || renderTranslation("dashboard.topup_page.errors.session_failed");
        throw new Error(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
      }
    } catch (err) {
      console.error("Topup error details:", err);
      setError(err instanceof Error ? err.message : renderTranslation("dashboard.topup_page.errors.general"));
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAmount, renderTranslation]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 space-y-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {renderTranslation("dashboard.topup_page.back")}
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">{renderTranslation("dashboard.topup_page.title")}</h1>
            <p className="text-gray-400">{renderTranslation("dashboard.topup_page.desc")}</p>
          </div>

          <TopupSkeleton />
        </div>
      </div>
    );
  }

  if (!user && !authLoading && !getAuthToken()) {
    if (typeof window !== 'undefined') {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    return null;
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-red-900/20 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {renderTranslation("dashboard.topup_page.back")}
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{renderTranslation("dashboard.topup_page.title")}</h1>
                <p className="text-gray-400 text-xs">{renderTranslation("dashboard.topup_page.desc")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-600/10 transition-colors duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
                    <Wallet className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-0.5">{renderTranslation("dashboard.stats.balance")}</p>
                    <p className="text-2xl font-black text-white group-hover:text-red-400 transition-colors duration-500">
                      ฿{(user?.balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block">
                  <Link href="/dashboard/topup/history">
                    <Button variant="secondary" className="bg-white/5 border-white/10 hover:bg-white/10 px-6">
                      {renderTranslation("dashboard.menu.topup_history")}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-5 bg-red-600 rounded-full" />
                <h3 className="text-lg font-bold text-white">
                  {renderTranslation("dashboard.topup_page.title")}
                </h3>
              </div>
              
              {loadingPackages ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                  <p className="text-gray-500 text-sm">{renderTranslation("common.loading")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topupPackages.map((pkg, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedPackage(index);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "relative p-6 rounded-2xl border-2 transition-all duration-500 group/pkg overflow-hidden",
                        selectedPackage === index
                          ? "border-red-600 bg-red-600/5 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)] scale-[1.02]"
                          : "border-white/5 bg-white/2 hover:border-red-500/30 hover:bg-white/5"
                      )}
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover/pkg:opacity-100 transition-opacity" />
                      
                      {pkg.bonus > 0 && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <Badge className="bg-red-600 text-white border-none shadow-lg shadow-red-600/20 px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-bl-xl rounded-tr-xl">
                            <Sparkles className="w-3 h-3 mr-1 inline" />
                            Bonus +฿{pkg.bonus}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="relative z-10">
                        <p className={cn(
                          "text-2xl font-black transition-colors duration-500",
                          selectedPackage === index ? "text-red-500" : "text-white group-hover/pkg:text-red-400"
                        )}>
                          ฿{pkg.amount.toLocaleString()}
                        </p>
                        {pkg.bonus > 0 ? (
                          <div className="mt-2 flex items-center justify-center gap-1.5">
                            <span className="text-xs text-gray-500 line-through opacity-50">฿{pkg.amount}</span>
                            <span className="text-sm text-red-400 font-bold">{renderTranslation("common.receive")} {formatPrice(pkg.amount + pkg.bonus)}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">{renderTranslation("dashboard.topup_page.amount_to_receive")}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-white/5">
                <label className="text-sm font-bold text-gray-300 mb-3 block ml-1">
                  {renderTranslation("dashboard.topup_page.min_amount")}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="text-xl font-bold text-gray-500 group-focus-within:text-red-500 transition-colors">฿</span>
                  </div>
                  <Input
                    type="number"
                    placeholder={renderTranslation("dashboard.topup_page.custom_amount_placeholder")}
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPackage(null);
                    }}
                    className="pl-10 h-14 text-lg font-bold bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/10 rounded-2xl transition-all"
                    min={100}
                  />
                </div>
                {bonus > 0 && customAmount && (
                  <motion.p 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-sm text-red-400 font-bold flex items-center gap-2 ml-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    {renderTranslation("dashboard.topup_page.bonus_msg", { amount: bonus.toLocaleString(), total: (parseInt(customAmount) + bonus).toLocaleString() })}
                  </motion.p>
                )}
              </div>
            </Card>

            <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-5 bg-red-600 rounded-full" />
                <h3 className="text-lg font-bold text-white">
                  {renderTranslation("dashboard.topup_page.payment_method_title")}
                </h3>
              </div>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 group/method",
                      paymentMethod === method.id
                        ? "border-red-600 bg-red-600/5 shadow-lg shadow-red-600/10"
                        : "border-white/5 bg-white/2 hover:border-red-500/30 hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                      paymentMethod === method.id ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 group-hover/method:bg-red-500/10 group-hover/method:text-red-500"
                    )}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <span className={cn(
                        "block font-bold transition-colors",
                        paymentMethod === method.id ? "text-white" : "text-gray-300 group-hover/method:text-white"
                      )}>{method.name}</span>
                      <span className="text-xs text-gray-500">{renderTranslation("dashboard.topup_page.payment_method_desc")}</span>
                    </div>
                    {paymentMethod === method.id && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-6 h-6 rounded-full bg-red-600 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-6 sticky top-24 border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
              
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-red-500" />
                {renderTranslation("dashboard.topup_page.summary")}
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-sm">{renderTranslation("dashboard.topup_page.amount_to_topup")}</span>
                  <span className="font-bold text-white">{formatPrice(selectedAmount)}</span>
                </div>
                {bonus > 0 && (
                  <div className="flex justify-between items-center text-red-400">
                    <span className="text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {renderTranslation("dashboard.topup_page.special_bonus")}
                    </span>
                    <span className="font-bold">+{formatPrice(bonus)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div className="text-sm text-gray-400">{renderTranslation("dashboard.topup_page.total_receive")}</div>
                  <div className="text-2xl font-black text-red-500 tracking-tight">
                    {formatPrice(selectedAmount + bonus)}
                  </div>
                </div>
              </div>

              <Button
                size="xl"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-14 rounded-2xl shadow-xl shadow-red-600/20 group"
                onClick={handleTopup}
                disabled={isProcessing || selectedAmount < 100}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{renderTranslation("dashboard.topup_page.processing")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>{renderTranslation("dashboard.topup_page.pay_now", { amount: formatPrice(selectedAmount) })}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-3 h-3 text-red-500" />
                  <span>{renderTranslation("dashboard.topup_page.secure_msg")}</span>
                </div>
                <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 items-center justify-center">
                  {/* VISA */}
                  <div className="relative w-10 h-6 flex items-center justify-center">
                    <span className="text-[10px] font-black italic tracking-tighter text-white">VISA</span>
                  </div>
                  {/* Mastercard */}
                  <div className="relative w-8 h-6 flex items-center justify-center">
                    <div className="absolute w-4 h-4 rounded-full bg-red-500/80 -translate-x-1.5" />
                    <div className="absolute w-4 h-4 rounded-full bg-orange-500/80 translate-x-1.5" />
                  </div>
                  {/* PromptPay */}
                  <div className="relative w-10 h-6 flex items-center justify-center">
                    <div className="px-1.5 py-0.5 border border-white/40 rounded flex items-center justify-center font-black text-[7px] text-white tracking-tighter">PP</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
