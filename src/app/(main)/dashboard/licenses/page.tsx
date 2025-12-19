"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Key,
  Copy,
  Download,
  CheckCircle,
  Search,
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { Card, Button, Badge, Input } from "@/components/ui";

// Mock licenses
const mockLicenses = [
  {
    id: "LIC-001",
    productName: "Advanced Inventory System",
    key: "QRS-INV-2024-ABCD-1234",
    status: "active",
    ip: "127.0.0.1",
    purchaseDate: new Date("2024-12-01"),
  },
  {
    id: "LIC-002",
    productName: "Modern HUD UI",
    key: "QRS-HUD-2024-EFGH-5678",
    status: "active",
    ip: "192.168.1.100",
    purchaseDate: new Date("2024-11-28"),
  },
  {
    id: "LIC-003",
    productName: "Vehicle Shop UI",
    key: "QRS-VSH-2024-IJKL-9012",
    status: "active",
    ip: "",
    purchaseDate: new Date("2024-11-15"),
  },
];

export default function LicensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [ipValues, setIpValues] = useState<Record<string, string>>(
    mockLicenses.reduce((acc, lic) => ({ ...acc, [lic.id]: lic.ip }), {})
  );

  const filteredLicenses = mockLicenses.filter(
    (license) =>
      license.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    const parts = key.split("-");
    return parts.map((part, i) => (i < 2 ? part : "****")).join("-");
  };

  const handleIpChange = (id: string, value: string) => {
    setIpValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveIp = (id: string) => {
    alert(`บันทึก IP: ${ipValues[id]} สำหรับ ${id} (Demo)`);
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้า Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">License ของฉัน</h1>
          <p className="text-gray-400">จัดการ License Key ทั้งหมดของคุณ</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="ค้นหา License..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Licenses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 border-b border-white/10 text-sm font-semibold text-gray-400">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">สคริปต์</div>
              <div className="col-span-3">โทเคนคีย์</div>
              <div className="col-span-3">ไอพี</div>
              <div className="col-span-2 text-center">จัดการ</div>
            </div>

            {/* Table Body */}
            {filteredLicenses.length > 0 ? (
              filteredLicenses.map((license, index) => (
                <div
                  key={license.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors"
                >
                  {/* # */}
                  <div className="col-span-1 text-center text-gray-500">
                    {index + 1}
                  </div>

                  {/* Script Name */}
                  <div className="col-span-3">
                    <p className="font-medium text-white">{license.productName}</p>
                    <p className="text-xs text-gray-500">
                      {license.purchaseDate.toLocaleDateString("th-TH")}
                    </p>
                  </div>

                  {/* Token Key */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 rounded-lg bg-black/50 text-sm font-mono text-gray-300 truncate">
                        {visibleKeys.includes(license.id)
                          ? license.key
                          : maskKey(license.key)}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(license.id)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title={visibleKeys.includes(license.id) ? "ซ่อน" : "แสดง"}
                      >
                        {visibleKeys.includes(license.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(license.key, license.id)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="คัดลอก"
                      >
                        {copiedKey === license.id ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* IP */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="กรอก IP Address"
                        value={ipValues[license.id] || ""}
                        onChange={(e) => handleIpChange(license.id, e.target.value)}
                        className="text-sm"
                      />
                      <button
                        onClick={() => handleSaveIp(license.id)}
                        className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                        title="บันทึก IP"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-center">
                    <Button variant="default" size="sm">
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Key className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  ไม่พบ License
                </h3>
                <p className="text-gray-400 mb-6">
                  คุณยังไม่มี License หรือไม่พบ License ที่ค้นหา
                </p>
                <Link href="/products">
                  <Button>เลือกซื้อสินค้า</Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
