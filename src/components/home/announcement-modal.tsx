"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { Button, Badge } from "@/components/ui";

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
  const [isOpen, setIsOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
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

  const handleClose = () => {
    // แค่ปิด modal ไม่บันทึก (จะแสดงอีกครั้งเมื่อ refresh)
    setIsOpen(false);
  };

  const handleDontShowToday = () => {
    setIsOpen(false);
    
    // บันทึกว่าผู้ใช้ไม่ต้องการเห็นในวันนี้
    if (currentAnnouncement) {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      const dismissedData = dismissed ? JSON.parse(dismissed) : {};
      dismissedData[currentAnnouncement.id] = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedData));
    }
  };

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

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const getTypeColor = (type: Announcement["type"]) => {
    switch (type) {
      case "promotion":
        return "from-pink-600 to-red-600";
      case "update":
        return "from-blue-600 to-red-600";
      case "event":
        return "from-orange-600 to-red-600";
      default:
        return "from-red-600 to-red-400";
    }
  };

  if (!isOpen || !currentAnnouncement) return null;

  const gradientColor = getTypeColor(currentAnnouncement.type);
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
        <div className={`absolute -inset-1 bg-linear-to-r ${gradientColor} rounded-3xl blur-xl opacity-30`} />
        
        <div className="relative rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge */}
          {currentAnnouncement.badge && (
            <div className="absolute top-4 left-4 z-20">
              <Badge variant="destructive" className="text-sm px-3 py-1">
                {currentAnnouncement.badge}
              </Badge>
            </div>
          )}

          {/* Slide Content */}
          <div className="relative aspect-video">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {slide.type === "image" ? (
                  <Image
                    src={slide.src}
                    alt={slide.title || "Slide"}
                    fill
                    className="object-cover"
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
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {currentAnnouncement.slides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Auto-play toggle */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="absolute bottom-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              title={isAutoPlaying ? "หยุดเล่นอัตโนมัติ" : "เล่นอัตโนมัติ"}
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Slide Indicators */}
          {currentAnnouncement.slides.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
              {currentAnnouncement.slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "w-6 bg-red-500"
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <motion.h2
              key={`title-${currentSlide}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {slide.title || currentAnnouncement.title}
            </motion.h2>

            <motion.p
              key={`desc-${currentSlide}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mb-4"
            >
              {slide.description || currentAnnouncement.description}
            </motion.p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {slide.link && (
                  <Link href={slide.link} onClick={handleClose}>
                    <Button className="group">
                      {slide.linkText || "ดูเพิ่มเติม"}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
              </div>

              <button
                onClick={handleDontShowToday}
                className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                ไม่ต้องแสดงอีกในวันนี้
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
