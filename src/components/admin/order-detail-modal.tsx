"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, User, CreditCard, Clock, CheckCircle, XCircle, Download, Key, Copy, Loader2, ImageOff } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { formatPrice, cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  licenseKeys?: string[];
}

interface Order {
  id: string;
  user: {
    username: string;
    email: string;
    discordId?: string;
  };
  items: OrderItem[];
  total: number;
  discount: number;
  promoCode?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
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
  onResendReceipt?: (orderId: string) => Promise<void>;
}

const statusConfig = {
  PENDING: { icon: Clock, label: "รอชำระเงิน", color: "warning" },
  PROCESSING: { icon: Clock, label: "กำลังดำเนินการ", color: "secondary" },
  COMPLETED: { icon: CheckCircle, label: "สำเร็จ", color: "success" },
  CANCELLED: { icon: XCircle, label: "ยกเลิก", color: "destructive" },
  REFUNDED: { icon: XCircle, label: "คืนเงินแล้ว", color: "destructive" },
};

export function OrderDetailModal({ isOpen, onClose, order, onUpdateStatus, onResendReceipt }: OrderDetailModalProps) {
  const [isResending, setIsResending] = useState(false);

  if (!isOpen || !order) return null;
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl flex flex-col max-h-[90vh]"
        >
          <div className="bg-[#0A0A0B] border border-white/5 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-4xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Order Details</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest opacity-60 font-mono">
                    ID: {order.id}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-6 rounded-4xl bg-white/2 border border-white/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-5 -rotate-12">
                   <StatusIcon className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    status.color === "success" ? "bg-green-500/10 text-green-500" : 
                    status.color === "warning" ? "bg-yellow-500/10 text-yellow-500" : 
                    status.color === "destructive" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    <StatusIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Current Status</p>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{status.label}</h3>
                  </div>
                </div>

                {onUpdateStatus && order.status !== "COMPLETED" && order.status !== "REFUNDED" && (
                  <div className="flex items-center gap-2 relative z-10">
                    {order.status === "PENDING" && (
                      <Button onClick={() => onUpdateStatus(order.id, "PROCESSING")} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-6 py-4 rounded-xl">
                        Process Order
                      </Button>
                    )}
                    {order.status === "PROCESSING" && (
                      <Button onClick={() => onUpdateStatus(order.id, "COMPLETED")} className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest px-6 py-4 rounded-xl">
                        Mark Success
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => onUpdateStatus(order.id, "CANCELLED")} className="text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest px-6 py-4 rounded-xl">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Info */}
                <div className="p-6 rounded-3xl bg-white/2 border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-blue-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Customer Info</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Username</p>
                      <p className="text-sm font-bold text-white">{order.user.username}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Email</p>
                      <p className="text-sm font-bold text-white">{order.user.email}</p>
                    </div>
                    {order.user.discordId && (
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Discord ID</p>
                        <p className="text-sm font-mono font-bold text-blue-400">{order.user.discordId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="p-6 rounded-3xl bg-white/2 border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-purple-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Payment Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Method</p>
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 uppercase font-black text-[8px] tracking-widest">{order.paymentMethod}</Badge>
                    </div>
                    {order.paymentRef && (
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Reference</p>
                        <p className="text-xs font-mono font-bold text-gray-400 truncate">{order.paymentRef}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase font-black tracking-tighter">Timestamp</p>
                      <p className="text-sm font-bold text-white">{new Date(order.createdAt).toLocaleString("th-TH")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-red-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Order Items</h3>
                </div>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="p-6 rounded-4xl bg-white/2 border border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-4xl bg-white/5 border border-white/10 overflow-hidden flex flex-col items-center justify-center shrink-0">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <ImageOff className="w-6 h-6 text-gray-600 mb-1" />
                                <span className="text-[6px] font-black uppercase tracking-widest text-gray-600">No Image</span>
                              </>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.productName}</h4>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Quantity: x{item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-red-500">{formatPrice(item.price * item.quantity)}</p>
                          <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">{formatPrice(item.price)} / unit</p>
                        </div>
                      </div>

                      {item.licenseKeys && item.licenseKeys.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Asset Keys / Licenses</p>
                            <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{item.licenseKeys.length} Keys Attached</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {item.licenseKeys.map((key, kIndex) => (
                              <div key={kIndex} className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between group/key">
                                <div className="flex items-center gap-3">
                                  <Key className="w-4 h-4 text-red-500" />
                                  <code className="text-xs font-mono text-red-400 font-bold">{key}</code>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(key)}
                                  className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover/key:opacity-100"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-8 rounded-[2.5rem] bg-linear-to-br from-white/5 to-transparent border border-white/10 space-y-4">
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(order.total + order.discount)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Discount</span>
                         {order.promoCode && <Badge className="bg-red-600 text-white font-mono text-[8px] border-none px-2">{order.promoCode}</Badge>}
                      </div>
                      <span className="text-sm font-black text-green-500">-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Grand Total</span>
                    <span className="text-3xl font-black text-red-500 tracking-tighter">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-white/2 flex items-center justify-between">
               <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  order.status === "COMPLETED" ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-yellow-500 shadow-[0_0_10px_#eab308]"
                )} />
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Verified transaction</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onClose} className="px-8 py-6 rounded-2xl text-gray-400 hover:text-white uppercase font-black text-[10px] tracking-widest">
                  Close
                </Button>
                {order.status === "COMPLETED" && onResendReceipt && (
                  <Button 
                    onClick={async () => {
                      setIsResending(true);
                      await onResendReceipt(order.id);
                      setIsResending(false);
                    }}
                    disabled={isResending}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 py-6 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                  >
                    {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Resend Invoice
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
