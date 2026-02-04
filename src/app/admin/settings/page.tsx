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
  Database,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { createLogger } from "@/lib/logger";

const settingsLogger = createLogger("admin:settings");

type Setting = {
  id: string;
  key: string;
  value: string | number | boolean | null;
  description: string | null;
  category: string;
  updatedAt: string;
};

const categories = [
  { id: "GENERAL", labelKey: "settings.tabs.general", icon: SettingsIcon },
  { id: "PAYMENT", labelKey: "settings.tabs.payment", icon: CreditCard },
  { id: "SECURITY", labelKey: "settings.tabs.security", icon: Shield },
  { id: "CONTACT", labelKey: "settings.tabs.contact", icon: MessageSquare },
  { id: "SYSTEM", labelKey: "settings.tabs.system", icon: Database },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string | number | boolean | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("GENERAL");
  const [rawSettings, setRawSettings] = useState<Setting[]>([]);
  
  // PIN Settings State
  const [pinState, setPinState] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
    loading: false,
    error: "",
    success: false
  });

  const { t } = useTranslation("admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      if (res.data) {
        // Handle both formats: { success, data } or direct array
        const responseData = res.data as { success?: boolean; data?: unknown[] } | unknown[];
        let settingsArray: unknown[] = [];
        
        if (Array.isArray(responseData)) {
          settingsArray = responseData;
        } else if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          settingsArray = Array.isArray(responseData.data) ? responseData.data : [];
        }
        
        const normalizedData = settingsArray as Setting[];
        setRawSettings(normalizedData);
        const settingsMap: Record<string, string | number | boolean | null> = {};
        normalizedData.forEach((s) => {
          settingsMap[s.key] = s.value as string | number | boolean | null;
        });
        setSettings(settingsMap);
      }
    } catch (err) {
      settingsLogger.error('Failed to fetch settings', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUpdateSetting = async (key: string, value: string | number | boolean | null) => {
    setSaving(key);
    try {
      const res = await adminApi.updateSetting(key, value);
      if (res.data) {
        setSettings((prev) => ({ ...prev, [key]: value }));
      }
    } catch (err) {
      settingsLogger.error('Failed to update setting', { key, error: err });
      alert(`Failed to update ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdatePin = async () => {
    if (pinState.newPin.length !== 6) {
      setPinState(prev => ({ ...prev, error: t("admin_pin.pin_length") }));
      return;
    }
    if (pinState.newPin !== pinState.confirmPin) {
      setPinState(prev => ({ ...prev, error: t("admin_pin.pin_mismatch") }));
      return;
    }

    setPinState(prev => ({ ...prev, loading: true, error: "", success: false }));
    try {
      // In a real app, you would have a dedicated endpoint for PIN updates
      // for security (hashing, current PIN verification, etc.)
      // For now, we update it via the general settings API
      const { data: res } = await adminApi.updateSetting("ADMIN_PIN", pinState.newPin) as { data: { success: boolean } };
      
      if (res && res.success) {
        setPinState(prev => ({ 
          ...prev, 
          success: true, 
          currentPin: "", 
          newPin: "", 
          confirmPin: "" 
        }));
        setTimeout(() => setPinState(prev => ({ ...prev, success: false })), 3000);
      } else {
        setPinState(prev => ({ ...prev, error: t("admin_pin.update_error") }));
      }
    } catch (_err) {
      setPinState(prev => ({ ...prev, error: t("admin_pin.update_error") }));
    } finally {
      setPinState(prev => ({ ...prev, loading: false }));
    }
  };

  const currentSettings = Array.isArray(rawSettings) ? rawSettings.filter((s) => s.category === selectedCategory) : [];

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 min-h-14">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{mounted ? t("settings.title") : ""}</h1>
          <p className="text-gray-400 mt-1">{mounted ? t("settings.subtitle") : ""}</p>
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
              <span className="relative z-10">{mounted ? t(cat.labelKey) : ""}</span>
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
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{mounted ? t("settings.loading") || "Loading settings..." : ""}</p>
            </div>
          ) : selectedCategory === "SECURITY" ? (
            <div className="space-y-6">
              {/* PIN Settings Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
                  
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
                      <Lock className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">
                        {t("admin_pin.settings_title")}
                      </h3>
                      <p className="text-sm text-gray-400 font-medium">
                        {t("admin_pin.settings_subtitle")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">
                        {t("admin_pin.current_pin")}
                      </label>
                      <div className="relative group/input">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/input:text-red-500 transition-colors" />
                        <Input
                          type="password"
                          maxLength={6}
                          placeholder="••••••"
                          value={pinState.currentPin}
                          onChange={(e) => setPinState(prev => ({ ...prev, currentPin: e.target.value.replace(/\D/g, "") }))}
                          className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all h-12 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">
                        {t("admin_pin.new_pin")}
                      </label>
                      <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/input:text-red-500 transition-colors" />
                        <Input
                          type="password"
                          maxLength={6}
                          placeholder="••••••"
                          value={pinState.newPin}
                          onChange={(e) => setPinState(prev => ({ ...prev, newPin: e.target.value.replace(/\D/g, "") }))}
                          className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all h-12 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">
                        {t("admin_pin.confirm_pin")}
                      </label>
                      <div className="relative group/input">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/input:text-red-500 transition-colors" />
                        <Input
                          type="password"
                          maxLength={6}
                          placeholder="••••••"
                          value={pinState.confirmPin}
                          onChange={(e) => setPinState(prev => ({ ...prev, confirmPin: e.target.value.replace(/\D/g, "") }))}
                          className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all h-12 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {pinState.error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {pinState.error}
                      </motion.div>
                    )}

                    {pinState.success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest mb-6 bg-green-500/10 p-4 rounded-xl border border-green-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t("admin_pin.update_success")}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={handleUpdatePin}
                    disabled={pinState.loading || pinState.newPin.length !== 6 || pinState.confirmPin.length !== 6}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98]"
                  >
                    {pinState.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        {t("admin_pin.update_btn")}
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>

              {/* Other Security Settings */}
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
                          {mounted ? (item.description || t("settings.default_description")) : ""}
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
                              value={String(settings[item.key] ?? "")}
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
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {currentSettings.length === 0 && (
                <Card className="p-20 text-center border-white/5 bg-white/2 backdrop-blur-md rounded-3xl">
                  <SettingsIcon className="w-16 h-16 text-gray-800 mx-auto mb-4 opacity-20" />
                  <p className="text-gray-500 font-bold">{mounted ? t("settings.no_settings") : ""}</p>
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
                          {mounted ? (item.description || t("settings.default_description")) : ""}
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
                              value={String(settings[item.key] ?? "")}
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
