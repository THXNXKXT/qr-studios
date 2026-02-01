"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { announcementsApi } from "@/lib/api";
import { Announcement } from "@/types";
import { motion } from "framer-motion";
import { createLogger } from "@/lib/logger";

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
}

const announcementLogger = createLogger("announcements:detail");
import { 
  ArrowLeft, 
  Calendar, 
  Megaphone, 
  Loader2, 
  Share2,
  Clock,
  ChevronRight
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import Link from "next/link";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return;
      try {
        const { data } = await announcementsApi.getById(id as string);
        const response = data as ApiResponse<Announcement>;
        if (data && response.success) {
          setAnnouncement(response.data ?? null);
        } else {
          // If not found or error, we might want to show an error state
          announcementLogger.error('Announcement not found');
        }
      } catch (error) {
        announcementLogger.error('Failed to fetch announcement', { error });
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.share({
        title: announcement?.title,
        url: window.location.href,
      }).catch((err) => announcementLogger.error('Share failed', { error: err }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-red-600 relative z-10" />
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
        <Megaphone className="w-16 h-16 text-gray-800 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">ไม่พบประกาศ</h1>
        <p className="text-gray-500 mb-8">ประกาศที่คุณกำลังมองหาอาจถูกลบหรือไม่มีอยู่จริง</p>
        <Button 
          onClick={() => router.push("/announcements")}
          className="bg-red-600 hover:bg-red-500 rounded-xl"
        >
          กลับไปหน้าประกาศทั้งหมด
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-900/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container max-w-4xl mx-auto px-4 relative z-10">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <Link
            href="/announcements"
            className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-600/10 group-hover:border-red-600/20 transition-all">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="font-bold uppercase tracking-widest text-[10px]">Back to Announcements</span>
          </Link>

          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            title="แชร์ประกาศนี้"
          >
            <Share2 className="w-4 h-4 text-gray-400" />
          </button>
        </motion.div>

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Badge className="bg-red-600/10 text-red-500 border-red-500/20 font-black uppercase tracking-widest text-[9px] py-1 px-3">
              Announcement
            </Badge>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {new Date(announcement.createdAt).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
            {announcement.title}
          </h1>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-red-600 to-red-800 p-px">
              <div className="w-full h-full rounded-[15px] bg-black flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="QR STUDIO" className="w-8 h-8 object-contain" />
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-tight">QR STUDIO TEAM</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Official Post</p>
            </div>
          </div>
        </motion.div>

        {/* Featured Media */}
        {announcement.media && announcement.media.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-12 rounded-4xl overflow-hidden border border-white/10 shadow-2xl shadow-red-900/10"
          >
            <img 
              src={announcement.media[0]} 
              alt={announcement.title}
              className="w-full h-auto object-cover"
            />
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert prose-red max-w-none mb-16"
        >
          <div 
            className="text-gray-300 text-lg leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />
        </motion.div>

        {/* More Media Grid */}
        {announcement.media && announcement.media.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {announcement.media.slice(1).map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl overflow-hidden border border-white/5"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-12 border-t border-white/5"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/2 backdrop-blur-md border border-white/5 p-8 rounded-4xl">
            <div>
              <h3 className="text-xl font-black text-white mb-2">ยังมีเรื่องราวอีกมากมาย</h3>
              <p className="text-gray-400 text-sm">อ่านประกาศอื่นๆ เพื่อไม่พลาดข่าวสารสำคัญ</p>
            </div>
            <Link href="/announcements">
              <Button className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-6 rounded-2xl group">
                <span>ประกาศทั้งหมด</span>
                <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
