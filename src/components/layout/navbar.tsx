"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ShoppingCart,
  Bell,
  User,
  LogIn,
  Home,
  Package,
  Palette,
  Wallet,
  ChevronDown,
  Globe,
  Mail,
  Heart,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { useNotificationStore } from "@/store/notification";
import { useWishlistStore } from "@/store/wishlist";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/products", label: "สินค้า", icon: Package },
  { href: "/commission", label: "รับทำ UI", icon: Palette },
  { href: "/web-design", label: "รับทำเว็บ", icon: Globe },
  { href: "/contact", label: "ติดต่อเรา", icon: Mail },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  // Fix hydration mismatch - wait for client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mock user - เปิดให้ทดสอบได้โดยไม่ต้องล็อคอิน
  const user = {
    id: "1",
    username: "TestUser",
    email: "test@example.com",
    balance: 2500,
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-black/80 backdrop-blur-xl border-white/10"
          : "bg-transparent border-transparent"
      )}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/Query.Design.png"
            alt="QR Studio Logo"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="text-xl font-bold text-white hidden sm:block">
            QR STUDIO
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-red-500/20 text-red-300"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {isMounted && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold text-white">การแจ้งเตือน</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        อ่านทั้งหมด
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-gray-500 text-sm">
                        ไม่มีการแจ้งเตือน
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={cn(
                            "p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5",
                            !notification.isRead && "bg-red-500/10"
                          )}
                        >
                          <p className="font-medium text-white text-sm">
                            {notification.title}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            {notification.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wishlist */}
          <Link href="/dashboard/wishlist">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="w-5 h-5" />
              {isMounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {wishlistCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Cart */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {isMounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* User Menu / Login */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              {/* Balance */}
              <Link href="/dashboard/topup">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                  <Wallet className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-semibold text-sm">
                    ฿{user.balance.toLocaleString()}
                  </span>
                </div>
              </Link>
              {/* User */}
              <Link href="/dashboard">
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-white">{user.username}</span>
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="default" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-red-500/20 text-red-300"
                        : "text-gray-300 hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="pt-3 mt-1 border-t border-white/10 space-y-2">
                {user ? (
                  <>
                    {/* User Profile & Balance Row */}
                    <div className="flex items-center gap-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{user.username}</p>
                          <p className="text-xs text-gray-500">ดูโปรไฟล์</p>
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/topup"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        <Wallet className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-semibold text-sm">฿{user.balance.toLocaleString()}</span>
                      </Link>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/dashboard/orders"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
                      >
                        <Package className="w-4 h-4" />
                        คำสั่งซื้อ
                      </Link>
                      <Link
                        href="/dashboard/wishlist"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
                      >
                        <Heart className="w-4 h-4" />
                        รายการโปรด
                      </Link>
                    </div>
                  </>
                ) : (
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full gap-2">
                      <LogIn className="w-4 h-4" />
                      เข้าสู่ระบบด้วย Discord
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
