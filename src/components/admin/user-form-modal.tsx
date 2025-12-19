"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Shield, Crown, User } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";

interface UserData {
  id?: string;
  username: string;
  email: string;
  discordId: string;
  role: "user" | "vip" | "admin";
  balance: number;
  status: "active" | "banned";
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
  role: "user",
  balance: 0,
  status: "active",
};

export function UserFormModal({ isOpen, onClose, user, onSave }: UserFormModalProps) {
  const [formData, setFormData] = useState<UserData>(defaultUser);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!user?.id;

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData(defaultUser);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
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
                {isEditing ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">ชื่อผู้ใช้ *</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">อีเมล *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Discord ID</label>
                <Input
                  value={formData.discordId}
                  onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                  placeholder="123456789012345678"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">บทบาท</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserData["role"] })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                  >
                    <option value="user">User</option>
                    <option value="vip">VIP</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserData["status"] })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                  >
                    <option value="active">ใช้งาน</option>
                    <option value="banned">ถูกแบน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">ยอดเงินในบัญชี (บาท)</label>
                <Input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  min={0}
                />
              </div>

              {/* Role Preview */}
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-sm text-gray-400 mb-2">สิทธิ์ตามบทบาท:</p>
                <div className="flex items-center gap-2">
                  {formData.role === "admin" && (
                    <>
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-white text-sm">เข้าถึง Admin Panel, จัดการทุกอย่าง</span>
                    </>
                  )}
                  {formData.role === "vip" && (
                    <>
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm">ส่วนลดพิเศษ, สิทธิ์ก่อนใคร</span>
                    </>
                  )}
                  {formData.role === "user" && (
                    <>
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-white text-sm">สิทธิ์ผู้ใช้ทั่วไป</span>
                    </>
                  )}
                </div>
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
                      {isEditing ? "บันทึกการแก้ไข" : "เพิ่มผู้ใช้"}
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
