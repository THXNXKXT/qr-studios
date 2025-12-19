"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  MessageCircle, 
  Mail, 
  Heart,
  ExternalLink
} from "lucide-react";

const footerLinks = {
  products: [
    { label: "Script เกม", href: "/products?category=script" },
    { label: "UI Design", href: "/products?category=ui" },
    { label: "Bundle", href: "/products?category=bundle" },
    { label: "รับทำ UI", href: "/commission" },
  ],
  support: [
    { label: "ติดต่อเรา", href: "/contact" },
    { label: "คำถามที่พบบ่อย", href: "/faq" },
    { label: "วิธีการชำระเงิน", href: "/payment-guide" },
    { label: "นโยบายการคืนเงิน", href: "/refund-policy" },
  ],
  legal: [
    { label: "ข้อกำหนดการใช้งาน", href: "/terms" },
    { label: "นโยบายความเป็นส่วนตัว", href: "/privacy" },
    { label: "นโยบาย License", href: "/license-policy" },
  ],
};

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/10 bg-black/50 backdrop-blur-xl">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-red-900/10 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/Query.Design.png"
                alt="QR Studio Logo"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="text-xl font-bold text-white">QR STUDIO</span>
            </Link>
            <p className="text-gray-400 text-sm">
              แหล่งรวม Script และ UI คุณภาพสูงสำหรับเซิร์ฟเวอร์ FiveM 
              พร้อมบริการรับทำ UI ตามความต้องการ
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://discord.gg/qrstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@qrstudio.com"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">สินค้า</h3>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-red-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">ช่วยเหลือ</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-red-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">ข้อกำหนด</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-red-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} QR STUDIO. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> in Thailand
          </p>
        </div>
      </div>
    </footer>
  );
}
