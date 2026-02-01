"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Star,
  ArrowLeft,
  Clock,
  Loader2,
  Search,
  TrendingUp,
  ShoppingBag,
  History
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Card, Input } from "@/components/ui";
import { cn, formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import { createLogger } from "@/lib/logger";
import { userApi } from "@/lib/api";

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
}

const pointsLogger = createLogger("dashboard:points");

interface PointTransaction {
  id: string;
  type: 'POINTS_EARNED' | 'POINTS_REDEEMED' | 'TOPUP' | 'PURCHASE' | 'REFUND' | 'BONUS';
  amount: number;
  bonus: number;
  points: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
  paymentRef?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function PointHistoryPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedDate = useCallback((date: string) => {
    if (!mounted) return "";
    return new Date(date).toLocaleDateString(t('common.date_locale') === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [mounted, t]);

  const fetchHistory = useCallback(async () => {
    const token = getAuthToken();
    if (!isSynced && !user?.id && token) return;
    if (!user?.id && !token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await userApi.getTransactions();
      const response = data as ApiResponse<PointTransaction[]>;
      if (response && response.success) {
        // Filter only point-related transactions or those with points > 0
        const allTrans = response.data || [];
        setTransactions(allTrans.filter((transaction: PointTransaction) => 
          transaction.type === 'POINTS_EARNED' || transaction.type === 'POINTS_REDEEMED' || transaction.points > 0
        ));
      }
    } catch (err) {
      pointsLogger.error('Failed to fetch point history', { error: err });
    } finally {
      setLoading(false);
    }
  }, [user?.id, isSynced]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredTransactions = useMemo(() => 
    transactions.filter((transaction) => {
      const searchLower = searchTerm.toLowerCase();
      const idMatch = transaction.id?.toLowerCase().includes(searchLower) ?? false;
      const refMatch = transaction.paymentRef?.toLowerCase().includes(searchLower) ?? false;
      return idMatch || refMatch;
    }), [transactions, searchTerm]
  );

  const stats = useMemo(() => {
    const earned = transactions
      .filter(transaction => transaction.type === 'POINTS_EARNED' || (transaction.points > 0 && transaction.type !== 'POINTS_REDEEMED'))
      .reduce((sum, transaction) => sum + transaction.points, 0);
    const redeemed = transactions
      .filter(transaction => transaction.type === 'POINTS_REDEEMED')
      .reduce((sum, transaction) => sum + Math.abs(transaction.points), 0);
    
    return { earned, redeemed };
  }, [transactions]);

  if (authLoading || (loading && (user || getAuthToken()))) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user && !authLoading && !getAuthToken()) {
    if (typeof window !== "undefined") {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    return null;
  }

  return (
    <div className="min-h-screen pt-32 px-4 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-yellow-900/10 via-black to-black pointer-events-none" />
      
      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {t("dashboard.points_page.back")}
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500/20" />
              {t("dashboard.points_page.title")}
            </h1>
            <p className="text-gray-400 text-xs">{t("dashboard.points_page.desc")}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Card className="p-2 border-white/5 bg-white/2 backdrop-blur-md w-full sm:w-72">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                <Input
                  placeholder={t("dashboard.points_page.search_placeholder")}
                  className="pl-10 bg-transparent border-none focus:ring-0 h-10 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">{t("dashboard.points_page.stats.balance")}</p>
                <p className="text-2xl font-black text-white">{(user?.points || 0).toLocaleString()} <span className="text-sm font-bold text-yellow-500">PTS</span></p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">{t("dashboard.points_page.stats.total_earned")}</p>
                <p className="text-2xl font-black text-white">{stats.earned.toLocaleString()} <span className="text-sm font-bold text-green-500">PTS</span></p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <ShoppingBag className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">{t("dashboard.points_page.stats.total_redeemed")}</p>
                <p className="text-2xl font-black text-white">{stats.redeemed.toLocaleString()} <span className="text-sm font-bold text-red-500">PTS</span></p>
              </div>
            </div>
          </Card>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-20 text-center border-white/5 bg-white/2 backdrop-blur-sm">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <History className="w-10 h-10 text-gray-700 opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t("dashboard.points_page.no_transactions")}</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  {searchTerm ? t("common.no_results") : t("dashboard.points_page.no_transactions_desc")}
                </p>
              </Card>
            </motion.div>
            ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4"
            >
              {filteredTransactions.map((transaction, _index) => {
                const isEarned = transaction.type === 'POINTS_EARNED' || (transaction.points > 0 && transaction.type !== 'POINTS_REDEEMED');
                return (
                  <motion.div
                    key={transaction.id}
                    variants={item}
                  >
                    <Card 
                      className="p-6 border-white/5 bg-white/2 backdrop-blur-sm hover:border-yellow-500/30 transition-all duration-500 group relative overflow-hidden"
                    >
                      <div className={cn(
                        "absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity",
                        isEarned ? "bg-yellow-500" : "bg-red-500"
                      )} />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-all duration-500 shadow-lg",
                            isEarned ? "bg-yellow-500/10" : "bg-red-500/10"
                          )}>
                            <Star className={cn(
                              "w-7 h-7",
                              isEarned ? "text-yellow-500 fill-yellow-500/20" : "text-red-500"
                            )} />
                          </div>
                          
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <span className="text-sm font-bold text-white group-hover:text-yellow-500 transition-colors">
                                {transaction.type === 'POINTS_EARNED' ? t("dashboard.points_page.types.earned") : 
                                 transaction.type === 'POINTS_REDEEMED' ? t("dashboard.points_page.types.redeemed") : 
                                 transaction.type === 'BONUS' ? t("dashboard.points_page.types.bonus") : t("dashboard.points_page.types.default")}
                              </span>
                              <Badge
                                className={cn(
                                  "px-2.5 py-0.5 rounded-lg border-none font-bold text-[10px] uppercase tracking-wider",
                                  isEarned ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                )}
                              >
                                {isEarned ? t("dashboard.points_page.status.earned") : t("dashboard.points_page.status.redeemed")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formattedDate(transaction.createdAt)}
                              </div>
                              {transaction.paymentRef && (
                                <span className="font-mono opacity-60">REF: {transaction.paymentRef?.substring(0, 12).toUpperCase() || 'N/A'}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={cn(
                              "text-xl font-black transition-colors",
                              isEarned ? "text-yellow-500" : "text-red-500"
                            )}>
                              {isEarned ? '+' : ''}{transaction.points.toLocaleString()} <span className="text-xs uppercase">Pts</span>
                            </p>
                            {transaction.amount > 0 && (
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">
                                {t("dashboard.points_page.payment_amount", { amount: formatPrice(transaction.amount) })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
