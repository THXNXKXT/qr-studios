"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, Wallet, MessageSquare } from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function TopupCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-start justify-center pt-32 px-4 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[160px] opacity-50" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <Card className="p-8 md:p-10 text-center border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
          
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner group">
            <XCircle className="w-10 h-10 text-red-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
          </div>
          
          <h1 className="text-xl font-black text-white mb-2 tracking-tight">ยกเลิกรายการแล้ว</h1>
          <p className="text-gray-400 mb-8 leading-relaxed text-xs">
            รายการเติมเงินของคุณถูกยกเลิก คุณสามารถกลับไปเลือกแพ็คเกจและทำรายการใหม่ได้ทุกเมื่อ
          </p>

          <div className="space-y-3">
            <Link href="/dashboard/topup" className="block group">
              <Button size="xl" className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-xl shadow-red-600/40 transition-all active:scale-95 group text-sm">
                ทำรายการใหม่อีกครั้ง
              </Button>
            </Link>
            <Link href="/products" className="block">
              <Button size="xl" className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white font-black rounded-xl transition-all active:scale-95 group text-sm">
                เลือกซื้อสินค้าอื่น
              </Button>
            </Link>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              กลับไปหน้า Dashboard
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
