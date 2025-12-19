"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Mail,
  Bell,
  Shield,
  Trash2,
  Save,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";

// Mock user data
const mockUser = {
  id: "1",
  username: "TestUser",
  email: "test@example.com",
  avatar: null,
  discordId: "123456789",
  createdAt: new Date("2024-01-15"),
};

export default function SettingsPage() {
  const [username, setUsername] = useState(mockUser.username);
  const [email, setEmail] = useState(mockUser.email);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    newsletter: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้า Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">ตั้งค่าบัญชี</h1>
          <p className="text-gray-400">จัดการข้อมูลและการตั้งค่าของคุณ</p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">โปรไฟล์</h2>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-red-600 to-red-400 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    รูปโปรไฟล์จาก Discord
                  </p>
                </div>

                {/* Form */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      ชื่อผู้ใช้
                    </label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ชื่อผู้ใช้"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      อีเมล
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="อีเมล"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Discord ID
                    </label>
                    <Input
                      value={mockUser.discordId}
                      disabled
                      className="opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ไม่สามารถเปลี่ยนแปลงได้
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">การแจ้งเตือน</h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "orderUpdates",
                    label: "อัพเดทคำสั่งซื้อ",
                    desc: "รับการแจ้งเตือนเมื่อสถานะคำสั่งซื้อเปลี่ยนแปลง",
                  },
                  {
                    key: "promotions",
                    label: "โปรโมชั่น",
                    desc: "รับข้อเสนอพิเศษและส่วนลด",
                  },
                  {
                    key: "newProducts",
                    label: "สินค้าใหม่",
                    desc: "รับการแจ้งเตือนเมื่อมีสินค้าใหม่",
                  },
                  {
                    key: "newsletter",
                    label: "จดหมายข่าว",
                    desc: "รับข่าวสารและอัพเดทจากเรา",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                  >
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof typeof prev],
                        }))
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        notifications[item.key as keyof typeof notifications]
                          ? "bg-red-500"
                          : "bg-white/20"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          notifications[item.key as keyof typeof notifications]
                            ? "left-7"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Security Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">ความปลอดภัย</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">เชื่อมต่อ Discord</p>
                    <p className="text-sm text-gray-400">
                      บัญชีของคุณเชื่อมต่อกับ Discord แล้ว
                    </p>
                  </div>
                  <Badge variant="success">เชื่อมต่อแล้ว</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">สมาชิกตั้งแต่</p>
                    <p className="text-sm text-gray-400">
                      {mockUser.createdAt.toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 border-red-500/30">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">โซนอันตราย</h2>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div>
                  <p className="font-medium text-white">ลบบัญชี</p>
                  <p className="text-sm text-gray-400">
                    ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4" />
                  ลบบัญชี
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end gap-4"
          >
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-5 h-5" />
                บันทึกสำเร็จ
              </div>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  บันทึกการเปลี่ยนแปลง
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
