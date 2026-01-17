"use client";

import { useState, useCallback } from "react";
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
import { formatPrice, cn } from "@/lib/utils";

type ExportType = "products" | "orders" | "users" | "commissions" | "licenses" | "reviews";

interface ExportOption {
  id: ExportType;
  label: string;
  description: string;
  icon: any;
  color: string;
  bg: string;
}

const exportOptions: ExportOption[] = [
  {
    id: "orders",
    label: "คำสั่งซื้อ",
    description: "ข้อมูลรายการสั่งซื้อทั้งหมด สถานะการชำระเงิน และยอดรวม",
    icon: ShoppingCart,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: "products",
    label: "สินค้า",
    description: "รายชื่อสินค้า ราคา คลังสินค้า และหมวดหมู่",
    icon: Package,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "users",
    label: "ผู้ใช้งาน",
    description: "รายชื่อผู้ใช้ อีเมล บทบาท และยอดเงินคงเหลือ",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "commissions",
    label: "รายการจ้างทำ",
    description: "ข้อมูลการจ้างทำสคริปต์/UI และสถานะการดำเนินงาน",
    icon: ClipboardList,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "licenses",
    label: "ลิขสิทธิ์ (Licenses)",
    description: "ข้อมูล License Key และการผูก IP ของลูกค้า",
    icon: Key,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    id: "reviews",
    label: "รีวิวสินค้า",
    description: "คะแนนและข้อคิดเห็นจากลูกค้าต่อสินค้าต่างๆ",
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
];

export default function ExportPage() {
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [timeRange, setTimeRange] = useState("all");

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
      let fileName = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;

      switch (type) {
        case "orders": {
          const { data } = await adminApi.getOrders({ limit: 5000 });
          if (data && (data as any).success) {
            const orders = (data as any).data || [];
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
            csvContent = [headers.join(","), ...rows.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "products": {
          const { data } = await adminApi.getProducts({ limit: 5000 });
          if (data && (data as any).success) {
            const products = (data as any).data || [];
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
            csvContent = [headers.join(","), ...rows.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "users": {
          const { data } = await adminApi.getUsers({ limit: 5000 });
          if (data && (data as any).success) {
            const users = (data as any).data || [];
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
            csvContent = [headers.join(","), ...rows.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "commissions": {
          const { data } = await adminApi.getCommissions({ limit: 5000 });
          if (data && (data as any).success) {
            const commissions = (data as any).data || [];
            const headers = ["ID", "Title", "Customer", "Budget", "Status", "Created At"];
            const rows = commissions.map((c: any) => [
              c.id,
              c.title,
              c.user?.username || "N/A",
              c.budget,
              c.status,
              new Date(c.createdAt).toLocaleString("th-TH")
            ]);
            csvContent = [headers.join(","), ...rows.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "licenses": {
          const { data } = await adminApi.getLicenses({ limit: 5000 });
          if (data && (data as any).success) {
            const licenses = (data as any).data || [];
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
            csvContent = [headers.join(","), ...rows.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }

        case "reviews": {
          const { data } = await adminApi.getReviews({ limit: 5000 });
          if (data && (data as any).success) {
            const reviews = (data as any).data || [];
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
            csvContent = [headers.join(","), ...rows.map((r: any[]) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
          }
          break;
        }
      }

      if (csvContent) {
        downloadCSV(csvContent, fileName);
      } else {
        alert("ไม่พบข้อมูลที่จะส่งออก หรือเกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    } catch (err) {
      console.error(`Failed to export ${type}:`, err);
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Export Data</h1>
          <p className="text-gray-400 mt-1">ส่งออกข้อมูลในระบบเป็นไฟล์ CSV เพื่อนำไปใช้งานต่อ</p>
        </div>
        <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-none px-3 py-1 font-black uppercase tracking-widest text-[10px]">
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
            <h3 className="text-lg font-bold text-white mb-1">คำแนะนำการส่งออก</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              การส่งออกข้อมูลจะดึงข้อมูลล่าสุดจากฐานข้อมูลโดยตรง ไฟล์ที่ได้จะเป็นรูปแบบ CSV ซึ่งสามารถเปิดได้ด้วย Excel, Google Sheets หรือโปรแกรม Spreadsheet อื่นๆ 
              หากคุณมีข้อมูลจำนวนมาก (มากกว่า 5,000 รายการ) อาจใช้เวลาในการเตรียมไฟล์สักครู่
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

              <div className="relative z-10 mb-8 flex-1">
                <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2 group-hover:text-red-400 transition-colors">
                  {option.label}
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {option.description}
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
                {exporting === option.id ? "กำลังส่งออก..." : "ส่งออกข้อมูล"}
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
              <h3 className="font-bold">กรองตามช่วงเวลา (Coming Soon)</h3>
            </div>
            <div className="flex gap-2">
              {["7 วัน", "30 วัน", "ทั้งหมด"].map((t) => (
                <div key={t} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-600">
                  {t}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4 mb-4 text-gray-500">
              <Filter className="w-5 h-5" />
              <h3 className="font-bold">รูปแบบไฟล์เพิ่มเติม (Coming Soon)</h3>
            </div>
            <div className="flex gap-2">
              {["Excel (.xlsx)", "JSON", "PDF"].map((f) => (
                <div key={f} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-gray-600">
                  {f}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
