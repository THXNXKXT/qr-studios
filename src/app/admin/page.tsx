"use client";

import { motion } from "framer-motion";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

// Mock stats
const stats = [
  {
    label: "รายได้วันนี้",
    value: "฿12,450",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "คำสั่งซื้อวันนี้",
    value: "24",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    label: "ผู้ใช้ทั้งหมด",
    value: "1,234",
    change: "+5.1%",
    trend: "up",
    icon: Users,
  },
  {
    label: "สินค้าทั้งหมด",
    value: "48",
    change: "+2",
    trend: "up",
    icon: Package,
  },
];

// Mock recent orders
const recentOrders = [
  { id: "ORD-001", user: "GamerTH", product: "Advanced Inventory", amount: 599, status: "completed" },
  { id: "ORD-002", user: "FiveMDev", product: "Modern HUD UI", amount: 399, status: "completed" },
  { id: "ORD-003", user: "ServerOwner", product: "Vehicle Shop", amount: 299, status: "pending" },
  { id: "ORD-004", user: "NewUser123", product: "Phone UI", amount: 349, status: "completed" },
  { id: "ORD-005", user: "ProGamer", product: "Admin Panel", amount: 799, status: "processing" },
];

// Mock top products
const topProducts = [
  { name: "Advanced Inventory System", sales: 156, revenue: 93444 },
  { name: "Modern HUD UI", sales: 124, revenue: 49476 },
  { name: "Vehicle Shop UI", sales: 98, revenue: 29302 },
  { name: "Phone UI", sales: 87, revenue: 30363 },
  { name: "Admin Panel", sales: 65, revenue: 51935 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">ภาพรวมระบบ QR Studio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-red-400" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">คำสั่งซื้อล่าสุด</h2>
              <a href="/admin/orders" className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                ดูทั้งหมด <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{order.product}</p>
                      <p className="text-xs text-gray-500">{order.user} • {order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-400">{formatPrice(order.amount)}</p>
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "success"
                          : order.status === "pending"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {order.status === "completed" ? "สำเร็จ" : order.status === "pending" ? "รอดำเนินการ" : "กำลังดำเนินการ"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">สินค้าขายดี</h2>
              <a href="/admin/products" className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                ดูทั้งหมด <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} ยอดขาย</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-green-400">
                    {formatPrice(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
