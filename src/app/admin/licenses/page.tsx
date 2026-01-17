"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Search,
  Eye,
  Copy,
  Ban,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Loader2,
  Plus,
  User,
  Package,
  Calendar,
  Save,
  X,
  ShieldCheck,
  Hash
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";

type LicenseStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

type License = {
  id: string;
  licenseKey: string;
  product: { name: string };
  user: { username: string; email: string };
  ipAddress: string | null;
  status: LicenseStatus;
  createdAt: string;
  expiresAt: string | null;
};

interface StatusConfigItem {
  icon: any;
  label: string;
  bg: string;
  text: string;
}

const statusConfig: Record<LicenseStatus, StatusConfigItem> = {
  ACTIVE: { icon: CheckCircle, label: "ACTIVE", bg: "bg-red-500/10", text: "text-red-400" },
  EXPIRED: { icon: Clock, label: "EXPIRED", bg: "bg-white/5", text: "text-gray-500" },
  REVOKED: { icon: XCircle, label: "REVOKED", bg: "bg-red-900/20", text: "text-red-500/50" },
};

const statusOptions = ["all", "ACTIVE", "EXPIRED", "REVOKED"] as const;
type FilterStatus = (typeof statusOptions)[number];

export default function AdminLicensesPage() {
  const { t } = useTranslation("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Grant License Modal
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [grantData, setGrantData] = useState({
    userId: "",
    productId: "",
    expiresAt: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGranting, setIsGranting] = useState(false);
  const [allUsers, setUsers] = useState<any[]>([]);
  const [allProducts, setProducts] = useState<any[]>([]);
  const [confirmRevoke, setConfirmRevoke] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const [licensesRes, statsRes] = await Promise.all([
        adminApi.getLicenses({
          status: filterStatus === "all" ? undefined : filterStatus,
          search: searchQuery || undefined,
        }),
        adminApi.getStats(),
      ]);

      if (licensesRes.data && (licensesRes.data as any).success) {
        setLicenses((licensesRes.data as any).data || []);
      }
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch licenses:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  const fetchUsersAndProducts = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        adminApi.getUsers({ limit: 100 }),
        adminApi.getProducts({ limit: 100 }),
      ]);
      if (uRes.data && (uRes.data as any).success) setUsers((uRes.data as any).data);
      if (pRes.data && (pRes.data as any).success) setProducts((pRes.data as any).data);
    } catch (err) {
      console.error("Failed to fetch users/products:", err);
    }
  };

  const handleGrantClick = () => {
    fetchUsersAndProducts();
    setIsGrantOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!grantData.userId || grantData.userId.trim() === "") {
      newErrors.userId = t("licenses.modals.grant.user_label");
    }
    if (!grantData.productId || grantData.productId.trim() === "") {
      newErrors.productId = t("licenses.modals.grant.product_label");
    }
    
    if (grantData.expiresAt && new Date(grantData.expiresAt) <= new Date()) {
      newErrors.expiresAt = "Invalid date";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setIsGranting(true);
    try {
      const res = await adminApi.grantLicense({
        userId: grantData.userId,
        productId: grantData.productId,
        expiresAt: grantData.expiresAt ? new Date(grantData.expiresAt).toISOString() : undefined,
      });

      if (res.data && (res.data as any).success) {
        await fetchLicenses();
        setIsGrantOpen(false);
        setGrantData({ userId: "", productId: "", expiresAt: "" });
      } else {
        alert((res.data as any)?.error || "Failed to grant license");
      }
    } catch (err: any) {
      console.error("Error granting license:", err);
      alert(err.message || "เกิดข้อผิดพลาดในการออกไลเซนส์");
    } finally {
      setIsGranting(false);
    }
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleRevokeLicense = useCallback(async () => {
    if (!confirmRevoke.id) return;
    
    try {
      const res = await adminApi.revokeLicense(confirmRevoke.id);
      if (res.data && (res.data as any).success) {
        await fetchLicenses();
      } else {
        alert((res.data as any)?.error || "Failed to revoke license");
      }
    } catch (err) {
      console.error("Error revoking license:", err);
      alert("An error occurred while revoking the license");
    }
  }, [confirmRevoke.id, fetchLicenses]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const filteredLicenses = useMemo(() => 
    licenses.filter((license) => {
      const matchesSearch =
        license.licenseKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        license.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        license.user.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || license.status === filterStatus;
      return matchesSearch && matchesStatus;
    }), [searchQuery, filterStatus, licenses]);

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{t("licenses.title")}</h1>
          <p className="text-gray-400 mt-1">{t("licenses.subtitle")}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button 
            onClick={handleGrantClick}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-xl px-6 py-6 font-black uppercase tracking-widest transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("licenses.grant_btn")}
          </Button>
          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  filterStatus === status 
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                {status === "all" ? t("licenses.all") : statusConfig[status as LicenseStatus]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t("licenses.stats.total"), value: stats?.licenses?.total || 0, icon: Key, color: "text-white", bg: "bg-white/5" },
          { label: t("licenses.stats.active"), value: stats?.licenses?.active || 0, icon: CheckCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: t("licenses.stats.expired"), value: stats?.licenses?.expired || 0, icon: Clock, color: "text-gray-500", bg: "bg-white/5" },
          { label: t("licenses.stats.revoked"), value: stats?.licenses?.revoked || 0, icon: Ban, color: "text-red-800", bg: "bg-red-900/20" },
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

      {/* Search Filter */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
          <Input
            placeholder={t("licenses.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
          />
        </div>
      </Card>

      {/* Licenses Table */}
      <Card className="border-white/5 bg-white/2 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t("licenses.table.loading")}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                  <th className="px-6 py-5 text-left border-b border-white/5">{t("licenses.table.details")}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{t("licenses.table.product")}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{t("licenses.table.owner")}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{t("licenses.table.node")}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{t("licenses.table.status")}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{t("licenses.table.issued")}</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">{t("licenses.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLicenses.map((license, index) => {
                  const status = statusConfig[license.status] || statusConfig.ACTIVE;
                  return (
                    <motion.tr
                      key={license.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <code className="text-sm text-red-500 font-mono font-black tracking-tight group-hover:text-red-400 transition-colors">{license.licenseKey}</code>
                          <button
                            onClick={() => copyToClipboard(license.licenseKey)}
                            className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-inner"
                            title="Copy Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[9px] text-gray-600 uppercase font-black mt-1">UUID: {license.id}</p>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-sm text-gray-300 font-bold group-hover:text-white transition-colors">{license.product.name}</p>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-bold text-white text-sm">{license.user.username}</p>
                        <p className="text-[10px] text-gray-500 font-black tracking-tighter opacity-60">{license.user.email}</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-gray-600" />
                          <code className="text-xs text-gray-400 font-mono font-bold">
                            {license.ipAddress || t("licenses.table.unrestricted")}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest transition-all duration-500",
                          status.bg,
                          status.text
                        )}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-400 font-bold">
                        {new Date(license.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {license.status === "ACTIVE" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setConfirmRevoke({ isOpen: true, id: license.id })}
                              className="w-10 h-10 rounded-xl hover:bg-red-900/20 text-red-500/50 hover:text-red-500 transition-all"
                              title="Revoke License"
                            >
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
          )}
        </div>

        {!loading && licenses.length === 0 && (
          <div className="p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
            <Key className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">{t("licenses.table.no_data")}</p>
            <p className="text-gray-600 text-sm mt-2 relative z-10">{t("licenses.table.no_data_subtitle")}</p>
          </div>
        )}
      </Card>

      {/* Grant License Modal */}
      <AnimatePresence>
        {isGrantOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGrantOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />
              
              <form onSubmit={handleGrantSubmit} className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t("licenses.modals.grant.title")}</h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{t("licenses.modals.grant.subtitle")}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsGrantOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* section: Assignments */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Hash className="w-4 h-4 text-red-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t("licenses.modals.grant.assignment")}</h3>
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-xs font-bold uppercase tracking-wider", errors.userId ? "text-red-500" : "text-gray-500")}>
                        {t("licenses.modals.grant.user_label")}
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                        <select
                          value={grantData.userId}
                          onChange={(e) => {
                            setGrantData({ ...grantData, userId: e.target.value });
                            if (errors.userId) setErrors({...errors, userId: ""});
                          }}
                          required
                          className={cn(
                            "w-full h-14 pl-12 pr-4 bg-white/5 border rounded-2xl text-white focus:outline-none transition-all appearance-none cursor-pointer hover:bg-white/10",
                            errors.userId ? "border-red-500" : "border-white/10 focus:border-red-500/50"
                          )}
                        >
                          <option value="" className="bg-[#0A0A0A] text-gray-400">{t("licenses.modals.grant.user_placeholder")}</option>
                          {allUsers.map((u) => (
                            <option key={u.id} value={u.id} className="bg-[#0A0A0A] text-white font-medium">
                              {u.username} ({u.email || u.discordId || "No Contact"})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <Plus className="w-4 h-4 rotate-45" />
                        </div>
                      </div>
                      {errors.userId && <p className="text-[10px] text-red-400 font-bold uppercase ml-1">{errors.userId}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className={cn("text-xs font-bold uppercase tracking-wider", errors.productId ? "text-red-500" : "text-gray-500")}>
                        {t("licenses.modals.grant.product_label")}
                      </label>
                      <div className="relative group">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                        <select
                          value={grantData.productId}
                          onChange={(e) => {
                            setGrantData({ ...grantData, productId: e.target.value });
                            if (errors.productId) setErrors({...errors, productId: ""});
                          }}
                          required
                          className={cn(
                            "w-full h-14 pl-12 pr-4 bg-white/5 border rounded-2xl text-white focus:outline-none transition-all appearance-none cursor-pointer hover:bg-white/10",
                            errors.productId ? "border-red-500" : "border-white/10 focus:border-red-500/50"
                          )}
                        >
                          <option value="" className="bg-[#0A0A0A] text-gray-400">{t("licenses.modals.grant.product_placeholder")}</option>
                          {allProducts.map((p) => (
                            <option key={p.id} value={p.id} className="bg-[#0A0A0A] text-white font-medium">
                              {p.name} — {p.category}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <Plus className="w-4 h-4 rotate-45" />
                        </div>
                      </div>
                      {errors.productId && <p className="text-[10px] text-red-400 font-bold uppercase ml-1">{errors.productId}</p>}
                    </div>
                  </div>

                  {/* section: Expiration */}
                  <div className="space-y-4 p-5 rounded-2xl bg-white/2 border border-white/5">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t("licenses.modals.grant.expiration")}</h3>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">{t("licenses.modals.grant.exp_label")}</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                        <Input
                          type="datetime-local"
                          value={grantData.expiresAt}
                          onChange={(e) => setGrantData({ ...grantData, expiresAt: e.target.value })}
                          className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl font-bold text-white focus:border-red-500/50 scheme-dark"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsGrantOpen(false)}
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-500 hover:text-white hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isGranting}
                    className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 transition-all active:scale-95"
                  >
                    {isGranting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("licenses.modals.grant.issuing")}</> : <><Save className="w-4 h-4 mr-2" /> {t("licenses.modals.grant.submit")}</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmRevoke.isOpen}
        onClose={() => setConfirmRevoke({ isOpen: false, id: null })}
        onConfirm={handleRevokeLicense}
        title={t("licenses.modals.revoke.title")}
        message={t("licenses.modals.revoke.message")}
        confirmText={t("licenses.modals.revoke.confirm")}
        type="danger"
      />
    </div>
  );
}