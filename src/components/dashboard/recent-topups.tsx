"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import { formatPrice, cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TopupTransaction {
  id: string;
  amount: number;
  bonus: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
}

interface RecentTopupsProps {
  topups: TopupTransaction[];
  onSelectTopup: (topup: TopupTransaction) => void;
}

import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export function RecentListSkeleton({ title }: { title: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white" suppressHydrationWarning>{title}</h3>
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-transparent">
            <div className="flex items-center gap-4 flex-1">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-5 w-20 ml-auto rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RecentTopups({ topups, onSelectTopup }: RecentTopupsProps) {
  const { t } = useTranslation("common");

  return (
    <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white" suppressHydrationWarning>{t("dashboard.recent.topups")}</h3>
            <p className="text-xs text-gray-500" suppressHydrationWarning>{t("dashboard.recent.topups_subtitle", "Last 3 transactions")}</p>
          </div>
        </div>
        <Link href="/dashboard/topup/history">
          <Button variant="secondary" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl px-4">
            {t("common.view_all", "View All")}
          </Button>
        </Link>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {topups.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/2">
            <CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
            <p className="text-gray-500" suppressHydrationWarning>{t("dashboard.history.no_data", "No top-up history found")}</p>
          </div>
        ) : (
          topups.slice(0, 3).map((topup) => (
            <motion.div
              key={topup.id}
              variants={item}
              onClick={() => onSelectTopup(topup)}
              className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-500 cursor-pointer group shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500 border border-white/5">
                  <CreditCard className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                    {topup.paymentMethod === 'promptpay'
                      ? 'PromptPay'
                      : topup.paymentMethod === 'card'
                        ? 'Credit/Debit Card'
                        : 'Stripe Payment'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1" suppressHydrationWarning>
                    {new Date(topup.createdAt).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-red-500">
                  +{formatPrice(topup.amount + (topup.bonus || 0))}
                </p>
                <Badge
                  variant={topup.status === "COMPLETED" ? "success" : "warning"}
                  className={cn(
                    "mt-1 px-2.5 py-0.5 rounded-lg border-none shadow-sm text-[10px]",
                    topup.status === "COMPLETED"
                      ? "bg-red-500/20 text-red-400"
                      : topup.status === "CANCELLED" || topup.status === "FAILED"
                        ? "bg-gray-500/20 text-gray-400"
                        : "bg-red-900/20 text-red-500/50"
                  )}
                >
                  {topup.status === "COMPLETED"
                    ? t("status.completed", "Success")
                    : topup.status === "CANCELLED"
                      ? t("status.cancelled", "Cancelled")
                      : topup.status === "FAILED"
                        ? t("status.failed", "Failed")
                        : t("status.pending", "Pending")}
                </Badge>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </Card>
  );
}
