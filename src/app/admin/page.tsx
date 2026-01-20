"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Key,
  Loader2,
  ImageOff,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { OrderDetailModal } from "@/components/admin";
import { formatPrice, cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";

export default function AdminDashboard() {
  const { t } = useTranslation("admin");
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<{ id: string; name: string; stock: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // Keeping any for now due to complexity of Order type vs UI usage
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getOrders({ limit: 5 }),
        adminApi.getLowStock()
      ]);

      if (statsRes.data && (statsRes.data as any).success) {
        setStats((statsRes.data as any).data);
      }
      if (ordersRes.data && (ordersRes.data as any).success) {
        setRecentOrders((ordersRes.data as any).data);
      }
      if (lowStockRes.data) {
        const resData = lowStockRes.data as any;
        if (resData.success) {
          setLowStockProducts(resData.data);
        } else if (Array.isArray(resData)) {
          setLowStockProducts(resData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleViewOrder = async (order: any) => {
    try {
      const { data: res } = await adminApi.getOrderById(order.id) as { data: { success: boolean; data: any } };
      if (res && res.success) {
        setSelectedOrder(res.data);
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      setSelectedOrder(order);
      setIsDetailOpen(true);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, status) as { data: { success: boolean; error?: string } };
      if (res.data && res.data.success) {
        await fetchDashboardData();
        if (selectedOrder?.id === orderId) {
          const { data: detailRes } = await adminApi.getOrderById(orderId) as { data: { success: boolean; data: any } };
          if (detailRes && detailRes.success) {
            setSelectedOrder(detailRes.data);
          }
        }
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const handleResendReceipt = async (orderId: string) => {
    try {
      await adminApi.resendOrderReceipt(orderId);
    } catch (err) {
      console.error("Error resending receipt:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const statCards = [
    {
      label: mounted ? t("dashboard.stats.total_revenue") : "",
      value: formatPrice(stats?.revenue?.total || 0),
      change: mounted ? t("dashboard.stats.revenue_summary") : "",
      trend: "up",
      icon: DollarSign,
    },
    {
      label: mounted ? t("dashboard.stats.total_orders") : "",
      value: (stats?.orders?.total || 0).toLocaleString(),
      change: mounted ? t("dashboard.stats.pending_orders", { count: stats?.orders?.pending || 0 }) : "",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      label: mounted ? t("dashboard.stats.total_users") : "",
      value: (stats?.users?.total || 0).toLocaleString(),
      change: mounted ? t("dashboard.stats.new_today", { count: stats?.users?.today || 0 }) : "",
      trend: "up",
      icon: Users,
    },
    {
      label: mounted ? t("dashboard.stats.active_licenses") : "",
      value: (stats?.licenses?.active || 0).toLocaleString(),
      change: mounted ? t("dashboard.stats.active") : "",
      trend: "up",
      icon: Package,
    },
  ];

  return (
    <div className="space-y-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-[128px] -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-14">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{mounted ? t("dashboard.title") : ""}</h1>
          <p className="text-gray-400 mt-1">{mounted ? t("dashboard.subtitle") : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] h-10 flex items-center justify-center rounded-xl">
            {mounted ? t("dashboard.live_status") : ""}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500 shadow-inner">
                  <stat.icon className="w-7 h-7 text-red-500 group-hover:text-red-400 transition-colors" />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm transition-all duration-500 group-hover:bg-red-500 group-hover:text-white",
                    stat.trend === "up" ? "" : ""
                  )}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {stat.change}
                </div>
              </div>

              <div className="relative z-10">
                <p className={cn(
                  "text-3xl font-black tracking-tighter mb-1 transition-colors duration-500",
                  (stat.label === t("dashboard.stats.total_revenue") || stat.value.toString().startsWith("฿"))
                    ? "text-red-500"
                    : "text-white group-hover:text-red-400"
                )}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
                  <ShoppingCart className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">{mounted ? t("dashboard.recent_orders.title") : ""}</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{mounted ? t("dashboard.recent_orders.subtitle") : ""}</p>
                </div>
              </div>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all">
                  {mounted ? t("dashboard.recent_orders.view_all") : ""}
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-20" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{mounted ? t("dashboard.recent_orders.no_orders") : ""}</p>
                </div>
              ) : (
                recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (index * 0.05) }}
                  >
                    <div
                      onClick={() => handleViewOrder(order)}
                      className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-500 group/item relative overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover/item:scale-110 group-hover/item:bg-red-500/20 transition-all duration-500 border border-white/5">
                          <ShoppingCart className="w-6 h-6 text-red-500 group-hover/item:text-red-400 transition-colors" />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover/item:text-red-400 transition-colors truncate max-w-[120px] sm:max-w-none">
                            {order.items?.[0]?.product?.name || (mounted ? t("common.unknown_product") : "")}
                            {order.items?.length > 1 && (mounted ? t("dashboard.recent_orders.more_items", { count: Math.max(0, order.items.length - 1) }) : "")}
                          </p>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter mt-1 opacity-60">
                            {order.user?.username || (mounted ? t("common.guest") : "")} <span className="mx-1">•</span> #{order.id.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right relative z-10">
                        <p className="font-black text-red-500 text-lg mb-1">{formatPrice(order.total)}</p>
                        <Badge
                          className={cn(
                            "border-none font-black text-[10px] uppercase tracking-wider shadow-sm",
                            order.status === "COMPLETED" ? "bg-red-500/20 text-red-400" : "bg-red-900/20 text-red-500/50"
                          )}
                        >
                          {order.status === "COMPLETED" ? (mounted ? t("dashboard.recent_orders.status_completed") : "") : order.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right Column: Top Products & Low Stock */}
        <div className="space-y-8">
          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />

              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
                    <TrendingUp className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{mounted ? t("dashboard.best_sellers.title") : ""}</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{mounted ? t("dashboard.best_sellers.subtitle") : ""}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {stats?.topProducts?.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 font-bold uppercase tracking-widest text-[10px]">{mounted ? t("dashboard.best_sellers.no_data") : ""}</div>
                ) : (
                  stats?.topProducts?.map((product: { id: string; name: string; image?: string; sales: number; revenue: number }) => (
                    <div key={product.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex flex-col items-center justify-center overflow-hidden border border-white/10 group-hover:border-red-500/30 transition-colors shadow-inner relative">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <>
                              <ImageOff className="w-4 h-4 text-gray-600 mb-0.5" />
                              <span className="text-[6px] font-black uppercase tracking-widest text-gray-600">{mounted ? t("products.table.no_image") : ""}</span>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{product.name}</p>
                          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{mounted ? t("dashboard.best_sellers.sales_count", { count: product.sales }) : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-red-500">{formatPrice(product.revenue)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: mounted ? t("dashboard.quick_links.products") : "", href: "/admin/products", icon: Package },
                    { label: mounted ? t("dashboard.quick_links.orders") : "", href: "/admin/orders", icon: ShoppingCart },
                    { label: mounted ? t("dashboard.quick_links.users") : "", href: "/admin/users", icon: Users },
                    { label: mounted ? t("dashboard.quick_links.licenses") : "", href: "/admin/licenses", icon: Key },
                  ].map((link, index) => (
                    <Link key={index} href={link.href}>
                      <Button variant="ghost" className="w-full h-24 flex flex-col gap-2 bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/30 rounded-2xl group transition-all">
                        <link.icon className="w-6 h-6 text-gray-500 group-hover:text-red-500 transition-colors" />
                        <span className="font-bold text-gray-400 group-hover:text-white transition-colors uppercase text-[10px] tracking-widest">{link.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Low Stock Warning */}
          <AnimatePresence>
            {lowStockProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-8 border-red-500/20 bg-red-500/5 backdrop-blur-sm shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-tight">{mounted ? t("dashboard.low_stock.title") : ""}</h2>
                      <p className="text-[9px] text-red-500/70 uppercase tracking-widest font-black">{mounted ? t("dashboard.low_stock.subtitle") : ""}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{product.name}</p>
                        </div>
                        <Badge className="bg-red-500 text-white border-none font-black text-[10px] px-3 py-1 rounded-lg">
                          {mounted ? t("dashboard.low_stock.remaining", { count: product.stock }) : ""}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder ? {
          ...selectedOrder,
          items: selectedOrder.items.map((item: any, i: number) => ({
            id: item.id || `item-${i}`,
            productId: item.productId,
            productName: item.product?.name || "Unknown Product",
            productImage: item.product?.images?.[0],
            price: item.price,
            quantity: item.quantity,
            licenseKeys: (selectedOrder as any).licenses
              ?.filter((l: any) => l.productId === item.productId)
              .map((l: any) => l.licenseKey)
          })),
          createdAt: new Date(selectedOrder.createdAt),
          updatedAt: new Date(selectedOrder.updatedAt || selectedOrder.createdAt),
        } : null}
        onUpdateStatus={(orderId, status) => handleUpdateStatus(orderId, status)}
        onResendReceipt={handleResendReceipt}
      />
    </div>
  );
}
