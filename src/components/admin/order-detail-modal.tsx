"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Package, User, CreditCard, Clock, CheckCircle, XCircle, Download, Key, Copy } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  licenseKey?: string;
}

interface Order {
  id: string;
  user: {
    name: string;
    email: string;
    discordId?: string;
  };
  items: OrderItem[];
  total: number;
  discount: number;
  promoCode?: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  paymentMethod: string;
  paymentRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus?: (orderId: string, status: Order["status"]) => Promise<void>;
}

const statusConfig = {
  pending: { icon: Clock, label: "รอชำระเงิน", color: "warning" },
  processing: { icon: Clock, label: "กำลังดำเนินการ", color: "secondary" },
  completed: { icon: CheckCircle, label: "สำเร็จ", color: "success" },
  cancelled: { icon: XCircle, label: "ยกเลิก", color: "destructive" },
  refunded: { icon: XCircle, label: "คืนเงินแล้ว", color: "destructive" },
};

export function OrderDetailModal({ isOpen, onClose, order, onUpdateStatus }: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">รายละเอียดคำสั่งซื้อ</h2>
                <p className="text-sm text-gray-400 font-mono">{order.id}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 mb-6">
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-6 h-6 ${status.color === "success" ? "text-green-400" : status.color === "warning" ? "text-yellow-400" : "text-red-400"}`} />
                <div>
                  <p className="text-white font-medium">สถานะ</p>
                  <Badge variant={status.color as any}>{status.label}</Badge>
                </div>
              </div>
              {onUpdateStatus && order.status !== "completed" && order.status !== "refunded" && (
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <Button size="sm" onClick={() => onUpdateStatus(order.id, "processing")}>
                      ดำเนินการ
                    </Button>
                  )}
                  {order.status === "processing" && (
                    <Button size="sm" onClick={() => onUpdateStatus(order.id, "completed")}>
                      เสร็จสิ้น
                    </Button>
                  )}
                  {order.status !== "cancelled" && (
                    <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(order.id, "cancelled")}>
                      ยกเลิก
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Info */}
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <h3 className="font-medium text-white">ข้อมูลลูกค้า</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-400">
                    ชื่อ: <span className="text-white">{order.user.name}</span>
                  </p>
                  <p className="text-gray-400">
                    อีเมล: <span className="text-white">{order.user.email}</span>
                  </p>
                  {order.user.discordId && (
                    <p className="text-gray-400">
                      Discord: <span className="text-white">{order.user.discordId}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <h3 className="font-medium text-white">ข้อมูลการชำระเงิน</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-400">
                    วิธีการ: <span className="text-white">{order.paymentMethod}</span>
                  </p>
                  {order.paymentRef && (
                    <p className="text-gray-400">
                      Ref: <span className="text-white font-mono">{order.paymentRef}</span>
                    </p>
                  )}
                  <p className="text-gray-400">
                    วันที่: <span className="text-white">{order.createdAt.toLocaleString("th-TH")}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-gray-400" />
                <h3 className="font-medium text-white">รายการสินค้า</h3>
              </div>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <Package className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{item.productName}</p>
                          <p className="text-sm text-gray-400">x{item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-red-400">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    {item.licenseKey && (
                      <div className="mt-3 p-3 rounded-lg bg-black/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-green-400" />
                          <code className="text-sm text-green-400 font-mono">{item.licenseKey}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.licenseKey!)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-white/5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">ยอดรวม</span>
                  <span className="text-white">{formatPrice(order.total + order.discount)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      ส่วนลด {order.promoCode && <code className="text-red-400">({order.promoCode})</code>}
                    </span>
                    <span className="text-green-400">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                  <span className="text-white">ยอดชำระ</span>
                  <span className="text-red-400">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={onClose}>
                ปิด
              </Button>
              {order.status === "completed" && (
                <Button variant="secondary">
                  <Download className="w-4 h-4" />
                  ส่งใบเสร็จ
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
