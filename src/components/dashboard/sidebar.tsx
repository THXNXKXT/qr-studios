"use client";

import { motion } from "framer-motion";
import { User, Clock, Star } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, Skeleton, Badge } from "@/components/ui";

import { usePathname } from "next/navigation";
import { cn, getTierInfo } from "@/lib/utils";

interface SidebarProps {
  user: any;
  isSyncing?: boolean;
  calculateDaysAsMember: (date: string | undefined) => number;
  menuItems: Array<{ icon: any; label: string; href: string }>;
}

export function SidebarSkeleton() {
  return (
    <div className="lg:col-span-1">
      <Card className="p-6">
        <div className="text-center mb-6 space-y-4">
          <Skeleton className="w-20 h-20 mx-auto rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
          <Skeleton className="h-10 w-24 mx-auto rounded-xl" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DashboardSidebar({ user, isSyncing, calculateDaysAsMember, menuItems }: SidebarProps) {
  const { t } = useTranslation("home");
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="lg:col-span-1"
    >
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            {user?.avatar ? (
              <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-red-500/30 shadow-lg shadow-red-500/10">
                <img 
                  src={user.avatar} 
                  alt={user.username || 'User'} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-red-600 to-red-400 flex items-center justify-center shadow-lg shadow-red-500/10">
                <span className="text-2xl font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            {isSyncing && (
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-red-500/50 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 px-2">
              <h2 className="text-lg font-bold text-white truncate">{user?.username || 'User'}</h2>
              {(() => {
                const tier = getTierInfo(user?.totalSpent || 0);
                return (
                  <Badge 
                    className={cn(
                      "px-2 py-0 h-5 border-none font-black text-[9px] uppercase tracking-tighter shrink-0",
                      tier.bg,
                      tier.color
                    )}
                  >
                    {tier.icon} {tier.name}
                  </Badge>
                );
              })()}
            </div>
            <p className="text-xs text-gray-400 truncate px-2">{user?.email || 'No email'}</p>
            {user?.createdAt && (
              <p className="text-[10px] text-gray-500 mt-1 flex items-center justify-center gap-1 opacity-60">
                <Clock className="w-3 h-3" />
                {t("dashboard.sidebar.member_since")} {calculateDaysAsMember(user.createdAt) === 0 ? t("dashboard.sidebar.today") : `${calculateDaysAsMember(user.createdAt)} ${t("dashboard.sidebar.days")}`}
              </p>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 font-bold text-sm">
                ฿{(user?.balance || 0).toLocaleString()}
              </span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-yellow-400/5 border border-yellow-400/10">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
                <span className="text-yellow-500 font-bold text-sm">
                  {(user?.points || 0).toLocaleString()} <span className="text-[9px] uppercase">Pts</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group relative overflow-hidden text-sm",
                  isActive 
                    ? "bg-red-500/10 text-red-400 font-medium" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-red-500 rounded-r-full" 
                  />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-red-400" : "group-hover:text-red-400"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </Card>
    </motion.div>
  );
}
