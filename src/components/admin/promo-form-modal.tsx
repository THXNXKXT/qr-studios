"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Percent, DollarSign } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";

interface PromoCode {
  id?: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
}

interface PromoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  promo?: PromoCode | null;
  onSave: (promo: PromoCode) => Promise<void>;
}

const defaultPromo: PromoCode = {
  code: "",
  discount: 10,
  type: "percentage",
  minPurchase: null,
  maxDiscount: null,
  usageLimit: null,
  usedCount: 0,
  isActive: true,
  expiresAt: null,
};

export function PromoFormModal({ isOpen, onClose, promo, onSave }: PromoFormModalProps) {
  const [formData, setFormData] = useState<PromoCode>(defaultPromo);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!promo?.id;

  useEffect(() => {
    if (promo) {
      setFormData(promo);
    } else {
      setFormData(defaultPromo);
    }
  }, [promo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving promo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
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
          className="relative w-full max-w-lg"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "แก้ไขโค้ดส่วนลด" : "สร้างโค้ดส่วนลดใหม่"}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">โค้ด *</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    required
                    className="font-mono"
                  />
                  <Button type="button" variant="secondary" onClick={generateCode}>
                    สุ่ม
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">ประเภทส่วนลด</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PromoCode["type"] })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                  >
                    <option value="percentage">เปอร์เซ็นต์ (%)</option>
                    <option value="fixed">จำนวนเงิน (฿)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    ส่วนลด {formData.type === "percentage" ? "(%)" : "(฿)"} *
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                      min={0}
                      max={formData.type === "percentage" ? 100 : undefined}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {formData.type === "percentage" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">ยอดขั้นต่ำ (บาท)</label>
                  <Input
                    type="number"
                    value={formData.minPurchase || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minPurchase: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    min={0}
                    placeholder="ไม่จำกัด"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">ส่วนลดสูงสุด (บาท)</label>
                  <Input
                    type="number"
                    value={formData.maxDiscount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    min={0}
                    placeholder="ไม่จำกัด"
                    disabled={formData.type === "fixed"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">จำนวนครั้งที่ใช้ได้</label>
                  <Input
                    type="number"
                    value={formData.usageLimit || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    min={0}
                    placeholder="ไม่จำกัด"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">วันหมดอายุ</label>
                  <Input
                    type="date"
                    value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiresAt: e.target.value ? new Date(e.target.value) : null,
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
                  <span className="text-white">เปิดใช้งาน</span>
                </label>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-sm text-gray-400 mb-2">ตัวอย่าง:</p>
                <div className="flex items-center gap-2">
                  <code className="text-red-400 font-mono font-bold text-lg">{formData.code || "CODE"}</code>
                  <span className="text-white">
                    ลด {formData.discount}{formData.type === "percentage" ? "%" : " บาท"}
                    {formData.maxDiscount && formData.type === "percentage" && ` (สูงสุด ${formData.maxDiscount} บาท)`}
                  </span>
                </div>
                {formData.minPurchase && (
                  <p className="text-sm text-gray-500 mt-1">ยอดขั้นต่ำ {formData.minPurchase} บาท</p>
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
                      {isEditing ? "บันทึกการแก้ไข" : "สร้างโค้ด"}
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
