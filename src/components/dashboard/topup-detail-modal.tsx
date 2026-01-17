"use client";

import { Wallet, Check, Copy, Clock, CreditCard, Sparkles, AlertCircle, XCircle } from "lucide-react";
import { Badge, Button, Modal } from "@/components/ui";
import { formatPrice, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface TopupTransaction {
  id: string;
  amount: number;
  bonus: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
}

interface TopupDetailModalProps {
  topup: TopupTransaction | null;
  onClose: () => void;
}

export function TopupDetailModal({ topup, onClose }: TopupDetailModalProps) {
  const [copiedId, setCopiedId] = useState(false);

  if (!topup) return null;

  const isCompleted = topup.status === "COMPLETED";
  const isCancelled = topup.status === "CANCELLED";
  const isFailed = topup.status === "FAILED";
  const isPending = topup.status === "PENDING";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <Modal
      isOpen={!!topup}
      onClose={onClose}
      showCloseButton={false}
      className="max-w-[380px] w-[92%] border-white/10 bg-black/90 backdrop-blur-3xl p-0 shadow-2xl rounded-2xl overflow-hidden"
    >
      <div className="relative flex flex-col overflow-hidden max-h-[90vh]">
        {/* Decorative Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-32 bg-linear-to-b from-red-600/15 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-600/20 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 p-6 flex flex-col items-center">
          {/* Status Icon - Restored size */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="relative mb-4"
          >
            <div className={cn(
              "w-16 h-16 rounded-3xl flex items-center justify-center relative z-10 transition-colors duration-500 shadow-[0_0_30px_-10px_rgba(239,68,68,0.4)]",
              isCompleted ? "bg-red-600/10 border border-red-500/30 shadow-red-500/20" :
              isPending ? "bg-amber-500/10 border border-amber-500/30 shadow-amber-500/20" :
              "bg-gray-500/10 border border-gray-500/30 shadow-gray-500/20"
            )}>
              {isCompleted ? (
                <Check className="w-8 h-8 text-red-500" strokeWidth={3} />
              ) : isPending ? (
                <Clock className="w-8 h-8 text-amber-500" strokeWidth={2.5} />
              ) : (
                <XCircle className="w-8 h-8 text-gray-500" strokeWidth={2.5} />
              )}
            </div>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border-4 border-black z-20 shadow-lg"
              >
                <Check className="w-3 h-3 text-white font-black" />
              </motion.div>
            )}
          </motion.div>

          {/* Amount Section - Restored typography */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-5 w-full"
          >
            <div className="flex flex-col items-center gap-1 mb-3">
              <span className="text-[9px] uppercase tracking-[0.25em] font-black text-gray-500">
                ยอดเติมเงินสุทธิ
              </span>
              <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-sm">
                +{formatPrice(topup.amount + (topup.bonus || 0))}
              </h2>
            </div>
            
            <Badge
              className={cn(
                "px-5 py-1 rounded-full border-none font-black text-[9px] uppercase tracking-widest shadow-xl",
                isCompleted ? "bg-red-600 text-white shadow-red-600/20" :
                isPending ? "bg-amber-500/20 text-amber-400" :
                "bg-gray-500/20 text-gray-400"
              )}
            >
              {topup.status === "COMPLETED" 
                ? "เติมเงินสำเร็จ" 
                : topup.status === "CANCELLED" 
                  ? "ยกเลิกรายการ" 
                  : topup.status === "FAILED" 
                    ? "ชำระเงินล้มเหลว" 
                    : "รอดำเนินการ"}
            </Badge>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-4 px-1"
          >
            {/* Receipt Section */}
            <div className="relative group">
              {/* Receipt Top Decoration */}
              <div className="absolute -top-1 left-4 right-4 flex justify-between px-2 z-20">
                {[...Array(Math.max(0, 10))].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-black/40 border border-white/5 shadow-inner" />
                ))}
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 pt-6 relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center gap-4">
                    <div className="space-y-0.5 overflow-hidden">
                      <p className="text-[8px] font-black text-red-500/60 uppercase tracking-[0.2em]">Transaction ID</p>
                      <p className="font-mono text-[10px] text-white/60 truncate selection:bg-red-500/30">
                        {topup.id}
                      </p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(topup.id)}
                      className="shrink-0 p-2 rounded-xl bg-white/5 hover:bg-red-600 hover:text-white transition-all duration-300 text-gray-400 shadow-xl group/copy active:scale-90 border border-white/5"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="relative h-px w-full overflow-hidden">
                    <div className="absolute inset-0 border-t border-dashed border-white/20 w-[200%]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <CreditCard className="w-2.5 h-2.5 text-red-500/70" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Payment</span>
                      </div>
                      <p className="text-xs font-bold text-white truncate pl-3 border-l-2 border-red-500/30">
                        {topup.paymentMethod === 'promptpay' ? 'PromptPay' : topup.paymentMethod === 'card' ? 'Debit/CreditCard' : 'Stripe'}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-1.5 justify-end text-gray-500">
                        <Clock className="w-2.5 h-2.5 text-red-500/70" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Time</span>
                      </div>
                      <p className="text-xs font-bold text-white pr-3 border-r-2 border-red-500/30">
                        {new Date(topup.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details - Premium Card */}
            <div className="bg-linear-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-4 relative overflow-hidden group shadow-2xl">
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Base Amount</span>
                  <span className="font-black text-white/90 text-base tracking-tight">{formatPrice(topup.amount)}</span>
                </div>
                
                {topup.bonus > 0 && (
                  <div className="flex justify-between items-center py-2 border-y border-emerald-500/10 bg-emerald-500/5 px-3 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">Bonus</span>
                    </div>
                    <span className="font-black text-emerald-400 text-base">+{formatPrice(topup.bonus)}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Total</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                      {new Date(topup.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                      {formatPrice(topup.amount + (topup.bonus || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Button */}
          <div className="mt-6 w-full">
            <Button
              className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_8px_25px_-5px_rgba(220,38,38,0.4)] h-12 rounded-xl font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-[0.98] text-xs border border-white/10"
              onClick={onClose}
            >
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
