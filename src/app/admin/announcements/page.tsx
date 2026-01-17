"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Megaphone,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video,
  Clock,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Card, Button, Input, Badge, Pagination } from "@/components/ui";
import { AnnouncementFormModal, ConfirmModal } from "@/components/admin";
import { formatPrice, cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { adminApi } from "@/lib/api";

type Media = {
  type: "image" | "video";
  url: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  media: string[]; // Backend returns string[]
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export default function AdminAnnouncementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, statsRes] = await Promise.all([
        adminApi.getAnnouncements(),
        adminApi.getStats()
      ]);

      if (annRes.data && (annRes.data as any).success) {
        setAnnouncements((annRes.data as any).data || []);
      }
      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const filteredAnnouncements = useMemo(() => 
    announcements.filter((ann) => {
      const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActive =
        filterActive === "all" ||
        (filterActive === "active" && ann.isActive) ||
        (filterActive === "inactive" && !ann.isActive);
      return matchesSearch && matchesActive;
    }), [announcements, searchQuery, filterActive]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterActive]);

  const paginatedAnnouncements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAnnouncements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAnnouncements, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);

  const handleAddAnnouncement = useCallback(() => {
    setSelectedAnnouncement(null);
    setIsFormOpen(true);
  }, []);

  const handleEditAnnouncement = useCallback((announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsFormOpen(true);
  }, []);

  const handleDeleteAnnouncement = useCallback((announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteOpen(true);
  }, []);

  const handleToggleActive = useCallback(async (announcement: Announcement) => {
    try {
      const res = await adminApi.toggleAnnouncement(announcement.id);
      if (res.data && (res.data as any).success) {
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error("Error toggling announcement status:", err);
    }
  }, [fetchAnnouncements]);

  const handleSaveAnnouncement = useCallback(async (announcementData: any) => {
    try {
      let res;
      if (selectedAnnouncement) {
        res = await adminApi.updateAnnouncement(selectedAnnouncement.id, announcementData);
      } else {
        res = await adminApi.createAnnouncement(announcementData);
      }

      if (res.data && (res.data as any).success) {
        await fetchAnnouncements();
        setIsFormOpen(false);
      } else {
        alert((res.data as any)?.error || "Failed to save announcement");
      }
    } catch (err) {
      console.error("Error saving announcement:", err);
      alert("An error occurred while saving the announcement");
    }
  }, [selectedAnnouncement, fetchAnnouncements]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedAnnouncement) return;
    try {
      const res = await adminApi.deleteAnnouncement(selectedAnnouncement.id);
      if (res.data && (res.data as any).success) {
        await fetchAnnouncements();
        setIsDeleteOpen(false);
      } else {
        alert((res.data as any)?.error || "Failed to delete announcement");
      }
    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert("An error occurred while deleting the announcement");
    }
  }, [selectedAnnouncement, fetchAnnouncements]);

  return (
    <div className="space-y-10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Announcements</h1>
          <p className="text-gray-400 mt-1">บริหารจัดการข่าวสาร โปรโมชั่น และการประกาศแจ้งเตือนบนหน้าเว็บไซต์</p>
        </div>
        <Button 
          onClick={handleAddAnnouncement}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-xl px-6 py-6 font-black uppercase tracking-widest transition-all duration-300"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Posts", value: stats?.announcements?.total || 0, icon: Megaphone, color: "text-white", bg: "bg-white/5" },
          { label: "Currently Published", value: stats?.announcements?.active || 0, icon: Eye, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Hidden Drafts", value: stats?.announcements?.inactive || 0, icon: EyeOff, color: "text-gray-500", bg: "bg-white/5" },
          { label: "Reach (Total Views)", value: "∞", icon: TrendingUp, color: "text-red-800", bg: "bg-red-900/20" },
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

      {/* Filters */}
      <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <Input
              placeholder="ค้นหาหัวข้อประกาศ หรือเนื้อหา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 rounded-xl focus:border-red-500/50 transition-all py-6 font-medium text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {["all", "active", "inactive"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterActive(status)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-widest",
                  filterActive === status 
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                {status === "all" ? "All Posts" : status === "active" ? "Published" : "Hidden"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading announcements...</p>
            </div>
          ) : (
            paginatedAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-2xl relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                        announcement.isActive ? "bg-red-500/10 border border-red-500/20" : "bg-white/5 border border-white/10"
                      )}>
                        <Megaphone className={cn(
                          "w-7 h-7 transition-colors duration-500",
                          announcement.isActive ? "text-red-500" : "text-gray-600"
                        )} />
                      </div>
                      <div>
                        <Badge className={cn(
                          "px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest transition-all duration-500",
                          announcement.isActive 
                            ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                            : "bg-white/5 text-gray-500"
                        )}>
                          {announcement.isActive ? "PUBLISHED" : "HIDDEN"}
                        </Badge>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2">
                          {new Date(announcement.createdAt).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleToggleActive(announcement)}
                        className="w-10 h-10 rounded-xl hover:bg-white/5 transition-all"
                        title={announcement.isActive ? "Hide" : "Show"}
                      >
                        {announcement.isActive ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditAnnouncement(announcement)}
                        className="w-10 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteAnnouncement(announcement)}
                        className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 relative z-10">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                      {announcement.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium line-clamp-3">
                      {announcement.content}
                    </p>

                    {/* Media Preview */}
                    {announcement.media.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-4">
                        {announcement.media.map((url, i) => (
                          <div
                            key={i}
                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 group/media hover:bg-white/10 transition-all cursor-pointer shadow-inner"
                          >
                            <ImageIcon className="w-4 h-4 text-red-500/50 group-hover/media:text-red-500 transition-colors" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover/media:text-gray-300 transition-colors">
                              Image {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  {(announcement.startsAt || announcement.endsAt) && (
                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-6 relative z-10">
                      {announcement.startsAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Starts:</span>
                          <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{new Date(announcement.startsAt).toLocaleDateString("th-TH")}</span>
                        </div>
                      )}
                      {announcement.endsAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-red-900/50" />
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Ends:</span>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            new Date(announcement.endsAt) < new Date() ? "text-red-900/50" : "text-gray-300"
                          )}>
                            {new Date(announcement.endsAt).toLocaleDateString("th-TH")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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

      {!loading && filteredAnnouncements.length === 0 && (
        <Card className="p-20 text-center relative overflow-hidden border-white/5 bg-white/2 backdrop-blur-md">
          <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full scale-50" />
          <Megaphone className="w-20 h-20 text-gray-800 mx-auto mb-6 relative z-10 opacity-20" />
          <p className="text-gray-500 font-black uppercase tracking-widest relative z-10">No announcements found</p>
          <p className="text-gray-600 text-sm mt-2 relative z-10">ลองเปลี่ยนเงื่อนไขการค้นหาหรือสร้างประกาศใหม่</p>
        </Card>
      )}


      {/* Announcement Form Modal */}
      <AnnouncementFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        announcement={selectedAnnouncement as any}
        onSave={handleSaveAnnouncement}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="ลบประกาศ"
        message={`คุณต้องการลบประกาศ "${selectedAnnouncement?.title}" หรือไม่?`}
        confirmText="ลบประกาศ"
        type="danger"
      />
    </div>
  );
}
