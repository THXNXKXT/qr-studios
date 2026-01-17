"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Wallet,
  CreditCard,
  ArrowLeft,
  Clock,
  Loader2,
  Calendar,
  ChevronRight,
  Search,
} from "lucide-react";
import { Badge, Button, Card, Input, Pagination } from "@/components/ui";
import { TopupHistorySkeleton } from "@/components/dashboard/topup-history-skeleton";
import { cn, formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import { topupApi } from "@/lib/api";
import { TopupDetailModal } from "@/components/dashboard/topup-detail-modal";

interface TopupTransaction {
  id: string;
  amount: number;
  bonus: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
}

export default function TopupHistoryPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced } = useAuth();
  const [topups, setTopups] = useState<TopupTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopup, setSelectedTopup] = useState<TopupTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchHistory = useCallback(async () => {
    const token = getAuthToken();
    if (!isSynced && !user?.id && token) return;
    if (!user?.id && !token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await topupApi.getHistory();
      if (data && (data as any).success) {
        setTopups((data as any).data || []);
      }
    } catch (err) {
      console.error("Failed to fetch top-up history:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isSynced]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredTopups = useMemo(() =>
    topups.filter((topup) => {
      const searchLower = searchTerm.toLowerCase();
      const idMatch = topup.id?.toLowerCase().includes(searchLower) ?? false;
      const methodMatch = topup.paymentMethod?.toLowerCase().includes(searchLower) ?? false;
      return idMatch || methodMatch;
    }), [topups, searchTerm]
  );

  const totalPages = Math.ceil(filteredTopups.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedTopups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTopups.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTopups, currentPage, itemsPerPage]);

  const renderTranslation = (key: string, options?: any): string => {
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  if (authLoading || (loading && (user || getAuthToken()))) {
    return (
      <div className="min-h-screen pt-32 px-4 pb-20 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" disabled className="text-gray-500">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {renderTranslation("dashboard.topup_history.back")}
            </Button>
            <h1 className="text-3xl font-bold text-white">{renderTranslation("dashboard.topup_history.title")}</h1>
          </div>
          <TopupHistorySkeleton />
        </div>
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
      <div className="absolute inset-0 bg-linear-to-br from-red-900/10 via-black to-black pointer-events-none" />

      <div className="container max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {renderTranslation("dashboard.menu.topup_history")}
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">{renderTranslation("dashboard.menu.topup_history")}</h1>
            <p className="text-gray-400 text-xs">{renderTranslation("dashboard.topup_history.desc")}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Card className="p-2 border-white/5 bg-white/2 backdrop-blur-md w-full sm:w-72">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <Input
                  placeholder={renderTranslation("dashboard.topup_history.search_placeholder")}
                  className="pl-10 bg-transparent border-none focus:ring-0 h-10 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Card>

            <Link href="/dashboard/topup" className="w-full sm:w-auto">
              <Button className="w-full bg-red-600 hover:bg-red-500 h-12 px-8 rounded-2xl shadow-xl shadow-red-600/20 font-bold group">
                <Wallet className="w-5 h-5 mr-2" />
                {renderTranslation("dashboard.topup_history.topup_more")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTopups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-20 text-center border-white/5 bg-white/2 backdrop-blur-sm">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Search className="w-10 h-10 text-gray-700 opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{renderTranslation("dashboard.topup_history.no_transactions")}</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  {searchTerm ? renderTranslation("common.no_results") : renderTranslation("dashboard.topup_history.no_transactions_desc")}
                </p>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paginatedTopups.map((topup, index) => (
                <motion.div
                  key={topup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="p-6 border-white/5 bg-white/2 backdrop-blur-sm hover:border-red-500/30 transition-all duration-500 group cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedTopup(topup)}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500 shadow-lg">
                          <CreditCard className="w-7 h-7 text-red-500" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <span className="text-sm font-mono text-gray-500 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded">#{topup.id?.substring(0, 12).toUpperCase() || 'N/A'}</span>
                            <Badge
                              className={cn(
                                "px-3 py-0.5 rounded-lg border-none font-bold text-[10px] uppercase tracking-wider",
                                topup.status === "COMPLETED"
                                  ? "bg-red-500/20 text-red-400"
                                  : topup.status === "CANCELLED" || topup.status === "FAILED"
                                    ? "bg-gray-500/20 text-gray-400"
                                    : "bg-red-900/20 text-red-500/50"
                              )}
                            >
                              {topup.status === "COMPLETED"
                                ? renderTranslation("dashboard.orders.status.completed")
                                : topup.status === "CANCELLED"
                                  ? renderTranslation("dashboard.orders.status.cancelled")
                                  : topup.status === "FAILED"
                                    ? renderTranslation("common.error")
                                    : renderTranslation("dashboard.orders.status.pending")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(topup.createdAt).toLocaleDateString(renderTranslation("common.date_locale") === 'th' ? 'th-TH' : 'en-US', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                        <div className="text-left md:text-right">
                          <p className="text-xl font-black text-white group-hover:text-red-500 transition-colors">
                            +{formatPrice(topup.amount)}
                          </p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">
                            {topup.paymentMethod === 'promptpay'
                              ? 'Stripe - PromptPay'
                              : topup.paymentMethod === 'card'
                                ? 'Stripe - Credit/Debit Card'
                                : 'Stripe Payment'}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-600 transition-all group-hover:scale-110 shadow-lg border border-white/5">
                          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <TopupDetailModal
        topup={selectedTopup}
        onClose={() => setSelectedTopup(null)}
      />
    </div>
  );
}
