import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QR STUDIO - Script & UI สำหรับ FiveM",
    template: "%s | QR STUDIO",
  },
  description:
    "แหล่งรวม Script และ UI คุณภาพสูงสำหรับเซิร์ฟเวอร์ FiveM พร้อมบริการรับทำ UI ตามความต้องการ",
  keywords: [
    "FiveM",
    "Script",
    "UI",
    "QR Studio",
    "ESX",
    "QBCore",
    "Game Script",
    "FiveM Script",
  ],
  authors: [{ name: "QR STUDIO" }],
  creator: "QR STUDIO",
  icons: {
    icon: "/images/Query.Design.png",
    shortcut: "/images/Query.Design.png",
    apple: "/images/Query.Design.png",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://qrstudio.com",
    siteName: "QR STUDIO",
    title: "QR STUDIO - Script & UI สำหรับ FiveM",
    description:
      "แหล่งรวม Script และ UI คุณภาพสูงสำหรับเซิร์ฟเวอร์ FiveM พร้อมบริการรับทำ UI ตามความต้องการ",
    images: ["/images/Query.Design.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "QR STUDIO - Script & UI สำหรับ FiveM",
    description:
      "แหล่งรวม Script และ UI คุณภาพสูงสำหรับเซิร์ฟเวอร์ FiveM",
    images: ["/images/Query.Design.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#dc2626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className={`${kanit.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
