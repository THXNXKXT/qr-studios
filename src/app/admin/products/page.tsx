"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Archive, 
  RotateCcw, 
  Eye, 
  Package, 
  Loader2, 
  ImageOff, 
  Star, 
  AlertTriangle 
} from "lucide-react";
import { Card, Button, Input, Badge, Pagination } from "@/components/ui";
import { ProductFormModal, ConfirmModal } from "@/components/admin";
import { formatPrice, cn, isProductOnFlashSale } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import type { Product } from "@/types";
import { createLogger } from "@/lib/logger";

const productsLogger = createLogger("admin:products");

function safeLower(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  if (value === undefined || value === null) return "";
  return String(value).toLowerCase();
}

function isSafeImageSrc(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  return v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://");
}

function normalizeProducts(raw: unknown): Product[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .filter(Boolean)
    .map((p: unknown) => {
      const item = p as Record<string, unknown>;
      const thumbnail = isSafeImageSrc(item?.thumbnail) ? item.thumbnail : undefined;
      return {
        ...item,
        id: typeof item?.id === "string" ? item.id : String(item?.id ?? ""),
        name: typeof item?.name === "string" ? item.name : String(item?.name ?? ""),
        category: (item?.category ?? "").toString(),
        thumbnail,
        features: Array.isArray(item?.features) ? item.features : [],
        tags: Array.isArray(item?.tags) ? item.tags : [],
        isActive: item?.isActive !== undefined ? Boolean(item.isActive) : true,
      } as Product;
    })
    .filter((p) => Boolean(p.id));
}

