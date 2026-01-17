import type { Product } from "@/types";

export const mockProducts: Product[] = [
  {
    id: "72cc1289-b726-4d91-8f8a-d331807698ec",
    name: "Advanced Admin Panel",
    description: "ระบบจัดการ Admin Panel สำหรับเซิร์ฟเวอร์ FiveM พร้อมฟีเจอร์ครบครัน รองรับการจัดการผู้เล่น, แบน, คิก และอื่นๆ",
    price: 1299,
    originalPrice: 1599,
    category: "SCRIPT",
    images: ["/images/products/admin-panel.png"],
    features: [
      "จัดการผู้เล่นแบบ Real-time",
      "ระบบแบน/คิกพร้อมเหตุผล",
      "ดูสถิติเซิร์ฟเวอร์",
      "รองรับหลายภาษา",
      "อัพเดทฟรีตลอดชีพ",
    ],
    tags: ["fivem", "admin", "management"],
    rating: 4.8,
    reviewCount: 156,
    stock: 999,
    isNew: false,
    isFeatured: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-20"),
  },
  {
    id: "2eb5f5a6-e62e-4d01-91eb-aa9da3308d46",
    name: "Modern UI Bundle",
    description: "HUD สไตล์โมเดิร์น สวยงาม แสดงข้อมูลครบถ้วน ทั้งเลือด, เกราะ, อาหาร, น้ำ และอื่นๆ",
    price: 799,
    category: "UI",
    images: ["/images/products/hud.png"],
    features: [
      "ดีไซน์ Glassmorphism",
      "แสดงข้อมูลครบถ้วน",
      "ปรับแต่งได้ตามใจ",
      "รองรับ ESX/QBCore",
      "Performance ดีเยี่ยม",
    ],
    tags: ["fivem", "hud", "ui"],
    rating: 4.9,
    reviewCount: 243,
    stock: 999,
    isNew: true,
    isFeatured: true,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-25"),
  },
  {
    id: "08f6dd68-bc81-4a24-8f49-c5f441c27c35",
    name: "Inventory System Pro",
    description: "ระบบ Inventory สุดล้ำ พร้อม Drag & Drop, Hotbar และระบบ Weight",
    price: 999,
    originalPrice: 1199,
    category: "SCRIPT",
    images: ["/images/products/inventory.png"],
    features: [
      "Drag & Drop ลื่นไหล",
      "ระบบ Hotbar",
      "รองรับ Weight System",
      "ปรับแต่ง Slot ได้",
      "รองรับ ESX/QBCore",
    ],
    tags: ["fivem", "inventory", "essential"],
    rating: 4.7,
    reviewCount: 189,
    stock: 999,
    isNew: false,
    isFeatured: true,
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-03-18"),
  },
  {
    id: "fe82c653-8f1d-404b-b8c1-f09e80e0f15d",
    name: "Banking System Pro",
    description: "ระบบธนาคารสุดล้ำ รองรับการโอนเงิน, ประวัติการทำรายการ และการจัดการบัญชีร่วม",
    price: 1499,
    category: "SCRIPT",
    images: ["/images/products/phone.png"],
    features: [
      "โอนเงินแบบ Real-time",
      "ประวัติการทำรายการ",
      "จัดการบัญชีร่วม",
      "รองรับหลายธนาคาร",
      "UI สวยงาม",
    ],
    tags: ["fivem", "banking", "economy"],
    rating: 4.6,
    reviewCount: 98,
    stock: 999,
    isNew: true,
    isFeatured: false,
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-22"),
  },
  {
    id: "8962344f-dafa-404b-89f5-82519739ae2c",
    name: "Custom Garage System",
    description: "ระบบการาจเก็บรถแบบส่วนตัว พร้อม UI สวยงาม และระบบปรับแต่งรถ",
    price: 899,
    category: "SCRIPT",
    images: ["/images/products/loading.png"],
    features: [
      "UI สวยงาม ใช้ง่าย",
      "ระบบแยกการาจ",
      "แสดงสถานะรถ",
      "ปรับแต่งง่าย",
      "รองรับ ESX/QBCore",
    ],
    tags: ["fivem", "garage", "vehicle"],
    rating: 4.5,
    reviewCount: 312,
    stock: 999,
    isNew: false,
    isFeatured: false,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "932dc0c1-f9e8-4462-a3b0-730205ccc7b5",
    name: "Complete Server Bundle",
    description: "แพ็คเกจสำหรับเริ่มต้นเซิร์ฟเวอร์ รวม Script และ UI ที่จำเป็นทั้งหมด",
    price: 2999,
    originalPrice: 3999,
    category: "BUNDLE",
    images: ["/images/products/bundle.png"],
    features: [
      "Admin Panel",
      "HUD System",
      "Inventory System",
      "Loading Screen",
      "ประหยัดกว่า 40%",
    ],
    tags: ["fivem", "bundle", "starter"],
    rating: 4.9,
    reviewCount: 67,
    stock: 999,
    isNew: false,
    isFeatured: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-03-15"),
  },
];

export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find((product) => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  if (category === "all") return mockProducts;
  return mockProducts.filter((product) => product.category === category);
};

export const getFeaturedProducts = (): Product[] => {
  return mockProducts.filter((product) => product.isFeatured);
};

export const getNewProducts = (): Product[] => {
  return mockProducts.filter((product) => product.isNew);
};
