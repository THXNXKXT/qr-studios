"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/ui";

interface Product {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: "script" | "ui" | "bundle";
  images: string[];
  features: string[];
  tags: string[];
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  version: string;
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
  category: "script",
  images: [],
  features: [""],
  tags: [],
  stock: -1,
  isNew: true,
  isFeatured: false,
  version: "1.0.0",
};

export function ProductFormModal({ isOpen, onClose, product, onSave }: ProductFormModalProps) {
  const [formData, setFormData] = useState<Product>(defaultProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState("");

  const isEditing = !!product?.id;

  useEffect(() => {
    if (product) {
      setFormData({ ...product, features: product.features.length ? product.features : [""] });
    } else {
      setFormData(defaultProduct);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsLoading(false);
    }
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">ชื่อสินค้า *</label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    placeholder="Advanced Inventory System"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Slug</label>
                  <Input
                    value={formData.slug || ""}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="advanced-inventory-system"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">รายละเอียด *</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดสินค้า..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
                  required
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">ราคา (บาท) *</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">ราคาเดิม (ถ้ามี)</label>
                  <Input
                    type="number"
                    value={formData.originalPrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">หมวดหมู่ *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as Product["category"] })
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500/50"
                  >
                    <option value="script">Script</option>
                    <option value="ui">UI</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">สต็อก (-1 = ไม่จำกัด)</label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    min={-1}
                  />
                </div>
              </div>

              {/* Version & Flags */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">เวอร์ชัน</label>
                  <Input
                    value={formData.version || ""}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0.0"
                  />
                </div>
                <div className="flex items-center gap-4 pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-white">สินค้าใหม่</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-white">แนะนำ</span>
                  </label>
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">คุณสมบัติ</label>
                  <Button type="button" variant="ghost" size="sm" onClick={addFeature}>
                    <Plus className="w-4 h-4" />
                    เพิ่ม
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`คุณสมบัติที่ ${index + 1}`}
                      />
                      {formData.features.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFeature(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">แท็ก</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="เพิ่มแท็ก..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addTag}>
                    เพิ่ม
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">รูปภาพ (URL)</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        if (input.value) {
                          setFormData({ ...formData, images: [...formData.images, input.value] });
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="https://example.com/image.jpg"]') as HTMLInputElement;
                      if (input?.value) {
                        setFormData({ ...formData, images: [...formData.images, input.value] });
                        input.value = "";
                      }
                    }}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="w-20 h-20 rounded-lg bg-white/10 overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              images: formData.images.filter((_, i) => i !== index),
                            })
                          }
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
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
                      {isEditing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
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
