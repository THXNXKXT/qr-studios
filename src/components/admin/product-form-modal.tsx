"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Plus, Trash2, Save, Loader2, FileText, Layout, Image as ImageIcon, Settings, Zap, Globe, Package as PackageIcon, Info, Star, Edit } from "lucide-react";
import { Button, Input, Card, Badge, FileUpload } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function toDatetimeLocalValue(value: unknown): string | undefined {
  if (!value) return undefined;
  const d = new Date(value as any);
  if (Number.isNaN(d.getTime())) return undefined;
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

interface Product {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: "SCRIPT" | "UI" | "BUNDLE";
  thumbnail?: string;
  images: string[];
  features: string[];
  tags: string[];
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: string;
  rewardPoints?: number;
  downloadUrl?: string;
  downloadFileKey?: string;
  isDownloadable: boolean;
  downloadKey?: string;
  version: string;
  isActive: boolean;
}

interface SelectedFile {
  file: File;
  preview: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Product) => Promise<void>;
}

const defaultProduct: Product = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  originalPrice: undefined,
  category: "SCRIPT",
  thumbnail: undefined,
  images: [],
  features: [""],
  tags: [],
  stock: 0,
  isNew: true,
  isFeatured: false,
  isFlashSale: false,
  flashSalePrice: undefined,
  flashSaleEnds: undefined,
  rewardPoints: 0,
  downloadUrl: undefined,
  downloadFileKey: undefined,
  isDownloadable: false,
  downloadKey: undefined,
  version: "1.0.0",
  isActive: true,
};

