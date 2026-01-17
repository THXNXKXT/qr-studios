"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Suspense } from "react";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "ข้อผิดพลาดการตั้งค่า",
    description: "มีปัญหากับการตั้งค่าเซิร์ฟเวอร์ กรุณาติดต่อผู้ดูแลระบบ",
  },
  AccessDenied: {
    title: "การเข้าถึงถูกปฏิเสธ",
    description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
  },
  Verification: {
    title: "ลิงก์หมดอายุ",
    description: "ลิงก์ยืนยันหมดอายุหรือถูกใช้งานแล้ว",
  },
  OAuthSignin: {
    title: "ข้อผิดพลาด OAuth",
    description: "ไม่สามารถเริ่มต้นการเข้าสู่ระบบกับ Discord ได้",
  },
  OAuthCallback: {
    title: "ข้อผิดพลาด OAuth",
    description: "เกิดข้อผิดพลาดระหว่างการตอบกลับจาก Discord",
  },
  OAuthCreateAccount: {
    title: "ไม่สามารถสร้างบัญชีได้",
    description: "ไม่สามารถสร้างบัญชีผู้ใช้ใหม่ได้ กรุณาลองใหม่อีกครั้ง",
  },
  EmailCreateAccount: {
    title: "ไม่สามารถสร้างบัญชีได้",
    description: "ไม่สามารถสร้างบัญชีด้วยอีเมลนี้ได้",
  },
  Callback: {
    title: "ข้อผิดพลาด Callback",
    description: "เกิดข้อผิดพลาดระหว่างการประมวลผล callback",
  },
  OAuthAccountNotLinked: {
    title: "บัญชีไม่ได้เชื่อมต่อ",
    description: "อีเมลนี้เชื่อมต่อกับบัญชีอื่นแล้ว กรุณาเข้าสู่ระบบด้วยวิธีเดิม",
  },
  SessionRequired: {
    title: "ต้องเข้าสู่ระบบ",
    description: "กรุณาเข้าสู่ระบบเพื่อเข้าถึงหน้านี้",
  },
  Default: {
    title: "เกิดข้อผิดพลาด",
    description: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง",
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-black" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[128px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-10 text-center border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
          
          {/* Error Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner group">
            <AlertTriangle className="w-12 h-12 text-red-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
            {errorInfo.title}
          </h1>
          <p className="text-gray-400 mb-10 leading-relaxed">{errorInfo.description}</p>

          {/* Actions */}
          <div className="space-y-4">
            <Link href="/auth/login" className="block group">
              <Button className="w-full h-14 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 transition-all duration-300 active:scale-95">
                <RefreshCw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-700" />
                ลองเข้าสู่ระบบอีกครั้ง
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="secondary" className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 font-bold rounded-2xl transition-all">
                <ArrowLeft className="w-5 h-5 mr-3" />
                กลับหน้าแรก
              </Button>
            </Link>
          </div>

          {/* Error Code */}
          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-black mb-2">
              Error Diagnostics
            </p>
            <code className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-red-400/60 font-mono">
              {error}
            </code>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">กำลังโหลด...</h1>
        </Card>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
