"use client";

import Link from "next/link";
import { Package, ImageOff } from "lucide-react";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import { formatPrice, cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
      images?: string[];
    };
  }>;
}

interface RecentOrdersProps {
  orders: Order[];
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

export function RecentOrders({ orders }: RecentOrdersProps) {
  const { t } = useTranslation("common");

  return (
    <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white" suppressHydrationWarning>{t("dashboard.recent.orders")}</h3>
            <p className="text-xs text-gray-500" suppressHydrationWarning>{t("dashboard.recent.orders_subtitle", "Last 3 orders")}</p>
          </div>
        </div>
        <Link href="/dashboard/orders">
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
        {orders.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/2">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Package className="w-8 h-8 text-gray-700 opacity-20" />
            </div>
            <p className="text-gray-500" suppressHydrationWarning>{t("dashboard.history.no_orders", "No orders yet")}</p>
          </div>
        ) : (
          orders.slice(0, 3).map((order) => (
            <motion.div key={order.id} variants={item}>
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="block group"
              >
                <div
                  className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-500 group shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex flex-col items-center justify-center group-hover:scale-110 group-hover:bg-red-500/10 transition-all duration-500 border border-white/5 overflow-hidden shrink-0">
                      {order.items?.[0]?.product?.images?.[0] ? (
                        <img src={order.items[0].product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageOff className="w-5 h-5 text-gray-700 opacity-40" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate max-w-[150px] sm:max-w-none">
                        {order.items?.[0]?.product?.name || 'Order'}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-60">#{order.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-red-500">{formatPrice(order.total)}</p>
                    <Badge
                      variant={order.status === "COMPLETED" ? "success" : "warning"}
                      className={cn(
                        "mt-1 px-2.5 py-0.5 rounded-lg border-none shadow-sm text-[10px]",
                        order.status === "COMPLETED" ? "bg-red-500/20 text-red-400" : "bg-red-900/20 text-red-500/50"
                      )}
                    >
                      {order.status === "COMPLETED"
                        ? t("status.completed", "Success")
                        : t("status.pending", "Pending")}
                    </Badge>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </motion.div>
    </Card>
  );
}
