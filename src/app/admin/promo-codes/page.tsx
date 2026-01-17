"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Copy,
  Zap,
  Clock,
  Shield,
  Loader2,
} from "lucide-react";
import { Card, Button, Input, Badge, Pagination } from "@/components/ui";
import { PromoFormModal, ConfirmModal } from "@/components/admin";
import { formatPrice, cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";

type PromoCode = {
  id: string;
  code: string;
  discount: number;
  type: "PERCENTAGE" | "FIXED";
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export default function AdminPromoCodesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getPromoCodes();
      if (data && (data as any).success) {
        setPromoCodes((data as any).data || []);
      }
    } catch (err) {
      console.error("Failed to fetch promo codes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const filteredCodes = useMemo(() => 
    promoCodes.filter((code) => {
      const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActive =
        filterActive === "all" ||
        (filterActive === "active" && code.isActive) ||
        (filterActive === "inactive" && !code.isActive);
      return matchesSearch && matchesActive;
    }), [promoCodes, searchQuery, filterActive]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterActive]);

  const paginatedCodes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCodes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCodes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleAddPromo = useCallback(() => {
    setSelectedPromo(null);
    setIsFormOpen(true);
  }, []);

  const handleEditPromo = useCallback((promo: PromoCode) => {
    setSelectedPromo(promo);
    setIsFormOpen(true);
  }, []);

  const handleDeletePromo = useCallback((promo: PromoCode) => {
    setSelectedPromo(promo);
    setIsDeleteOpen(true);
  }, []);

  const handleToggleActive = useCallback(async (promo: PromoCode) => {
    try {
      const res = await adminApi.togglePromoCode(promo.id);
      if (res.data && (res.data as any).success) {
        await fetchPromoCodes();
      }
    } catch (err) {
      console.error("Error toggling promo code status:", err);
    }
  }, [fetchPromoCodes]);

  const handleSavePromo = useCallback(async (promoData: any) => {
    try {
      let res;
      const formattedData = {
        ...promoData,
        type: promoData.type.toUpperCase(),
        expiresAt: promoData.expiresAt ? new Date(promoData.expiresAt).toISOString() : null
      };

      if (selectedPromo) {
        res = await adminApi.updatePromoCode(selectedPromo.id, formattedData);
      } else {
        res = await adminApi.createPromoCode(formattedData);
      }

      if (res.data && (res.data as any).success) {
        await fetchPromoCodes();
        setIsFormOpen(false);
      } else {
        alert((res.data as any)?.error || "Failed to save promo code");
      }
    } catch (err) {
      console.error("Error saving promo code:", err);
      alert("An error occurred while saving the promo code");
    }
  }, [selectedPromo, fetchPromoCodes]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPromo) return;
    try {
      const res = await adminApi.deletePromoCode(selectedPromo.id);
      if (res.data && (res.data as any).success) {
        await fetchPromoCodes();
        setIsDeleteOpen(false);
      } else {
        alert((res.data as any)?.error || "Failed to delete promo code");
      }
    } catch (err) {
      console.error("Error deleting promo code:", err);
      alert("An error occurred while deleting the promo code");
    }
  }, [selectedPromo, fetchPromoCodes]);

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Promo Management</h1>
          <p className="text-gray-400 mt-1">บริหารจัดการรหัสส่วนลดและแคมเปญการตลาดของ QR Studio</p>
        </div>
        <Button 
          onClick={handleAddPromo}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-xl px-6 py-6 font-black uppercase tracking-widest transition-all duration-300"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Code
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Coupons", value: promoCodes.filter(c => c.isActive).length, icon: Tag, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Total Usage", value: promoCodes.reduce((sum, c) => sum + c.usedCount, 0), icon: Copy, color: "text-white", bg: "bg-white/5" },
          { label: "Expired Soon", value: promoCodes.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length, icon: Clock, color: "text-gray-500", bg: "bg-white/5" },
          { label: "Total Campaigns", value: promoCodes.length, icon: Zap, color: "text-red-400", bg: "bg-red-500/5" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 transition-all duration-500 shadow-inner", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black text-white tracking-tighter mb-1">{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder="ค้นหารหัสส่วนลด หรือเงื่อนไข..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {["all", "active", "inactive"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterActive(status)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest",
                  filterActive === status 
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                {status === "all" ? "All Status" : status === "active" ? "Running" : "Paused"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Promo Codes Table */}
      <Card className="border-white/5 bg-white/2 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading promo codes...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-5 text-left border-b border-white/5">Coupon Code</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Discount Info</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Conditions</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Usage Pulse</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Expiration</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Status</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedCodes.map((promo, index) => (
                  <motion.tr
                    key={promo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/2 transition-colors group"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 group-hover:bg-red-500/20 transition-all">
                          <code className="text-sm text-red-500 font-mono font-black tracking-widest">{promo.code}</code>
                        </div>
                        <button
                          onClick={() => copyToClipboard(promo.code)}
                          className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div>
                        <p className="font-black text-red-500 text-lg">
                          {promo.type === "PERCENTAGE" ? `${promo.discount}% OFF` : formatPrice(promo.discount)}
                        </p>
                        {promo.maxDiscount && (
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">Capped at {formatPrice(promo.maxDiscount)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {promo.minPurchase ? (
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-sm text-gray-300 font-bold">Min. {formatPrice(promo.minPurchase)}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 uppercase font-black">No Min. Spend</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-500">{promo.usedCount} Uses</span>
                          <span className="text-white">{promo.usageLimit || "∞"}</span>
                        </div>
                        {promo.usageLimit && (
                          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(promo.usedCount / promo.usageLimit) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-red-600 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {promo.expiresAt ? (
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-sm font-bold",
                            new Date(promo.expiresAt) < new Date() ? "text-red-900/50" : "text-gray-300"
                          )}>
                            {new Date(promo.expiresAt).toLocaleDateString("th-TH")}
                          </span>
                          <span className="text-[10px] text-gray-600 font-black uppercase">Expiration</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 uppercase font-black">Never Expires</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <Badge className={cn(
                        "px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest transition-all duration-500 cursor-pointer",
                        promo.isActive 
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                          : "bg-white/5 text-gray-500"
                      )}
                      onClick={() => handleToggleActive(promo)}
                      >
                        {promo.isActive ? "ACTIVE" : "PAUSED"}
                      </Badge>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditPromo(promo)}
                          className="w-10 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeletePromo(promo)}
                          className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-6 border-t border-white/5 bg-white/2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {!loading && filteredCodes.length === 0 && (
          <div className="p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
            <Tag className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">No promo codes found</p>
            <p className="text-gray-600 text-sm mt-2 relative z-10">ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มรหัสใหม่</p>
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
