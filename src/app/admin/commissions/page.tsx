"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  PlayCircle,
  DollarSign,
  Calendar,
  Loader2,
  FileText,
  MessageSquare,
  Save,
  X,
  History,
  Layout
} from "lucide-react";
import { Card, Button, Input, Badge, Pagination } from "@/components/ui";
import { formatPrice, cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { createLogger } from "@/lib/logger";

const commissionsLogger = createLogger("admin:commissions");

type CommissionStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type Commission = {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    discordId: string;
  };
  title: string;
  description: string;
  budget: number | null;
  status: CommissionStatus;
  attachments: string[];
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusConfig: Record<CommissionStatus, { icon: React.ElementType; labelKey: string; bg: string; text: string }> = {
  PENDING: { icon: Clock, labelKey: "commissions.status.pending", bg: "bg-amber-500/10", text: "text-amber-500" },
  ACCEPTED: { icon: CheckCircle, labelKey: "commissions.status.accepted", bg: "bg-blue-500/10", text: "text-blue-500" },
  IN_PROGRESS: { icon: PlayCircle, labelKey: "commissions.status.in_progress", bg: "bg-indigo-500/10", text: "text-indigo-500" },
  COMPLETED: { icon: CheckCircle, labelKey: "commissions.status.completed", bg: "bg-green-500/10", text: "text-green-500" },
  CANCELLED: { icon: XCircle, labelKey: "commissions.status.cancelled", bg: "bg-red-500/10", text: "text-red-500" },
};

export default function AdminCommissionsPage() {
  const { t } = useTranslation("admin");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<{
    commissions: { total: number; pending: number; inProgress: number; completed: number };
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // For update modal/form
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedCommission, setSelectedReview] = useState<Commission | null>(null);
  const [updateStatus, setUpdateStatus] = useState<CommissionStatus>("PENDING");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const [commissionsRes, statsRes] = await Promise.all([
        adminApi.getCommissions({
          status: filterStatus === "all" ? undefined : filterStatus,
        }),
        adminApi.getStats()
      ]);

      const commissionsData = commissionsRes as unknown as { data?: { success?: boolean; data?: Commission[] } };
      const statsData = statsRes as unknown as { data?: { success?: boolean; data?: { commissions?: { total?: number; pending?: number; inProgress?: number; completed?: number } } } };

      if (commissionsData.data?.success) {
        setCommissions(commissionsData.data.data || []);
      }
      if (statsData.data?.success) {
        const statsResponseData = statsData.data.data;
        if (statsResponseData?.commissions) {
          setStats(statsResponseData as { commissions: { total: number; pending: number; inProgress: number; completed: number } });
        }
      }
    } catch (err) {
      commissionsLogger.error('Failed to fetch commissions', { error: err });
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const handleUpdateClick = (commission: Commission) => {
    setSelectedReview(commission);
    setUpdateStatus(commission.status);
    setAdminNotes(commission.adminNotes || "");
    setIsUpdateOpen(true);
  };

  const handleSaveUpdate = async () => {
    if (!selectedCommission) return;
    setIsSaving(true);
    try {
      const response = await adminApi.updateCommissionStatus(
        selectedCommission.id,
        { status: updateStatus, adminNotes }
      );
      const res = response as unknown as { data: { success: boolean } };
      if (res.data && res.data.success) {
        await fetchCommissions();
        setIsUpdateOpen(false);
      }
    } catch (err) {
      commissionsLogger.error('Failed to update commission', { error: err });
      alert(mounted ? t("commissions.errors.update_failed") : "");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCommissions = useMemo(() => {
    return commissions.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.includes(searchQuery)
    );
  }, [commissions, searchQuery]);

  const paginatedCommissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCommissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCommissions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCommissions.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{mounted ? t("commissions.title") : ""}</h1>
          <p className="text-gray-400 mt-1">{mounted ? t("commissions.subtitle") : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md h-auto lg:h-14">
          {["all", "PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
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
              {status === "all" ? t("commissions.filter.all") : t(statusConfig[status as CommissionStatus]?.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: mounted ? t("commissions.stats.total_requests") : "", value: stats?.commissions?.total || 0, icon: ClipboardList, color: "text-white", bg: "bg-white/5" },
          { label: mounted ? t("commissions.stats.pending_review") : "", value: stats?.commissions?.pending || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: mounted ? t("commissions.stats.in_progress") : "", value: stats?.commissions?.inProgress || 0, icon: PlayCircle, color: "text-blue-400", bg: "bg-blue-500/5" },
          { label: mounted ? t("commissions.stats.completed") : "", value: stats?.commissions?.completed || 0, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
        ].map((stat, index) => (
          <motion.div
            key={index}
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
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{mounted ? stat.label : ""}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder={mounted ? t("commissions.search_placeholder") : ""}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {["all", "PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest",
                  filterStatus === status
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                {status === "all" ? t("commissions.filter.all") : t(statusConfig[status as CommissionStatus]?.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Commissions Grid */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{mounted ? t("common.loading") : ""}</p>
          </div>
        ) : (
          paginatedCommissions.map((commission: Commission, index: number) => {
            const status = statusConfig[commission.status];
            return (
              <motion.div
                key={commission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Status & Date Side */}
                    <div className="lg:w-48 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-white/5 pb-6 lg:pb-0 lg:pr-8">
                      <Badge className={cn(
                        "w-full justify-center py-2 rounded-xl border-none font-black text-xs uppercase tracking-widest",
                        status.bg,
                        status.text
                      )}>
                        <status.icon className="w-4 h-4 mr-2" />
                        {t(status.labelKey)}
                      </Badge>

                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">{mounted ? t("commissions.card.created_at") : ""}</p>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{mounted ? new Date(commission.createdAt).toLocaleDateString("th-TH") : ""}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">{t("commissions.card.budget")}</p>
                          <div className="flex items-center gap-2 text-red-500">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span className="text-lg font-black">{commission.budget ? formatPrice(commission.budget) : (mounted ? t("common.no_data") : "")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                            {commission.title}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter mt-1">
                            ID: {commission.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 font-black">
                            {commission.user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{commission.user.username}</p>
                            <p className="text-[10px] text-gray-500 font-bold">{commission.user.discordId || (mounted ? t("common.no_data") : "")}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                          {commission.description}
                        </p>
                      </div>

                      {commission.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {commission.attachments.map((url: string, i: number) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 hover:bg-white/10 transition-all shadow-inner"
                            >
                              <FileText className="w-4 h-4 text-red-500/50" />
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {mounted ? `${t("commissions.card.attachment")} ${i + 1}` : ""}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}

                      {commission.adminNotes && (
                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                          <div className="flex items-center gap-2 mb-2 text-red-400">
                            <MessageSquare className="w-4 h-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{t("commissions.admin_notes_label")}</p>
                          </div>
                          <p className="text-sm text-gray-400 font-medium italic">
                            {commission.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Side */}
                    <div className="lg:w-32 flex flex-row lg:flex-col gap-2 justify-end">
                      <Button
                        onClick={() => handleUpdateClick(commission)}
                        className="flex-1 lg:w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] transition-all duration-300"
                      >
                        {t("commissions.card.manage_btn")}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}

        {!loading && filteredCommissions.length === 0 && (
          <div className="p-20 text-center relative overflow-hidden border-white/5 bg-white/2 backdrop-blur-md rounded-3xl">
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
            <ClipboardList className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">{mounted ? t("commissions.no_commissions") : ""}</p>
          </div>
        )}
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

      {/* Update Modal */}
      <AnimatePresence>
        {isUpdateOpen && selectedCommission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUpdateOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent" />

              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t("commissions.modal.title")}</h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">ID: {selectedCommission.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsUpdateOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Project Brief */}
                <div className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-black text-white uppercase tracking-widest">{selectedCommission.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{selectedCommission.description}</p>
                </div>

                <div className="space-y-6">
                  {/* section: Status Update */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <History className="w-4 h-4 text-orange-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t("commissions.modal.update_status")}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as CommissionStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setUpdateStatus(status)}
                          className={cn(
                            "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                            updateStatus === status
                              ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20"
                              : "bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {t(statusConfig[status].labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* section: Admin Feedback */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t("commissions.modal.admin_notes")}</h3>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1 italic">{t("commissions.modal.notes_hint")}</p>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder={t("commissions.modal.notes_placeholder")}
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/50 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <Button
                    variant="ghost"
                    onClick={() => setIsUpdateOpen(false)}
                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-500 hover:text-white hover:bg-white/5"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleSaveUpdate}
                    disabled={isSaving}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20 h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                  >
                    {isSaving ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("common.saving")}</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> {t("commissions.modal.update_btn")}</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
