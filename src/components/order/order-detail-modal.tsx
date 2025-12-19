"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  CreditCard,
  Calendar,
  Download,
  Key,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button, Badge, Modal } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  licenseKey?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  discount: number;
  promoCode?: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  paymentMethod: string;
  createdAt: Date;
}

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (licenseKey: string) => void;
}

const statusConfig = {
  pending: { icon: Clock, label: "รอชำระเงิน", color: "warning", bg: "bg-yellow-500/20", text: "text-yellow-400" },
  processing: { icon: Clock, label: "กำลังดำเนินการ", color: "warning", bg: "bg-blue-500/20", text: "text-blue-400" },
  completed: { icon: CheckCircle, label: "สำเร็จ", color: "success", bg: "bg-green-500/20", text: "text-green-400" },
  cancelled: { icon: XCircle, label: "ยกเลิก", color: "destructive", bg: "bg-red-500/20", text: "text-red-400" },
  refunded: { icon: XCircle, label: "คืนเงินแล้ว", color: "secondary", bg: "bg-gray-500/20", text: "text-gray-400" },
};

export function OrderDetailModal({ order, isOpen, onClose, onDownload }: OrderDetailModalProps) {
  if (!order) return null;

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="รายละเอียดคำสั่งซื้อ">
      <div className="space-y-6">
        {/* Order Header */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${status.bg} flex items-center justify-center`}>
              <StatusIcon className={`w-6 h-6 ${status.text}`} />
            </div>
            <div>
              <p className="font-mono text-white">{order.id}</p>
              <p className="text-sm text-gray-400">
                {order.createdAt.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <Badge variant={status.color as any}>{status.label}</Badge>
        </div>

        {/* Order Items */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">สินค้า</h4>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{item.productName}</p>
                    <p className="text-sm text-gray-400">x{item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-400">{formatPrice(item.price)}</p>
                  {item.licenseKey && order.status === "completed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => onDownload?.(item.licenseKey!)}
                    >
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* License Keys */}
        {order.status === "completed" && order.items.some((item) => item.licenseKey) && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">License Keys</h4>
            <div className="space-y-2">
              {order.items
                .filter((item) => item.licenseKey)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">{item.productName}</span>
                    </div>
                    <code className="text-sm text-green-400 font-mono">{item.licenseKey}</code>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">การชำระเงิน</h4>
          <div className="p-4 rounded-xl bg-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">วิธีชำระเงิน</span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-white">{order.paymentMethod}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">ราคาสินค้า</span>
              <span className="text-white">{formatPrice(order.total + order.discount)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">
                  ส่วนลด {order.promoCode && `(${order.promoCode})`}
                </span>
                <span className="text-green-400">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="font-medium text-white">รวมทั้งหมด</span>
              <span className="text-xl font-bold text-red-400">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            ปิด
          </Button>
          {order.status === "completed" && (
            <Button className="flex-1">
              <Download className="w-4 h-4" />
              ดาวน์โหลดทั้งหมด
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
