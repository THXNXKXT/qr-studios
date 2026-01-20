"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Package,
  ShoppingCart,
  Users,
  ClipboardList,
  Key,
  Star,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Filter
} from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type ExportType = "products" | "orders" | "users" | "commissions" | "licenses" | "reviews";

interface ExportOption {
  id: ExportType;
  labelKey: string;
  descriptionKey: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const exportOptions: ExportOption[] = [
  {
    id: "orders",
    labelKey: "export.options.orders.label",
    descriptionKey: "export.options.orders.description",
    icon: ShoppingCart,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: "products",
    labelKey: "export.options.products.label",
    descriptionKey: "export.options.products.description",
    icon: Package,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "users",
    labelKey: "export.options.users.label",
    descriptionKey: "export.options.users.description",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "commissions",
    labelKey: "export.options.commissions.label",
    descriptionKey: "export.options.commissions.description",
    icon: ClipboardList,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "licenses",
    labelKey: "export.options.licenses.label",
    descriptionKey: "export.options.licenses.description",
    icon: Key,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: "reviews",
    labelKey: "export.options.reviews.label",
    descriptionKey: "export.options.reviews.description",
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
];

export default function ExportPage() {
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const { t } = useTranslation("admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const downloadCSV = useCallback((csvContent: string, fileName: string) => {
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = async (type: ExportType) => {
    setExporting(type);
    try {
      let csvContent = "";
      const fileName = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;

      switch (type) {
        case "orders": {
          const { data: res } = await adminApi.getOrders({ limit: 5000 }) as { data: { success: boolean; data: any[] } };
          if (res && res.success) {
            const orders = res.data || [];
            const headers = ["Order ID", "Date", "Customer", "Email", "Products", "Total", "Discount", "Status", "Payment"];
            const rows = orders.map((o: any) => [
              o.id,
              new Date(o.createdAt).toLocaleString("th-TH"),
              o.user.username,
              o.user.email,
              o.items.map((i: any) => `${i.product.name} (x${i.quantity})`).join("; "),
              o.total,
              o.discount,
              o.status,
              o.paymentMethod
            ]);
            csvContent = [headers.join(","), ...rows.map((r: (string | number)[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "products": {
          const { data: res } = await adminApi.getProducts({ limit: 5000 }) as { data: { success: boolean; data: any[] } };
          if (res && res.success) {
            const products = res.data || [];
            const headers = ["ID", "Name", "Category", "Price", "Original Price", "Stock", "Featured", "Flash Sale", "Flash Sale Price"];
            const rows = products.map((p: any) => [
              p.id,
              p.name,
              p.category,
              p.price,
              p.originalPrice || 0,
              p.stock === -1 ? "Unlimited" : p.stock,
              p.isFeatured ? "Yes" : "No",
              p.isFlashSale ? "Yes" : "No",
              p.flashSalePrice || 0
            ]);
            csvContent = [headers.join(","), ...rows.map((r: (string | number)[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "users": {
          const { data: res } = await adminApi.getUsers({ limit: 5000 }) as { data: { success: boolean; data: any[] } };
          if (res && res.success) {
            const users = res.data || [];
            const headers = ["ID", "Username", "Email", "Discord ID", "Role", "Balance", "Total Spent", "Orders", "Banned", "Created At"];
            const rows = users.map((u: any) => [
              u.id,
              u.username,
              u.email || "N/A",
              u.discordId || "N/A",
              u.role,
              u.balance,
              u.totalSpent || 0,
              u.orders || 0,
              u.isBanned ? "Yes" : "No",
              new Date(u.createdAt).toLocaleString("th-TH")
            ]);
            csvContent = [headers.join(","), ...rows.map((r: (string | number)[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "commissions": {
          const { data: res } = await adminApi.getCommissions({ limit: 5000 }) as { data: { success: boolean; data: any[] } };
          if (res && res.success) {
            const commissions = res.data || [];
            const headers = ["ID", "Title", "Customer", "Budget", "Status", "Created At"];
            const rows = commissions.map((c: any) => [
              c.id,
              c.title,
              c.user?.username || "N/A",
              c.budget,
              c.status,
              new Date(c.createdAt).toLocaleString("th-TH")
            ]);
            csvContent = [headers.join(","), ...rows.map((r: (string | number)[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "licenses": {
          const { data: res } = await adminApi.getLicenses({ limit: 5000 }) as { data: { success: boolean; data: any[] } };
          if (res && res.success) {
            const licenses = res.data || [];
            const headers = ["ID", "License Key", "Product", "User", "IP Addresses", "Status", "Expires At"];
            const rows = licenses.map((l: any) => [
              l.id,
              l.licenseKey,
              l.product?.name || "N/A",
              l.user?.username || "N/A",
              (l.ipAddresses || []).join("; "),
              l.status,
              l.expiresAt ? new Date(l.expiresAt).toLocaleString("th-TH") : "Never"
            ]);
            csvContent = [headers.join(","), ...rows.map((r: (string | number)[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "reviews": {
          const { data: res } = await adminApi.getReviews({ limit: 5000 }) as { data: { success: boolean; data: any[] } };
          if (res && res.success) {
            const reviews = res.data || [];
            const headers = ["ID", "Product", "User", "Rating", "Comment", "Verified", "Created At"];
            const rows = reviews.map((r: any) => [
              r.id,
              r.product?.name || "N/A",
              r.user?.username || "N/A",
              r.rating,
              r.comment,
              r.isVerified ? "Yes" : "No",
              new Date(r.createdAt).toLocaleString("th-TH")
            ]);
            csvContent = [headers.join(","), ...rows.map((r: (string | number)[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }
      }

      if (csvContent) {
        downloadCSV(csvContent, fileName);
      } else {
        alert(t("export.errors.no_data"));
      }
    } catch (err) {
      console.error(`Failed to export ${type}:`, err);
      alert(t("export.errors.export_failed"));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 min-h-14">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{mounted ? t("export.title") : ""}</h1>
          <p className="text-gray-400 mt-1">{mounted ? t("export.subtitle") : ""}</p>
        </div>
        <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md h-auto lg:h-14">
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-none px-4 h-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center rounded-xl">
            <FileSpreadsheet className="w-3 h-3 mr-1.5" />
            CSV Format Only
          </Badge>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{mounted ? t("export.info.title") : ""}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {mounted ? t("export.info.description") : ""}
            </p>
          </div>
        </div>
      </Card>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group p-6 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 shadow-xl relative overflow-hidden flex flex-col h-full">
              <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 transition-all duration-500 shadow-inner", option.bg)}>
                  <option.icon className={cn("w-7 h-7", option.color)} />
                </div>
                {exporting === option.id && (
                  <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                )}
              </div>

              <div className="flex-1 text-left relative z-10">
                <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                  {mounted ? t(option.labelKey) : ""}
                </h3>
                <p className="text-xs text-gray-500 font-bold leading-relaxed mt-1">
                  {mounted ? t(option.descriptionKey) : ""}
                </p>
              </div>

              <Button
                onClick={() => handleExport(option.id)}
                disabled={exporting !== null}
                className={cn(
                  "relative z-10 w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300",
                  exporting === option.id
                    ? "bg-red-900/40 text-red-500/50 cursor-not-allowed"
                    : "bg-white/5 hover:bg-red-600 text-white border border-white/10 hover:border-red-600 hover:shadow-lg hover:shadow-red-600/20"
                )}
              >
                <Download className="w-4 h-4 mr-2" />
                <span>{mounted ? (exporting === option.id ? t("export.exporting") : t("export.export_btn")) : ""}</span>
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Future Settings Section */}
      <div className="pt-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-white/5" />
          <h2 className="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Advanced Settings</h2>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4 mb-4 text-gray-500">
              <Clock className="w-5 h-5" />
              <h3 className="font-bold">{mounted ? t("export.advanced.time_range") : ""}</h3>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-600">
                  {mounted ? t(`export.advanced.time_options.${idx}`) : ""}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4 mb-4 text-gray-500">
              <Filter className="w-5 h-5" />
              <h3 className="font-bold">{mounted ? t("export.advanced.file_formats") : ""}</h3>
            </div>
            <div className="flex gap-2">
              {["Excel (.xlsx)", "JSON", "PDF"].map((format, idx) => (
                <div key={idx} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-600">
                  {mounted ? format : ""}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
