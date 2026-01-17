// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  thumbnail?: string;
  images: string[];
  features: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: Date | string;
  rewardPoints?: number;
  expectedPoints?: number;
  isDownloadable?: boolean;
  downloadUrl?: string;
  downloadKey?: string;
  version?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = "SCRIPT" | "UI" | "BUNDLE";

// User Types
export interface User {
  id: string;
  discordId: string;
  username: string;
  email: string;
  avatar: string;
  balance: number;
  licenses: License[];
  createdAt: Date;
}

// License Types
export interface License {
  id: string;
  productId: string;
  userId: string;
  key: string;
  status: LicenseStatus;
  expiresAt?: Date;
  createdAt: Date;
}

export type LicenseStatus = "active" | "expired" | "revoked";

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "refunded";
export type PaymentMethod = "stripe" | "balance";

// Commission Types (รับทำ UI)
export interface Commission {
  id: string;
  userId: string;
  title: string;
  description: string;
  budget: number;
  status: CommissionStatus;
  attachments: string[];
  createdAt: Date;
}

export type CommissionStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

// Stats Types
export interface SiteStats {
  totalVisitors: number;
  totalProducts: number;
  totalLicenses: number;
  totalMembers: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  media: string[];
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType = "UPDATE" | "PROMOTION" | "SYSTEM" | "ORDER";
