"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import Image from "next/image";
import { 
  Package, 
  ArrowLeft,
  ArrowRight,
  Clock, 
  Search,
  ImageOff
} from "lucide-react";
import { Badge, Button, Card, Input, Pagination } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { OrderSkeleton } from "@/components/dashboard/order-skeleton";
import { formatPrice, cn } from "@/lib/utils";
import { ordersApi } from "@/lib/api";
import { AnimatePresence } from "framer-motion";
import { createLogger } from "@/lib/logger";

const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
}

const ordersLogger = createLogger("dashboard:orders");

interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
      thumbnail?: string | null;
    };
    price: number;
  }>;
}

export default function OrdersPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const itemsPerPage = 10;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderTranslation = (key: string, options?: Record<string, unknown>): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  const fetchOrders = useCallback(async () => {
    const token = getAuthToken();
    
    // If auth is still working, wait for it
    if (!isSynced && !user?.id && token) return;

    // If we finished syncing and still no user, or no token at all
    if (!user?.id && !token) {
      setLoading(false);
      return;
    }

    if (user?.id) {
      // Don't set loading(true) if we already have data to prevent flickering
      try {
        const { data } = await ordersApi.getAll();
        const response = data as ApiResponse<Order[]>;
        if (data && typeof data === 'object' && 'data' in data) {
          setOrders(response.data || []);
        }
      } catch (error) {
        ordersLogger.error('Failed to fetch orders', { error });
      } finally {
        setLoading(false);
      }
    } else if (isSynced) {
      setLoading(false);
    }
  }, [user?.id, isSynced]); // Dependencies for callback

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => 
    orders.filter(order =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    ), [orders, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (authLoading || (loading && (user || getAuthToken()))) {
    return (
      <div className="min-h-screen pt-32 px-4 pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {renderTranslation("dashboard.orders.back")}
            </Button>
            <h1 className="text-3xl font-bold text-white">{renderTranslation("dashboard.orders.title")}</h1>
          </div>

          <Card className="p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input placeholder={renderTranslation("dashboard.orders.search_placeholder")} disabled className="pl-10" />
            </div>
          </Card>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Robust redirect logic
  if (!user && !authLoading && !getAuthToken()) {
    if (typeof window !== 'undefined') {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    return null;
  }

  return (
    <div className="min-h-screen pt-32 px-4 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-red-900/10 via-black to-black pointer-events-none" />
      <div className="container max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {renderTranslation("dashboard.orders.back")}
            </Link>
            <h1 className="text-4xl font-bold text-white tracking-tight">{renderTranslation("dashboard.orders.title")}</h1>
            <p className="text-gray-400">{renderTranslation("dashboard.orders.desc")}</p>
          </div>
          
          <Card className="p-2 border-white/5 bg-white/2 backdrop-blur-md w-full md:w-80">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
              <Input
                placeholder={renderTranslation("dashboard.orders.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-transparent border-none focus:ring-0 h-10"
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key="empty"
              >
                <Card className="p-20 text-center border-white/5 bg-white/2 backdrop-blur-sm">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Package className="w-10 h-10 text-gray-700 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{renderTranslation("dashboard.orders.no_orders")}</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">{renderTranslation("dashboard.orders.no_orders_desc")}</p>
                  <Link href="/products" className="mt-8 inline-block">
                    <Button className="bg-red-600 hover:bg-red-500 rounded-xl px-8">{renderTranslation("dashboard.orders.shop_now")}</Button>
                  </Link>
                </Card>
              </motion.div>
            ) : (
              paginatedOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-sm hover:border-red-500/30 transition-all duration-500 group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-gray-500 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded">#{order.id?.substring(0, 12).toUpperCase() || 'N/A'}</span>
                          <Badge
                            variant={
                              order.status === "COMPLETED"
                                ? "success"
                                : order.status === "PENDING"
                                ? "warning"
                                : "default"
                            }
                            className={cn(
                              "px-3 py-0.5 rounded-lg border-none font-bold text-[10px] uppercase tracking-wider",
                              order.status === "COMPLETED" ? "bg-red-500/20 text-red-400" : order.status === "PENDING" ? "bg-red-900/20 text-red-500/50" : "bg-white/10 text-gray-400"
                            )}
                          >
                            {order.status === "COMPLETED" ? renderTranslation("dashboard.orders.status.completed") : order.status === "PENDING" ? renderTranslation("dashboard.orders.status.pending") : order.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mt-2">
                          {order.items?.map((item, idx) => {
                            const errorKey = `${order.id}-${idx}`;
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                  {item.product?.thumbnail && !imageErrors[errorKey] ? (
                                    <Image
                                      src={item.product.thumbnail}
                                      alt={item.product.name}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                      placeholder="blur"
                                      blurDataURL={blurDataURL}
                                      onError={() => setImageErrors(prev => ({ ...prev, [errorKey]: true }))}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageOff className="w-5 h-5 text-gray-600" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-white font-bold group-hover:text-red-400 transition-colors line-clamp-1">
                                  {item.product?.name || renderTranslation('common.product')}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString(renderTranslation('common.date_locale') === 'th' ? 'th-TH' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                        <div className="text-left md:text-right">
                          <p className="text-2xl font-black text-white group-hover:text-red-500 transition-colors">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">{order.paymentMethod}</p>
                        </div>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="secondary" className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white group/btn rounded-xl px-6 h-11">
                            <span>{renderTranslation("dashboard.orders.details")}</span>
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
