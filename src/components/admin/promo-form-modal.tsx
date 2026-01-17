"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Percent, DollarSign, Ticket, Settings, Calendar, MousePointer2 } from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PromoCode {
  id?: string;
  code: string;
  discount: number;
  type: "PERCENTAGE" | "FIXED";
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
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
  type: "PERCENTAGE",
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!promo?.id;

  useEffect(() => {
    if (promo) {
      setFormData({
        ...promo,
        expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split("T")[0] : null,
      });
    } else {
      setFormData(defaultPromo);
    }
    setErrors({});
  }, [promo, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.code || formData.code.trim().length < 3) {
      newErrors.code = "รหัสส่วนลดต้องมีความยาวอย่างน้อย 3 ตัวอักษร";
    }
    
    if (formData.discount === undefined || formData.discount === null || formData.discount <= 0) {
      newErrors.discount = "ส่วนลดต้องมากกว่า 0";
    } else if (formData.type === "PERCENTAGE" && formData.discount > 100) {
      newErrors.discount = "ส่วนลดแบบเปอร์เซ็นต์ต้องไม่เกิน 100%";
    }

    if (formData.minPurchase !== undefined && formData.minPurchase !== null && formData.minPurchase < 0) {
      newErrors.minPurchase = "ยอดซื้อขั้นต่ำต้องไม่น้อยกว่า 0";
    }

    if (formData.maxDiscount !== undefined && formData.maxDiscount !== null && formData.maxDiscount <= 0) {
      newErrors.maxDiscount = "ส่วนลดสูงสุดต้องมากกว่า 0";
    }

    if (formData.usageLimit !== undefined && formData.usageLimit !== null && formData.usageLimit < 1) {
      newErrors.usageLimit = "จำนวนสิทธิ์การใช้งานต้องอย่างน้อย 1 ครั้ง";
    }

    if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
      newErrors.expiresAt = "วันหมดอายุต้องเป็นเวลาในอนาคต";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submissionData = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };
      await onSave(submissionData as any);
      onClose();
    } catch (error: any) {
      console.error("Error saving promo:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการบันทึกโค้ดส่วนลด");
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
          className="relative w-full max-w-2xl flex flex-col"
        >
          <Card className="flex flex-col max-h-[90vh] overflow-hidden border-white/5 bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    {isEditing ? "Edit Promo Code" : "Create New Promo"}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest opacity-60">
                    Configure discounts and usage limits
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

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              {/* Basic Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Ticket className="w-4 h-4 text-red-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Promo Code</label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. NEWYEAR2024"
                        className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 font-mono"
                        error={errors.code}
                      />
                      <Button type="button" variant="secondary" onClick={generateCode} className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest">
                        Random
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Discount Value</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                        className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 font-bold"
                        error={errors.discount}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {formData.type === "PERCENTAGE" ? <Percent className="w-4 h-4" /> : <span className="text-sm font-bold">฿</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "PERCENTAGE", label: "Percentage (%)", icon: Percent },
                    { id: "FIXED", label: "Fixed Amount (฿)", icon: DollarSign },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.id as any })}
                      className={cn(
                        "flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all group",
                        formData.type === t.id 
                          ? "bg-red-500/10 border-red-500/40 text-red-500" 
                          : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"
                      )}
                    >
                      <t.icon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditions Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-blue-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Usage Conditions</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Min Purchase (฿)</label>
                    <Input
                      type="number"
                      value={formData.minPurchase || ""}
                      onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value ? Number(e.target.value) : null })}
                      placeholder="No Minimum"
                      className="bg-white/5 border-white/10 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Max Discount (฿)</label>
                    <Input
                      type="number"
                      value={formData.maxDiscount || ""}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Unlimited"
                      disabled={formData.type === "FIXED"}
                      className="bg-white/5 border-white/10 rounded-xl py-6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Usage Limit</label>
                    <Input
                      type="number"
                      value={formData.usageLimit || ""}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Unlimited"
                      className="bg-white/5 border-white/10 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Expiration Date</label>
                    <Input
                      type="date"
                      value={formData.expiresAt || ""}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || null })}
                      className="bg-white/5 border-white/10 rounded-xl py-6 scheme-dark"
                    />
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="flex items-center justify-between p-6 rounded-4xl bg-white/2 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    formData.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"
                  )}>
                    <Save className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Active Status</h4>
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Enable or disable this promo code</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-red-600 transition-colors"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={onClose} 
                  disabled={isLoading}
                  className="flex-1 text-gray-400 hover:text-white uppercase font-black text-[10px] tracking-widest py-8"
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 py-8 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? "Update Promo" : "Publish Promo"}</span>
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
