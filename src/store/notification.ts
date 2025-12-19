import { create } from "zustand";
import type { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "isRead" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    {
      id: "1",
      title: "🎉 ยินดีต้อนรับสู่ QR STUDIO",
      message: "ขอบคุณที่เลือกใช้บริการของเรา พบกับ Script และ UI คุณภาพสูง",
      type: "system",
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "🆕 อัพเดทใหม่!",
      message: "เพิ่ม Script ใหม่ 5 รายการ พร้อมส่วนลดพิเศษ 20%",
      type: "update",
      isRead: false,
      createdAt: new Date(Date.now() - 86400000),
    },
  ],
  unreadCount: 2,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      isRead: false,
      createdAt: new Date(),
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    const notification = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: notification && !notification.isRead 
        ? Math.max(0, state.unreadCount - 1) 
        : state.unreadCount,
    }));
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
