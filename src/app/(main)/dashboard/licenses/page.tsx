"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getAuthToken } from "@/lib/auth-helper";
import {
  Key,
  Search,
  ArrowLeft,
  Download,
  Copy,
  Eye,
  EyeOff,
  Package,
  Loader2,
  Shield,
  Save,
  RefreshCcw,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, formatPrice } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { Badge, Button, Card, Input, Pagination } from "@/components/ui";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { LicenseSkeleton } from "@/components/dashboard/license-skeleton";
import { licensesApi } from "@/lib/api";

interface License {
  id: string;
  licenseKey: string;
  status: string;
  ipAddress: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    downloadKey: string | null;
  };
}

export default function LicensesPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading, isSynced } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingIp, setEditingIp] = useState<string | null>(null);
  const [ipValues, setIpValues] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  useEffect(() => {
    async function fetchLicenses() {
      const token = getAuthToken();

      // If auth is still working, wait for it
      if (!isSynced && !user?.id && token) return;

      // If we finished syncing and still no user, or no token at all
      if (!user?.id && !token) {
        setLoading(false);
        return;
      }

      // If we have a user, fetch their data
      if (user?.id) {
        // Only show full-page loading if we don't have any data yet
        if (licenses.length === 0) setLoading(true);

        try {
          const { data, error } = await licensesApi.getAll();
          if (data && typeof data === 'object' && 'data' in data) {
            const licensesData = (data as any).data || [];
            setLicenses(licensesData);

            // Initialize IP values
            const ips: Record<string, string> = {};
            licensesData.forEach((lic: License) => {
              ips[lic.id] = lic.ipAddress || '';
            });
            setIpValues(ips);
          }
        } catch (err) {
          console.error("Failed to fetch licenses:", err);
        } finally {
          setLoading(false);
        }
      } else if (isSynced) {
        // Auth finished but no user
        setLoading(false);
      }
    }
    fetchLicenses();
  }, [user?.id, isSynced]); // Re-run if user or sync status changes

  const toggleKeyVisibility = useCallback((id: string) => {
    setVisibleKeys(prev =>
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  }, []);

  const copyToClipboard = useCallback((key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const handleUpdateIp = useCallback(async (licenseId: string) => {
    setActionLoading(`ip-${licenseId}`);
    try {
      const rawIp = ipValues[licenseId] || '';
      // Convert comma-separated string back to array for the API
      const ipArray = rawIp.split(',').map(ip => ip.trim()).filter(Boolean);

      const { data, error } = await licensesApi.updateIp(licenseId, ipArray);

      if (data) {
        setEditingIp(null);
        // Update local state
        setLicenses(prev => prev.map(lic =>
          lic.id === licenseId ? { ...lic, ipAddress: ipArray.join(',') } : lic
        ));
      } else {
        alert(error || t('dashboard.licenses.errors.update_ip_failed'));
      }
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  }, [ipValues, t]);

  const handleResetIp = useCallback(async () => {
    if (!confirmReset.id) return;

    setActionLoading(`reset-${confirmReset.id}`);
    try {
      const { data, error } = await licensesApi.resetIp(confirmReset.id);
      if (data) {
        setIpValues(prev => ({ ...prev, [confirmReset.id!]: '' }));
        setLicenses(prev => prev.map(lic =>
          lic.id === confirmReset.id ? { ...lic, ipAddress: null } : lic
        ));
      } else {
        alert(error || t('dashboard.licenses.errors.reset_ip_failed'));
      }
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  }, [confirmReset.id, t]);

  const handleDownload = useCallback(async (licenseId: string) => {
    setActionLoading(`download-${licenseId}`);
    try {
      const { data, error } = await licensesApi.getDownloadUrl(licenseId);
      if (data && (data as any).success) {
        const downloadUrl = (data as any).data.downloadUrl;
        // Construct full URL if it's relative
        const fullUrl = downloadUrl.startsWith('http')
          ? downloadUrl
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}${downloadUrl}`;
        window.open(fullUrl, '_blank');
      } else {
        alert(error || t('dashboard.licenses.errors.download_failed'));
      }
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setActionLoading(null);
    }
  }, [t]);

  // Use Memo for filtered licenses
  const filteredLicenses = useMemo(() =>
    licenses.filter(license =>
      license.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.licenseKey.toLowerCase().includes(searchQuery.toLowerCase())
    ), [licenses, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedLicenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLicenses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLicenses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);

  if (authLoading || (loading && (user || getAuthToken()))) {
    return (
      <div className="min-h-screen pt-32 px-4 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-red-900/10 via-black to-black pointer-events-none" />
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span suppressHydrationWarning>{t("dashboard.licenses.back")}</span>
              </Link>
              <h1 className="text-4xl font-bold text-white tracking-tight" suppressHydrationWarning>{t("dashboard.licenses.title")}</h1>
              <p className="text-gray-400" suppressHydrationWarning>{t("dashboard.licenses.desc")}</p>
            </div>

            <Card className="p-2 border-white/5 bg-white/2 backdrop-blur-md w-full md:w-80">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <Input
                  placeholder={t("dashboard.licenses.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-transparent border-none focus:ring-0 h-10"
                  suppressHydrationWarning
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <LicenseSkeleton />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // Robust redirect logic
  if (!user && !authLoading && !getAuthToken()) {
    if (typeof window !== 'undefined') {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
    }
    return null;
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-red-900/10 via-black to-black pointer-events-none" />
      <div className="container max-w-6xl mx-auto relative z-10">
        <div className="space-y-2 mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span suppressHydrationWarning>{t("dashboard.licenses.back")}</span>
          </Link>
          <h1 className="text-4xl font-bold text-white tracking-tight" suppressHydrationWarning>{t("dashboard.licenses.title")}</h1>
          <p className="text-gray-400" suppressHydrationWarning>{t("dashboard.licenses.desc")}</p>
        </div>

        <Card className="p-2 border-white/5 bg-white/2 backdrop-blur-md w-full md:w-80 mb-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder={t("dashboard.licenses.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-transparent border-none focus:ring-0 h-10"
              suppressHydrationWarning
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredLicenses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key="empty"
              >
                <Card className="p-20 text-center border-white/5 bg-white/2 backdrop-blur-sm">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Key className="w-10 h-10 text-gray-700 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t("dashboard.licenses.no_licenses")}</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">{t("dashboard.licenses.no_licenses_desc")}</p>
                  <Link href="/products" className="mt-8 inline-block">
                    <Button className="bg-red-600 hover:bg-red-500 rounded-xl px-8">{t("dashboard.licenses.shop_now")}</Button>
                  </Link>
                </Card>
              </motion.div>
            ) : (
              paginatedLicenses.map((license, index) => (
                <motion.div
                  key={license.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-sm hover:border-red-500/30 transition-all duration-500 group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 mb-8">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors truncate">
                              {license.product.name}
                            </h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                              ID: {license.id?.substring(0, 8).toUpperCase() || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="relative group/key">
                          <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 group-hover/key:border-red-500/20 transition-all">
                            <code className="text-sm font-mono text-red-400 truncate">
                              {visibleKeys.includes(license.id)
                                ? license.licenseKey
                                : `${license.licenseKey?.substring(0, 6) || ''}••••••••••••••••••••`}
                            </code>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                                onClick={() => toggleKeyVisibility(license.id)}
                                title={visibleKeys.includes(license.id) ? t("dashboard.licenses.hide_key") : t("dashboard.licenses.show_key")}
                              >
                                {visibleKeys.includes(license.id) ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                                onClick={() => copyToClipboard(license.licenseKey, license.id)}
                              >
                                {copiedKey === license.id ? (
                                  <CheckCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                        <Badge
                          variant={license.status === "ACTIVE" ? "success" : "destructive"}
                          className={cn(
                            "px-3 py-1 rounded-lg border-none font-bold text-[10px] uppercase tracking-wider",
                            license.status === "ACTIVE" ? "bg-red-500/20 text-red-400" : "bg-red-900/20 text-red-500/50"
                          )}
                        >
                          {license.status === "ACTIVE" ? t("dashboard.licenses.status.active") : t("dashboard.licenses.status.suspended")}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white group/btn rounded-xl px-6 h-11"
                            onClick={() => handleDownload(license.id)}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === `download-${license.id}` ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            <span>{t("dashboard.licenses.download")}</span>
                          </Button>
                          <Link href={`/products/${license.product.id}`}>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10" title={t("dashboard.licenses.view_product")}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <label className="text-sm font-bold text-gray-300 mb-3 flex items-center justify-between ml-1">
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-500" />
                          {t("dashboard.licenses.ip_whitelist")}
                        </span>
                        {license.ipAddress && (
                          <button
                            onClick={() => setConfirmReset({ isOpen: true, id: license.id })}
                            disabled={actionLoading !== null}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors disabled:opacity-50 font-bold"
                          >
                            {actionLoading === `reset-${license.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCcw className="w-3 h-3" />
                            )}
                            {t("dashboard.licenses.reset_ip")}
                          </button>
                        )}
                      </label>
                      <div className="flex gap-3">
                        <Input
                          value={ipValues[license.id] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setIpValues({ ...ipValues, [license.id]: e.target.value })
                          }
                          placeholder={t("dashboard.licenses.ip_placeholder")}
                          disabled={editingIp !== license.id || actionLoading !== null}
                          className="flex-1 bg-black/40 border-white/10 focus:border-red-500/50 focus:ring-red-500/10 rounded-xl h-12"
                        />
                        {editingIp === license.id ? (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-red-600 hover:bg-red-500 h-12 px-6 rounded-xl shadow-lg shadow-red-600/20"
                            onClick={() => handleUpdateIp(license.id)}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === `ip-${license.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                <span>{t("dashboard.licenses.save_ip")}</span>
                              </div>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/5 border-white/10 hover:bg-white/10 h-12 px-6 rounded-xl"
                            onClick={() => setEditingIp(license.id)}
                            disabled={actionLoading !== null}
                          >
                            {t("dashboard.licenses.edit_ip")}
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 ml-1">
                        {t("dashboard.licenses.ip_limit_hint")}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
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
      </div>

      <ConfirmModal
        isOpen={confirmReset.isOpen}
        onClose={() => setConfirmReset({ isOpen: false, id: null })}
        onConfirm={handleResetIp}
        title={t("dashboard.licenses.confirm_reset_title")}
        message={t("dashboard.licenses.confirm_reset_msg")}
        confirmText={t("dashboard.licenses.reset_ip")}
        type="danger"
      />
    </div>
  );
}
