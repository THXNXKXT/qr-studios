"use client";

import { motion } from "framer-motion";
import { TrendingUp, Award, CheckCircle2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, Badge } from "@/components/ui";
import { cn, formatPrice, getTierInfo, getUserTier, TIERS, MemberTier } from "@/lib/utils";

interface TierProgressProps {
  totalSpent: number;
}

export function TierProgress({ totalSpent }: TierProgressProps) {
  const { t } = useTranslation("home");
  const currentTierKey = getUserTier(totalSpent);
  const currentTier = TIERS[currentTierKey];
  
  const tierKeys: MemberTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "ELITE", "ROYAL", "LEGEND"];
  const currentIndex = tierKeys.indexOf(currentTierKey);
  const nextTierKey = currentIndex < tierKeys.length - 1 ? tierKeys[currentIndex + 1] : null;
  const nextTier = nextTierKey ? TIERS[nextTierKey] : null;

  const progress = nextTier 
    ? Math.min(100, (totalSpent / nextTier.minSpent) * 100)
    : 100;

  return (
    <Card className="p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Award className="w-32 h-32 text-white" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t("dashboard.tier.progress_title")}</span>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              {t("dashboard.tier.current_tier")} 
              <span className={cn("px-3 py-0.5 rounded-lg text-sm", currentTier.bg, currentTier.color)}>
                {currentTier.icon} {currentTier.name}
              </span>
            </h2>
          </div>

          {nextTier && (
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">{t("dashboard.tier.next_tier_prefix")} {formatPrice(nextTier.minSpent - totalSpent)} {t("dashboard.tier.next_tier_suffix")}</p>
              <Badge className={cn("px-3 py-1 border-none font-black text-[10px] uppercase", nextTier.bg, nextTier.color)}>
                {nextTier.icon} {nextTier.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-gray-500">{t("dashboard.tier.progress")}</span>
            <span className="text-red-500">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-linear-to-r from-red-600 to-red-400 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            />
          </div>
        </div>

        {/* Tier Milestones */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {tierKeys.map((key) => {
            const tier = TIERS[key];
            const isReached = totalSpent >= tier.minSpent;
            const isCurrent = currentTierKey === key;

            return (
              <div 
                key={key}
                className={cn(
                  "p-3 rounded-xl border transition-all duration-300 flex flex-col items-center text-center",
                  isReached ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 opacity-40",
                  isCurrent && "ring-2 ring-red-500/50 border-red-500/50"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 mb-2 relative">
                  <span className="text-lg">{tier.icon}</span>
                  {isReached && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <p className={cn("font-black text-[9px] uppercase tracking-tighter mb-1 truncate w-full", tier.color)}>
                  {tier.name}
                </p>
                <p className="text-[8px] text-gray-500 font-medium">
                  {tier.discount > 0 ? t("dashboard.tier.discount", { percent: tier.discount }) : t("dashboard.tier.no_discount")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
