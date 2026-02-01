"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Star,
  Coins,
  Save,
  Loader2,
  AlertCircle,
  Gift,
  Target,
  Palette
} from "lucide-react";
import { Button, Card, Modal, Input } from "@/components/ui";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { luckyWheelApi, adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { createLogger } from "@/lib/logger";

const luckyWheelLogger = createLogger("admin:lucky-wheel");

interface Reward {
  id: string;
  name: string;
  type: "POINTS" | "BALANCE";
  value: number;
  probability: number;
  color: string;
  isActive: boolean;
}

export default function LuckyWheelAdminPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);
  const [saving, setSaving] = useState(false);
  const [isWheelEnabled, setIsWheelEnabled] = useState<boolean>(true);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchRewards();
    fetchWheelStatus();
  }, []);

  const fetchWheelStatus = async () => {
    try {
      const response = await adminApi.getSettings();
      const res = response as unknown as { data: { success: boolean; data: Record<string, number | boolean | string | null> } };
      if (res.data?.success && res.data.data) {
        setIsWheelEnabled(res.data.data.LUCKY_WHEEL_ENABLED !== false);
      }
    } catch (error) {
      luckyWheelLogger.error('Failed to fetch wheel status', { error });
    }
  };

  const handleToggleWheel = async () => {
    setToggling(true);
    try {
      const newValue = !isWheelEnabled;
      await adminApi.updateSetting("LUCKY_WHEEL_ENABLED", newValue);
      setIsWheelEnabled(newValue);
    } catch (error) {
      luckyWheelLogger.error('Failed to toggle wheel', { error });
    } finally {
      setToggling(false);
    }
  };

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const response = await luckyWheelApi.adminGetAllRewards();
      const res = response as unknown as { data: { success: boolean; data: Reward[] } };
      if (res.data && res.data.success) {
        setRewards(res.data.data || []);
      }
    } catch (error) {
      luckyWheelLogger.error('Failed to fetch rewards', { error });
    } finally {
      setLoading(false);
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editingReward?.name || editingReward.name.trim().length < 1) {
      newErrors.name = t("lucky_wheel.errors.name_required");
    }

    if (editingReward?.value === undefined || editingReward?.value === null || editingReward.value < 0) {
      newErrors.value = mounted ? t("lucky_wheel.errors.value_invalid") : "";
    }

    if (editingReward?.probability === undefined || editingReward?.probability === null || editingReward.probability < 0 || editingReward.probability > 1) {
      newErrors.probability = mounted ? t("lucky_wheel.errors.probability_invalid") : "";
    }

    if (!editingReward?.color || !/^#[0-9A-F]{6}$/i.test(editingReward.color)) {
      newErrors.color = mounted ? t("lucky_wheel.errors.color_invalid") : "";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenModal = (reward?: Reward) => {
    setEditingReward(reward || {
      name: "",
      type: "POINTS",
      value: 0,
      probability: 0.1,
      color: "#EF4444",
      isActive: true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setErrors({});
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingReward?.id) {
        await luckyWheelApi.adminUpdateReward(editingReward.id, editingReward);
      } else {
        await luckyWheelApi.adminCreateReward(editingReward!);
      }
      setIsModalOpen(false);
      fetchRewards();
    } catch (error: unknown) {
      luckyWheelLogger.error('Failed to save reward', { error });
      const err = error as { message?: string };
      alert(err.message || (mounted ? t("lucky_wheel.errors.save_failed") : ""));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await luckyWheelApi.adminDeleteReward(confirmDelete.id);
      fetchRewards();
    } catch (error) {
      luckyWheelLogger.error('Failed to delete reward', { error });
    }
  };

  const totalProb = Array.isArray(rewards) ? rewards.reduce((sum, r) => sum + r.probability, 0) : 0;
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
            <Trophy className="w-8 h-8 text-yellow-500" />
            {mounted ? t("lucky_wheel.title") : ""}
          </h1>
          <p className="text-gray-400 mt-1">{mounted ? t("lucky_wheel.subtitle") : ""}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center justify-between gap-4 bg-white/5 px-5 rounded-2xl border border-white/10 shadow-inner min-w-[200px] h-14">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{mounted ? t("lucky_wheel.system_status") : ""}</span>
              <span className={cn("text-xs font-bold uppercase tracking-tight", isWheelEnabled ? "text-green-500" : "text-red-500")}>
                {mounted ? (isWheelEnabled ? t("lucky_wheel.enabled") : t("lucky_wheel.disabled")) : ""}
              </span>
            </div>
            <button
              onClick={handleToggleWheel}
              disabled={toggling}
              className={cn(
                "relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none shadow-lg",
                isWheelEnabled ? "bg-red-600" : "bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm",
                  isWheelEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-red-600 hover:bg-red-500 h-14 rounded-2xl font-black uppercase tracking-widest text-xs px-8 shadow-lg shadow-red-600/20 w-full sm:w-auto transition-all duration-300 shrink-0">
            <Plus className="w-5 h-5 mr-2" />
            <span>{mounted ? t("lucky_wheel.add_reward") : ""}</span>
          </Button>
        </div>
      </div>

      {/* Probabilities Alert */}
      {Math.abs(totalProb - 1) > 0.001 && rewards.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-yellow-500">{mounted ? t("lucky_wheel.probability_warning") : ""}</h4>
            <p className="text-xs text-gray-400">
              {mounted ? t("lucky_wheel.probability_warning_desc", { total: totalProb.toFixed(3) }) : ""}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <Card key={reward.id} className="p-4 border-white/10 relative overflow-hidden group">
              <div
                className="absolute top-0 right-0 w-16 h-16 opacity-10 -mr-4 -mt-4 transition-opacity group-hover:opacity-20"
                style={{ backgroundColor: reward.color, borderRadius: '100%' }}
              />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: reward.color }}
                  >
                    {reward.type === "POINTS" ? (
                      <Star className="w-5 h-5 text-black fill-black" />
                    ) : (
                      <Coins className="w-5 h-5 text-black" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{reward.name}</h3>
                    <p className="text-xs text-gray-500 uppercase font-black">
                      {reward.type === 'POINTS' ? (mounted ? t("lucky_wheel.points_label") : "") : (mounted ? t("lucky_wheel.balance_label") : "")} · {reward.value}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(reward as Reward)}
                    className="p-2 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ isOpen: true, id: reward.id })}
                    className="p-2 rounded-xl text-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 relative z-10">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{mounted ? t("lucky_wheel.probability") : ""}</span>
                  <span className="text-white font-bold">{(reward.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: reward.color, width: `${reward.probability * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReward?.id ? t("lucky_wheel.edit_reward") : t("lucky_wheel.add_new_reward")}
      >
        <div className="p-6 space-y-8">
          {/* section: Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Gift className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">{t("lucky_wheel.reward_info")}</h3>
            </div>

            <div className="space-y-2">
              <label className={cn("text-xs font-bold uppercase tracking-wider", errors.name ? "text-red-500" : "text-gray-500")}>
                {t("lucky_wheel.reward_name")} *
              </label>
              <Input
                value={editingReward?.name || ""}
                onChange={(e) => {
                  setEditingReward(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder={t("lucky_wheel.reward_name_placeholder")}
                error={errors.name}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">{t("lucky_wheel.type")}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingReward(prev => ({ ...prev, type: "POINTS" }))}
                    className={cn(
                      "flex items-center justify-center gap-2 h-11 rounded-xl border transition-all font-bold text-sm",
                      editingReward?.type === "POINTS"
                        ? "bg-red-500/10 border-red-500 text-red-500"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <Star className="w-4 h-4" />
                    {mounted ? t("lucky_wheel.type_points") : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingReward(prev => ({ ...prev, type: "BALANCE" }))}
                    className={cn(
                      "flex items-center justify-center gap-2 h-11 rounded-xl border transition-all font-bold text-sm",
                      editingReward?.type === "BALANCE"
                        ? "bg-red-500/10 border-red-500 text-red-500"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <Coins className="w-4 h-4" />
                    {mounted ? t("lucky_wheel.type_balance") : ""}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn("text-xs font-bold uppercase tracking-wider", errors.value ? "text-red-500" : "text-gray-500")}>
                  {mounted ? t("lucky_wheel.value") : ""} *
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={editingReward?.value ?? 0}
                    onChange={(e) => {
                      setEditingReward(prev => ({ ...prev, value: parseFloat(e.target.value) }));
                      if (errors.value) setErrors({ ...errors, value: "" });
                    }}
                    error={errors.value}
                    required
                    className="pr-10"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    {editingReward?.type === "POINTS" ? <Star className="w-4 h-4" /> : <span className="text-xs font-bold text-gray-500">฿</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* section: Mechanics */}
          <div className="space-y-4 p-5 rounded-2xl bg-white/2 border border-white/5">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Target className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">{mounted ? t("lucky_wheel.settings_chances") : ""}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={cn("text-xs font-bold uppercase tracking-wider", errors.probability ? "text-red-500" : "text-gray-500")}>
                  {mounted ? t("lucky_wheel.probability") : ""} *
                </label>
                <div className="relative group">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={editingReward?.probability ?? 0}
                    onChange={(e) => {
                      setEditingReward(prev => ({ ...prev, probability: parseFloat(e.target.value) }));
                      if (errors.probability) setErrors({ ...errors, probability: "" });
                    }}
                    error={errors.probability}
                    required
                    className="pl-10"
                  />
                  <Target className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{mounted ? t("lucky_wheel.probability_hint", { percent: ((editingReward?.probability || 0) * 100).toFixed(1) }) : ""}</p>
              </div>
              <div className="space-y-2">
                <label className={cn("text-xs font-bold uppercase tracking-wider", errors.color ? "text-red-500" : "text-gray-500")}>
                  {mounted ? t("lucky_wheel.color") : ""} *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Input
                      value={editingReward?.color || "#EF4444"}
                      onChange={(e) => {
                        setEditingReward(prev => ({ ...prev, color: e.target.value }));
                        if (errors.color) setErrors({ ...errors, color: "" });
                      }}
                      error={errors.color}
                      className="pl-10 uppercase font-mono"
                    />
                    <Palette className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                    <div
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg border border-white/10 overflow-hidden shadow-sm"
                    >
                      <input
                        type="color"
                        value={editingReward?.color || "#EF4444"}
                        onChange={(e) => {
                          setEditingReward(prev => ({ ...prev, color: e.target.value }));
                          if (errors.color) setErrors({ ...errors, color: "" });
                        }}
                        className="absolute inset-[-5px] w-[200%] h-[200%] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 px-2">
              <label className="flex items-center gap-3 cursor-pointer group w-fit">
                <div className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                  editingReward?.isActive ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/20" : "border-white/20 group-hover:border-green-500/50"
                )}>
                  <input
                    type="checkbox"
                    checked={editingReward?.isActive}
                    onChange={(e) => setEditingReward(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="hidden"
                  />
                  {editingReward?.isActive && <Save className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm font-bold text-gray-300">{mounted ? t("lucky_wheel.enable_reward") : ""}</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="px-8 font-bold text-gray-400 hover:text-white">
              {mounted ? t("common.cancel") : ""}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-10 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest shadow-xl shadow-red-600/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {mounted ? (editingReward?.id ? t("lucky_wheel.save_changes") : t("lucky_wheel.add_reward")) : ""}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title={mounted ? (confirmDelete.id ? t("lucky_wheel.confirm_delete_title") : "") : ""}
        message={mounted ? t("lucky_wheel.confirm_delete_msg") : ""}
        confirmText={mounted ? t("lucky_wheel.delete_reward") : ""}
        type="danger"
      />
    </div>
  );
}
