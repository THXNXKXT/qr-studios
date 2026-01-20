"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Search,
  Zap,
  ZapOff,
  Loader2,
  ImageOff,
  Edit,
  Timer,
  Clock,
  CheckCircle2,
  Plus,
  Save,
  X,
  TrendingDown,
  Calendar
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { ConfirmModal } from "@/components/admin";
import { formatPrice, cn, isProductOnFlashSale } from "@/lib/utils";
import { adminApi, productsApi } from "@/lib/api";
import type { Product } from "@/types";
import { useTranslation } from "react-i18next";

export default function AdminFlashSalePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form states
  const [flashSalePrice, setFlashSalePrice] = useState<number>(0);
  const [flashSaleEnds, setFlashSaleEnds] = useState<string>("");
  const { t } = useTranslation("admin");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({ limit: 200 }) as { data: { success: boolean; data: Product[] } };
      if (res.data && res.data.success) {
        setAllProducts(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (flashSalePrice === undefined || flashSalePrice === null || flashSalePrice <= 0) {
      newErrors.price = t("flash_sale.errors.price_invalid");
    } else if (selectedProduct && flashSalePrice >= selectedProduct.price) {
      newErrors.price = t("flash_sale.errors.price_must_be_lower", { price: formatPrice(selectedProduct.price) });
    }

    if (!flashSaleEnds) {
      newErrors.endsAt = t("flash_sale.errors.end_time_required");
    } else if (new Date(flashSaleEnds) <= new Date()) {
      newErrors.endsAt = t("flash_sale.errors.end_time_future");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFlashSalePrice(product.flashSalePrice || Math.round(product.price * 0.8));
    setFlashSaleEnds(product.flashSaleEnds ? new Date(product.flashSaleEnds).toISOString().slice(0, 16) : "");
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleRemoveClick = (product: Product) => {
    setSelectedProduct(product);
    setIsRemoveModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const res = await adminApi.updateFlashSale(selectedProduct.id, {
        isFlashSale: false,
        flashSalePrice: undefined,
        flashSaleEnds: null,
      }) as { data: { success: boolean } };

      if (res.data && res.data.success) {
        setIsRemoveModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to remove flash sale:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    setErrors({});
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await adminApi.updateFlashSale(selectedProduct.id, {
        isFlashSale: true,
        flashSalePrice: Number(flashSalePrice),
        flashSaleEnds: new Date(flashSaleEnds).toISOString(),
      }) as { data: { success: boolean; error?: string } };

      if (res.data && res.data.success) {
        setIsEditModalOpen(false);
        await fetchData();
      }
    } catch (err: any) {
      console.error("Failed to update flash sale:", err);
      alert(err.message || t("flash_sale.errors.save_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFlashSale = async (product: Product) => {
    setSelectedProduct(product);
    setFlashSalePrice(Math.round(product.price * 0.8)); // Default 20% discount
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFlashSaleEnds(tomorrow.toISOString().slice(0, 16));
    setIsAddModalOpen(false);
    setIsEditModalOpen(true);
  };

  const activeFlashSales = allProducts.filter(isProductOnFlashSale);

  const availableProducts = allProducts.filter(p => !isProductOnFlashSale(p));

  const filteredAvailableProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 relative overflow-hidden pb-20">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            {mounted ? t("flash_sale.title") : ""}
          </h1>
          <p className="text-gray-400 mt-1">{mounted ? t("flash_sale.subtitle") : ""}</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-xs transition-all duration-300 shrink-0 w-full lg:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          {mounted ? t("flash_sale.add_flash_sale") : ""}
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white/2 border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">{mounted ? t("flash_sale.active_sales") : ""}</p>
              <h3 className="text-2xl font-black text-white">{activeFlashSales.length}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white/2 border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">{mounted ? t("flash_sale.ending_soon") : ""}</p>
              <h3 className="text-2xl font-black text-white">
                {activeFlashSales.filter(p => p.flashSaleEnds && new Date(p.flashSaleEnds).getTime() - new Date().getTime() < 86400000).length}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white/2 border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-600/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">{mounted ? t("flash_sale.avg_discount") : ""}</p>
              <h3 className="text-2xl font-black text-white">
                {activeFlashSales.length > 0
                  ? `${Math.round(activeFlashSales.reduce((acc, p) => acc + (1 - (p.flashSalePrice || 0) / p.price) * 100, 0) / activeFlashSales.length)}%`
                  : "0%"}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Flash Sales Table */}
      <Card className="border-white/5 bg-white/2 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{mounted ? t("common.loading") : ""}</p>
            </div>
          ) : activeFlashSales.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("flash_sale.table.product") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("flash_sale.table.original_price") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("flash_sale.table.sale_price") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("flash_sale.table.ending_at") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("flash_sale.table.time_left") : ""}</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">{mounted ? t("flash_sale.table.actions") : ""}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeFlashSales.map((product, index) => {
                  const timeLeft = product.flashSaleEnds
                    ? Math.max(0, new Date(product.flashSaleEnds).getTime() - new Date().getTime())
                    : 0;
                  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                  const isExpiringSoon = hoursLeft < 24;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500 shadow-inner">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={56}
                                height={56}
                                className="object-cover"
                              />
                            ) : (
                              <ImageOff className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-red-400 transition-colors">{product.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter opacity-60">ID: {product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-bold text-gray-500 line-through">{formatPrice(product.price)}</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-red-500 text-lg">{formatPrice(product.flashSalePrice || 0)}</p>
                          <Badge className="bg-red-500 text-white border-none font-black text-[10px] px-2 py-0.5 rounded-md">
                            -{Math.round((1 - (product.flashSalePrice || 0) / product.price) * 100)}%
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          <span>
                            {mounted ? (product.flashSaleEnds ? new Date(product.flashSaleEnds).toLocaleString('th-TH') : "N/A") : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest",
                          isExpiringSoon ? "bg-orange-500/20 text-orange-500" : "bg-green-500/20 text-green-500"
                        )}>
                          {mounted ? t("flash_sale.hours_left", { count: hoursLeft }) : ""}
                        </Badge>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            className="w-10 h-10 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveClick(product)}
                            className="w-10 h-10 rounded-xl text-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            <ZapOff className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
              <Zap className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-10" />
              <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">{mounted ? t("flash_sale.no_active_sales") : ""}</p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                variant="ghost"
                className="mt-4 text-red-500 hover:text-red-400 font-black uppercase tracking-widest text-xs relative z-10"
              >
                {mounted ? t("flash_sale.create_first") : ""}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />

              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-600/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t("flash_sale.modals.edit.title")}</h3>
                      <p className="text-gray-400 text-sm">{t("flash_sale.modals.edit.subtitle")}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {selectedProduct && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/2 border border-white/5 group hover:border-red-500/20 transition-all">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/5">
                      {selectedProduct.images?.[0] ? (
                        <Image src={selectedProduct.images[0]} alt="" width={56} height={56} className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center"><ImageOff className="w-5 h-5 text-gray-600" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{selectedProduct.name}</p>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedProduct.category} • {formatPrice(selectedProduct.price)}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* section: Pricing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <TrendingDown className="w-4 h-4 text-orange-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t("flash_sale.modals.edit.pricing_settings")}</h3>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-xs font-bold uppercase tracking-wider", errors.price ? "text-red-500" : "text-gray-500")}>
                        {t("flash_sale.modals.edit.price_label")}
                      </label>
                      <div className="relative group">
                        <Input
                          type="number"
                          value={flashSalePrice}
                          onChange={(e) => {
                            setFlashSalePrice(Number(e.target.value));
                            if (errors.price) setErrors({ ...errors, price: "" });
                          }}
                          className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-lg font-black text-white focus:border-red-500/50"
                          error={errors.price}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-500 group-focus-within:text-red-500 transition-colors">฿</span>
                      </div>

                      {selectedProduct && (
                        <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-500/10 text-red-500 border-none font-black text-[10px] uppercase">
                              {t("flash_sale.modals.edit.discount_badge", { percent: Math.round((1 - flashSalePrice / (selectedProduct.price || 1)) * 100) })}
                            </Badge>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">
                              {t("flash_sale.modals.edit.save_badge", { amount: formatPrice(selectedProduct.price - flashSalePrice) })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* section: Timing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t("flash_sale.modals.edit.duration_settings")}</h3>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-xs font-bold uppercase tracking-wider", errors.endsAt ? "text-red-500" : "text-gray-500")}>
                        {t("flash_sale.modals.edit.end_time_label")}
                      </label>
                      <div className="relative group">
                        <Input
                          type="datetime-local"
                          value={flashSaleEnds}
                          onChange={(e) => {
                            setFlashSaleEnds(e.target.value);
                            if (errors.endsAt) setErrors({ ...errors, endsAt: "" });
                          }}
                          className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 font-bold text-white focus:border-red-500/50 scheme-dark"
                          error={errors.endsAt}
                        />
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <Button
                    onClick={() => setIsEditModalOpen(false)}
                    variant="ghost"
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/5 text-gray-400 hover:text-white"
                  >
                    {t("flash_sale.modals.edit.cancel")}
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("flash_sale.modals.edit.saving")}</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> {t("flash_sale.modals.edit.save")}</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Flash Sale Selection Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />

              <div className="mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{t("flash_sale.modals.add.title")}</h3>
                <p className="text-gray-400 text-sm">{t("flash_sale.modals.add.subtitle")}</p>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  placeholder={t("flash_sale.modals.add.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white/5 border-white/10 rounded-2xl py-6 font-medium text-white focus:border-red-500/50"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {filteredAvailableProducts.length > 0 ? (
                  filteredAvailableProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleAddFlashSale(product)}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-red-500/30 hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 shrink-0">
                        {product.images?.[0] ? (
                          <Image src={product.images[0]} alt="" width={56} height={56} className="object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-6 h-6 text-gray-600" /></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white group-hover:text-red-400 transition-colors">{product.name}</p>
                        <p className="text-xs text-gray-500 uppercase font-black tracking-widest">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white">{formatPrice(product.price)}</p>
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{t("flash_sale.modals.add.available")}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t("flash_sale.modals.add.no_products")}</p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setIsAddModalOpen(false)}
                variant="ghost"
                className="mt-6 py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/5"
              >
                {t("flash_sale.modals.add.close")}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={handleConfirmRemove}
        title={t("flash_sale.modals.remove.title")}
        message={t("flash_sale.modals.remove.message", { name: selectedProduct?.name })}
        confirmText={t("flash_sale.modals.remove.confirm")}
        type="info"
      />
    </div>
  );
}
