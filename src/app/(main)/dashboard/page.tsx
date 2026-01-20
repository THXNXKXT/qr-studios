"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  Package,
  Key,
  Wallet,
  ShoppingBag,
  Award,
  Settings,
  Bell,
  CreditCard,
  Download,
  Clock,
  History,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { DashboardSidebar, SidebarSkeleton } from "@/components/dashboard/sidebar";
import { DashboardStats, StatsSkeleton } from "@/components/dashboard/stats-grid";
import { RecentTopups, RecentListSkeleton } from "@/components/dashboard/recent-topups";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { MyLicenses } from "@/components/dashboard/my-licenses";
import { TopupDetailModal } from "@/components/dashboard/topup-detail-modal";
import { TierProgress } from "@/components/dashboard/tier-progress";
import { cn, formatPrice, getTierInfo, getUserTier, TIERS } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import { ordersApi, licensesApi, topupApi } from "@/lib/api";

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
    };
  }>;
}

interface License {
  id: string;
  licenseKey: string;
  status: string;
  product: {
    name: string;
  };
}

interface TopupTransaction {
  id: string;
  amount: number;
  bonus: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced, isSyncing, refresh } = useAuth();

  const menuItems = useMemo(() => [
    { icon: User, label: t("dashboard.menu.profile"), href: "/dashboard" },
    { icon: ShoppingBag, label: t("dashboard.menu.orders"), href: "/dashboard/orders" },
    { icon: Key, label: t("dashboard.menu.licenses"), href: "/dashboard/licenses" },
    { icon: Star, label: t("dashboard.menu.points"), href: "/dashboard/points" },
    { icon: Wallet, label: t("dashboard.menu.topup"), href: "/dashboard/topup" },
    { icon: History, label: t("dashboard.menu.topup_history"), href: "/dashboard/topup/history" },
    { icon: Settings, label: t("dashboard.menu.settings"), href: "/dashboard/settings" },
  ], [t]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [topups, setTopups] = useState<TopupTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopup, setSelectedTopup] = useState<TopupTransaction | null>(null);

  const calculateDaysAsMember = useCallback((createdAt: string | undefined) => {
    if (!createdAt) return 0;
    try {
      const start = new Date(createdAt);
      start.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(now.getTime() - start.getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  }, []);

  const fetchData = useCallback(async (showLoading = false) => {
    const token = getAuthToken();
    if (!isSynced && !user?.id && token) return;
    if (!user?.id && !token) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    
    try {
      const [ordersRes, licensesRes, topupRes] = await Promise.all([
        ordersApi.getAll(),
        licensesApi.getAll(),
        topupApi.getHistory()
      ]);

      if (ordersRes.data && typeof ordersRes.data === 'object' && 'data' in ordersRes.data) {
        setOrders((ordersRes.data as any).data || []);
      }

      if (licensesRes.data && typeof licensesRes.data === 'object' && 'data' in licensesRes.data) {
        setLicenses((licensesRes.data as any).data || []);
      }

      if (topupRes.data && typeof topupRes.data === 'object' && 'data' in topupRes.data) {
        setTopups((topupRes.data as any).data || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isSynced]);

  useEffect(() => {
    // Force refresh user data on dashboard mount to ensure latest totalSpent/points
    const forceRefresh = async () => {
      const token = getAuthToken();
      if (token) {
        console.log('[Dashboard] Forcing profile refresh...');
        await refresh();
        // After profile sync, re-fetch dashboard specific data
        fetchData();
      }
    };
    forceRefresh();
  }, [refresh, fetchData]);

  // Keep this for subsequent manual refreshes or data updates
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => [
    { icon: ShoppingBag, label: t("dashboard.stats.orders"), value: orders.length },
    { icon: Key, label: t("dashboard.stats.licenses"), value: licenses.length },
    { 
      icon: Award, 
      label: t("dashboard.stats.total_spent"), 
      value: (
        <span className="text-yellow-400 font-bold">
          ฿{(user?.totalSpent || 0).toLocaleString()}
        </span>
      )
    },
    { 
      icon: Star, 
      label: t("dashboard.stats.points"), 
      value: (
        <span className="text-yellow-500 font-bold">
          {(user?.points || 0).toLocaleString()} <span className="text-[10px] uppercase">Pts</span>
        </span>
      )
    },
  ], [t, orders.length, licenses.length, user?.totalSpent, user?.points]);

  if (authLoading || (loading && (user || getAuthToken()))) {
    return (
      <div className="min-h-screen pt-32">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <SidebarSkeleton />
            <div className="lg:col-span-3 space-y-6">
              <StatsSkeleton />
              <RecentListSkeleton title={t("dashboard.recent.topups")} />
              <RecentListSkeleton title={t("dashboard.recent.orders")} />
              <RecentListSkeleton title={t("dashboard.recent.licenses")} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Robust check: if no user and no cookie token, then redirect
  if (!user && !authLoading && !getAuthToken()) {
    if (typeof window !== 'undefined') {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    return null;
  }

  return (
    <div className="min-h-screen pt-32">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <DashboardSidebar 
            user={user} 
            isSyncing={isSyncing}
            calculateDaysAsMember={calculateDaysAsMember} 
            menuItems={menuItems} 
          />

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{t("dashboard.title")}</h1>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchData(true)}
                disabled={loading}
                className="text-gray-400 hover:text-red-400 gap-2 bg-white/5 hover:bg-white/10 rounded-xl px-4 h-10 border border-white/5"
              >
                <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
                {t("dashboard.refresh")}
              </Button>
            </div>
            <p className="text-gray-400 mb-8 text-xs">{t("dashboard.welcome")}</p>

            {/* Stats */}
            <DashboardStats stats={stats} />

            {/* Member Tier Progress */}
            <TierProgress totalSpent={user?.totalSpent || 0} />

            {/* Recent Top-ups */}
            <RecentTopups 
              topups={topups as any} 
              onSelectTopup={setSelectedTopup as any} 
            />

            {/* Recent Orders */}
            <RecentOrders orders={orders} />

            {/* Licenses */}
            <MyLicenses licenses={licenses} />
          </motion.div>
        </div>
      </div>

      {/* Top-up Detail Modal - Moved to root for better Portal reliability */}
      <TopupDetailModal 
        topup={selectedTopup} 
        onClose={() => setSelectedTopup(null)} 
      />
    </div>
  );
}
