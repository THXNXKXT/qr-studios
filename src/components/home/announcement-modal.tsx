"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Megaphone, 
  Sparkles, 
  Gift, 
  ArrowRight, 
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Check,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface SlideItem {
  id: string;
  type: "image" | "video";
  src: string;
  title?: string;
  description?: string;
  link?: string;
  linkText?: string;
}

interface Announcement {
  id: string;
  type: "promotion" | "update" | "news" | "event";
  title: string;
  description: string;
  slides: SlideItem[];
  badge?: string;
  expiresAt?: Date;
}

// Mock announcements with slides - จะดึงจาก API ในอนาคต
const announcements: Announcement[] = [
  {
    id: "promo-dec-2024",
    type: "promotion",
    title: "🎉 ยินดีต้อนรับสู่ QR STUDIO!",
    description: "แหล่งรวม Script และ UI คุณภาพสูงสำหรับ FiveM",
    badge: "ใหม่",
    slides: [
      {
        id: "slide-1",
        type: "image",
        src: "/images/Query.Design.jpg",
        title: "Script คุณภาพสูง",
        description: "พัฒนาโดยทีมงานมืออาชีพ",
        link: "/products",
        linkText: "ดูสินค้าทั้งหมด",
      },
      {
        id: "slide-2",
        type: "video",
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        title: "ตัวอย่างการใช้งาน",
        description: "ดูวิดีโอสาธิตการใช้งาน Script",
      },
      {
        id: "slide-3",
        type: "image",
        src: "/images/Query.Design.png",
        title: "รับทำ UI ตามสั่ง",
        description: "ออกแบบ UI สำหรับเซิร์ฟเวอร์ของคุณ",
        link: "/commission",
        linkText: "สั่งทำ UI",
      },
    ],
  },
];

const STORAGE_KEY = "qr-studio-announcement-dismissed";
const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

