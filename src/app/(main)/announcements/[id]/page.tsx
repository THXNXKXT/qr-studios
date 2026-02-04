"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { announcementsApi } from "@/lib/api";
import { Announcement } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { createLogger } from "@/lib/logger";
import Image from "next/image";

interface ApiResponse<T> {
  data?: T;
  success?: boolean;
}

const announcementLogger = createLogger("announcements:detail");
import { 
  ArrowLeft, 
  Megaphone, 
  Loader2, 
  Share2,
  Clock,
  ChevronRight,
  X,
  ChevronLeft,
  Maximize2
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return;
      try {
        const { data } = await announcementsApi.getById(id as string);
        const response = data as ApiResponse<Announcement>;
        if (data && response.success) {
          setAnnouncement(response.data ?? null);
        } else {
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

  const handleShare = useCallback(() => {
    if (typeof window !== "undefined" && announcement) {
      navigator.share({
        title: announcement.title,
        url: window.location.href,
      }).catch((err) => announcementLogger.error('Share failed', { error: err }));
    }
  }, [announcement]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    if (!announcement?.media) return;
    setLightboxIndex((prev) => (prev + 1) % announcement.media!.length);
  }, [announcement]);

  const prevImage = useCallback(() => {
    if (!announcement?.media) return;
    setLightboxIndex((prev) => (prev - 1 + announcement.media!.length) % announcement.media!.length);
  }, [announcement]);

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
    <div className="min-h-screen bg-black pt-20 pb-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-red-600/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-red-900/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && announcement.media && announcement.media[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all z-50"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {announcement.media.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all z-50"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all z-50"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-[90vw] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={announcement.media[lightboxIndex]}
                alt={announcement.title}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl"
              />
              {announcement.media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md">
                  <span className="text-white text-sm font-medium">
                    {lightboxIndex + 1} / {announcement.media.length}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <Link
            href="/announcements"
            className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-600/10 group-hover:border-red-600/20 group-hover:scale-105 transition-all">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="font-bold uppercase tracking-widest text-[11px] hidden sm:inline">Back</span>
          </Link>

          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-105 transition-all"
            title="แชร์ประกาศนี้"
          >
            <Share2 className="w-4 h-4 text-gray-400" />
          </button>
        </motion.div>

        {/* Header Section - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white/2 backdrop-blur-sm border border-white/6 rounded-3xl p-6 sm:p-8">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-red-600/10 text-red-400 border-red-500/20 font-black uppercase tracking-widest text-[10px] py-1.5 px-3 hover:bg-red-600/20 transition-colors">
                Announcement
              </Badge>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {new Date(announcement.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-6">
              {announcement.title}
            </h1>

            {/* Author */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/6">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-red-600 to-red-800 p-[2px]">
                <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center overflow-hidden">
                  <Image src="/logo.png" alt="QR STUDIO" width={32} height={32} className="w-8 h-8 object-contain" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">QR STUDIO TEAM</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Official Post</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content - Two Column Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
        >
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            {announcement.media && announcement.media.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative aspect-4/3 rounded-3xl overflow-hidden group cursor-pointer border border-white/10 bg-black/30"
                onClick={() => openLightbox(0)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={announcement.media[0]}
                  alt={announcement.title}
                  className="w-full h-full object-contain bg-black/40 transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            )}

            {/* Thumbnail Grid */}
            {announcement.media && announcement.media.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {announcement.media.slice(0, 4).map((url, i) => (
                  <button
                    key={i}
                    onClick={() => openLightbox(i)}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      i === 0 
                        ? "border-red-500/50 ring-2 ring-red-500/20" 
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && <div className="absolute inset-0 bg-red-600/10" />}
                    {i === 3 && announcement.media.length > 4 && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">+{announcement.media.length - 4}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Content */}
          <div className="flex flex-col">
            {/* Content Card */}
            <div className="bg-white/2 backdrop-blur-sm border border-white/6 rounded-3xl p-6 sm:p-8 flex-1">
              <div className="prose prose-invert prose-red max-w-none">
                <div 
                  className="text-gray-300 text-base leading-[1.8] whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* More Media Section */}
        {announcement.media && announcement.media.length > 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-red-600 rounded-full" />
              รูปภาพทั้งหมด
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {announcement.media.map((url, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openLightbox(i)}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={url} 
                    alt={`Image ${i + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-linear-to-r from-white/3 to-transparent backdrop-blur-sm border border-white/6 p-6 sm:p-8 rounded-3xl">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-black text-white mb-1">ยังมีเรื่องราวอีกมากมาย</h3>
              <p className="text-gray-400 text-sm">อ่านประกาศอื่นๆ เพื่อไม่พลาดข่าวสารสำคัญ</p>
            </div>
            <Link href="/announcements">
              <Button className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-6 rounded-2xl group shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transition-all">
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
