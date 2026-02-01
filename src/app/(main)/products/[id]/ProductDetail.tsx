"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Star, 
  Check, 
  Shield, 
  Zap, 
  RefreshCw, 
  MessageCircle, 
  ImageOff, 
  Clock 
} from "lucide-react";
import { toast } from "sonner";
import { Button, Badge, WishlistButton, StockCounter, FlashSaleTimer } from "@/components/ui";
import {
  ProductCard,
  RecentlyViewed,
  ReviewSection,
  ProductDetailSkeleton
} from "@/components/product";
import { useCartStore } from "@/store/cart";
import { useRecentlyViewedStore } from "@/store/recently-viewed";
import { useAuth } from "@/hooks/useAuth";
import { adminApi, productsApi, userApi } from "@/lib/api";
import type { Product } from "@/types";
import { cn, formatPrice, getProductPrice, isProductOnFlashSale } from "@/lib/utils";

interface Review {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  helpful: number;
  createdAt: Date;
}

interface ReviewResponse {
  id: string;
  userId: string;
  user?: {
    username: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  isVerified: boolean;
  helpful?: number;
  createdAt: string;
}

interface OrderItem {
  productId: string;
}

interface Order {
  status: string;
  items: OrderItem[];
}

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
}

interface DownloadResponse {
  url: string;
}

