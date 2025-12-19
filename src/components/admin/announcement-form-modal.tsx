"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Plus, Image as ImageIcon, Video, Trash2 } from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/ui";

interface Media {
  type: "image" | "video";
  url: string;
}

interface Announcement {
  id?: string;
  title: string;
  content: string;
  media: Media[];
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
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
  const [formData, setFormData] = useState<Announcement>(defaultAnnouncement);
  const [isLoading, setIsLoading] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");

  const isEditing = !!announcement?.id;

  useEffect(() => {
    if (announcement) {
      setFormData(announcement);
    } else {
      setFormData(defaultAnnouncement);
    }
  }, [announcement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving announcement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMedia = () => {
    if (newMediaUrl) {
      setFormData({
        ...formData,
        media: [...formData.media, { type: newMediaType, url: newMediaUrl }],
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">หัวข้อ *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="🎉 Flash Sale สิ้นปี!"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">เนื้อหา</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="รายละเอียดประกาศ..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>

              {/* Media */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">สื่อ (รูปภาพ/วิดีโอ)</label>
                <div className="flex gap-2 mb-3">
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as "image" | "video")}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                  >
                    <option value="image">รูปภาพ</option>
                    <option value="video">วิดีโอ</option>
                  </select>
                  <Input
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="URL..."
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={addMedia}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.media.length > 0 && (
                  <div className="space-y-2">
                    {formData.media.map((media, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          {media.type === "image" ? (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Video className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Badge variant="secondary" className="mb-1">
                            {media.type === "image" ? "รูปภาพ" : "วิดีโอ"}
                          </Badge>
                          <p className="text-sm text-gray-400 truncate">{media.url}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMedia(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">วันที่เริ่ม</label>
                  <Input
                    type="datetime-local"
                    value={formData.startsAt ? new Date(formData.startsAt).toISOString().slice(0, 16) : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startsAt: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">วันที่สิ้นสุด</label>
                  <Input
                    type="datetime-local"
                    value={formData.endsAt ? new Date(formData.endsAt).toISOString().slice(0, 16) : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endsAt: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-white">แสดงประกาศ</span>
                </label>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400 mb-2">ตัวอย่าง:</p>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {formData.title || "หัวข้อประกาศ"}
                </h3>
                <p className="text-gray-400 text-sm">
                  {formData.content || "เนื้อหาประกาศ..."}
                </p>
                {formData.media.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    📎 {formData.media.length} ไฟล์แนบ
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={onClose}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? "บันทึกการแก้ไข" : "สร้างประกาศ"}
                    </>
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
