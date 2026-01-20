"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Plus, Image as ImageIcon, Video, Trash2, Upload, Calendar, Megaphone, Layout } from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Announcement {
  id?: string;
  title: string;
  content: string;
  media: string[];
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface SelectedFile {
  file: File;
  preview: string;
}

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: Announcement | null;
  onSave: (announcement: Announcement) => Promise<void>;
}

const defaultAnnouncement: Announcement = {
  title: "",
  content: "",
  media: [],
  isActive: true,
  startsAt: null,
  endsAt: null,
};

export function AnnouncementFormModal({ isOpen, onClose, announcement, onSave }: AnnouncementFormModalProps) {
  const { t } = useTranslation("admin");
  const [formData, setFormData] = useState<Announcement>(defaultAnnouncement);
  const [isLoading, setIsLoading] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<SelectedFile[]>([]);

  const isEditing = !!announcement?.id;

  useEffect(() => {
    if (announcement) {
      setFormData({
        ...announcement,
        startsAt: announcement.startsAt ? new Date(announcement.startsAt).toISOString().slice(0, 16) : null,
        endsAt: announcement.endsAt ? new Date(announcement.endsAt).toISOString().slice(0, 16) : null,
      });
    } else {
      setFormData(defaultAnnouncement);
    }
    setErrors({});
    setPendingFiles([]);
  }, [announcement, isOpen]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [pendingFiles]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title || formData.title.trim().length < 1) newErrors.title = t("announcements.errors.title_required");
    if (!formData.content || formData.content.trim().length < 1) newErrors.content = t("announcements.errors.content_required");

    if (formData.startsAt && formData.endsAt) {
      if (new Date(formData.startsAt) >= new Date(formData.endsAt)) {
        newErrors.endsAt = t("announcements.errors.ends_after_starts");
      }
    }

    if (formData.endsAt && new Date(formData.endsAt) <= new Date()) {
      newErrors.endsAt = t("announcements.errors.ends_future");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newSelectedFiles = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : ""
    }));

    setPendingFiles(prev => [...prev, ...newSelectedFiles]);
    e.target.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { adminApi } = await import("@/lib/api");
      let currentMedia = [...formData.media];

      // Upload pending files
      if (pendingFiles.length > 0) {
        const uploadPromises = pendingFiles.map(f => adminApi.uploadFile(f.file, 'announcements'));
        const results = await Promise.all(uploadPromises);
        results.forEach(res => {
          if (res.data && (res.data as any).success) {
            currentMedia.push((res.data as any).data.url);
          }
        });
      }

      const submissionData = {
        ...formData,
        media: currentMedia,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
      };

      await onSave(submissionData as any);
      onClose();
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      alert(error.message || t("announcements.errors.save_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const addMedia = () => {
    if (newMediaUrl) {
      setFormData({
        ...formData,
        media: [...formData.media, newMediaUrl],
      });
      setNewMediaUrl("");
    }
  };

  const removeMedia = (index: number) => {
    setFormData({
      ...formData,
      media: formData.media.filter((_, i) => i !== index),
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl flex flex-col max-h-[90vh]"
        >
          <Card className="flex flex-col overflow-hidden border-white/5 bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-4xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    {isEditing ? t("announcements.modals.form.edit_title") : t("announcements.modals.form.create_title")}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest opacity-60">
                    {t("announcements.modals.form.subtitle")}
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

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-8 space-y-8">
                {/* Content Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-4 h-4 text-red-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("announcements.modals.form.message_details")}</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("announcements.modals.form.headline")}</label>
                      <Input
                        value={formData.title || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          if (errors.title) setErrors({ ...errors, title: "" });
                        }}
                        placeholder={t("announcements.modals.form.placeholders.headline")}
                        className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 font-bold"
                        error={errors.title}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("announcements.modals.form.content")}</label>
                      <textarea
                        value={formData.content || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, content: e.target.value });
                          if (errors.content) setErrors({ ...errors, content: "" });
                        }}
                        placeholder={t("announcements.modals.form.placeholders.content")}
                        rows={6}
                        className={cn(
                          "w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/50 resize-none transition-all text-sm leading-relaxed",
                          errors.content ? "border-red-500/50 bg-red-500/5" : "border-white/10"
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Media Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Layout className="w-4 h-4 text-blue-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("announcements.modals.form.visual_media")}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="aspect-video w-full rounded-3xl border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                        <Upload className="w-8 h-8 text-gray-600 group-hover:text-blue-500 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("announcements.modals.form.drop_assets")}</span>
                      </label>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("announcements.modals.form.paste_url")}</label>
                        <div className="flex gap-2">
                          <Input
                            value={newMediaUrl || ""}
                            onChange={(e) => setNewMediaUrl(e.target.value)}
                            placeholder="https://..."
                            className="bg-white/5 border-white/10 rounded-xl py-5"
                          />
                          <Button type="button" variant="secondary" onClick={addMedia} className="px-6 rounded-xl font-black uppercase text-[10px] tracking-widest h-[44px]">
                            {t("common.add")}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[250px] overflow-y-auto no-scrollbar">
                      <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest ml-1">{t("announcements.modals.form.active_attachments")}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {pendingFiles.map((f, index) => (
                          <div key={"pending-" + index} className="relative aspect-square rounded-2xl bg-white/5 overflow-hidden group border border-blue-500/40">
                            {f.preview && <img src={f.preview} alt="" className="w-full h-full object-cover opacity-40" />}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">{t("products.modals.form.media.pending")}</span>
                            </div>
                            <button type="button" onClick={() => removePendingFile(index)} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {formData.media.map((url, index) => (
                          <div key={"existing-" + index} className="relative aspect-square rounded-2xl bg-white/5 overflow-hidden group border border-white/10">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeMedia(index)} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Section */}
                <div className="p-8 rounded-4xl bg-white/2 border border-white/5 space-y-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("announcements.modals.form.schedule_title")}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("announcements.modals.form.go_live_date")}</label>
                      <Input
                        type="datetime-local"
                        value={formData.startsAt || ""}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        className="bg-white/5 border-white/10 rounded-xl py-6 scheme-dark font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("announcements.modals.form.end_date")}</label>
                      <Input
                        type="datetime-local"
                        value={formData.endsAt || ""}
                        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                        className="bg-white/5 border-white/10 rounded-xl py-6 scheme-dark font-bold text-sm"
                        error={errors.endsAt}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        formData.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"
                      )}>
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{t("announcements.modals.form.public_visibility")}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-5 after:transition-all peer-checked:bg-red-600 transition-colors"></div>
                    </label>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 text-gray-400 hover:text-white uppercase font-black text-[10px] tracking-widest py-8"
                  >
                    {t("common.discard")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 py-8 rounded-2xl font-black uppercase tracking-widest transition-all"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t("common.broadcasting")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        <span>{isEditing ? t("announcements.modals.form.update_btn") : t("announcements.modals.form.publish_btn")}</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
