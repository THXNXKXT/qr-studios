"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Shield, Crown, User, Mail, Hash, Wallet, Star, Ban, CheckCircle2 } from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { createLogger } from "@/lib/logger";

const userFormLogger = createLogger("admin:user-form");

interface UserData {
  id?: string;
  username: string;
  email: string | null;
  discordId: string;
  role: "USER" | "VIP" | "ADMIN" | "MODERATOR";
  balance: number;
  points: number;
  isBanned: boolean;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserData | null;
  onSave: (user: UserData) => Promise<void>;
}

const defaultUser: UserData = {
  username: "",
  email: "",
  discordId: "",
  role: "USER",
  balance: 0,
  points: 0,
  isBanned: false,
};

export function UserFormModal({ isOpen, onClose, user, onSave }: UserFormModalProps) {
  const { t } = useTranslation("admin");
  const [formData, setFormData] = useState<UserData>(defaultUser);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!user?.id;

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData(defaultUser);
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username || formData.username.trim().length < 2) newErrors.username = t("users.errors.username_length");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t("users.errors.email_invalid");
    if (!formData.discordId || formData.discordId.trim().length < 1) newErrors.discordId = t("users.errors.discord_id_required");

    if (formData.balance < 0) newErrors.balance = t("users.errors.balance_negative");
    if (formData.points < 0) newErrors.points = t("users.errors.points_negative");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      userFormLogger.error('Error saving user', { error });
      alert(error.message || t("users.errors.save_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl flex flex-col max-h-[90vh]"
        >
          <Card className="flex flex-col overflow-hidden border-white/5 bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />

            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/2 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    {isEditing ? t("users.modals.form.edit_title") : t("users.modals.form.create_title")}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest opacity-60">
                    {t("users.modals.form.subtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-blue-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("users.modals.form.section_profile")}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("users.modals.form.username")}</label>
                    <div className="relative">
                      <Input
                        value={formData.username || ""}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder={t("users.modals.form.placeholders.username")}
                        className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 pl-12"
                        error={errors.username}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("users.modals.form.email")}</label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t("users.modals.form.placeholders.email")}
                        className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 pl-12"
                        error={errors.email}
                        disabled={isEditing}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("users.modals.form.discord_id")}</label>
                  <div className="relative">
                    <Input
                      value={formData.discordId || ""}
                      onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                      placeholder={t("users.modals.form.placeholders.discord_id")}
                      className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 pl-12 font-mono"
                      error={errors.discordId}
                      disabled={isEditing}
                    />
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("users.modals.form.section_permissions")}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("users.modals.form.system_role")}</label>
                    <div className="relative">
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50 appearance-none transition-all font-bold text-sm uppercase tracking-widest"
                      >
                        <option value="USER" className="bg-[#111]">{t("users.roles.user")}</option>
                        <option value="VIP" className="bg-[#111]">{t("users.roles.vip")}</option>
                        <option value="MODERATOR" className="bg-[#111]">{t("users.roles.moderator")}</option>
                        <option value="ADMIN" className="bg-[#111]">{t("users.roles.admin")}</option>
                      </select>
                      <Crown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("users.modals.form.account_status")}</label>
                    <div className="relative">
                      <select
                        value={formData.isBanned ? "banned" : "active"}
                        onChange={(e) => setFormData({ ...formData, isBanned: e.target.value === "banned" })}
                        className={cn(
                          "w-full px-4 py-3.5 border rounded-xl focus:outline-none appearance-none transition-all font-bold text-sm uppercase tracking-widest",
                          formData.isBanned
                            ? "bg-red-500/10 border-red-500/40 text-red-500"
                            : "bg-green-500/10 border-green-500/40 text-green-500"
                        )}
                      >
                        <option value="active" className="bg-[#111] text-green-500">{t("users.modals.form.status_operational")}</option>
                        <option value="banned" className="bg-[#111] text-red-500">{t("users.modals.form.status_restricted")}</option>
                      </select>
                      <Ban className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("users.modals.form.credits")}</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                        className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 pl-12 font-bold"
                        error={errors.balance}
                      />
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("users.modals.form.reward_points")}</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                        className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 pl-12 font-bold"
                        error={errors.points}
                      />
                      <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-8 py-6 rounded-2xl text-gray-400 hover:text-white uppercase font-black text-[10px] tracking-widest transition-all"
                >
                  {t("users.modals.form.btn_discard")}
                </button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 py-8 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("users.modals.form.btn_syncing")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? t("users.modals.form.btn_update") : t("users.modals.form.btn_create")}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
