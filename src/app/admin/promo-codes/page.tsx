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
import { useTranslation } from "react-i18next";
import { createLogger } from "@/lib/logger";

const promoCodesLogger = createLogger("admin:promo-codes");

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
  const { t } = useTranslation("admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPromoCodes();
      const res = response as unknown as { data: { success: boolean; data: PromoCode[] } };
      if (res.data && res.data.success) {
        setPromoCodes(res.data.data || []);
      }
    } catch (err) {
      promoCodesLogger.error('Failed to fetch promo codes', { error: err });
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
      const response = await adminApi.togglePromoCode(promo.id);
      const res = response as unknown as { data: { success: boolean } };
      if (res.data && res.data.success) {
        await fetchPromoCodes();
      }
    } catch (err) {
      promoCodesLogger.error('Error toggling promo code status', { error: err });
    }
  }, [fetchPromoCodes]);

  const handleSavePromo = useCallback(async (promoData: Partial<PromoCode>) => {
    try {
      let res: { data: { success: boolean; error?: string } };
      const formattedData = {
        ...promoData,
        type: promoData.type?.toUpperCase() as "PERCENTAGE" | "FIXED" | undefined,
        expiresAt: promoData.expiresAt ? new Date(promoData.expiresAt).toISOString() : null
      };

      if (selectedPromo) {
        res = await adminApi.updatePromoCode(selectedPromo.id, formattedData as Partial<PromoCode>) as unknown as { data: { success: boolean; error?: string } };
      } else {
        res = await adminApi.createPromoCode(formattedData as Partial<PromoCode>) as unknown as { data: { success: boolean; error?: string } };
      }

      if (res.data && res.data.success) {
        await fetchPromoCodes();
        setIsFormOpen(false);
      } else {
        alert(res.data?.error || (mounted ? t("promo_codes.errors.save_failed") : ""));
      }
    } catch (err) {
      promoCodesLogger.error('Error saving promo code', { error: err });
    }
  }, [selectedPromo, fetchPromoCodes, mounted, t]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPromo) return;
    try {
      const response = await adminApi.deletePromoCode(selectedPromo.id);
      const res = response as unknown as { data: { success: boolean; error?: string } };
      if (res.data && res.data.success) {
        await fetchPromoCodes();
        setIsDeleteOpen(false);
      } else {
        alert(res.data?.error || (mounted ? t("promo_codes.errors.delete_fail") : ""));
      }
    } catch (err) {
      promoCodesLogger.error('Error deleting promo code', { error: err });
    }
  }, [selectedPromo, fetchPromoCodes, mounted, t]);

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{mounted ? t("promo_codes.title") : ""}</h1>
          <p className="text-gray-400 mt-1">{mounted ? t("promo_codes.subtitle") : ""}</p>
        </div>
        <Button
          onClick={handleAddPromo}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-xs transition-all duration-300 shrink-0 w-full lg:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          {mounted ? t("promo_codes.add_code") : ""}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: mounted ? t("promo_codes.active") : "", value: promoCodes.filter(c => c.isActive).length, icon: Tag, color: "text-red-500", bg: "bg-red-500/10" },
          { label: mounted ? t("promo_codes.usage_count") : "", value: promoCodes.reduce((sum, c) => sum + c.usedCount, 0), icon: Copy, color: "text-white", bg: "bg-white/5" },
          { label: mounted ? t("promo_codes.expired") : "", value: promoCodes.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length, icon: Clock, color: "text-gray-500", bg: "bg-white/5" },
          { label: mounted ? t("promo_codes.stats.total") : "", value: promoCodes.length, icon: Zap, color: "text-red-400", bg: "bg-red-500/5" },
        ].map((stat, index) => (
          <motion.div
            key={index}
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
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{mounted ? stat.label : ""}</p>
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
              placeholder={mounted ? t("promo_codes.search_placeholder") : ""}
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
                {mounted ? (status === "all" ? t("promo_codes.filter.all") : status === "active" ? t("promo_codes.active") : t("promo_codes.inactive")) : ""}
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
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{mounted ? t("common.loading") : ""}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("promo_codes.code") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("promo_codes.discount") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("promo_codes.min_purchase") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("promo_codes.usage_count") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("promo_codes.expires_at") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("common.status") : ""}</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">{mounted ? t("common.actions") : ""}</th>
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
                          title={mounted ? t("common.copy") : ""}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div>
                        <p className="font-black text-red-500 text-lg">
                          {mounted ? (promo.type === "PERCENTAGE" ? t("promo_codes.table.discount_off", { percent: promo.discount }) : formatPrice(promo.discount)) : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {promo.minPurchase ? (
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-sm text-gray-300 font-bold">{formatPrice(promo.minPurchase)}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 uppercase font-black">{mounted ? t("promo_codes.placeholders.no_min") : ""}</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-500">{promo.usedCount}</span>
                          <span className="text-white">{promo.usageLimit || t("promo_codes.placeholders.unlimited")}</span>
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
                            {mounted ? new Date(promo.expiresAt).toLocaleDateString("th-TH") : ""}
                          </span>
                          <span className="text-[10px] text-gray-600 font-black uppercase">{mounted ? t("promo_codes.table.expiration_label") : ""}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 uppercase font-black">{mounted ? t("promo_codes.table.never_expires") : ""}</span>
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
                        {mounted ? (promo.isActive ? t("promo_codes.active") : t("promo_codes.inactive")) : ""}
                      </Badge>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPromo(promo)}
                          className="w-10 h-10 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePromo(promo)}
                          className="w-10 h-10 rounded-xl hover:bg-red-600/10 text-red-600/30 hover:text-red-600 transition-all"
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
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">{mounted ? t("promo_codes.no_codes") : ""}</p>
            <p className="text-gray-600 text-sm mt-2 relative z-10">{mounted ? t("promo_codes.no_codes_hint") : ""}</p>
          </div>
        )}
      </Card>


      {/* Promo Form Modal */}
      <PromoFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        promo={selectedPromo as PromoCode}
        onSave={handleSavePromo}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t("promo_codes.delete_title")}
        message={t("promo_codes.delete_message", { code: selectedPromo?.code })}
        confirmText={t("promo_codes.delete_confirm")}
        type="danger"
      />
    </div>
  );
}