export default function AdminProductsPage() {
  const { t } = useTranslation("admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts();
      // Handle both formats: { success, data } or direct array
      const responseData = res.data as { success?: boolean; data?: unknown[] } | unknown[];
      let productsArray: unknown[] = [];
      
      if (Array.isArray(responseData)) {
        productsArray = responseData;
      } else if (responseData && typeof responseData === 'object') {
        if ('success' in responseData && responseData.success && 'data' in responseData) {
          productsArray = Array.isArray(responseData.data) ? responseData.data : [];
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          productsArray = responseData.data;
        }
      }
      
      setProducts(normalizeProducts(productsArray));
    } catch (err) {
      productsLogger.error('Failed to fetch products', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const q = safeLower(searchQuery);
        const matchesSearch = safeLower(product?.name).includes(q) || safeLower(product?.id).includes(q);
        const matchesCategory =
          selectedCategory === "all" || safeLower(product?.category) === safeLower(selectedCategory);
        return matchesSearch && matchesCategory;
      }),
    [products, searchQuery, selectedCategory]
  );

  const handleAddProduct = useCallback(() => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  }, []);

  const handleSaveSuccess = useCallback(async () => {
    await fetchProducts();
    setIsFormOpen(false);
  }, [fetchProducts]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedProduct) return;
    try {
      const res = await adminApi.deleteProduct(selectedProduct.id);
      if (res.data) {
        await fetchProducts();
        setIsDeleteOpen(false);
      } else {
        alert(res.error?.message || t("products.errors.archive_fail"));
      }
    } catch (err) {
      productsLogger.error('Error archiving product', { error: err });
      alert(t("products.errors.archive_error"));
    }
  }, [selectedProduct, fetchProducts, t]);

  const handleConfirmHardDelete = useCallback(async () => {
    if (!selectedProduct) return;
    try {
      const res = await adminApi.hardDeleteProduct(selectedProduct.id);
      if (res.data) {
        await fetchProducts();
        setIsHardDeleteOpen(false);
      } else {
        alert(res.error?.message || t("products.errors.delete_fail"));
      }
    } catch (err) {
      productsLogger.error('Error permanently deleting product', { error: err });
      alert(t("products.errors.delete_error"));
    }
  }, [selectedProduct, fetchProducts, t]);

  const handleRestoreProduct = useCallback(async (product: Product) => {
    try {
      const res = await adminApi.updateProduct(product.id, { isActive: true });
      if (res.data) {
        await fetchProducts();
      } else {
        alert(res.error?.message || t("products.errors.restore_fail"));
      }
    } catch (err) {
      productsLogger.error('Error restoring product', { error: err });
      alert(t("products.errors.restore_error"));
    }
  }, [fetchProducts, t]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{mounted ? t("products.title") : ""}</h1>
          <p className="text-gray-400 mt-1">{mounted ? t("products.subtitle") : ""}</p>
        </div>
        <Button
          onClick={handleAddProduct}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-xs transition-all duration-300 shrink-0 w-full lg:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          {mounted ? t("products.add_new") : ""}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder={mounted ? t("products.search_placeholder") : ""}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {["all", "SCRIPT", "UI", "BUNDLE"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest",
                  selectedCategory === cat
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                <span >{mounted ? (cat === "all" ? t("products.all_items") : t(`products.categories.${cat.toLowerCase()}`)) : ""}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="border-white/5 bg-white/2 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{mounted ? t("products.table.loading") : ""}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("products.table.info") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("products.table.category") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("products.table.price") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("products.table.points") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("products.table.inventory") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("products.table.status") : ""}</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">{mounted ? t("products.table.actions") : ""}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedProducts.map((product, index) => (
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
                          {product.thumbnail ? (
                            <Image
                              src={product.thumbnail}
                              alt={product.name}
                              width={56}
                              height={56}
                              className="object-cover"
                            />
                          ) : product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={56}
                              height={56}
                              className="object-cover"
                            />
                          ) : (
                            <>
                              <ImageOff className="w-5 h-5 text-gray-600 mb-0.5" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">{mounted ? t("products.table.no_image") : ""}</span>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-red-400 transition-colors">{product.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter opacity-60">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <Badge className="bg-white/10 text-gray-300 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-6">
                      <div>
                        {isProductOnFlashSale(product) ? (
                          <>
                            <p className="font-black text-red-500 text-lg" suppressHydrationWarning>{formatPrice(product.flashSalePrice!)}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-gray-600 line-through font-bold" suppressHydrationWarning>
                                {formatPrice(product.price)}
                              </p>
                              <Badge className="bg-red-500/10 text-red-500 border-none text-[8px] font-black px-1.5 py-0">
                                {mounted ? t("products.table.flash_sale") : ""}
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-black text-white text-lg" suppressHydrationWarning>{formatPrice(product.price)}</p>
                            {product.originalPrice && (
                              <p className="text-[10px] text-gray-600 line-through font-bold" suppressHydrationWarning>
                                {formatPrice(product.originalPrice)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-1.5 text-yellow-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-yellow-500/20" />
                        <span>{product.rewardPoints || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          product.stock === -1 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                            product.stock > 0 ? "bg-red-400" : "bg-gray-600"
                        )} />
                        <span className="font-black text-white text-sm">
                          {mounted ? (product.stock === -1 ? t("products.table.unlimited") : product.stock) : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-2">
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest w-fit",
                          product.isActive
                            ? "bg-green-500/10 text-green-500"
                            : "bg-orange-500/10 text-orange-500"
                        )}>
                          {mounted ? (product.isActive ? t("products.table.active") : t("products.table.archived")) : ""}
                        </Badge>
                        {product.isFeatured && (
                          <Badge className="bg-red-600 text-white shadow-lg shadow-red-600/20 px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest w-fit">
                            {mounted ? t("products.table.featured") : ""}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/products/${product.id}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("common.view")}
                            className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("common.edit")}
                          onClick={() => handleEditProduct(product)}
                          className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {product.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("products.modals.archive.title")}
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDeleteOpen(true);
                            }}
                            className="w-10 h-10 rounded-xl hover:bg-orange-500/10 text-orange-500/40 hover:text-orange-500 transition-all"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("common.restore")}
                            onClick={() => handleRestoreProduct(product)}
                            className="w-10 h-10 rounded-xl hover:bg-green-500/10 text-green-500/40 hover:text-green-500 transition-all"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("products.modals.delete.title")}
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsHardDeleteOpen(true);
                          }}
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

        {!loading && filteredProducts.length === 0 && (
          <div className="p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
            <Package className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">{mounted ? t("products.table.no_products") : ""}</p>
            <p className="text-gray-600 text-sm mt-2 relative z-10">{mounted ? t("products.table.no_products_subtitle") : ""}</p>
          </div>
        )}
      </Card>


      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={selectedProduct}
        onSave={handleSaveSuccess}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t("products.modals.archive.title")}
        message={t("products.modals.archive.message", { name: selectedProduct?.name })}
        confirmText={t("products.modals.archive.confirm")}
        type="warning"
      />

      {/* Hard Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isHardDeleteOpen}
        onClose={() => setIsHardDeleteOpen(false)}
        onConfirm={handleConfirmHardDelete}
        title={t("products.modals.delete.title")}
        message={
          <div className="space-y-3 text-left">
            <p className="font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t("products.modals.delete.warning")}
            </p>
            <p>{t("products.modals.delete.message", { name: selectedProduct?.name })}</p>
            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
              <li>{t("products.modals.delete.list.licenses")}</li>
              <li>{t("products.modals.delete.list.access")}</li>
              <li>{t("products.modals.delete.list.storage")}</li>
              <li>{t("products.modals.delete.list.undo")}</li>
            </ul>
          </div>
        }
        confirmText={t("products.modals.delete.confirm")}
        type="danger"
      />
    </div>
  );
}
