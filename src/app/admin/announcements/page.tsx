"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { AnnouncementFormModal, ConfirmModal } from "@/components/admin";

type Media = {
  type: "image" | "video";
  url: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  media: Media[];
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
};

// Mock announcements
const initialAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "🎉 Flash Sale สิ้นปี!",
    content: "ลดสูงสุด 40% ทุกสินค้า ถึง 31 ธันวาคมนี้เท่านั้น!",
    media: [{ type: "image", url: "/images/flash-sale.jpg" }],
    isActive: true,
    startsAt: new Date("2024-12-01"),
    endsAt: new Date("2024-12-31"),
    createdAt: new Date("2024-11-28"),
  },
  {
    id: "2",
    title: "🆕 สินค้าใหม่: Advanced Inventory v2.0",
    content: "อัพเดทใหม่พร้อมฟีเจอร์ที่รอคอย! ระบบ Crafting, Weight System และอื่นๆ",
    media: [],
    isActive: true,
    startsAt: null,
    endsAt: null,
    createdAt: new Date("2024-12-05"),
  },
  {
    id: "3",
    title: "🔧 ปิดปรับปรุงระบบ",
    content: "ระบบจะปิดปรับปรุงในวันที่ 15 ธันวาคม เวลา 02:00 - 04:00 น.",
    media: [],
    isActive: false,
    startsAt: new Date("2024-12-14"),
    endsAt: new Date("2024-12-15"),
    createdAt: new Date("2024-12-10"),
  },
  {
    id: "4",
    title: "🎁 โปรโมชั่นปีใหม่",
    content: "ใช้โค้ด NEWYEAR2025 รับส่วนลด 25% ทันที!",
    media: [{ type: "image", url: "/images/newyear.jpg" }],
    isActive: false,
    startsAt: new Date("2025-01-01"),
    endsAt: new Date("2025-01-07"),
    createdAt: new Date("2024-12-20"),
  },
];

export default function AdminAnnouncementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive =
      filterActive === "all" ||
      (filterActive === "active" && ann.isActive) ||
      (filterActive === "inactive" && !ann.isActive);
    return matchesSearch && matchesActive;
  });

  const handleAddAnnouncement = () => {
    setSelectedAnnouncement(null);
    setIsFormOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleDeleteAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteOpen(true);
  };

  const handleToggleActive = (announcement: Announcement) => {
    setAnnouncements(announcements.map(a => 
      a.id === announcement.id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const handleSaveAnnouncement = async (announcementData: any) => {
    if (selectedAnnouncement) {
      setAnnouncements(announcements.map(a => 
        a.id === selectedAnnouncement.id ? { ...a, ...announcementData } : a
      ));
    } else {
      const newAnnouncement: Announcement = {
        ...announcementData,
        id: `ann-${Date.now()}`,
        createdAt: new Date(),
      };
      setAnnouncements([newAnnouncement, ...announcements]);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedAnnouncement) {
      setAnnouncements(announcements.filter(a => a.id !== selectedAnnouncement.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">จัดการประกาศ</h1>
          <p className="text-gray-400">สร้างและจัดการประกาศบนเว็บไซต์</p>
        </div>
        <Button onClick={handleAddAnnouncement}>
          <Plus className="w-4 h-4" />
          สร้างประกาศใหม่
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="ค้นหาประกาศ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((status) => (
              <Button
                key={status}
                variant={filterActive === status ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterActive(status)}
              >
                {status === "all" ? "ทั้งหมด" : status === "active" ? "แสดงอยู่" : "ซ่อน"}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    announcement.isActive ? "bg-green-500/20" : "bg-gray-500/20"
                  }`}>
                    <Megaphone className={`w-5 h-5 ${
                      announcement.isActive ? "text-green-400" : "text-gray-400"
                    }`} />
                  </div>
                  <Badge variant={announcement.isActive ? "success" : "secondary"}>
                    {announcement.isActive ? "แสดงอยู่" : "ซ่อน"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleToggleActive(announcement)}
                  >
                    {announcement.isActive ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditAnnouncement(announcement)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDeleteAnnouncement(announcement)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">
                {announcement.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {announcement.content}
              </p>

              {/* Media */}
              {announcement.media.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {announcement.media.map((m, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"
                    >
                      {m.type === "image" ? (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Video className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Schedule */}
              <div className="text-xs text-gray-500 space-y-1">
                {announcement.startsAt && (
                  <p>เริ่ม: {announcement.startsAt.toLocaleDateString("th-TH")}</p>
                )}
                {announcement.endsAt && (
                  <p>สิ้นสุด: {announcement.endsAt.toLocaleDateString("th-TH")}</p>
                )}
                <p>สร้างเมื่อ: {announcement.createdAt.toLocaleDateString("th-TH")}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <Card className="p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">ไม่พบประกาศ</p>
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
