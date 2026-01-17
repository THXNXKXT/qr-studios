"use client";

import { useEffect, useState } from "react";
import { useNotificationStore } from "@/store/notification";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Inbox,
  Clock,
  ExternalLink,
  Package,
  Megaphone,
  CreditCard,
  ShieldAlert
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const typeConfig = {
  UPDATE: { icon: Megaphone, color: "text-blue-500", bg: "bg-blue-500/10" },
  PROMOTION: { icon: Package, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  SYSTEM: { icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/10" },
  ORDER: { icon: CreditCard, color: "text-red-500", bg: "bg-red-500/10" },
};

export default function NotificationsPage() {
  const { t } = useTranslation("common");
  const { user, loading: authLoading } = useAuth();
  const renderTranslation = (key: string, options?: any): string => {
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  const { 
    notifications, 
    unreadCount, 
    loading: notifyLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    removeNotification
  } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  if (authLoading || (notifyLoading && notifications.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container max-w-4xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {renderTranslation("dashboard.orders.back")}
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-600/5">
                <Bell className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight uppercase">{renderTranslation("notifications_page.title")}</h1>
                <p className="text-gray-400">{renderTranslation("notifications_page.desc")}</p>
              </div>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl px-4 font-bold"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {renderTranslation("notifications_page.read_all")}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key="empty"
              >
                <Card className="p-20 text-center border-white/5 bg-white/2 backdrop-blur-md">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Inbox className="w-10 h-10 text-gray-800 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{renderTranslation("notifications_page.empty_title")}</h3>
                  <p className="text-gray-500">{renderTranslation("notifications_page.empty_desc")}</p>
                </Card>
              </motion.div>
            ) : (
              notifications.map((notification, index) => {
                const config = typeConfig[notification.type] || typeConfig.SYSTEM;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "p-6 border-white/5 bg-white/2 backdrop-blur-sm transition-all duration-300 relative overflow-hidden group",
                      !notification.isRead && "border-red-500/20 bg-red-500/2 shadow-lg shadow-red-900/5"
                    )}>
                      {!notification.isRead && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                      )}
                      
                      <div className="flex gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner",
                          config.bg
                        )}>
                          <Icon className={cn("w-6 h-6", config.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <h3 className={cn(
                              "font-bold truncate group-hover:text-white transition-colors",
                              notification.isRead ? "text-gray-300" : "text-white text-lg"
                            )}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-1 text-gray-500 shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">
                                {new Date(notification.createdAt).toLocaleDateString(renderTranslation("common.date_locale") === 'th' ? 'th-TH' : 'en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <p className={cn(
                            "text-sm leading-relaxed mb-4",
                            notification.isRead ? "text-gray-500" : "text-gray-400"
                          )}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <Badge className={cn(
                              "px-3 py-1 rounded-lg border-none font-black text-[10px] uppercase tracking-widest",
                              notification.isRead ? "bg-white/5 text-gray-500" : "bg-red-600/20 text-red-500"
                            )}>
                              {notification.type}
                            </Badge>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-9 rounded-xl hover:bg-red-600/10 hover:text-red-500 font-bold text-xs"
                                >
                                  {renderTranslation("notifications_page.mark_as_read")}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeNotification(notification.id)}
                                className="h-9 w-9 p-0 rounded-xl hover:bg-red-900/20 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
