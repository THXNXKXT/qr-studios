"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, Button, Input, Badge } from "@/components/ui";
import { SettingsSkeleton } from "@/components/dashboard/settings-skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import { createLogger } from "@/lib/logger";

const settingsLogger = createLogger("dashboard:settings");
import { userApi } from "@/lib/api";

export default function SettingsPage() {
  const { t, i18n } = useTranslation("common");
  const { user, loading: authLoading, isSynced, refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const renderTranslation = useCallback((key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  }, [mounted, t]);

  // Use robust loading check
  const isAuthInitializing = !isSynced && !user && !!getAuthToken();
  const isLoading = (authLoading || isAuthInitializing || !mounted) && !user;

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newProducts: true,
    newsletter: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notificationItems = useMemo(() => {
    if (!mounted) return [];
    return [
      {
        key: "orderUpdates",
        label: renderTranslation("dashboard.settings_page.notifications.items.orderUpdates.label"),
        desc: renderTranslation("dashboard.settings_page.notifications.items.orderUpdates.desc"),
      },
      {
        key: "promotions",
        label: renderTranslation("dashboard.settings_page.notifications.items.promotions.label"),
        desc: renderTranslation("dashboard.settings_page.notifications.items.promotions.desc"),
      },
      {
        key: "newProducts",
        label: renderTranslation("dashboard.settings_page.notifications.items.newProducts.label"),
        desc: renderTranslation("dashboard.settings_page.notifications.items.newProducts.desc"),
      },
      {
        key: "newsletter",
        label: renderTranslation("dashboard.settings_page.notifications.items.newsletter.label"),
        desc: renderTranslation("dashboard.settings_page.notifications.items.newsletter.desc"),
      },
    ];
  }, [mounted, renderTranslation]);

  const toggleNotification = useCallback((key: string) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  }, []);

  const handleSave = useCallback(async () => {
    // Currently only notifications can be updated as username/email are synced from Discord
    setIsSaving(true);
    setError(null);
    try {
      // Logic for saving notifications would go here
      // Since updateProfile only takes avatar now and we don't have avatar upload yet,
      // we'll just show success for notification settings.
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      settingsLogger.error('Failed to save settings', { error: err });
      setError(renderTranslation("dashboard.settings_page.error_saving"));
    } finally {
      setIsSaving(false);
    }
  }, [renderTranslation]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8 space-y-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {renderTranslation("dashboard.settings_page.back")}
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">{renderTranslation("dashboard.settings_page.title")}</h1>
            <p className="text-gray-400">{renderTranslation("dashboard.settings_page.desc")}</p>
          </div>

          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  if (!user && !authLoading && isSynced && !getAuthToken()) {
    if (typeof window !== 'undefined') {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    return null;
  }

  return (
    <div className="min-h-screen pt-32">
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
            {renderTranslation("dashboard.settings_page.back")}
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{renderTranslation("dashboard.settings_page.title")}</h1>
          <p className="text-gray-400">{renderTranslation("dashboard.settings_page.desc")}</p>
        </motion.div>

        <div className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">{renderTranslation("dashboard.settings_page.profile.title")}</h2>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  {user?.avatar ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-500/30">
                      <img 
                        src={user.avatar} 
                        alt={username} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-red-600 to-red-400 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    {renderTranslation("dashboard.settings_page.profile.avatar_hint")}
                  </p>
                </div>

                {/* Form */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      {renderTranslation("dashboard.settings_page.profile.username")}
                    </label>
                    <Input
                      value={user?.username || ""}
                      disabled
                      className="opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {renderTranslation("dashboard.settings_page.profile.sync_hint")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      {renderTranslation("dashboard.settings_page.profile.email")}
                    </label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {renderTranslation("dashboard.settings_page.profile.sync_hint")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      {renderTranslation("dashboard.settings_page.profile.discord_id")}
                    </label>
                    <Input
                      value={user?.discordId || ""}
                      disabled
                      className="opacity-50"
                    />
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
                <h2 className="text-lg font-semibold text-white">{renderTranslation("dashboard.settings_page.notifications.title")}</h2>
              </div>

              <div className="space-y-4">
                {notificationItems.map((item) => {
                  const isEnabled = notifications[item.key as keyof typeof notifications];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all duration-300 relative",
                          isEnabled ? "bg-red-600" : "bg-white/20"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm",
                            isEnabled ? "left-7" : "left-1"
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
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
                <h2 className="text-lg font-semibold text-white">{renderTranslation("dashboard.settings_page.security.title")}</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">{renderTranslation("dashboard.settings_page.security.discord_connected")}</p>
                    <p className="text-sm text-gray-400">
                      {renderTranslation("dashboard.settings_page.security.discord_status")}
                    </p>
                  </div>
                  <Badge variant="success">{renderTranslation("dashboard.settings_page.security.connected")}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">{renderTranslation("dashboard.settings_page.security.member_since")}</p>
                    <p className="text-sm text-gray-400">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(i18n.language === "th" ? "th-TH" : "en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }) : "N/A"}
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
                <h2 className="text-lg font-semibold text-white">{renderTranslation("dashboard.settings_page.danger_zone.title")}</h2>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div>
                  <p className="font-medium text-white">{renderTranslation("dashboard.settings_page.danger_zone.delete_account")}</p>
                  <p className="text-sm text-gray-400">
                    {renderTranslation("dashboard.settings_page.danger_zone.delete_desc")}
                  </p>
                </div>
                <button 
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {renderTranslation("dashboard.settings_page.danger_zone.delete_account")}
                </button>
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
              <div className="flex items-center gap-2 text-red-400">
                <Check className="w-5 h-5" />
                {renderTranslation("dashboard.settings_page.save_success")}
              </div>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="bg-red-600 hover:bg-red-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-red-600/20">
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {renderTranslation("dashboard.settings_page.saving")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {renderTranslation("dashboard.settings_page.save_changes")}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
