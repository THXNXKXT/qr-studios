"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  History,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileJson,
  Activity,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { useTranslation } from "react-i18next";

type AuditLog = {
  id: string;
  userId: string | null;
  user: {
    username: string;
    email: string;
  } | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export default function AdminAuditLogsPage() {
  const { t, i18n } = useTranslation("admin");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await adminApi.getAuditLogs({
        page,
        limit: 15,
        search: searchQuery || undefined,
      }) as { data: { success: boolean; data: AuditLog[]; pagination?: { totalPages: number } } };

      if (res && res.success) {
        setLogs(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "text-green-400 bg-green-500/10";
    if (action.includes("UPDATE")) return "text-blue-400 bg-blue-500/10";
    if (action.includes("DELETE") || action.includes("BAN")) return "text-red-400 bg-red-500/10";
    return "text-gray-400 bg-white/5";
  };

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 min-h-14">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{mounted ? t("audit_logs_page.title") : ""}</h1>
          <p className="text-gray-400 mt-1">{mounted ? t("audit_logs_page.subtitle") : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
          <Input
            placeholder={mounted ? t("audit_logs_page.search_placeholder") : ""}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
          />
        </form>
      </Card>

      {/* Logs Table */}
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
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("audit_logs_page.table.admin") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("audit_logs_page.table.action") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("audit_logs_page.table.entity") : ""}</th>
                  <th className="px-6 py-5 text-left border-b border-white/5">{mounted ? t("audit_logs_page.table.timestamp") : ""}</th>
                  <th className="px-6 py-5 text-right border-b border-white/5">{mounted ? t("audit_logs_page.table.details") : ""}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/2 transition-colors group"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{mounted ? (log.user?.username || t("audit_logs_page.system") || t("common.system") || "System") : ""}</p>
                          <p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">{log.user?.email || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <Badge className={cn(
                        "px-2 py-0.5 rounded-lg border-none font-black text-[10px] uppercase tracking-widest",
                        getActionColor(log.action)
                      )}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-red-500/50" />
                          <span className="text-sm text-gray-300 font-bold">{log.entity}</span>
                        </div>
                        <span className="text-[10px] text-gray-600 font-black uppercase font-mono">
                          ID: {log.entityId || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm text-gray-400 font-bold">
                      <div className="flex flex-col">
                        <span>{mounted ? new Date(log.createdAt).toLocaleDateString(i18n.language === "th" ? "th-TH" : "en-US") : ""}</span>
                        <span className="text-[10px] text-gray-600 uppercase font-black">
                          {mounted ? new Date(log.createdAt).toLocaleTimeString(i18n.language === "th" ? "th-TH" : "en-US") : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                        className="w-10 h-10 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                      >
                        <FileJson className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/20">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
              {mounted ? t("common.pagination.page", { current: page, total: totalPages }) : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-white/5"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> {mounted ? t("common.pagination.previous") : ""}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-white/5"
              >
                {mounted ? t("common.pagination.next") : ""} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
            <History className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">{mounted ? t("audit_logs_page.no_logs") : ""}</p>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <FileJson className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{mounted ? t("audit_logs_page.modal.title") : ""}</h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {selectedLog.action} - {selectedLog.entity}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedLog(null)}
                    className="w-10 h-10 rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-600 uppercase font-black mb-2">{mounted ? t("audit_logs_page.modal.old_data") : ""}</p>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-64 scrollbar-hide font-mono">
                      {JSON.stringify(selectedLog.oldData, null, 2) || "NULL"}
                    </pre>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-600 uppercase font-black mb-2">{mounted ? t("audit_logs_page.modal.new_data") : ""}</p>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-64 scrollbar-hide font-mono">
                      {JSON.stringify(selectedLog.newData, null, 2) || "NULL"}
                    </pre>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-600 uppercase font-black mb-1">{mounted ? t("audit_logs_page.modal.ip_address") : ""}</p>
                    <p className="text-sm font-bold text-white font-mono">{selectedLog.ipAddress || "Internal"}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-600 uppercase font-black mb-1">{mounted ? t("audit_logs_page.modal.user_agent") : ""}</p>
                    <p className="text-[10px] font-bold text-white truncate" title={selectedLog.userAgent || ""}>
                      {selectedLog.userAgent || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
