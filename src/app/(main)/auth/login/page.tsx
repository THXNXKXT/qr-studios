"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { MessageCircle, Shield, Zap, Gift, ArrowLeft, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";

const benefits = [
  {
    icon: Shield,
    title: "ปลอดภัย",
    description: "เข้าสู่ระบบผ่าน Discord อย่างปลอดภัย",
  },
  {
    icon: Zap,
    title: "รวดเร็ว",
    description: "ไม่ต้องสมัครสมาชิกใหม่",
  },
  {
    icon: Gift,
    title: "สิทธิพิเศษ",
    description: "รับส่วนลดและโปรโมชั่นพิเศษ",
  },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleDiscordLogin = () => {
    signIn("discord", { callbackUrl });
  };

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
        <Card className="p-10 border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />

          {/* Logo */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-red-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <Image
                  src="/images/Query.Design.png"
                  alt="QR Studio Logo"
                  width={64}
                  height={64}
                  className="relative rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                />
              </div>
            </Link>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              ยินดีต้อนรับ
            </h1>
            <p className="text-gray-400">
              เข้าสู่ระบบเพื่อจัดการ License และบริการของคุณ
            </p>
          </div>

          {/* Discord Login Button */}
          <Button
            size="xl"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-14 rounded-2xl shadow-xl shadow-red-600/20 transition-all duration-300 active:scale-95 group"
            onClick={handleDiscordLogin}
          >
            <MessageCircle className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
            เข้าสู่ระบบด้วย Discord
          </Button>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-4 bg-black/40 text-gray-500 uppercase tracking-[0.2em] font-black backdrop-blur-md">
                สิทธิประโยชน์สมาชิก
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-5">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-5 group/item"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover/item:scale-110 group-hover/item:bg-red-500/20 transition-all duration-500">
                  <benefit.icon className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover/item:text-red-400 transition-colors">{benefit.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Terms */}
          <p className="text-[10px] text-gray-600 text-center mt-10 leading-relaxed">
            การเข้าสู่ระบบหมายความว่าคุณยอมรับ{" "}
            <Link href="/terms" className="text-red-500/80 hover:text-red-400 font-bold transition-colors">
              ข้อกำหนดการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="/privacy" className="text-red-500/80 hover:text-red-400 font-bold transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            กลับไปหน้าหลัก
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center pt-32 px-4 pb-20 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-inner">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
