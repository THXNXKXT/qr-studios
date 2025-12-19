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
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-400/10 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-gray-400 mb-8">{errorInfo.description}</p>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <Button className="w-full">
                <RefreshCw className="w-4 h-4" />
                ลองเข้าสู่ระบบอีกครั้ง
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="secondary" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                กลับหน้าแรก
              </Button>
            </Link>
          </div>

          {/* Error Code */}
          <p className="text-xs text-gray-600 mt-6">
            Error Code: {error}
          </p>
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
