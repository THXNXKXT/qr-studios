"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  Edit,
  Ban,
  Users,
  Shield,
  Crown,
  User,
  CheckCircle,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { UserFormModal, ConfirmModal } from "@/components/admin";
import { formatPrice } from "@/lib/utils";

type UserData = {
  id: string;
  username: string;
  email: string;
  discordId: string;
  role: "user" | "vip" | "admin";
  balance: number;
  totalSpent: number;
  orders: number;
  status: "active" | "banned";
  createdAt: Date;
};

// Mock users
const initialUsers: UserData[] = [
  {
    id: "1",
    username: "GamerTH",
    email: "gamer@example.com",
    discordId: "123456789",
    role: "user",
    balance: 2500,
    totalSpent: 5999,
    orders: 8,
    status: "active",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    username: "FiveMDev",
    email: "dev@example.com",
    discordId: "987654321",
    role: "user",
    balance: 500,
    totalSpent: 12450,
    orders: 15,
    status: "active",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    username: "ServerOwner",
    email: "owner@example.com",
    discordId: "456789123",
    role: "vip",
    balance: 10000,
    totalSpent: 45000,
    orders: 32,
    status: "active",
    createdAt: new Date("2023-11-10"),
  },
  {
    id: "4",
    username: "AdminUser",
    email: "admin@qrstudio.com",
    discordId: "111222333",
    role: "admin",
    balance: 0,
    totalSpent: 0,
    orders: 0,
    status: "active",
    createdAt: new Date("2023-01-01"),
  },
  {
    id: "5",
    username: "BannedUser",
    email: "banned@example.com",
    discordId: "999888777",
    role: "user",
    balance: 0,
    totalSpent: 299,
    orders: 1,
    status: "banned",
    createdAt: new Date("2024-06-15"),
  },
];

const roleConfig = {
  admin: { icon: Shield, label: "Admin", color: "destructive" },
  vip: { icon: Crown, label: "VIP", color: "warning" },
  user: { icon: User, label: "User", color: "secondary" },
};

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBanOpen, setIsBanOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.discordId.includes(searchQuery);
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleBanUser = (user: UserData) => {
    setSelectedUser(user);
    setIsBanOpen(true);
  };

  const handleSaveUser = async (userData: any) => {
    if (selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...userData } : u));
    }
  };

  const handleConfirmBan = async () => {
    if (selectedUser) {
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, status: u.status === "active" ? "banned" : "active" } as UserData
          : u
      ));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">จัดการผู้ใช้</h1>
        <p className="text-gray-400">ดูและจัดการผู้ใช้ทั้งหมดในระบบ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ผู้ใช้ทั้งหมด", value: users.length, color: "text-white" },
          { label: "ผู้ใช้ใหม่วันนี้", value: 12, color: "text-green-400" },
          { label: "VIP", value: users.filter(u => u.role === "vip").length, color: "text-yellow-400" },
          { label: "ถูกแบน", value: users.filter(u => u.status === "banned").length, color: "text-red-400" },
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
              placeholder="ค้นหาผู้ใช้, อีเมล, Discord ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "admin", "vip", "user"].map((role) => (
              <Button
                key={role}
                variant={filterRole === role ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterRole(role)}
              >
                {role === "all" ? "ทั้งหมด" : roleConfig[role as keyof typeof roleConfig]?.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">ผู้ใช้</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">บทบาท</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">ยอดเงิน</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">ใช้จ่ายรวม</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">คำสั่งซื้อ</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">สถานะ</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const role = roleConfig[user.role as keyof typeof roleConfig];
                const RoleIcon = role.icon;
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-red-400">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={role.color as any} className="gap-1">
                        <RoleIcon className="w-3 h-3" />
                        {role.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-green-400">{formatPrice(user.balance)}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white">{formatPrice(user.totalSpent)}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-white">{user.orders}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.status === "active" ? "success" : "destructive"}>
                        {user.status === "active" ? "ใช้งาน" : "ถูกแบน"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={user.status === "active" ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}
                          onClick={() => handleBanUser(user)}
                        >
                          {user.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">ไม่พบผู้ใช้</p>
          </div>
        )}
      </Card>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={selectedUser as any}
        onSave={handleSaveUser}
      />

      {/* Ban Confirmation Modal */}
      <ConfirmModal
        isOpen={isBanOpen}
        onClose={() => setIsBanOpen(false)}
        onConfirm={handleConfirmBan}
        title={selectedUser?.status === "active" ? "แบนผู้ใช้" : "ปลดแบนผู้ใช้"}
        message={selectedUser?.status === "active" 
          ? `คุณต้องการแบน "${selectedUser?.username}" หรือไม่?`
          : `คุณต้องการปลดแบน "${selectedUser?.username}" หรือไม่?`
        }
        confirmText={selectedUser?.status === "active" ? "แบน" : "ปลดแบน"}
        type={selectedUser?.status === "active" ? "danger" : "info"}
      />
    </div>
  );
}
