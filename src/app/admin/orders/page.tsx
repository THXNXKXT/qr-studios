"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
  Package,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, Button, Input, Badge, Pagination } from "@/components/ui";
import { OrderDetailModal } from "@/components/admin";
import { formatPrice, cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const ordersLogger = createLogger("admin:orders");

type OrderStatus = "COMPLETED" | "PENDING" | "PROCESSING" | "CANCELLED" | "REFUNDED";

type Order = {
  id: string;
  user: { id: string; username: string; email: string };
  items: { product: { id: string; name: string }; price: number; quantity: number }[];
  licenses?: { licenseKey: string; productId: string }[];
  total: number;
  discount: number;
  promoCode: string | null;
  status: OrderStatus;
  paymentMethod: string;
  paymentRef?: string;
  createdAt: string;
  updatedAt?: string;
};

const statusConfig: Record<OrderStatus, { icon: React.ElementType; bg: string; text: string }> = {
  COMPLETED: { icon: CheckCircle, bg: "bg-red-500/10", text: "text-red-400" },
  PENDING: { icon: Clock, bg: "bg-red-900/20", text: "text-red-500/70" },
  PROCESSING: { icon: Clock, bg: "bg-red-500/5", text: "text-red-300" },
  CANCELLED: { icon: XCircle, bg: "bg-white/5", text: "text-gray-500" },
  REFUNDED: { icon: XCircle, bg: "bg-amber-500/10", text: "text-amber-400" },
};

export default function AdminOrdersPage() {
  const { t } = useTranslation("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false); // Add mounted state
  const itemsPerPage = 10;

  useEffect(() => {
    setMounted(true);
  }, []); // Set mounted on client

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await adminApi.getOrders({
        status: filterStatus === "all" ? undefined : filterStatus,
        search: searchQuery || undefined
      }) as { data: { success: boolean; data: Order[] } };

      if (res && res.success) {
        setOrders(res.data || []);
        setCurrentPage(1); // Reset to page 1 on search/filter change
      }
    } catch (err) {
      ordersLogger.error('Failed to fetch orders', { error: err });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewOrder = useCallback(async (order: Order) => {
    try {
      const { data: res } = await adminApi.getOrderById(order.id) as { data: { success: boolean; data: Order } };
      if (res && res.success) {
        setSelectedOrder(res.data);
        setIsDetailOpen(true);
      }
    } catch (err) {
      ordersLogger.error('Failed to fetch order details', { error: err });
      // Fallback to basic data if full fetch fails
      setSelectedOrder(order);
      setIsDetailOpen(true);
    }
  }, []);

  const handleUpdateStatus = useCallback(async (orderId: string, status: string) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, status) as { data: { success: boolean; error?: string } };
      if (res.data && res.data.success) {
        await fetchOrders();
        // If the modal is open and showing the updated order, update it too
        if (selectedOrder?.id === orderId) {
          const { data: detailRes } = await adminApi.getOrderById(orderId) as { data: { success: boolean; data: Order } };
          if (detailRes && detailRes.success) {
            setSelectedOrder(detailRes.data);
          }
        }
      } else {
        alert(res.data?.error || "Failed to update order status");
      }
    } catch (err) {
      ordersLogger.error('Error updating order status', { error: err });
      alert("An error occurred while updating the order status");
    }
  }, [fetchOrders, selectedOrder]);

  const handleResendReceipt = useCallback(async (orderId: string) => {
    try {
      const res = await adminApi.resendOrderReceipt(orderId) as { data: { success: boolean; error?: string } };
      if (res.data && res.data.success) {
        alert(t("orders.messages.receipt_sent"));
      } else {
        alert(res.data?.error || t("orders.messages.receipt_fail"));
      }
    } catch (err) {
      ordersLogger.error('Error resending receipt', { error: err });
      alert("An error occurred while resending the receipt");
    }
  }, [t]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return orders.slice(startIndex, startIndex + itemsPerPage);
  }, [orders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Fetch more orders for export (e.g., 1000 items)
      const { data: res } = await adminApi.getOrders({
        status: filterStatus === "all" ? undefined : filterStatus,
        search: searchQuery || undefined,
        limit: 1000
      }) as { data: { success: boolean; data: Order[] } };

      if (res && res.success) {
        const exportData = res.data || [];
        if (exportData.length === 0) {
          alert(t("orders.export.errors.no_data"));
          return;
        }

        // CSV Headers
        // CSV Headers
        const headers = [
          t("orders.export.id"),
          t("orders.export.date"),
          t("orders.export.customer_name"),
          t("orders.export.customer_email"),
          t("orders.export.products"),
          t("orders.export.total"),
          t("orders.export.status"),
          t("orders.export.payment_method")
        ];

        // Format data for CSV
        const rows = exportData.map((order: Order) => [
          `#${order.id}`,
          new Date(order.createdAt).toLocaleString("th-TH"),
          order.user.username,
          order.user.email,
          order.items.map(item => `${item.product.name} (x${item.quantity})`).join("; "),
          order.total,
          order.status,
          order.paymentMethod
        ]);

        // Construct CSV content
        const csvContent = [
          headers.join(","),
          ...rows.map((row: (string | number)[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        // Create blob and download
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Failed to export orders:", err);
      alert(t("orders.export.errors.export_failed"));
    } finally {
      setIsExporting(false);
    }
  }, [filterStatus, searchQuery, t]);

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{mounted ? t("orders.title") : ""}</h1>
          <p className="text-gray-400 mt-1">{mounted ? t("orders.subtitle") : ""}</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-xs transition-all duration-300 disabled:opacity-50 shrink-0 w-full lg:w-auto"
        >
          {isExporting ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Download className="w-5 h-5 mr-2" />
          )}
          <span>
            {mounted ? (isExporting ? t("orders.export.btn_exporting") : t("orders.export.btn_export")) : ""}
          </span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder={mounted ? t("orders.search_placeholder") : ""}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
            />
          </div>
        <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md h-auto lg:h-14">
          {["all", "COMPLETED", "PENDING", "PROCESSING", "CANCELLED", "REFUNDED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest h-full",
                filterStatus === status
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <span>
                {mounted ? (status === "all" ? t("orders.filter.all") : t(`orders.status.${status.toLowerCase()}`)) : ""}
              </span>
            </button>
          ))}
        </div>
        </div>
      </Card>

      {/* Orders Table */}
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
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("orders.table.order_id") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("orders.table.customer") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("orders.table.products") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("orders.table.total") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("orders.table.status") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("orders.table.date") : ""}</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">{mounted ? t("orders.table.actions") : ""}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedOrders.map((order, index) => {
                  const status = statusConfig[order.status] || statusConfig.PENDING;
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/2 transition-colors group cursor-pointer"
                      onClick={() => handleViewOrder(order)}
                    >
                      <td className="px-6 py-6">
                        <p className="font-mono text-sm font-bold text-white group-hover:text-red-400 transition-colors">#{order.id.substring(0, 8)}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">{order.paymentMethod}</p>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-bold text-white group-hover:text-red-400 transition-colors">{order.user.username}</p>
                        <p className="text-[10px] text-gray-500 font-black tracking-tighter opacity-60">{order.user.email}</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-red-500/50" />
                              <p className="text-sm text-gray-300 font-medium truncate max-w-[150px]">{item.product.name}</p>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[10px] text-gray-500 uppercase font-black ml-5">{mounted ? t("orders.table.more_items", { count: order.items.length - 2 }) : ""}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-black text-red-500 text-lg">{mounted ? formatPrice(order.total) : ""}</p>
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest transition-all duration-500",
                          status.bg,
                          status.text
                        )}>
                          {mounted ? t(`orders.status.${order.status.toLowerCase()}`) : ""}
                        </Badge>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-300 font-bold">{mounted ? new Date(order.createdAt).toLocaleDateString("th-TH") : ""}</span>
                          <span className="text-[10px] text-gray-600 font-black uppercase">{mounted ? new Date(order.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("orders.table.view_details")}
                            onClick={() => handleViewOrder(order)}
                            className="w-10 h-10 rounded-2xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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

        {!loading && orders.length === 0 && (
          <div className="p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
            <ShoppingCart className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">{mounted ? t("orders.no_orders") : ""}</p>
            <p className="text-gray-600 text-sm mt-2 relative z-10">{mounted ? t("orders.no_orders_subtitle") : ""}</p>
          </div>
        )}
      </Card>

      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder ? {
          ...selectedOrder,
          items: selectedOrder.items.map((item: any, i: number) => ({
            id: item.id || `item-${i}`,
            productId: item.productId,
            productName: item.product?.name || (mounted ? t("common.unknown_product") : ""),
            productImage: item.product?.images?.[0],
            price: item.price,
            quantity: item.quantity,
            licenseKeys: (selectedOrder as any).licenses
              ?.filter((l: any) => l.productId === item.productId)
              .map((l: any) => l.licenseKey)
          })),
          createdAt: new Date(selectedOrder.createdAt),
          updatedAt: new Date(selectedOrder.updatedAt || selectedOrder.createdAt),
        } : null}
        onUpdateStatus={(orderId, status) => handleUpdateStatus(orderId, status)}
        onResendReceipt={handleResendReceipt}
      />
    </div>
  );
}
