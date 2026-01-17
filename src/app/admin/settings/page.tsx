"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Loader2,
  Settings as SettingsIcon,
  Shield,
  CreditCard,
  MessageSquare,
  Globe,
  Bell,
  Database,
  CheckCircle2,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";

type Setting = {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: string;
  updatedAt: string;
};

const categories = [
  { id: "GENERAL", label: "ทั่วไป", icon: SettingsIcon },
  { id: "PAYMENT", label: "การชำระเงิน", icon: CreditCard },
  { id: "SECURITY", label: "ความปลอดภัย", icon: Shield },
  { id: "CONTACT", label: "ติดต่อสอบถาม", icon: MessageSquare },
  { id: "SYSTEM", label: "ระบบหลังบ้าน", icon: Database },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("GENERAL");
  const [rawSettings, setRawSettings] = useState<Setting[]>([]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await adminApi.getSettings();
      if (res && (res as any).success) {
        const settingsData = (res as any).data || [];
        const normalizedData = Array.isArray(settingsData) ? settingsData : [];
        setRawSettings(normalizedData);
        const settingsMap: Record<string, any> = {};
        normalizedData.forEach((s: Setting) => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUpdateSetting = async (key: string, value: any) => {
    setSaving(key);
    try {
      const { data: res } = await adminApi.updateSetting(key, value);
      if (res && (res as any).success) {
        setSettings((prev) => ({ ...prev, [key]: value }));
      }
    } catch (err) {
      console.error(`Failed to update setting ${key}:`, err);
      alert(`Failed to update ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const currentSettings = Array.isArray(rawSettings) ? rawSettings.filter((s) => s.category === selectedCategory) : [];

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">System Settings</h1>
          <p className="text-gray-400 mt-1">ตั้งค่าการทำงานและกำหนดค่าพื้นฐานของระบบ QR Studio</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Categories */}
        <aside className="lg:w-64 space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden",
                selectedCategory === cat.id
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5"
              )}
            >
              <cat.icon className={cn(
                "w-5 h-5 transition-transform duration-500",
                selectedCategory === cat.id ? "scale-110" : "group-hover:scale-110 group-hover:text-red-500"
              )} />
              <span className="relative z-10">{cat.label}</span>
              {selectedCategory === cat.id && (
                <motion.div 
                  layoutId="active-setting-cat"
                  className="absolute inset-0 bg-linear-to-r from-red-600 to-red-500 -z-10"
                />
              )}
            </button>
          ))}
        </aside>

        {/* Settings Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading settings...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {currentSettings.length === 0 && (
                <Card className="p-20 text-center border-white/5 bg-white/2 backdrop-blur-md rounded-3xl">
                  <SettingsIcon className="w-16 h-16 text-gray-800 mx-auto mb-4 opacity-20" />
                  <p className="text-gray-500 font-bold">ไม่มีการตั้งค่าในหมวดหมู่นี้</p>
                </Card>
              )}
              {currentSettings.map((item) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                            {item.key.replace(/_/g, " ")}
                          </h3>
                          {saving === item.key && (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                          {item.description || "ปรับแต่งค่าการทำงานของระบบในส่วนนี้"}
                        </p>
                      </div>

                      <div className="w-full md:w-72 flex items-center gap-3">
                        {typeof item.value === "boolean" ? (
                          <div className="flex items-center justify-end w-full">
                            <button
                              onClick={() => handleUpdateSetting(item.key, !settings[item.key])}
                              className={cn(
                                "relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none border border-white/10",
                                settings[item.key] ? "bg-red-600" : "bg-white/10"
                              )}
                            >
                              <motion.div
                                animate={{ x: settings[item.key] ? 24 : 4 }}
                                className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                              />
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full group/input">
                            <Input
                              value={settings[item.key] || ""}
                              onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                              onBlur={() => {
                                if (settings[item.key] !== item.value) {
                                  handleUpdateSetting(item.key, settings[item.key]);
                                }
                              }}
                              className="bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all text-white font-mono text-sm pr-10"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                              <Save className="w-4 h-4 text-red-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
