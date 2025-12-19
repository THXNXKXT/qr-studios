"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Check,
  Heart,
  Share2,
  Shield,
  Zap,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { Button, Badge, Card, WishlistButton, ReviewStars } from "@/components/ui";
import { ProductCard, RecentlyViewed, ReviewSection } from "@/components/product";
import { useCartStore } from "@/store/cart";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { getProductById, mockProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";

// Mock reviews data
const mockReviews = [
  {
    id: "1",
    userId: "u1",
    username: "GamerTH",
    rating: 5,
    comment: "สคริปต์ดีมาก ใช้งานง่าย ซัพพอร์ตเร็วมาก แนะนำเลยครับ",
    isVerified: true,
    helpful: 12,
    createdAt: new Date("2024-12-01"),
  },
  {
    id: "2",
    userId: "u2",
    username: "FiveMDev",
    rating: 4,
    comment: "โค้ดสะอาด optimize ดี แต่อยากให้มี feature เพิ่มอีกหน่อย",
    isVerified: true,
    helpful: 8,
    createdAt: new Date("2024-11-28"),
  },
  {
    id: "3",
    userId: "u3",
    username: "ServerOwner99",
    rating: 5,
    comment: "คุ้มค่ามาก ใช้มาหลายเดือนไม่มีปัญหาเลย",
    isVerified: true,
    helpful: 5,
    createdAt: new Date("2024-11-15"),
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const addToRecentlyViewed = useRecentlyViewedStore((state) => state.addItem);

  const product = getProductById(params.id as string);

  // Add to recently viewed on mount
  useEffect(() => {
    if (product) {
      addToRecentlyViewed({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0] || "",
        category: product.category,
      });
    }
  }, [product, addToRecentlyViewed]);

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">ไม่พบสินค้า</h1>
          <Link href="/products">
            <Button>กลับไปหน้าสินค้า</Button>
          </Link>
        </div>
      </div>
    );
  }

  const relatedProducts = mockProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addItem(product);
  };

  const handleBuyNow = () => {
    addItem(product);
    router.push("/cart");
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-400 mb-8"
        >
          <Link href="/" className="hover:text-red-400 transition-colors">
            หน้าแรก
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-red-400 transition-colors">
            สินค้า
          </Link>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </motion.div>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-linear-to-br from-red-900/50 to-black border border-white/10">
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-2xl bg-red-500/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-red-400">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {product.isNew && <Badge variant="success">ใหม่</Badge>}
                {product.originalPrice && (
                  <Badge variant="destructive">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-red-500"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Category */}
            <Badge variant="secondary">
              {product.category === "script"
                ? "Script"
                : product.category === "ui"
                ? "UI"
                : "Bundle"}
            </Badge>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-600"
                    }`}
                  />
                ))}
                <span className="ml-2 text-white font-medium">{product.rating}</span>
              </div>
              <span className="text-gray-400">({product.reviewCount} รีวิว)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-red-400">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-400 leading-relaxed">{product.description}</p>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white">คุณสมบัติ:</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button size="lg" className="flex-1" onClick={handleBuyNow}>
                ซื้อเลย
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5" />
                เพิ่มลงตะกร้า
              </Button>
              <WishlistButton
                item={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] || "",
                  category: product.category,
                }}
                size="lg"
              />
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              {[
                { icon: Shield, label: "ปลอดภัย 100%", desc: "ชำระเงินผ่าน Stripe" },
                { icon: Zap, label: "ส่งทันที", desc: "หลังชำระเงินสำเร็จ" },
                { icon: RefreshCw, label: "อัพเดทฟรี", desc: "ตลอดอายุการใช้งาน" },
                { icon: MessageCircle, label: "ซัพพอร์ต", desc: "ผ่าน Discord 24/7" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <ReviewSection
          productId={product.id}
          reviews={mockReviews}
          averageRating={product.rating}
          totalReviews={product.reviewCount}
          distribution={{ 5: 25, 4: 10, 3: 3, 2: 1, 1: 0 }}
          canReview={true}
          onSubmitReview={async (rating, comment) => {
            console.log("Submit review:", { rating, comment });
            // API call will be here
          }}
        />

        {/* Recently Viewed */}
        <RecentlyViewed limit={4} excludeId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-8">สินค้าที่เกี่ยวข้อง</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
