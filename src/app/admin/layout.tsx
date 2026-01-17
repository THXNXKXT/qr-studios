"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Key,
  Tag,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Star,
  ClipboardList,
  History,
  Zap,
  Download,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { LanguageSwitcher } from "@/components/admin/LanguageSwitcher";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation("admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const sidebarLinks = [
    { href: "/admin", label: t("sidebar.dashboard"), icon: LayoutDashboard },
    { href: "/admin/analytics", label: t("sidebar.analytics"), icon: BarChart3 },
    { href: "/admin/products", label: t("sidebar.products"), icon: Package },
    { href: "/admin/flash-sale", label: "Flash Sale", icon: Zap },
    { href: "/admin/orders", label: t("sidebar.orders"), icon: ShoppingCart },
    { href: "/admin/users", label: t("sidebar.users"), icon: Users },
    { href: "/admin/licenses", label: "License", icon: Key },
    { href: "/admin/promo-codes", label: "Promo Codes", icon: Tag },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/commissions", label: "Commissions", icon: ClipboardList },
    { href: "/admin/lucky-wheel", label: "Lucky Wheel", icon: Trophy },
    { href: "/admin/export", label: "Export", icon: Download },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: History },
    { href: "/admin/settings", label: t("sidebar.settings"), icon: Settings },
  ];

  return (
    <I18nProvider>
      <div className="min-h-screen bg-black">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-black/95 backdrop-blur-2xl border-r border-white/5 transition-transform duration-300 lg:translate-x-0 shadow-2xl shadow-red-950/10",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-linear-to-b from-red-950/20 to-transparent">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-red-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <Image
                src="/images/Query.Design.png"
                alt="QR Studio"
                width={36}
                height={32}
                className="relative rounded-lg shadow-xl"
              />
            </div>
            <span className="font-black text-white tracking-tighter uppercase text-lg group-hover:text-red-400 transition-colors">Admin Panel</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100%-10rem)] scrollbar-hide">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="admin-active-nav"
                    className="absolute inset-0 bg-linear-to-r from-red-600 to-red-500 -z-10"
                  />
                )}
                <link.icon className={cn(
                  "w-5 h-5 transition-transform duration-500",
                  isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-red-500"
                )} />
                <span className="relative z-10">{link.label}</span>
                {isActive && (
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="ml-auto"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-bold group">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              {t("sidebar.logout_admin")}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-30 shadow-2xl">
          <div className="h-full px-8 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-6 ml-auto">
              <LanguageSwitcher />
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-white group-hover:text-red-400 transition-colors">Admin User</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Super Admin</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/10">
                  <span className="text-lg font-black text-white">A</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-10 flex-1 relative">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-500/10 to-transparent" />
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </I18nProvider>
  );
}
