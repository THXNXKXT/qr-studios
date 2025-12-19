"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Package,
  Search,
  ArrowLeft,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, Button, Badge, Input } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

// Mock orders
const mockOrders = [
  {
    id: "ORD-20241209-001",
    products: [{ name: "Advanced Inventory System", price: 599 }],
    total: 599,
    status: "completed",
    paymentMethod: "Stripe",
    date: new Date("2024-12-09T14:30:00"),
  },
  {
    id: "ORD-20241201-002",
    products: [{ name: "Modern HUD UI", price: 399 }],
    total: 399,
    status: "completed",
    paymentMethod: "Stripe",
    date: new Date("2024-12-01T10:15:00"),
  },
  {
    id: "ORD-20241128-003",
    products: [
      { name: "Vehicle Shop UI", price: 299 },
      { name: "Phone UI", price: 349 },
    ],
    total: 648,
    status: "completed",
    paymentMethod: "Balance",
    date: new Date("2024-11-28T16:45:00"),
  },
  {
    id: "ORD-20241115-004",
    products: [{ name: "Admin Panel", price: 799 }],
    total: 799,
    status: "pending",
    paymentMethod: "Stripe",
    date: new Date("2024-11-15T09:00:00"),
  },
];

const statusConfig = {
  completed: { icon: CheckCircle, label: "สำเร็จ", color: "success" },
  pending: { icon: Clock, label: "รอดำเนินการ", color: "warning" },
  cancelled: { icon: XCircle, label: "ยกเลิก", color: "destructive" },
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products.some((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้า Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">คำสั่งซื้อของฉัน</h1>
          <p className="text-gray-400">ดูประวัติการสั่งซื้อทั้งหมด</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="ค้นหาคำสั่งซื้อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            {["all", "completed", "pending", "cancelled"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === "all"
                  ? "ทั้งหมด"
                  : statusConfig[status as keyof typeof statusConfig]?.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            order.status === "completed"
                              ? "bg-green-500/20"
                              : order.status === "pending"
                              ? "bg-yellow-500/20"
                              : "bg-red-500/20"
                          }`}
                        >
                          <StatusIcon
                            className={`w-6 h-6 ${
                              order.status === "completed"
                                ? "text-green-400"
                                : order.status === "pending"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">
                              {order.id}
                            </h3>
                            <Badge
                              variant={status.color as any}
                            >
                              {status.label}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {order.products.map((product, i) => (
                              <p key={i} className="text-sm text-gray-400">
                                {product.name} - {formatPrice(product.price)}
                              </p>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {order.date.toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            • {order.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-16 md:ml-0">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">ยอดรวม</p>
                          <p className="text-xl font-bold text-red-400">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                        <Button variant="secondary" size="sm">
                          <Eye className="w-4 h-4" />
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                ไม่พบคำสั่งซื้อ
              </h3>
              <p className="text-gray-400 mb-6">
                คุณยังไม่มีคำสั่งซื้อ หรือไม่พบคำสั่งซื้อที่ค้นหา
              </p>
              <Link href="/products">
                <Button>เลือกซื้อสินค้า</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
