"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  ArrowLeft,
  ArrowRight,
  Package,
  Calendar,
  CreditCard,
  Hash,
  Download,
  Key,
  AlertCircle,
  Copy,
  Loader2,
  Shield,
  EyeOff,
  Eye,
  CheckCircle,
  ImageOff,
  Sparkles
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { createLogger } from "@/lib/logger";
interface ApiResponse<T> {
  data?: T;
  success?: boolean;
}

interface DownloadUrlResponse {
  downloadUrl: string;
}

const orderDetailLogger = createLogger("dashboard:order-detail");
import { OrderDetailSkeleton } from "@/components/dashboard/order-detail-skeleton";
import { formatPrice, cn } from "@/lib/utils";
import { ordersApi, licensesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";

interface OrderDetail {
  id: string;
  total: number;
  discount: number;
  promoCode: string | null;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      thumbnail?: string | null; // Product thumbnail image
      category: string;
      downloadKey: string | null;
      version: string | null;
    };
  }>;
  licenses: Array<{
    id: string;
    licenseKey: string;
    status: string;
    productId: string;
    product: {
      id: string;
      name: string;
    };
  }>;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const toggleKeyVisibility = useCallback((id: string) => {
    setVisibleKeys(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  }, []);

  useEffect(() => {
    async function fetchOrderDetail() {
      const token = getAuthToken();

      // If auth is still working, wait for it
      if (!isSynced && !user?.id && token) return;

      // If we finished syncing and still no user, or no token at all
      if (!user?.id && !token) {
        setLoading(false);
        return;
      }

      // If we have a user, fetch their data
      if (user?.id) {
        try {
          const { data, error: apiError } = await ordersApi.getById(id);
          if (apiError) {
            setError(typeof apiError === 'string' ? apiError : apiError.message || t("dashboard.orders.errors.fetch_failed"));
          } else if (data) {
            // Backend returns {success: true, data: orderObject}
            const response = data as ApiResponse<OrderDetail>;
            const orderData = response.success ? response.data : (data as unknown as OrderDetail);
            setOrder(orderData ?? null);
          }
        } catch (err) {
          orderDetailLogger.error('Failed to fetch order details', { error: err });
          setError(t("dashboard.orders.errors.fetch_failed"));
        } finally {
          setLoading(false);
        }
      } else if (isSynced) {
        // Auth finished but no user
        setLoading(false);
      }
    }
    fetchOrderDetail();
  }, [id, user?.id, isSynced, t]); // Use stable deps and sync status

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const renderTranslation = useCallback((key: string, options?: Record<string, unknown>): string => {
    if (!isMounted.current) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  }, [t]);

  const handleDownload = async (licenseId: string) => {
    try {
      const { data, error } = await licensesApi.getDownloadUrl(licenseId);
      if (error) {
        alert(error || t("dashboard.licenses.errors.download_failed"));
        return;
      }

      const response = data as ApiResponse<DownloadUrlResponse>;
      const downloadUrl = response.success ? response.data?.downloadUrl : (data as unknown as DownloadUrlResponse)?.downloadUrl;
      if (!downloadUrl) {
        alert(t("dashboard.licenses.errors.download_failed"));
        return;
      }

      // Open download in a new tab or trigger it
      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4001"}${downloadUrl}`;
      window.open(fullUrl, '_blank');
    } catch (err) {
      orderDetailLogger.error('Download failed', { error: err });
      alert(t("common.error"));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-32 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 space-y-4">
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span suppressHydrationWarning>{renderTranslation("dashboard.orders.back")}</span>
              </Button>
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white" suppressHydrationWarning>{renderTranslation("dashboard.orders.details")}</h1>
                <p className="text-gray-400" suppressHydrationWarning>{renderTranslation("common.loading")}</p>
              </div>
              <Button disabled className="bg-red-600/50">
                <Download className="w-4 h-4 mr-2" />
                <span suppressHydrationWarning>{renderTranslation("dashboard.orders.download_receipt")}</span>
              </Button>
            </div>
          </div>

          <OrderDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!user && !getAuthToken()) {
    if (typeof window !== 'undefined') {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    return null;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen pt-32 px-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2" suppressHydrationWarning>{renderTranslation("dashboard.orders.no_orders")}</h1>
          <p className="text-gray-400 mb-6" suppressHydrationWarning>{error || renderTranslation("dashboard.orders.no_orders_desc")}</p>
          <Link href="/dashboard/orders">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span suppressHydrationWarning>{renderTranslation("dashboard.orders.back")}</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-4 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-red-900/10 via-black to-black pointer-events-none" />
      <div className="container max-w-4xl mx-auto relative z-10">
        <div className="mb-10">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span suppressHydrationWarning>{renderTranslation("dashboard.orders.back")}</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white tracking-tight flex flex-wrap items-center gap-4">
                <span suppressHydrationWarning>{renderTranslation("dashboard.orders.details")}</span>
                <Badge
                  className={cn(
                    "px-4 py-1 rounded-xl border-none font-black text-[10px] uppercase tracking-widest shadow-lg",
                    order.status === "COMPLETED" ? "bg-red-500/20 text-red-400 shadow-red-500/10" :
                      order.status === "PENDING" ? "bg-red-900/20 text-red-500/50 shadow-red-900/10" :
                        "bg-red-500/20 text-red-400 shadow-red-500/10"
                  )}
                  suppressHydrationWarning
                >
                  {order.status === "COMPLETED" ? renderTranslation("dashboard.orders.status.completed") : order.status === "PENDING" ? renderTranslation("dashboard.orders.status.pending") : order.status}
                </Badge>
              </h1>
              <div className="flex items-center gap-2 text-gray-500 font-mono text-sm uppercase tracking-tighter">
                <Hash className="w-4 h-4" />
                <span suppressHydrationWarning>{renderTranslation("dashboard.orders.order_id")}: {order.id.toUpperCase()}</span>
              </div>
            </div>
            {order.status === "COMPLETED" && (
              <Button className="bg-red-600 hover:bg-red-500 h-12 px-8 rounded-2xl shadow-xl shadow-red-600/20 font-bold group">
                <Download className="w-5 h-5 mr-2 group-hover:translate-y-0.5 transition-transform" />
                <span suppressHydrationWarning>{renderTranslation("dashboard.orders.download_receipt")}</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Calendar, label: renderTranslation("dashboard.orders.date"), value: new Date(order.createdAt).toLocaleDateString(renderTranslation("common.date_locale") === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { icon: CreditCard, label: renderTranslation("dashboard.orders.payment_method"), value: order.paymentMethod },
            { icon: Package, label: renderTranslation("dashboard.orders.total_payment"), value: formatPrice(order.total), valueClass: "text-red-500 font-black" }
          ].map((item, index) => (
            <Card key={index} className="p-6 border-white/5 bg-white/2 backdrop-blur-sm group hover:border-red-500/30 transition-all duration-500 shadow-xl">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                  <item.icon className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1" suppressHydrationWarning>{item.label}</p>
                  <p className={cn("text-sm text-white font-bold", item.valueClass)} suppressHydrationWarning>{item.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-8">
          {/* Order Items */}
          <Card className="overflow-hidden border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Package className="w-6 h-6 text-red-500" />
                <span suppressHydrationWarning>{renderTranslation("dashboard.orders.items_title")}</span>
              </h3>
              <Badge className="bg-white/5 text-gray-400 border-none" suppressHydrationWarning>{order.items.length} {renderTranslation("dashboard.orders.items_count")}</Badge>
            </div>
            <div className="divide-y divide-white/5">
              {order.items.map((item) => {
                const imageUrl = item.product?.thumbnail;
                
                return (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center overflow-hidden shrink-0 group-hover:border-red-500/30 transition-colors">
                        {imageUrl ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <ImageOff className="w-8 h-8 text-gray-700 mb-1" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-700" suppressHydrationWarning>{renderTranslation("common.no_image")}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{item.product.name}</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {item.quantity} × {formatPrice(item.price)}
                          </span>
                          {item.product.version && (
                            <Badge variant="outline" className="text-[10px] py-0 border-white/10 text-gray-400" suppressHydrationWarning>
                              {renderTranslation("dashboard.orders.version")} {item.product.version}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right border-t border-white/5 pt-4 sm:border-none sm:pt-0">
                      <p className="text-xl font-black text-white">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-8 bg-black/40 border-t border-white/5">
              <div className="max-w-xs ml-auto space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-wider" suppressHydrationWarning>{renderTranslation("dashboard.orders.subtotal")}</span>
                  <span className="text-white font-mono">{formatPrice(order.total + order.discount)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-2" suppressHydrationWarning>
                      <Sparkles className="w-4 h-4" />
                      {renderTranslation("cart.summary.promo_discount", { code: order.promoCode ? `(${order.promoCode})` : '' })}
                    </span>
                    <span className="text-red-400 font-mono">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <span className="text-lg font-black text-white uppercase tracking-tight" suppressHydrationWarning>{renderTranslation("dashboard.orders.total_payment")}</span>
                  <span className="text-3xl font-black text-red-500 tracking-tighter">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Licenses & Downloads */}
          {order.status === "COMPLETED" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Key className="w-7 h-7 text-red-500" />
                  <span suppressHydrationWarning>{renderTranslation("dashboard.orders.usage_info")}</span>
                </h3>
                <Badge className="bg-red-600 text-white border-none shadow-lg shadow-red-600/20 px-3" suppressHydrationWarning>
                  {renderTranslation("dashboard.orders.license_download")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {order.licenses.map((license, index) => (
                  <motion.div
                    key={license.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm hover:border-red-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                        <div className="flex-1 min-w-0 space-y-6">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2" suppressHydrationWarning>{renderTranslation("dashboard.orders.product_name")}</p>
                            <h4 className="text-2xl font-black text-white group-hover:text-red-400 transition-colors">{license.product.name}</h4>
                          </div>

                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-3" suppressHydrationWarning>{renderTranslation("dashboard.orders.license_key")}</p>
                            <div className="relative group/key max-w-2xl">
                              <div className="absolute -inset-1 bg-linear-to-r from-red-600 to-red-900 rounded-2xl blur opacity-10 group-hover/key:opacity-20 transition duration-500" />
                              <div className="relative bg-black/60 border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-6 group-hover/key:border-red-500/20 transition-all">
                                <code className="text-sm font-mono text-red-400 truncate">
                                  {visibleKeys.includes(license.id)
                                    ? license.licenseKey
                                    : `${license.licenseKey?.substring(0, 6) || ''}••••••••••••••••••••`}
                                </code>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                                    onClick={() => toggleKeyVisibility(license.id)}
                                    title={visibleKeys.includes(license.id) ? renderTranslation("dashboard.licenses.hide_key") : renderTranslation("dashboard.licenses.show_key")}
                                  >
                                    {visibleKeys.includes(license.id) ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                                    onClick={() => copyToClipboard(license.licenseKey, license.id)}
                                  >
                                    {copiedKey === license.id ? (
                                      <CheckCircle className="w-4 h-4 text-red-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-64 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-10">
                          <Link href={`/dashboard/licenses`} className="flex-1">
                            <Button variant="secondary" className="w-full h-14 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl font-bold group/btn">
                              <Shield className="w-5 h-5 mr-2 text-red-500" />
                              <span suppressHydrationWarning>{renderTranslation("dashboard.licenses.ip_whitelist")}</span>
                              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                            </Button>
                          </Link>
                          <Button
                            className="flex-1 w-full h-14 bg-red-600 hover:bg-red-500 rounded-2xl font-black shadow-xl shadow-red-600/20 text-lg group/dl"
                            onClick={() => handleDownload(license.id)}
                          >
                            <Download className="w-6 h-6 mr-2 group-hover/dl:translate-y-0.5 transition-transform" />
                            <span suppressHydrationWarning>{renderTranslation("dashboard.licenses.download")}</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {order.licenses.length === 0 && (
                <Card className="p-16 text-center border-2 border-dashed border-white/5 bg-white/2 backdrop-blur-sm rounded-3xl">
                  <div className="w-20 h-20 rounded-full bg-red-500/5 flex items-center justify-center mx-auto mb-6 border border-red-500/10">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-2" suppressHydrationWarning>{renderTranslation("dashboard.licenses.preparing")}</h4>
                  <p className="text-gray-500 max-w-md mx-auto" suppressHydrationWarning>{renderTranslation("dashboard.licenses.preparing_desc")}</p>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
