"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Copy,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { PromoFormModal, ConfirmModal } from "@/components/admin";
import { formatPrice } from "@/lib/utils";

type PromoCode = {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
};

// Mock promo codes
const initialPromoCodes: PromoCode[] = [
  {
    id: "1",
    code: "WELCOME10",
    discount: 10,
    type: "percentage",
    minPurchase: null,
    maxDiscount: 500,
    usageLimit: null,
    usedCount: 156,
    isActive: true,
    expiresAt: null,
  },
  {
    id: "2",
    code: "SAVE50",
    discount: 50,
    type: "fixed",
    minPurchase: 500,
    maxDiscount: null,
    usageLimit: 100,
    usedCount: 45,
    isActive: true,
    expiresAt: new Date("2024-12-31"),
  },
  {
    id: "3",
    code: "VIP20",
    discount: 20,
    type: "percentage",
    minPurchase: 1000,
    maxDiscount: 1000,
    usageLimit: 50,
    usedCount: 50,
    isActive: false,
    expiresAt: null,
  },
  {
    id: "4",
    code: "NEWYEAR2025",
    discount: 25,
    type: "percentage",
    minPurchase: null,
    maxDiscount: 750,
    usageLimit: 200,
    usedCount: 0,
    isActive: true,
    expiresAt: new Date("2025-01-07"),
  },
  {
    id: "5",
    code: "FLASH100",
    discount: 100,
    type: "fixed",
    minPurchase: 300,
    maxDiscount: null,
    usageLimit: 50,
    usedCount: 32,
    isActive: true,
    expiresAt: new Date("2024-12-15"),
  },
];

export default function AdminPromoCodesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);

  const filteredCodes = promoCodes.filter((code) => {
    const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive =
      filterActive === "all" ||
      (filterActive === "active" && code.isActive) ||
      (filterActive === "inactive" && !code.isActive);
    return matchesSearch && matchesActive;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleAddPromo = () => {
    setSelectedPromo(null);
    setIsFormOpen(true);
  };

  const handleEditPromo = (promo: PromoCode) => {
    setSelectedPromo(promo);
    setIsFormOpen(true);
  };

  const handleDeletePromo = (promo: PromoCode) => {
    setSelectedPromo(promo);
    setIsDeleteOpen(true);
  };

  const handleSavePromo = async (promoData: any) => {
    if (selectedPromo) {
      setPromoCodes(promoCodes.map(p => p.id === selectedPromo.id ? { ...p, ...promoData } : p));
    } else {
      const newPromo: PromoCode = {
        ...promoData,
        id: `promo-${Date.now()}`,
        usedCount: 0,
      };
      setPromoCodes([newPromo, ...promoCodes]);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedPromo) {
      setPromoCodes(promoCodes.filter(p => p.id !== selectedPromo.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">จัดการโค้ดส่วนลด</h1>
          <p className="text-gray-400">สร้างและจัดการโค้ดส่วนลด</p>
        </div>
        <Button onClick={handleAddPromo}>
          <Plus className="w-4 h-4" />
          สร้างโค้ดใหม่
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "โค้ดทั้งหมด", value: promoCodes.length, color: "text-white" },
          { label: "ใช้งานอยู่", value: promoCodes.filter(c => c.isActive).length, color: "text-green-400" },
          { label: "ใช้ไปแล้ว", value: promoCodes.reduce((sum, c) => sum + c.usedCount, 0), color: "text-blue-400" },
          { label: "หมดอายุ", value: promoCodes.filter(c => c.expiresAt && c.expiresAt < new Date()).length, color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="ค้นหาโค้ดส่วนลด..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((status) => (
              <Button
                key={status}
                variant={filterActive === status ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterActive(status)}
              >
                {status === "all" ? "ทั้งหมด" : status === "active" ? "ใช้งาน" : "ปิดใช้งาน"}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Promo Codes Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">โค้ด</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">ส่วนลด</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">เงื่อนไข</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">การใช้งาน</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">หมดอายุ</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">สถานะ</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.map((promo, index) => (
                <motion.tr
                  key={promo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-red-400 font-mono font-bold">{promo.code}</code>
                      <button
                        onClick={() => copyToClipboard(promo.code)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-white">
                      {promo.type === "percentage" ? `${promo.discount}%` : formatPrice(promo.discount)}
                    </p>
                    {promo.maxDiscount && (
                      <p className="text-xs text-gray-500">สูงสุด {formatPrice(promo.maxDiscount)}</p>
                    )}
                  </td>
                  <td className="p-4">
                    {promo.minPurchase ? (
                      <p className="text-sm text-gray-400">ขั้นต่ำ {formatPrice(promo.minPurchase)}</p>
                    ) : (
                      <p className="text-sm text-gray-500">-</p>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-white">
                      {promo.usedCount} / {promo.usageLimit || "∞"}
                    </p>
                    {promo.usageLimit && (
                      <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(promo.usedCount / promo.usageLimit) * 100}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {promo.expiresAt ? (
                      <p className={`text-sm ${promo.expiresAt < new Date() ? "text-red-400" : "text-gray-400"}`}>
                        {promo.expiresAt.toLocaleDateString("th-TH")}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">ไม่หมดอายุ</p>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={promo.isActive ? "success" : "secondary"}>
                      {promo.isActive ? "ใช้งาน" : "ปิด"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPromo(promo)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeletePromo(promo)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCodes.length === 0 && (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">ไม่พบโค้ดส่วนลด</p>
          </div>
        )}
      </Card>

      {/* Promo Form Modal */}
      <PromoFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        promo={selectedPromo as any}
        onSave={handleSavePromo}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="ลบโค้ดส่วนลด"
        message={`คุณต้องการลบโค้ด "${selectedPromo?.code}" หรือไม่?`}
        confirmText="ลบโค้ด"
        type="danger"
      />
    </div>
  );
}
