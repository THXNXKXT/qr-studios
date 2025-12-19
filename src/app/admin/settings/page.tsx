"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Globe,
  CreditCard,
  Bell,
  Shield,
  Database,
  Mail,
  Check,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock settings
  const [settings, setSettings] = useState({
    siteName: "QR Studio",
    siteDescription: "Premium FiveM Scripts & UI",
    contactEmail: "support@qrstudio.com",
    discordWebhook: "https://discord.com/api/webhooks/...",
    stripeEnabled: true,
    balanceEnabled: true,
    promptpayEnabled: false,
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    discordNotifications: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ตั้งค่าระบบ</h1>
          <p className="text-gray-400">จัดการการตั้งค่าทั่วไปของระบบ</p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">ทั่วไป</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">ชื่อเว็บไซต์</label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">คำอธิบาย</label>
              <Input
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">อีเมลติดต่อ</label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Payment Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">การชำระเงิน</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "stripeEnabled", label: "Stripe (บัตรเครดิต/เดบิต)", desc: "รับชำระเงินผ่านบัตร" },
              { key: "balanceEnabled", label: "ยอดเงินในบัญชี", desc: "ชำระด้วยยอดเงินที่เติมไว้" },
              { key: "promptpayEnabled", label: "PromptPay", desc: "รับชำระเงินผ่าน QR Code" },
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
                    setSettings((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof typeof prev],
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings[item.key as keyof typeof settings]
                      ? "bg-red-500"
                      : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      settings[item.key as keyof typeof settings]
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

      {/* Notification Settings */}
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
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Discord Webhook URL</label>
              <Input
                value={settings.discordWebhook}
                onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            {[
              { key: "emailNotifications", label: "แจ้งเตือนทางอีเมล", desc: "ส่งอีเมลเมื่อมีคำสั่งซื้อใหม่" },
              { key: "discordNotifications", label: "แจ้งเตือนทาง Discord", desc: "ส่ง Webhook เมื่อมีคำสั่งซื้อใหม่" },
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
                    setSettings((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof typeof prev],
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings[item.key as keyof typeof settings]
                      ? "bg-red-500"
                      : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      settings[item.key as keyof typeof settings]
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

      {/* Security Settings */}
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
            {[
              { key: "maintenanceMode", label: "โหมดปิดปรับปรุง", desc: "ปิดเว็บไซต์ชั่วคราวสำหรับการบำรุงรักษา" },
              { key: "registrationEnabled", label: "เปิดรับสมัครสมาชิก", desc: "อนุญาตให้ผู้ใช้ใหม่สมัครสมาชิก" },
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
                    setSettings((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof typeof prev],
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings[item.key as keyof typeof settings]
                      ? "bg-red-500"
                      : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      settings[item.key as keyof typeof settings]
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

      {/* Database Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">ข้อมูลระบบ</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Version", value: "1.0.0" },
              { label: "Next.js", value: "15.0.0" },
              { label: "Database", value: "PostgreSQL" },
              { label: "Cache", value: "Redis" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-white/5">
                <p className="text-sm text-gray-400">{item.label}</p>
                <p className="font-medium text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
