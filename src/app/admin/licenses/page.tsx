"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  Copy,
  Ban,
  Key,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";

// Mock licenses
const mockLicenses = [
  {
    id: "LIC-001",
    key: "QRST-ABCD-1234-WXYZ",
    productName: "Advanced Inventory System",
    userName: "GamerTH",
    userEmail: "gamer@example.com",
    ipAddress: "192.168.1.100",
    status: "active",
    createdAt: new Date("2024-12-01"),
    expiresAt: null,
  },
  {
    id: "LIC-002",
    key: "QRST-EFGH-5678-UVWX",
    productName: "Modern HUD UI",
    userName: "FiveMDev",
    userEmail: "dev@example.com",
    ipAddress: "10.0.0.50",
    status: "active",
    createdAt: new Date("2024-11-28"),
    expiresAt: null,
  },
  {
    id: "LIC-003",
    key: "QRST-IJKL-9012-RSTU",
    productName: "Vehicle Shop UI",
    userName: "ServerOwner",
    userEmail: "owner@example.com",
    ipAddress: null,
    status: "active",
    createdAt: new Date("2024-11-15"),
    expiresAt: null,
  },
  {
    id: "LIC-004",
    key: "QRST-MNOP-3456-QRST",
    productName: "Phone UI",
    userName: "NewUser123",
    userEmail: "new@example.com",
    ipAddress: "172.16.0.25",
    status: "expired",
    createdAt: new Date("2024-06-01"),
    expiresAt: new Date("2024-12-01"),
  },
  {
    id: "LIC-005",
    key: "QRST-QRST-7890-MNOP",
    productName: "Admin Panel",
    userName: "BannedUser",
    userEmail: "banned@example.com",
    ipAddress: "192.168.0.1",
    status: "revoked",
    createdAt: new Date("2024-08-15"),
    expiresAt: null,
  },
];

const statusConfig = {
  active: { icon: CheckCircle, label: "ใช้งาน", color: "success" },
  expired: { icon: Clock, label: "หมดอายุ", color: "warning" },
  revoked: { icon: XCircle, label: "ถูกยกเลิก", color: "destructive" },
};

export default function AdminLicensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLicenses = mockLicenses.filter((license) => {
    const matchesSearch =
      license.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || license.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">จัดการ License</h1>
        <p className="text-gray-400">ดูและจัดการ License ทั้งหมดในระบบ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "License ทั้งหมด", value: mockLicenses.length, color: "text-white" },
          { label: "ใช้งานอยู่", value: mockLicenses.filter(l => l.status === "active").length, color: "text-green-400" },
          { label: "หมดอายุ", value: mockLicenses.filter(l => l.status === "expired").length, color: "text-yellow-400" },
          { label: "ถูกยกเลิก", value: mockLicenses.filter(l => l.status === "revoked").length, color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="ค้นหา License Key, สินค้า, ผู้ใช้..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "expired", "revoked"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === "all" ? "ทั้งหมด" : statusConfig[status as keyof typeof statusConfig]?.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Licenses Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">License Key</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">สินค้า</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">ผู้ใช้</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">IP Address</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">สถานะ</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">วันที่สร้าง</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredLicenses.map((license, index) => {
                const status = statusConfig[license.status as keyof typeof statusConfig];
                return (
                  <motion.tr
                    key={license.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-green-400 font-mono">{license.key}</code>
                        <button
                          onClick={() => copyToClipboard(license.key)}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{license.productName}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{license.userName}</p>
                      <p className="text-xs text-gray-500">{license.userEmail}</p>
                    </td>
                    <td className="p-4">
                      <code className="text-sm text-gray-400 font-mono">
                        {license.ipAddress || "-"}
                      </code>
                    </td>
                    <td className="p-4">
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-400">
                        {license.createdAt.toLocaleDateString("th-TH")}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {license.status === "active" && (
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300">
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLicenses.length === 0 && (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">ไม่พบ License</p>
          </div>
        )}
      </Card>
    </div>
  );
}