export function ProductFormModal({ isOpen, onClose, product, onSave }: ProductFormModalProps) {
  const { t } = useTranslation("admin");
  const [activeTab, setActiveTab] = useState<"basic" | "media" | "settings" | "delivery">("basic");
  const [formData, setFormData] = useState<Product>(defaultProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Local files state
  const [thumbnailFile, setThumbnailFile] = useState<SelectedFile | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<SelectedFile[]>([]);
  const [productFile, setProductFile] = useState<File | null>(null);

  const isEditing = !!product?.id;

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        features: Array.isArray((product as any).features) && (product as any).features.length ? (product as any).features : [""],
        tags: Array.isArray((product as any).tags) ? (product as any).tags : [],
        images: Array.isArray((product as any).images) ? (product as any).images : [],
        flashSaleEnds: toDatetimeLocalValue((product as any).flashSaleEnds),
        rewardPoints: typeof (product as any).rewardPoints === "number" ? (product as any).rewardPoints : 0,
        downloadUrl: (product as any).downloadUrl || undefined,
        downloadFileKey: (product as any).downloadFileKey || undefined,
        isDownloadable: Boolean((product as any).isDownloadable),
        downloadKey: (product as any).downloadKey || undefined,
        isActive: (product as any).isActive !== undefined ? Boolean((product as any).isActive) : true,
        version: (product as any).version || "1.0.0",
      });
    } else {
      setFormData(defaultProduct);
    }
    // Reset local files, tabs and errors when modal opens/changes
    setActiveTab("basic");
    setThumbnailFile(null);
    setGalleryFiles([]);
    setProductFile(null);
    setErrors({});
  }, [product, isOpen]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    const urlsToRevoke: string[] = [];
    if (thumbnailFile?.preview?.startsWith('blob:')) {
      urlsToRevoke.push(thumbnailFile.preview);
    }
    galleryFiles.forEach(f => {
      if (f.preview?.startsWith('blob:')) {
        urlsToRevoke.push(f.preview);
      }
    });

    return () => {
      urlsToRevoke.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      });
    };
  }, [thumbnailFile, galleryFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const { adminApi } = await import("@/lib/api");
      const folderPath = `products/${formData.slug}`;

      let currentThumbnail = formData.thumbnail;
      let currentImages = [...formData.images];
      let currentDownloadUrl = formData.downloadUrl;
      let currentDownloadFileKey = formData.downloadFileKey;

      // 1. Upload Thumbnail if changed
      if (thumbnailFile) {
        const res = await adminApi.uploadFile(thumbnailFile.file, `${folderPath}/thumbnail`);
        if (res.data && (res.data as any).success) {
          currentThumbnail = (res.data as any).data.url;
        } else {
          throw new Error(t("products.errors.upload_cover_failed"));
        }
      }

      // 2. Upload Gallery Images
      if (galleryFiles.length > 0) {
        const uploadPromises = galleryFiles.map(f => adminApi.uploadFile(f.file, `${folderPath}/gallery`));
        const results = await Promise.all(uploadPromises);
        results.forEach(res => {
          if (res.data && (res.data as any).success) {
            currentImages.push((res.data as any).data.url);
          } else {
            throw new Error(t("products.errors.upload_gallery_failed"));
          }
        });
      }

      // 3. Upload Product File
      if (productFile) {
        const res = await adminApi.uploadFile(productFile, `${folderPath}/files`);
        if (res.data && (res.data as any).success) {
          currentDownloadUrl = (res.data as any).data.url;
          currentDownloadFileKey = (res.data as any).data.key;
        } else {
          throw new Error(t("products.errors.upload_file_failed"));
        }
      }

      const formattedData = {
        ...formData,
        thumbnail: currentThumbnail,
        images: currentImages,
        downloadUrl: currentDownloadUrl,
        downloadFileKey: currentDownloadFileKey,
        category: formData.category.toUpperCase(),
        description: formData.description || null,
        originalPrice: formData.originalPrice || null,
        downloadKey: formData.downloadKey || null,
        version: formData.version || null,
        isActive: formData.isActive,
        rewardPoints: formData.rewardPoints !== undefined ? formData.rewardPoints : null,
        flashSalePrice: formData.isFlashSale ? (formData.flashSalePrice || null) : null,
        flashSaleEnds: formData.isFlashSale ? (formData.flashSaleEnds || null) : null,
      };

      let res;
      if (isEditing) {
        res = await adminApi.updateProduct(product.id!, formattedData);
      } else {
        res = await adminApi.createProduct(formattedData);
      }

      if (res.data && (res.data as any).success) {
        await onSave((res.data as any).data); // Signal parent to refresh
        onClose();
      } else {
        const errorData = (res.data as any);
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const backendErrors: Record<string, string> = {};
          errorData.errors.forEach((err: any) => {
            backendErrors[err.field] = err.message;
          });
          setErrors(backendErrors);
        } else {
          alert(errorData?.message || t("products.errors.save_failed"));
        }
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(error.message || t("products.errors.save_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name || formData.name.trim().length < 1) newErrors.name = t("products.errors.name_required");
    if (!formData.slug || formData.slug.trim().length < 1) newErrors.slug = t("products.errors.slug_required");
    if (!formData.description || formData.description.trim().length < 1) newErrors.description = t("products.errors.description_required");

    if (formData.price === undefined || formData.price === null || formData.price < 0) {
      newErrors.price = t("products.errors.price_invalid");
    }

    if (formData.originalPrice !== undefined && formData.originalPrice !== null && formData.originalPrice < 0) {
      newErrors.originalPrice = t("products.errors.original_price_invalid");
    }

    if (formData.stock !== -1 && (formData.stock === undefined || formData.stock === null || formData.stock < 0)) {
      newErrors.stock = t("products.errors.stock_invalid");
    }

    if (formData.rewardPoints !== undefined && formData.rewardPoints !== null && formData.rewardPoints < 0) {
      newErrors.rewardPoints = t("products.errors.points_invalid");
    }

    if (!formData.category) {
      newErrors.category = t("products.errors.category_required");
    }

    if (!formData.thumbnail && !thumbnailFile) {
      newErrors.thumbnail = t("products.errors.thumbnail_required");
    }

    if (formData.isFlashSale) {
      if (formData.flashSalePrice === undefined || formData.flashSalePrice === null || formData.flashSalePrice < 0) {
        newErrors.flashSalePrice = t("products.errors.flash_price_invalid");
      }
      if (!formData.flashSaleEnds) {
        newErrors.flashSaleEnds = t("products.errors.flash_ends_required");
      } else {
        const endsAt = new Date(formData.flashSaleEnds);
        if (Number.isNaN(endsAt.getTime())) {
          newErrors.flashSaleEnds = t("products.errors.flash_ends_invalid");
        } else if (endsAt <= new Date()) {
          newErrors.flashSaleEnds = t("products.errors.flash_ends_future");
        }
      }
    }

    if (formData.isDownloadable) {
      if (!productFile && !formData.downloadUrl) {
        newErrors.downloadUrl = t("products.errors.download_file_required");
      }
    }

    if (formData.features && formData.features.some(f => f.trim().length > 0)) {
      // Valid if at least one feature is filled, or all are empty (optional)
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newSelectedFiles = files
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

    if (newSelectedFiles.length < files.length) {
      alert(t("products.errors.some_files_skipped"));
    }

    setGalleryFiles(prev => [...prev, ...newSelectedFiles]);
    e.target.value = "";
  };

  const removeGalleryFile = (index: number) => {
    setGalleryFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t("products.errors.image_only"));
      return;
    }

    if (thumbnailFile) {
      URL.revokeObjectURL(thumbnailFile.preview);
    }

    setThumbnailFile({
      file,
      preview: URL.createObjectURL(file)
    });
    e.target.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductFile(file);
    setFormData({ ...formData, isDownloadable: true });
    e.target.value = "";
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
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          <Card className="flex flex-col overflow-hidden border-white/5 bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                  {isEditing ? <Plus className="w-6 h-6 text-red-500" /> : <Plus className="w-6 h-6 text-red-500" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    {isEditing ? t("products.modals.form.edit_title") : t("products.modals.form.create_title")}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest opacity-60">
                    {isEditing ? t("products.modals.form.edit_subtitle", { id: product?.id }) : t("products.modals.form.create_subtitle")}
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

            {/* Tabs Navigation */}
            <div className="flex px-6 bg-white/2 border-b border-white/5 overflow-x-auto no-scrollbar">
              {[
                { id: "basic", label: t("products.modals.form.tabs.basic"), icon: Info },
                { id: "media", label: t("products.modals.form.tabs.media"), icon: ImageIcon },
                { id: "settings", label: t("products.modals.form.tabs.settings"), icon: Settings },
                { id: "delivery", label: t("products.modals.form.tabs.delivery"), icon: Globe },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-red-500"
                      : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-red-500" : "text-gray-500")} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                    />
                  )}
                </button>
              ))}
            </div>
            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* Basic Info Tab */}
                    {activeTab === "basic" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                              {t("products.modals.form.basic.name")}
                            </label>
                            <Input
                              value={formData.name || ""}
                              onChange={(e) => {
                                const name = e.target.value;
                                setFormData({ ...formData, name, slug: generateSlug(name) });
                                if (errors.name) setErrors({ ...errors, name: "" });
                              }}
                              placeholder={t("products.modals.form.placeholders.name")}
                              className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6"
                              error={errors.name}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                              {t("products.modals.form.basic.slug")}
                            </label>
                            <Input
                              value={formData.slug || ""}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                              placeholder={t("products.modals.form.placeholders.slug")}
                              className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6"
                              error={errors.slug}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                            {t("products.modals.form.basic.description")}
                          </label>
                          <textarea
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t("products.modals.form.placeholders.description")}
                            rows={6}
                            className={cn(
                              "w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/50 resize-none transition-all font-medium",
                              errors.description ? "border-red-500/50 bg-red-500/5" : "border-white/10"
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                              {t("products.modals.form.basic.category")}
                            </label>
                            <div className="relative">
                              <select
                                value={formData.category || "SCRIPT"}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50 appearance-none transition-all font-bold text-sm uppercase tracking-widest"
                              >
                                <option value="SCRIPT" className="bg-[#111] text-white">{t("products.categories.script")}</option>
                                <option value="UI" className="bg-[#111] text-white">{t("products.categories.ui")}</option>
                                <option value="BUNDLE" className="bg-[#111] text-white">{t("products.categories.bundle")}</option>
                              </select>
                              <Layout className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                              {t("products.modals.form.basic.version")}
                            </label>
                            <Input
                              value={formData.version || ""}
                              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                              placeholder={t("products.modals.form.placeholders.version")}
                              className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                {t("products.modals.form.basic.stock")}
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-red-500 transition-colors">Unlimited</span>
                                <input
                                  type="checkbox"
                                  checked={formData.stock === -1}
                                  onChange={(e) => {
                                    setFormData({ ...formData, stock: e.target.checked ? -1 : 0 });
                                  }}
                                  className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-red-600 focus:ring-red-500/50"
                                />
                              </label>
                            </div>
                            <Input
                              type="number"
                              value={formData.stock === -1 ? "" : formData.stock}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFormData({ ...formData, stock: isNaN(val) ? 0 : val });
                              }}
                              disabled={formData.stock === -1}
                              placeholder={formData.stock === -1 ? "Unlimited" : "0"}
                              className={cn(
                                "bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6 font-bold transition-all",
                                formData.stock === -1 && "opacity-50 grayscale cursor-not-allowed"
                              )}
                              min={0}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Media Tab */}
                    {activeTab === "media" && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {/* Thumbnail Upload */}
                          <div className="md:col-span-1 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                              {t("products.modals.form.media.cover")}
                            </label>
                            
                            {thumbnailFile || formData.thumbnail ? (
                              <div className="relative group aspect-square rounded-3xl overflow-hidden border border-white/10">
                                <img 
                                  src={thumbnailFile ? thumbnailFile.preview : formData.thumbnail} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <label className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer transition-all">
                                    <Upload className="w-5 h-5 text-white" />
                                    <input type="file" className="hidden" onChange={handleThumbnailSelect} accept="image/*" />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setThumbnailFile(null);
                                      setFormData({ ...formData, thumbnail: undefined });
                                    }}
                                    className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-500 transition-all"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <FileUpload
                                label={t("products.modals.form.media.upload_cover")}
                                accept={{ "image/*": [".jpeg", ".jpg", ".png", ".webp"] }}
                                onFileSelect={(file) => setThumbnailFile({ file, preview: URL.createObjectURL(file) })}
                                className="aspect-square"
                                autoUpload={false}
                              />
                            )}
                            
                            {errors.thumbnail && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight text-center">{errors.thumbnail}</p>}
                          </div>

                          {/* Gallery Upload */}
                          <div className="md:col-span-2 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                              {t("products.modals.form.media.gallery")}
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                              {/* Existing Images */}
                              {formData.images.map((img, idx) => (
                                <div key={"old-" + idx} className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              {/* New Gallery Files */}
                              {galleryFiles.map((file, idx) => (
                                <div key={"new-" + idx} className="relative aspect-video rounded-2xl overflow-hidden border border-red-500/20 group">
                                  <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600 text-[8px] font-black text-white uppercase tracking-widest">{t("products.modals.form.media.pending")}</div>
                                  <button
                                    type="button"
                                    onClick={() => removeGalleryFile(idx)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              {/* Upload Trigger */}
                              <FileUpload
                                label={t("products.modals.form.media.add_image")}
                                accept={{ "image/*": [".jpeg", ".jpg", ".png", ".webp"] }}
                                onFileSelect={(file) => setGalleryFiles(prev => [...prev, { file, preview: URL.createObjectURL(file) }])}
                                className="aspect-video"
                                autoUpload={false}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Settings Tab */}
                    {activeTab === "settings" && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Pricing Card */}
                          <div className="p-6 rounded-3xl bg-white/2 border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <Zap className="w-5 h-5 text-red-500" />
                              <h3 className="text-sm font-black text-white uppercase tracking-widest">{t("products.modals.form.settings.pricing_title")}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("products.modals.form.settings.sale_price")}</label>
                                <Input
                                  type="number"
                                  value={formData.price}
                                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                  className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl font-bold"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("products.modals.form.settings.original_price")}</label>
                                <Input
                                  type="number"
                                  value={formData.originalPrice || ""}
                                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                                  placeholder={t("products.modals.form.placeholders.none")}
                                  className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("products.modals.form.settings.reward_points")}</label>
                              <Input
                                type="number"
                                value={formData.rewardPoints || 0}
                                onChange={(e) => setFormData({ ...formData, rewardPoints: Number(e.target.value) })}
                                className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl"
                              />
                            </div>
                          </div>

                          {/* Visibility & Flags */}
                          <div className="p-6 rounded-3xl bg-white/2 border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                              <Settings className="w-5 h-5 text-red-500" />
                              <h3 className="text-sm font-black text-white uppercase tracking-widest">{t("products.modals.form.settings.visibility_title")}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {[
                                { key: "isActive", label: t("products.modals.form.settings.active"), icon: Globe, color: "text-green-500" },
                                { key: "isNew", label: t("products.modals.form.settings.new"), icon: Zap, color: "text-blue-500" },
                                { key: "isFeatured", label: t("products.modals.form.settings.featured"), icon: Star, color: "text-yellow-500" },
                                { key: "isFlashSale", label: t("products.modals.form.settings.flash_sale"), icon: Zap, color: "text-red-500" },
                              ].map((item) => (
                                <label
                                  key={item.key}
                                  className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                    formData[item.key as keyof Product]
                                      ? "bg-red-500/10 border-red-500/30"
                                      : "bg-white/5 border-white/10 hover:border-white/20"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <item.icon className={cn("w-4 h-4", formData[item.key as keyof Product] ? item.color : "text-gray-500")} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.label}</span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={formData[item.key as keyof Product] as boolean}
                                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                    className="hidden"
                                  />
                                  <div className={cn(
                                    "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                                    formData[item.key as keyof Product] ? "border-red-500 bg-red-500" : "border-white/20"
                                  )}>
                                    {formData[item.key as keyof Product] && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Flash Sale Options */}
                        <AnimatePresence>
                          {formData.isFlashSale && (
                            <motion.div
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="p-8 rounded-4xl bg-linear-to-br from-red-600/20 to-transparent border border-red-500/20 relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap className="w-32 h-32 text-red-500" />
                              </div>
                              <div className="relative space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-white" />
                                  </div>
                                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">{t("products.modals.form.settings.flash_config")}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-red-400 ml-1">{t("products.modals.form.settings.flash_price")}</label>
                                    <Input
                                      type="number"
                                      value={formData.flashSalePrice || ""}
                                      onChange={(e) => setFormData({ ...formData, flashSalePrice: Number(e.target.value) })}
                                      className="bg-black/40 border-red-500/30 focus:border-red-500 rounded-xl py-6 font-black text-red-500"
                                      error={errors.flashSalePrice}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-red-400 ml-1">{t("products.modals.form.settings.flash_ends")}</label>
                                    <Input
                                      type="datetime-local"
                                      value={formData.flashSaleEnds || ""}
                                      onChange={(e) => setFormData({ ...formData, flashSaleEnds: e.target.value })}
                                      className="bg-black/40 border-red-500/30 focus:border-red-500 rounded-xl py-6 scheme-dark font-bold text-red-500"
                                      error={errors.flashSaleEnds}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    {/* Delivery Tab */}
                    {activeTab === "delivery" && (
                      <div className="space-y-8">
                        <div className="p-8 rounded-4xl bg-white/2 border border-white/5 space-y-8">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <PackageIcon className="w-6 h-6 text-blue-500" />
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{t("products.modals.form.delivery.title")}</h3>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t("products.modals.form.delivery.subtitle")}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.isDownloadable}
                                onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
                            </label>
                          </div>

                          <AnimatePresence>
                            {formData.isDownloadable && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6 overflow-hidden"
                              >
                                <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("products.modals.form.delivery.asset_method")}</label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FileUpload
                                      label={t("products.modals.form.delivery.direct_upload")}
                                      accept={{
                                        "application/zip": [".zip"],
                                        "application/x-zip-compressed": [".zip"],
                                      }}
                                      onFileSelect={(file) => {
                                        setProductFile(file);
                                        setFormData({ ...formData, isDownloadable: true });
                                      }}
                                      className="p-4"
                                      autoUpload={false}
                                    />

                                    <div className="space-y-4 flex flex-col justify-center">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("products.modals.form.delivery.external")}</label>
                                        <Input
                                          value={formData.downloadKey || ""}
                                          onChange={(e) => setFormData({ ...formData, downloadKey: e.target.value })}
                                          placeholder={t("products.modals.form.delivery.placeholder_package")}
                                          className="bg-white/5 border-white/10 focus:border-blue-500/50 rounded-xl py-6"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("products.modals.form.delivery.url_override")}</label>
                                        <Input
                                          value={formData.downloadUrl || ""}
                                          onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                                          placeholder={t("products.modals.form.delivery.placeholder_url")}
                                          className="bg-white/5 border-white/10 focus:border-blue-500/50 rounded-xl py-6"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {(productFile || formData.downloadUrl) && (
                                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                      <p className="text-xs font-bold text-white truncate">
                                        {productFile ? productFile.name : (formData.downloadUrl ? formData.downloadUrl.split('/').pop() : t("products.modals.form.delivery.linked_asset"))}
                                      </p>
                                      <p className="text-[8px] text-blue-400 uppercase font-black tracking-widest">
                                        {productFile ? t("products.modals.form.delivery.ready") : t("products.modals.form.delivery.linked")}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductFile(null);
                                        if (!productFile) setFormData({ ...formData, downloadUrl: undefined, downloadFileKey: undefined });
                                      }}
                                      className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Features & Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("products.modals.form.delivery.features")}</label>
                              <button type="button" onClick={addFeature} className="text-[8px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">{t("products.modals.form.delivery.add_new")}</button>
                            </div>
                            <div className="space-y-3">
                              {formData.features.map((feature, idx) => (
                                <div key={idx} className="relative group">
                                  <Input
                                    value={feature}
                                    onChange={(e) => updateFeature(idx, e.target.value)}
                                    placeholder={t("products.modals.form.delivery.feature_placeholder", { count: idx + 1 })}
                                    className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl pr-12"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeFeature(idx)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{t("products.modals.form.delivery.tags")}</label>
                            <div className="space-y-4">
                              <div className="relative group">
                                <Input
                                  value={newTag}
                                  onChange={(e) => setNewTag(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                  placeholder={t("products.modals.form.delivery.tags_placeholder")}
                                  className="bg-white/5 border-white/10 focus:border-red-500/50 rounded-xl py-6"
                                />
                                <button
                                  type="button"
                                  onClick={addTag}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    className="bg-red-600/10 text-red-500 border-red-500/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest flex items-center gap-2 group cursor-pointer hover:bg-red-600 hover:text-white transition-all"
                                  >
                                    {tag}
                                    <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => removeTag(tag)} />
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  activeTab === "delivery" && !formData.isDownloadable ? "bg-yellow-500" : "bg-green-500"
                )} />
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                  {activeTab === "delivery" && !formData.isDownloadable ? t("products.modals.form.delivery.mode_physical") : t("products.modals.form.delivery.mode_digital")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white uppercase font-black text-[10px] tracking-widest px-8"
                >
                  {t("products.modals.form.btn_discard")}
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 px-10 py-6 rounded-xl font-black uppercase tracking-widest transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("products.modals.form.btn_saving")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? t("products.modals.form.btn_update") : t("products.modals.form.btn_save")}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