export function ProductDetail({ initialProduct }: { initialProduct?: Product }) {
  const { t, i18n } = useTranslation("common");
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const addToRecentlyViewed = useRecentlyViewedStore((state) => state.addItem);
  const [mounted, setMounted] = useState(false);

  const productId = params?.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Product Data
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await productsApi.getById(productId);
      if (error) throw new Error(error.message);
      const response = data as ApiResponse<Product>;
      const prod = response?.data;
      
      // Track recently viewed
      if (prod) {
        addToRecentlyViewed({
          id: prod.id,
          name: prod.name,
          price: prod.price,
          image: Array.isArray(prod.images) ? prod.images[0] : "",
          category: prod.category,
          stock: prod.stock,
          isFlashSale: prod.isFlashSale,
          flashSalePrice: prod.flashSalePrice,
          flashSaleEnds: prod.flashSaleEnds,
          rewardPoints: prod.rewardPoints,
          expectedPoints: prod.expectedPoints,
        });
      }
      return prod as Product;
    },
    enabled: !!productId && mounted,
    initialData: initialProduct,
  });

  // Fetch Reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data } = await productsApi.getReviews(productId);
      return (data as ApiResponse<ReviewResponse[]>)?.data || [];
    },
    enabled: !!productId && mounted,
  });

  const reviews = reviewsData || [];

  // Check Purchase Status
  const { data: hasPurchased } = useQuery({
    queryKey: ['purchase-status', user?.id, productId],
    queryFn: async () => {
      const { data } = await userApi.getOrders();
      const orders = (data as ApiResponse<Order[]>)?.data || [];
      return orders.some(order =>
        order.status === "COMPLETED" &&
        order.items.some(item => item.productId === productId)
      );
    },
    enabled: !!user?.id && !!productId && mounted,
    initialData: false,
  });

  // Check if user can review
  const { data: canReview } = useQuery({
    queryKey: ['can-review', user?.id, productId],
    queryFn: async () => {
      if (!user || !hasPurchased) return false;
      const alreadyReviewed = reviews.some((r) => r.userId === user.id);
      return !alreadyReviewed;
    },
    enabled: !!user?.id && !!productId && !!reviews && mounted,
    initialData: false,
  });

  // Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number, comment: string }) => {
      const { data, error } = await productsApi.addReview(productId, rating, comment);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(t("products.detail.success.review_submitted"));
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['can-review', user?.id, productId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("products.detail.errors.review_failed"));
    }
  });

  // Download Mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await productsApi.download(productId);
      if (error) throw new Error(error.message);
      return (data as ApiResponse<DownloadResponse>)?.data?.url ?? '';
    },
    onSuccess: (url: string) => {
      window.open(url, '_blank');
    },
    onError: (error: Error) => {
      toast.error(error.message || t("products.detail.errors.download_failed"));
    }
  });

  const reviewStats = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r: ReviewResponse) => {
      const rating = Math.round(r.rating) as keyof typeof dist;
      if (dist[rating] !== undefined) dist[rating]++;
    });

    return {
      average: product?.rating || 0,
      total: product?.reviewCount || 0,
      distribution: dist
    };
  }, [reviews, product?.rating, product?.reviewCount]);

  const renderTranslation = useCallback((key: string, options?: Record<string, unknown>): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  }, [mounted, t]);

  const relatedProducts: Product[] = useMemo(() => {
    return [];
  }, []);

  const handleAddToCart = useCallback(() => {
    if (product) addItem(product);
  }, [addItem, product]);

  const handleBuyNow = useCallback(() => {
    if (product) {
      addItem(product);
      router.push("/cart");
    }
  }, [addItem, router, product]);

  const handleDownload = useCallback(() => {
    downloadMutation.mutate();
  }, [downloadMutation]);

  const handleSubmitReview = useCallback((rating: number, comment: string) => {
    if (!user) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    submitReviewMutation.mutate({ rating, comment });
  }, [user, router, submitReviewMutation]);

  const allImages = useMemo(() => {
    if (!product) return [];
    const images = [];
    if (product.thumbnail) images.push(product.thumbnail);
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images);
    }
    return images;
  }, [product]);

  const loading = productLoading;

  if (loading || authLoading || !mounted) {
    return (
      <div className="min-h-screen pt-20">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{renderTranslation("products.detail.errors.not_found")}</h1>
          <Link href="/products">
            <Button>{renderTranslation("products.detail.errors.back_to_products")}</Button>
          </Link>
        </div>
      </div>
    );
  }

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
            {renderTranslation("products.detail.breadcrumb_home")}
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-red-400 transition-colors">
            {renderTranslation("products.detail.breadcrumb_products")}
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
            className="space-y-6"
          >
            {/* Main Image */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-linear-to-br from-red-900/40 via-black to-black border border-white/5 shadow-2xl group">
              {allImages[selectedImage] ? (
                <Image
                  src={allImages[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5">
                  <ImageOff className="w-16 h-16 text-gray-600 mb-4" />
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-gray-600">{renderTranslation("products.detail.no_image")}</span>
                </div>
              )}

              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />

              {/* Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                {product.isNew && (
                  <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold uppercase tracking-widest text-[10px] w-fit">
                    {renderTranslation("products.card.new")}
                  </Badge>
                )}
                {isProductOnFlashSale(product) ? (
                  <Badge variant="destructive" className="bg-red-600 text-white border-none shadow-lg shadow-red-600/20 px-3 py-1.5 font-black uppercase tracking-widest text-[10px] gap-1.5 animate-pulse w-fit">
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    {renderTranslation("flash_sale.title")} -{Math.round((1 - (product.flashSalePrice || product.price) / (product.originalPrice || product.price)) * 100)}%
                  </Badge>
                ) : product.originalPrice && (
                  <Badge variant="destructive" className="bg-red-600 text-white border-none shadow-lg shadow-red-600/20 px-3 py-1.5 font-black uppercase tracking-widest text-[10px] w-fit">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative w-24 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 shrink-0",
                      selectedImage === index
                        ? "border-red-600 shadow-lg shadow-red-600/20 scale-95"
                        : "border-white/5 hover:border-white/20 opacity-60 hover:opacity-100"
                    )}
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
              {product.category === "SCRIPT"
                ? renderTranslation("footer.links.products.script")
                : product.category === "UI"
                  ? renderTranslation("footer.links.products.ui")
                  : product.category === "BUNDLE"
                    ? renderTranslation("footer.links.products.bundle")
                    : renderTranslation("footer.links.products.commission")}
            </Badge>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {product.name}
            </h1>

            {/* Rating & Stock */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-1">
                {[...Array(Math.max(0, 5))].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating || 0)
                      ? "fill-red-500 text-red-500"
                      : "text-white/10"
                      }`}
                  />
                ))}
                <span className="ml-2 text-white font-medium">{product.rating}</span>
                <span className="text-gray-400 ml-1">({product.reviewCount} {renderTranslation("products.detail.reviews_count")})</span>
              </div>

              <StockCounter stock={product.stock} />
            </div>

            {/* Price & Flash Sale Timer */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-4">
                <span className="text-4xl font-black text-red-500 tracking-tighter">
                  {formatPrice(getProductPrice(product))}
                </span>
                {isProductOnFlashSale(product) && (
                  <span className="text-xl text-gray-500 line-through opacity-50 font-bold">
                    {formatPrice(product.price)}
                  </span>
                )}
                {!isProductOnFlashSale(product) && product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through opacity-50 font-bold">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Reward Points Badge */}
                {product.expectedPoints !== undefined && product.expectedPoints > 0 && (
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-yellow-400/5 border border-yellow-400/10 shadow-inner group">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500/20 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none mb-1">{renderTranslation("products.detail.earn_points")}</p>
                      <p className="text-lg font-black text-yellow-500 leading-none">
                        {product.expectedPoints.toLocaleString()} <span className="text-xs uppercase opacity-60">Pts</span>
                      </p>
                    </div>
                  </div>
                )}

                {isProductOnFlashSale(product) && product.flashSaleEnds && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20"
                  >
                    <div className="flex items-center gap-2 text-red-500">
                      <Clock className="w-5 h-5 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-widest">{renderTranslation("flash_sale.title")} {renderTranslation("flash_sale.ends_in")}</span>
                    </div>
                    <FlashSaleTimer
                      endTime={product.flashSaleEnds}
                      variant="default"
                      className="text-white"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 leading-relaxed">{product.description}</p>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white">{renderTranslation("products.detail.features_title")}</h3>
              <ul className="space-y-2">
                {product.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-red-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 pt-6">
              {hasPurchased && product.isDownloadable && (
                <div className="w-full">
                  <Button
                    size="xl"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 h-14 text-lg font-bold mb-4"
                    onClick={handleDownload}
                    disabled={downloadMutation.isPending}
                  >
                    {downloadMutation.isPending ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        {renderTranslation("products.detail.downloading")}
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        {renderTranslation("products.detail.download_btn")}
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  size="xl"
                  className={cn(
                    "flex-1 h-14 text-lg font-bold shadow-xl shadow-red-600/20",
                    hasPurchased ? "bg-white/10 hover:bg-white/20 border border-white/10" : "bg-red-600 hover:bg-red-500"
                  )}
                  onClick={handleBuyNow}
                >
                  {hasPurchased
                    ? renderTranslation("products.detail.buy_now_btn")
                    : renderTranslation("products.detail.buy_now_btn")
                  }
                </Button>

                <Button
                  variant="secondary"
                  size="xl"
                  className="flex-1 bg-white/5 hover:bg-white/10 border-white/5 h-14"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {renderTranslation("products.detail.add_to_cart_btn")}
                </Button>

                <WishlistButton
                  item={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.thumbnail || product.images[0] || "",
                    category: product.category,
                    description: product.description || "",
                    stock: product.stock,
                    isFlashSale: product.isFlashSale,
                    flashSalePrice: product.flashSalePrice,
                    flashSaleEnds: product.flashSaleEnds,
                  }}
                  size="xl"
                  className="h-14 w-14 shrink-0 bg-white/5 border-white/5 hover:bg-white/10"
                />
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              {[
                { icon: Shield, label: renderTranslation("products.detail.trust.secure"), desc: renderTranslation("products.detail.trust.secure_desc") },
                { icon: Zap, label: renderTranslation("products.detail.trust.instant"), desc: renderTranslation("products.detail.trust.instant_desc") },
                { icon: RefreshCw, label: renderTranslation("products.detail.trust.update"), desc: renderTranslation("products.detail.trust.update_desc") },
                { icon: MessageCircle, label: renderTranslation("products.detail.trust.support"), desc: renderTranslation("products.detail.trust.support_desc") },
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

        <ReviewSection
          productId={product.id}
          reviews={reviews.map((r: ReviewResponse) => ({
            id: r.id,
            userId: r.userId,
            username: r.user?.username || "Unknown",
            avatar: r.user?.avatar,
            rating: r.rating,
            comment: r.comment,
            isVerified: r.isVerified,
            helpful: r.helpful || 0,
            createdAt: new Date(r.createdAt)
          }))}
          averageRating={reviewStats.average}
          totalReviews={reviewStats.total}
          distribution={reviewStats.distribution}
          canReview={canReview}
          onSubmitReview={async (rating: number, comment: string) => handleSubmitReview(rating, comment)}
        />

        {/* Recently Viewed */}
        <RecentlyViewed limit={4} excludeId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-8">{renderTranslation("products.detail.related_products")}</h2>
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