export function AnnouncementModal() {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    setMounted(true);
    // ตรวจสอบว่าผู้ใช้กด "ไม่ต้องแสดงอีกในวันนี้" หรือยัง
    const dismissed = localStorage.getItem(STORAGE_KEY);
    const dismissedData = dismissed ? JSON.parse(dismissed) : {};
    const today = new Date().toDateString();

    // หา announcement ที่ยังไม่ถูกปิดในวันนี้
    const activeAnnouncement = announcements.find((a) => {
      // ตรวจสอบว่าหมดอายุหรือยัง
      if (a.expiresAt && new Date(a.expiresAt) < new Date()) {
        return false;
      }
      // ตรวจสอบว่าถูกปิดในวันนี้หรือยัง
      const dismissedDate = dismissedData[a.id];
      if (dismissedDate) {
        const dismissedDay = new Date(dismissedDate).toDateString();
        // ถ้าปิดในวันนี้แล้ว ไม่แสดง
        if (dismissedDay === today) {
          return false;
        }
      }
      return true;
    });

    if (activeAnnouncement) {
      // แสดง modal หลังจาก delay เล็กน้อย
      const timer = setTimeout(() => {
        setCurrentAnnouncement(activeAnnouncement);
        setIsOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  // Auto slide
  useEffect(() => {
    if (!isOpen || !currentAnnouncement || !isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === currentAnnouncement.slides.length - 1 ? 0 : prev + 1
      );
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [isOpen, currentAnnouncement, isAutoPlaying]);

  const handleClose = useCallback(() => {
    // แค่ปิด modal ไม่บันทึก (จะแสดงอีกครั้งเมื่อ refresh)
    setIsOpen(false);
  }, []);

  const handleDontShowToday = useCallback(() => {
    setIsOpen(false);
    
    // บันทึกว่าผู้ใช้ไม่ต้องการเห็นในวันนี้
    if (currentAnnouncement) {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      const dismissedData = dismissed ? JSON.parse(dismissed) : {};
      dismissedData[currentAnnouncement.id] = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedData));
    }
  }, [currentAnnouncement]);

  const nextSlide = useCallback(() => {
    if (!currentAnnouncement) return;
    setCurrentSlide((prev) =>
      prev === currentAnnouncement.slides.length - 1 ? 0 : prev + 1
    );
  }, [currentAnnouncement]);

  const prevSlide = useCallback(() => {
    if (!currentAnnouncement) return;
    setCurrentSlide((prev) =>
      prev === 0 ? currentAnnouncement.slides.length - 1 : prev - 1
    );
  }, [currentAnnouncement]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const typeColor = useMemo(() => {
    if (!currentAnnouncement) return "from-red-600 to-red-400";
    switch (currentAnnouncement.type) {
      case "promotion":
        return "from-red-600 to-red-400";
      case "update":
        return "from-red-600 to-red-400";
      case "event":
        return "from-red-700 to-red-500";
      default:
        return "from-red-600 to-red-400";
    }
  }, [currentAnnouncement]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  if (!mounted || !isOpen || !currentAnnouncement) return null;

  const slide = currentAnnouncement.slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative w-full max-w-2xl"
      >
        {/* Glow Effect */}
        <div className={`absolute -inset-1 bg-linear-to-r ${typeColor} rounded-3xl blur-xl opacity-30`} />
        
        <div className="relative rounded-3xl bg-black/95 backdrop-blur-2xl border border-white/5 overflow-hidden shadow-2xl shadow-red-900/20">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 z-30 p-2.5 rounded-2xl text-gray-400 hover:text-white hover:bg-red-600/20 hover:border-red-500/30 border border-transparent transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge */}
          {currentAnnouncement.badge && (
            <div className="absolute top-5 left-5 z-30">
              <Badge className="bg-red-600 text-white border-none shadow-lg shadow-red-600/20 px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-xl">
                {currentAnnouncement.badge}
              </Badge>
            </div>
          )}

          {/* Slide Content */}
          <div className="relative aspect-video group">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {slide.type === "image" ? (
                  <Image
                    src={slide.src}
                    alt={slide.title || "Slide"}
                    fill
                    className="object-cover transition-transform duration-10000 group-hover:scale-110"
                  />
                ) : (
                  <iframe
                    src={slide.src}
                    title={slide.title || "Video"}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent opacity-80" />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {currentAnnouncement.slides.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <button
                  onClick={prevSlide}
                  className="p-3 rounded-2xl bg-black/60 text-white hover:bg-red-600 transition-all duration-300 backdrop-blur-md border border-white/5 hover:border-red-500/50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-3 rounded-2xl bg-black/60 text-white hover:bg-red-600 transition-all duration-300 backdrop-blur-md border border-white/5 hover:border-red-500/50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Auto-play toggle */}
            <button
              onClick={toggleAutoPlay}
              className="absolute bottom-6 right-6 z-20 p-2.5 rounded-xl bg-black/60 text-white hover:bg-red-600 transition-all duration-300 backdrop-blur-md border border-white/5"
              title={isAutoPlaying ? "หยุดเล่นอัตโนมัติ" : "เล่นอัตโนมัติ"}
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>

            {/* Slide Indicators inside video area */}
            {currentAnnouncement.slides.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
                {currentAnnouncement.slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className="group py-2"
                  >
                    <div className={cn(
                      "h-1.5 rounded-full transition-all duration-500 shadow-lg",
                      index === currentSlide ? "w-8 bg-red-500" : "w-2 bg-white/30 group-hover:bg-white/60"
                    )} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Footer Area */}
          <div className="p-8 md:p-10 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${currentSlide}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                  {slide.title || currentAnnouncement.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xl">
                  {slide.description || currentAnnouncement.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {slide.link && (
                  <Link href={slide.link} onClick={handleClose} className="w-full sm:w-auto">
                    <Button size="xl" className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-red-600/20 group text-sm">
                      <span>{slide.linkText || "ตรวจสอบเลย"}</span>
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
              </div>

              <button
                onClick={handleDontShowToday}
                className="text-xs font-bold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2 group"
              >
                <div className="w-4 h-4 rounded border border-gray-700 group-hover:border-red-500/50 flex items-center justify-center transition-colors">
                  <Check className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                ไม่ต้องแสดงอีกในวันนี้
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
