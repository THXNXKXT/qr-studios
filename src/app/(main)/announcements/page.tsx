"use client";

import { useEffect, useState } from "react";
import { announcementsApi } from "@/lib/api";
import { Announcement } from "@/types";
import { motion } from "framer-motion";
import { Bell, Calendar, Megaphone, Loader2, ChevronRight } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { useTranslation } from "react-i18next";
import Link from "next/link";

export default function AnnouncementsPage() {
  const { t, i18n } = useTranslation("home");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await announcementsApi.getActive();
        if (data && (data as any).success) {
          setAnnouncements((data as any).data);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-red-500/10 rounded-2xl">
            <Megaphone className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t("misc.announcements.title")}</h1>
            <p className="text-gray-400">{t("misc.announcements.desc")}</p>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
            <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
            <p className="text-gray-500">{t("misc.announcements.no_announcements")}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/[0.07] transition-all group"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(announcement.createdAt).toLocaleDateString(i18n.language === 'th' ? 'th-TH' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                    {t("misc.announcements.badge")}
                  </Badge>
                </div>

                <Link href={`/announcements/${announcement.id}`}>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-red-400 transition-colors">
                    {announcement.title}
                  </h2>
                </Link>

                <div 
                  className="text-gray-400 leading-relaxed prose prose-invert max-w-none line-clamp-3 mb-6"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />

                {announcement.media && announcement.media.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {announcement.media.slice(0, 2).map((url, i) => (
                      <img 
                        key={i}
                        src={url} 
                        alt={`Announcement media ${i + 1}`}
                        className="rounded-2xl border border-white/10 w-full h-48 object-cover"
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Link href={`/announcements/${announcement.id}`}>
                    <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold group/btn">
                      {t("misc.announcements.read_more")}
                      <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
