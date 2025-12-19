"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { ProductFormModal, ConfirmModal } from "@/components/admin";
import { formatPrice } from "@/lib/utils";
import { mockProducts } from "@/data/products";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState(mockProducts);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    if (selectedProduct) {
      // Edit existing
      setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, ...productData } : p));
    } else {
      // Add new
      const newProduct = {
        ...productData,
        id: `prod-${Date.now()}`,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProducts([newProduct, ...products]);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      setProducts(products.filter(p => p.id !== selectedProduct.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">จัดการสินค้า</h1>
          <p className="text-gray-400">จัดการสินค้าทั้งหมดในระบบ</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="w-4 h-4" />
          เพิ่มสินค้า
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "script", "ui", "bundle"].map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? "ทั้งหมด" : cat.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">สินค้า</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">หมวดหมู่</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">ราคา</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">สต็อก</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">สถานะ</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center overflow-hidden">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-gray-500">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary">
                      {product.category.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-red-400">{formatPrice(product.price)}</p>
                      {product.originalPrice && (
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{product.stock === -1 ? "∞" : product.stock}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={product.isFeatured ? "success" : "secondary"}>
                      {product.isFeatured ? "แนะนำ" : "ปกติ"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/products/${product.id}`} target="_blank">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteProduct(product)}
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

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">ไม่พบสินค้า</p>
          </div>
        )}
      </Card>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={selectedProduct as any}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="ลบสินค้า"
        message={`คุณต้องการลบ "${selectedProduct?.name}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบสินค้า"
        type="danger"
      />
    </div>
  );
}
