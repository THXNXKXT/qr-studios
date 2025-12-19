"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { OrderDetailModal } from "@/components/admin";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "completed" | "pending" | "processing" | "cancelled";

type Order = {
  id: string;
  user: { name: string; email: string; discordId?: string };
  products: { name: string; price: number; licenseKey?: string }[];
  total: number;
  discount?: number;
  promoCode?: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentRef?: string;
  date: Date;
};

// Mock orders
const initialOrders: Order[] = [
  {
    id: "ORD-20241209-001",
    user: { name: "GamerTH", email: "gamer@example.com" },
    products: [{ name: "Advanced Inventory System", price: 599 }],
    total: 599,
    status: "completed",
    paymentMethod: "Stripe",
    date: new Date("2024-12-09T14:30:00"),
  },
  {
    id: "ORD-20241209-002",
    user: { name: "FiveMDev", email: "dev@example.com" },
    products: [{ name: "Modern HUD UI", price: 399 }],
    total: 399,
    status: "completed",
    paymentMethod: "Balance",
    date: new Date("2024-12-09T12:15:00"),
  },
  {
    id: "ORD-20241209-003",
    user: { name: "ServerOwner", email: "owner@example.com" },
    products: [
      { name: "Vehicle Shop UI", price: 299 },
      { name: "Phone UI", price: 349 },
    ],
    total: 648,
    status: "pending",
    paymentMethod: "Stripe",
    date: new Date("2024-12-09T10:45:00"),
  },
  {
    id: "ORD-20241208-004",
    user: { name: "NewUser123", email: "new@example.com" },
    products: [{ name: "Admin Panel", price: 799 }],
    total: 799,
    status: "processing",
    paymentMethod: "Stripe",
    date: new Date("2024-12-08T16:00:00"),
  },
  {
    id: "ORD-20241208-005",
    user: { name: "ProGamer", email: "pro@example.com" },
    products: [{ name: "Complete Bundle", price: 1499 }],
    total: 1499,
    status: "cancelled",
    paymentMethod: "Stripe",
    date: new Date("2024-12-08T09:30:00"),
  },
];

const statusConfig = {
  completed: { icon: CheckCircle, label: "สำเร็จ", color: "success", bg: "bg-green-500/20", text: "text-green-400" },
  pending: { icon: Clock, label: "รอชำระ", color: "warning", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  processing: { icon: Clock, label: "กำลังดำเนินการ", color: "secondary", bg: "bg-blue-500/20", text: "text-blue-400" },
  cancelled: { icon: XCircle, label: "ยกเลิก", color: "destructive", bg: "bg-red-500/20", text: "text-red-400" },
};

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">จัดการคำสั่งซื้อ</h1>
          <p className="text-gray-400">ดูและจัดการคำสั่งซื้อทั้งหมด</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="ค้นหาคำสั่งซื้อ, ผู้ใช้..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "completed", "pending", "processing", "cancelled"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === "all" ? "ทั้งหมด" : statusConfig[status as keyof typeof statusConfig]?.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">คำสั่งซื้อ</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">ผู้ใช้</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">สินค้า</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">ยอดรวม</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">สถานะ</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">วันที่</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => {
                const status = statusConfig[order.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-mono text-sm text-white">{order.id}</p>
                      <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{order.user.name}</p>
                      <p className="text-xs text-gray-500">{order.user.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {order.products.slice(0, 2).map((p, i) => (
                          <p key={i} className="text-sm text-gray-300">{p.name}</p>
                        ))}
                        {order.products.length > 2 && (
                          <p className="text-xs text-gray-500">+{order.products.length - 2} รายการ</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-red-400">{formatPrice(order.total)}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-400">
                        {order.date.toLocaleDateString("th-TH")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                          <Eye className="w-4 h-4" />
                          ดู
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">ไม่พบคำสั่งซื้อ</p>
          </div>
        )}
      </Card>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder ? {
          ...selectedOrder,
          items: selectedOrder.products.map((p, i) => ({
            id: `item-${i}`,
            productName: p.name,
            price: p.price,
            quantity: 1,
            licenseKey: p.licenseKey,
          })),
          discount: selectedOrder.discount || 0,
          createdAt: selectedOrder.date,
          updatedAt: selectedOrder.date,
        } : null}
        onUpdateStatus={(orderId, status) => handleUpdateStatus(orderId, status as OrderStatus)}
      />
    </div>
  );
}
