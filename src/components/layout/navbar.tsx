"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  ShoppingCart,
  Bell,
  User,
  LogIn,
  LogOut,
  Home,
  Package,
  Palette,
  Wallet,
  ChevronDown,
  Globe,
  Mail,
  Heart,
  Megaphone,
  Languages,
  Blocks,
  ArrowRight
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useCartStore } from "@/store/cart";
import { useNotificationStore } from "@/store/notification";
import { useWishlistStore } from "@/store/wishlist";
import { useAuth } from "@/hooks/useAuth";
import { useIsMounted } from "@/hooks/useIsMounted";
import { getAuthToken } from "@/lib/auth-helper";
import { cn, getTierInfo } from "@/lib/utils";

const navLinks = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/products", labelKey: "nav.products", icon: Package },
  {
    labelKey: "nav.services",
    icon: Blocks,
    dropdown: [
      { href: "/commission", labelKey: "nav.ui_service", icon: Palette },
      { href: "/web-design", labelKey: "nav.web_service", icon: Globe },
    ]
  },
  { href: "/announcements", labelKey: "nav.announcements", icon: Megaphone },
  { href: "/contact", labelKey: "nav.contact", icon: Mail },
];

export function Navbar() {
  const { t, i18n } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isMounted = useIsMounted();
  const [isOptimisticAuth, setIsOptimisticAuth] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotificationStore();
  const { user, loading, isAuthenticated: isAuthFromHook, logout } = useAuth();

  // Check cookie immediately on mount to prevent flicker
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Defer setState to avoid react-hooks/set-state-in-effect warning
      queueMicrotask(() => setIsOptimisticAuth(true));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const renderTranslation = (key: string) => {
    if (!isMounted) return null;
    return t(key);
  };

  useEffect(() => {
    if (!loading && user) {
      // Defer setState to avoid react-hooks/set-state-in-effect warning
      queueMicrotask(() => setIsOptimisticAuth(true));
    } else if (!loading && !user) {
      queueMicrotask(() => setIsOptimisticAuth(false));
    }
  }, [loading, user]);

  const isAuthenticated = isOptimisticAuth || isAuthFromHook;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
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
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/Query.Design.png"
            alt="QR Studio Logo"
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="text-xl font-bold text-white hidden lg:block">
            QR STUDIO
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center justify-center flex-1 min-w-0 px-2">
          <div className="flex items-center gap-1 py-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              
              if (link.dropdown) {
                const isAnyActive = link.dropdown.some(item => pathname === item.href);
                return (
                  <div key={link.labelKey} className="relative group/dropdown">
                    <button
                      className={cn(
                        "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                        isAnyActive
                          ? "bg-red-500/10 text-red-500 shadow-[0_0_15px_-3px_RGBA(239,68,68,0.3)]"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">{renderTranslation(link.labelKey)}</span>
                      <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover/dropdown:rotate-180" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:translate-y-0 group-hover/dropdown:pointer-events-auto transition-all duration-300 z-50">
                      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[200px] p-1.5">
                        {link.dropdown.map((item) => {
                          const DropdownIcon = item.icon;
                          const isItemActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isItemActive
                                  ? "bg-red-500/10 text-red-500"
                                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                              )}
                            >
                              <DropdownIcon className="w-4 h-4" />
                              <span className="whitespace-nowrap">{renderTranslation(item.labelKey)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shrink-0",
                    isActive
                      ? "bg-red-500/10 text-red-500 shadow-[0_0_15px_-3px_RGBA(239,68,68,0.3)]"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{renderTranslation(link.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
                    <h3 className="font-semibold text-white">{t('nav.notifications')}</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        {t('nav.read_all')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {notifications.filter(n => !n.isRead).length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-20" />
                        <p className="text-gray-500 text-sm">
                          {t('nav.no_notifications')}
                        </p>
                      </div>
                    ) : (
                      notifications
                        .filter(n => !n.isRead)
                        .slice(0, 3)
                        .map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            markAsRead(notification.id);
                            // If it's an announcement, we might want to navigate to an announcement page
                            if (notification.type === 'UPDATE' || notification.type === 'PROMOTION') {
                              router.push('/announcements');
                            }
                          }}
                          className={cn(
                            "p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 relative group",
                            "bg-red-500/5"
                          )}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-medium text-white text-sm leading-tight group-hover:text-red-400 transition-colors">
                              {notification.title}
                            </p>
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                          </div>
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleDateString(i18n.language === 'th' ? 'th-TH' : 'en-US', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-white/5 border-t border-white/10">
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors w-full"
                    >
                      <span>{t('nav.view_all_notifications')}</span>
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {notifications.filter(n => !n.isRead).length}
                        </Badge>
                      )}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
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

          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => i18n.changeLanguage(i18n.language === 'th' ? 'en' : 'th')}
            className="text-gray-400 hover:text-white"
          >
            <Languages className="w-5 h-5" />
          </Button>

          {/* User Menu / Login */}
          <div className="hidden sm:flex items-center min-w-[100px] justify-end">
            {!isMounted ? (
              <div className="h-9 w-24 bg-white/5 animate-pulse rounded-xl" />
            ) : (isAuthenticated || isOptimisticAuth) && user ? (
              <div className="flex items-center gap-2">
                {/* Balance */}
                <Link href="/dashboard/topup">
                  <div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-bold text-sm">
                      ฿{(user.balance || 0).toLocaleString()}
                    </span>
                  </div>
                </Link>
                {/* User Menu */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    className="gap-2"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    {user.avatar ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-red-500/30 relative">
                        <Image
                          src={user.avatar}
                          alt={user.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                    <span className="text-white">{user.username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        {/* Tier Info */}
                        <div className="px-4 py-3 border-b border-white/10 bg-white/2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('nav.membership')}</span>
                            {(() => {
                              const tier = getTierInfo(user.totalSpent || 0);
                              return (
                                <Badge 
                                  className={cn(
                                    "px-2 py-0 h-5 border-none font-black text-[9px] uppercase tracking-tighter",
                                    tier.bg,
                                    tier.color
                                  )}
                                >
                                  {tier.icon} {tier.name}
                                </Badge>
                              );
                            })()}
                          </div>
                          <p className="text-white font-bold text-sm">{user.username}</p>
                          <p className="text-gray-500 text-[10px] truncate">{user.email || 'Member'}</p>
                        </div>

                        <Link 
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                        >
                          <User className="w-4 h-4" />
                          {t('nav.dashboard')}
                        </Link>
                        <Link 
                          href="/dashboard/orders"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                        >
                          <Package className="w-4 h-4" />
                          {t('nav.orders')}
                        </Link>
                        <Link 
                          href="/dashboard/wishlist"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                        >
                          <Heart className="w-4 h-4" />
                          {t('nav.wishlist')}
                        </Link>
                        <div className="border-t border-white/10">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-gray-300 hover:text-red-400 w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('nav.logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (isOptimisticAuth || loading) ? (
              <div className="h-9 w-24 bg-white/5 animate-pulse rounded-xl" />
            ) : (
              <Link href="/auth/login">
                <Button variant="default" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  {t('nav.login')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
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
            className="xl:hidden bg-black/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;

                if (link.dropdown) {
                  const isAnyActive = link.dropdown.some(item => pathname === item.href);
                  return (
                    <div key={link.labelKey} className="space-y-1">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold tracking-tight uppercase opacity-50",
                          isAnyActive ? "text-red-500" : "text-gray-400"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {renderTranslation(link.labelKey)}
                        <ChevronDown className="w-4 h-4" />
                      </div>
                      <div className="pl-4 space-y-1 border-l border-white/10 ml-6">
                        {link.dropdown.map((item) => {
                          const DropdownIcon = item.icon;
                          const isItemActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                isItemActive
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                  : "text-gray-300 hover:bg-white/5"
                              )}
                            >
                              <DropdownIcon className="w-5 h-5" />
                              {renderTranslation(item.labelKey)}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : "text-gray-300 hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {renderTranslation(link.labelKey)}
                  </Link>
                );
              })}
              
              <div className="pt-3 mt-1 border-t border-white/10 space-y-2">
                {!isMounted ? (
                  <div className="h-12 w-full bg-white/5 animate-pulse rounded-xl" />
                ) : (isAuthenticated || isOptimisticAuth) && user ? (
                  <>
                    {/* User Profile & Balance Row */}
                    <div className="flex items-center gap-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        {user.avatar ? (
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-red-500/30 relative">
                            <Image
                              src={user.avatar}
                              alt={user.username}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-red-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white text-sm">{user.username}</p>
                          <p className="text-xs text-gray-500">ดูโปรไฟล์</p>
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/topup"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 transition-colors"
                      >
                        <Wallet className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-bold text-sm">฿{(user.balance || 0).toLocaleString()}</span>
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
                        {t('nav.orders')}
                      </Link>
                      <Link
                        href="/dashboard/wishlist"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
                      >
                        <Heart className="w-4 h-4" />
                        {t('nav.wishlist')}
                      </Link>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 text-sm font-medium mt-2"
                    >
                      <LogOut className="w-5 h-5" />
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (isOptimisticAuth || loading) ? (
                  <div className="h-12 w-full bg-white/5 animate-pulse rounded-xl" />
                ) : (
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full gap-2">
                      <LogIn className="w-4 h-4" />
                      {t('nav.login_discord')}
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
