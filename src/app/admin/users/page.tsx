"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
  ShoppingCart,
  Loader2,
  DollarSign,
  Star,
} from "lucide-react";
import { Card, Button, Input, Badge, Pagination } from "@/components/ui";
import { UserFormModal, ConfirmModal, OrderDetailModal } from "@/components/admin";
import { formatPrice, cn, getTierInfo, TIERS, MemberTier } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import Link from "next/link";

type UserData = {
  id: string;
  username: string;
  email: string | null;
  discordId: string;
  avatar: string | null;
  role: "USER" | "VIP" | "ADMIN" | "MODERATOR";
  balance: number;
  points: number;
  totalSpent: number;
  orders: number;
  isBanned: boolean;
  createdAt: string;
};

const roleConfig: Record<string, { icon: any; label: string; bg: string; text: string }> = {
  ADMIN: { icon: Shield, label: "Admin", bg: "bg-red-600", text: "text-white shadow-lg shadow-red-600/20" },
  VIP: { icon: Crown, label: "VIP", bg: "bg-red-500/20", text: "text-red-400 border border-red-500/20" },
  USER: { icon: User, label: "User", bg: "bg-white/5", text: "text-gray-400 border border-white/5" },
  MODERATOR: { icon: Shield, label: "Mod", bg: "bg-amber-500/20", text: "text-amber-400 border border-amber-500/20" },
};

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTier, setFilterTier] = useState<MemberTier | "all">("all");
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBanOpen, setIsBanOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers({ 
          search: searchQuery || undefined,
          role: filterRole !== "all" ? filterRole : undefined,
          tier: filterTier !== "all" ? filterTier : undefined
        }),
        adminApi.getStats()
      ]);

      if (usersRes.data && (usersRes.data as any).success) {
        setUsers((usersRes.data as any).data || []);
        setCurrentPage(1); // Reset to page 1 on filter/search change
      }
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterRole, filterTier]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users;

  const handleEditUser = useCallback((user: UserData) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  }, []);

  const handleBanUser = useCallback((user: UserData) => {
    setSelectedUser(user);
    setIsBanOpen(true);
  }, []);

  const handleViewOrder = useCallback(async (orderId: string) => {
    try {
      const { data: res } = await adminApi.getOrderById(orderId);
      if (res && (res as any).success) {
        setSelectedOrder((res as any).data);
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    }
  }, []);

  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, status);
      if (res.data && (res.data as any).success) {
        if (selectedOrder?.id === orderId) {
          const { data: detailRes } = await adminApi.getOrderById(orderId);
          if (detailRes && (detailRes as any).success) {
            setSelectedOrder((detailRes as any).data);
          }
        }
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  }, [selectedOrder]);

  const handleResendReceipt = useCallback(async (orderId: string) => {
    try {
      await adminApi.resendOrderReceipt(orderId);
    } catch (err) {
      console.error("Error resending receipt:", err);
    }
  }, []);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleSaveUser = useCallback(async (userData: any) => {
    if (!selectedUser) return;
    try {
      // Handle balance update if changed
      if (userData.balance !== selectedUser.balance) {
        const diff = userData.balance - selectedUser.balance;
        await adminApi.updateUserBalance(selectedUser.id, {
          amount: Math.abs(diff),
          operation: diff > 0 ? "ADD" : "SUBTRACT"
        });
      }

      // Handle role update if changed
      if (userData.role !== selectedUser.role) {
        await adminApi.updateUserRole(selectedUser.id, userData.role.toUpperCase());
      }

      // Handle points update if changed
      if (userData.points !== selectedUser.points) {
        const diff = userData.points - selectedUser.points;
        await adminApi.updateUserPoints(selectedUser.id, {
          amount: Math.abs(diff),
          operation: diff > 0 ? "ADD" : "SUBTRACT"
        });
      }

      await fetchUsers();
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user");
    }
  }, [selectedUser, fetchUsers]);

  const handleConfirmBan = useCallback(async () => {
    if (!selectedUser) return;
    try {
      if (selectedUser.isBanned) {
        await adminApi.unbanUser(selectedUser.id);
      } else {
        await adminApi.banUser(selectedUser.id);
      }
      await fetchUsers();
      setIsBanOpen(false);
    } catch (err) {
      console.error("Error toggling ban status:", err);
      alert("Failed to update ban status");
    }
  }, [selectedUser, fetchUsers]);

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">User Management</h1>
          <p className="text-gray-400 mt-1">บริหารจัดการบัญชีผู้ใช้งาน สิทธิ์การใช้งาน และตรวจสอบสถานะทั้งหมด</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
          {["all", "admin", "moderator", "vip", "user"].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest",
                filterRole === role 
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              {role === "all" ? "All Users" : roleConfig[role.toUpperCase()]?.label || role}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Accounts", value: stats?.users?.total || 0, icon: Users, color: "text-white", bg: "bg-white/5" },
          { label: "New Signups (24h)", value: stats?.users?.today || 0, icon: CheckCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Completed Orders", value: stats?.orders?.completed || 0, icon: ShoppingCart, color: "text-red-400", bg: "bg-red-500/5" },
          { label: "Total Revenue", value: formatPrice(stats?.revenue?.total || 0), icon: DollarSign, color: "text-red-800", bg: "bg-red-900/20" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 transition-all duration-500 shadow-inner", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black text-white tracking-tighter mb-1">{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tier Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {(Object.keys(TIERS) as MemberTier[]).map((tierKey, index) => {
          const tier = TIERS[tierKey];
          const count = stats?.users?.tiers?.[tierKey] || 0;
          const isActive = filterTier === tierKey;

          return (
            <motion.div
              key={tierKey}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              onClick={() => setFilterTier(isActive ? "all" : tierKey)}
              className="cursor-pointer"
            >
              <Card className={cn(
                "p-4 border-white/5 bg-white/2 backdrop-blur-sm transition-all text-center relative overflow-hidden group h-full",
                isActive ? "ring-2 ring-red-500 border-red-500/50" : "hover:border-red-500/30"
              )}>
                <div className={cn(
                  "absolute inset-0 transition-opacity",
                  isActive ? "opacity-20" : "opacity-0 group-hover:opacity-10",
                  tier.bg
                )} />
                <p className="text-2xl mb-1">{tier.icon}</p>
                <p className={cn("text-[10px] font-black uppercase tracking-tighter mb-1", tier.color)}>{tier.name}</p>
                <p className="text-xl font-black text-white">{count}</p>
                <p className="text-[8px] text-gray-500 uppercase font-bold">Members</p>
                {isActive && (
                  <div className="absolute top-1 right-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Search Filter */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
          <Input
            placeholder="ค้นหาด้วย Username, Email หรือ Discord ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border-white/5 bg-white/2 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading users...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-5 text-left border-b border-white/5">User Identity</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Role</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Member Tier</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Points</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Available Balance</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Total Contributions</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">Account Status</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedUsers.map((user, index) => {
                  const role = roleConfig[user.role] || roleConfig.USER;
                  const RoleIcon = role.icon;
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-black text-red-500">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-red-400 transition-colors">{user.username}</p>
                            <p className="text-[10px] text-gray-500 font-black tracking-tighter opacity-60">{user.email || "No Email"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={cn(
                          "gap-1.5 px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest",
                          role.bg,
                          role.text
                        )}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {role.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-6">
                        {(() => {
                          const tier = getTierInfo(user.totalSpent || 0);
                          return (
                            <Badge className={cn(
                              "gap-1 px-2.5 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-tighter",
                              tier.bg,
                              tier.color
                            )}>
                              {tier.icon} {tier.name}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-1.5 text-yellow-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-yellow-500/20" />
                          <span>{(user.points || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-black text-white text-sm">{formatPrice(user.balance)}</p>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-black text-red-500 text-lg">{formatPrice(user.totalSpent)}</p>
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest",
                          !user.isBanned 
                            ? "bg-red-500/10 text-red-400" 
                            : "bg-red-900/40 text-red-500/50"
                        )}>
                          {!user.isBanned ? "ACTIVE" : "BANNED"}
                        </Badge>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/users/${user.id}`} className="hidden">
                            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditUser(user)}
                            className="w-10 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleBanUser(user)}
                            className={cn(
                              "w-10 h-10 rounded-xl transition-all",
                              !user.isBanned 
                                ? "text-red-500/50 hover:bg-red-900/20 hover:text-red-500" 
                                : "text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            )}
                          >
                            {!user.isBanned ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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

        {!loading && filteredUsers.length === 0 && (
          <div className="p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
            <Users className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">No users found</p>
            <p className="text-gray-600 text-sm mt-2 relative z-10">ลองเปลี่ยนเงื่อนไขการค้นหาหรือนำเข้าข้อมูลใหม่</p>
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
        title={!selectedUser?.isBanned ? "แบนผู้ใช้" : "ปลดแบนผู้ใช้"}
        message={!selectedUser?.isBanned 
          ? `คุณต้องการแบน "${selectedUser?.username}" หรือไม่?`
          : `คุณต้องการปลดแบน "${selectedUser?.username}" หรือไม่?`
        }
        confirmText={!selectedUser?.isBanned ? "แบน" : "ปลดแบน"}
        type={!selectedUser?.isBanned ? "danger" : "info"}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder ? {
          ...selectedOrder,
          items: selectedOrder.items.map((item: any, i: number) => ({
            id: item.id || `item-${i}`,
            productId: item.productId,
            productName: item.product?.name || "Unknown Product",
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
        onUpdateStatus={(orderId, status) => handleUpdateOrderStatus(orderId, status)}
        onResendReceipt={handleResendReceipt}
      />
    </div>
  );
}
