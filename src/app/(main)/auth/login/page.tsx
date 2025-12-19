"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Shield, Zap, Gift } from "lucide-react";
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

export default function LoginPage() {
  const handleDiscordLogin = () => {
    // จะเชื่อมต่อกับ NextAuth ในภายหลัง
    // signIn("discord", { callbackUrl: "/" });
    console.log("Discord login clicked");
  };

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
        <Card className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Image
                src="/images/Query.Design.png"
                alt="QR Studio Logo"
                width={48}
                height={48}
                className="rounded-xl"
              />
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">
              เข้าสู่ระบบ
            </h1>
            <p className="text-gray-400">
              เข้าสู่ระบบด้วย Discord เพื่อเริ่มต้นใช้งาน
            </p>
          </div>

          {/* Discord Login Button */}
          <Button
            size="xl"
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/25"
            onClick={handleDiscordLogin}
          >
            <MessageCircle className="w-5 h-5" />
            เข้าสู่ระบบด้วย Discord
          </Button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/5 text-gray-500 rounded-full">
                สิทธิประโยชน์
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <benefit.icon className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{benefit.title}</p>
                  <p className="text-sm text-gray-400">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-8">
            การเข้าสู่ระบบหมายความว่าคุณยอมรับ{" "}
            <Link href="/terms" className="text-red-400 hover:underline">
              ข้อกำหนดการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="/privacy" className="text-red-400 hover:underline">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </Card>

        {/* Back to Home */}
        <p className="text-center mt-6 text-gray-400">
          <Link href="/" className="hover:text-red-400 transition-colors">
            ← กลับหน้าแรก
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
