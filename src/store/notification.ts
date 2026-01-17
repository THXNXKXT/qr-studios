import { create } from "zustand";
import type { Notification } from "@/types";
import { notificationsApi } from "@/lib/api";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    const { data, error } = await notificationsApi.getAll();
    if (data && (data as any).success) {
      const notifications = (data as any).data;
      set({ 
        notifications, 
        unreadCount: notifications.filter((n: any) => !n.isRead).length,
        loading: false 
      });
    } else {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    const { data, error } = await notificationsApi.markAsRead(id);
    if (data && (data as any).success) {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    }
  },

  markAllAsRead: async () => {
    const { data, error } = await notificationsApi.markAllAsRead();
    if (data && (data as any).success) {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    }
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
