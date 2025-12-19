"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  Package,
  Key,
  Wallet,
  ShoppingBag,
  Settings,
  Bell,
  CreditCard,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

// Mock user data
const mockUser = {
  id: "1",
  username: "TestUser",
  email: "test@example.com",
  avatar: null,
  balance: 2500,
  createdAt: new Date("2024-01-15"),
};

// Mock orders
const mockOrders = [
  {
    id: "ORD-001",
    productName: "Advanced Inventory System",
    price: 599,
    status: "completed",
    date: new Date("2024-12-01"),
  },
  {
    id: "ORD-002",
    productName: "Modern HUD UI",
    price: 399,
    status: "completed",
    date: new Date("2024-11-28"),
  },
  {
    id: "ORD-003",
    productName: "Vehicle Shop UI",
    price: 299,
    status: "pending",
    date: new Date("2024-12-09"),
  },
];

// Mock licenses
const mockLicenses = [
  {
    id: "LIC-001",
    productName: "Advanced Inventory System",
    key: "XXXX-XXXX-XXXX-1234",
    status: "active",
    expiresAt: null,
  },
  {
    id: "LIC-002",
    productName: "Modern HUD UI",
    key: "XXXX-XXXX-XXXX-5678",
    status: "active",
    expiresAt: null,
  },
];

const menuItems = [
  { icon: User, label: "โปรไฟล์", href: "/dashboard" },
  { icon: ShoppingBag, label: "คำสั่งซื้อ", href: "/dashboard/orders" },
  { icon: Key, label: "License", href: "/dashboard/licenses" },
  { icon: Wallet, label: "เติมเงิน", href: "/dashboard/topup" },
  { icon: Settings, label: "ตั้งค่า", href: "/dashboard/settings" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="p-6">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-linear-to-br from-red-600 to-red-400 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {mockUser.username.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{mockUser.username}</h2>
                <p className="text-sm text-gray-400">{mockUser.email}</p>
                <div className="mt-3 px-4 py-2 rounded-xl bg-red-500/20 inline-block">
                  <span className="text-red-400 font-semibold">
                    ฿{mockUser.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Menu */}
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: ShoppingBag, label: "คำสั่งซื้อ", value: mockOrders.length },
                { icon: Key, label: "License", value: mockLicenses.length },
                { icon: Wallet, label: "ยอดเงิน", value: `฿${mockUser.balance.toLocaleString()}` },
                { icon: Clock, label: "สมาชิกมา", value: "11 เดือน" },
              ].map((stat, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">คำสั่งซื้อล่าสุด</h3>
                <Link href="/dashboard/orders">
                  <Button variant="ghost" size="sm">ดูทั้งหมด</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {mockOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{order.productName}</p>
                        <p className="text-sm text-gray-400">{order.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-400">{formatPrice(order.price)}</p>
                      <Badge
                        variant={order.status === "completed" ? "success" : "warning"}
                      >
                        {order.status === "completed" ? "สำเร็จ" : "รอดำเนินการ"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Licenses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">License ของฉัน</h3>
                <Link href="/dashboard/licenses">
                  <Button variant="ghost" size="sm">ดูทั้งหมด</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {mockLicenses.map((license) => (
                  <div
                    key={license.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{license.productName}</p>
                        <p className="text-sm text-gray-400 font-mono">{license.key}</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
