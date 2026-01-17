// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface AuthSession {
  user: {
    id: string;
    discordId: string;
    username: string;
    email: string;
    avatar: string;
  };
  accessToken: string;
  expires: string;
}

// Product API Types
export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: "SCRIPT" | "UI" | "BUNDLE";
  images: string[];
  features: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: string;
  rewardPoints?: number;
  version: string;
  createdAt: string;
  updatedAt: string;
}

// Order API Types
export interface OrderResponse {
  id: string;
  userId: string;
  items: OrderItemResponse[];
  total: number;
  discount: number;
  promoCode?: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded";
  paymentMethod: "stripe" | "balance" | "promptpay";
  paymentIntent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  licenseKey?: string;
}

// License API Types
export interface LicenseResponse {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  orderId: string;
  licenseKey: string;
  ipAddress?: string;
  status: "active" | "expired" | "revoked";
  expiresAt?: string;
  createdAt: string;
}

export interface LicenseVerifyRequest {
  licenseKey: string;
  serverIp: string;
  resourceName: string;
}

export interface LicenseVerifyResponse {
  valid: boolean;
  product?: string;
  expiresAt?: string;
  error?: string;
}

// Checkout API Types
export interface CheckoutRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  promoCode?: string;
}

export interface CheckoutResponse {
  orderId: string;
  sessionId?: string; // Stripe session ID
  clientSecret?: string; // Stripe client secret
}

// Topup API Types
export interface TopupPackage {
  amount: number;
  bonus: number;
}

export interface TopupRequest {
  amount: number;
  paymentMethod: "stripe" | "promptpay";
}

export interface TopupResponse {
  transactionId: string;
  sessionId?: string;
  qrCode?: string; // For PromptPay
}

// Promo API Types
export interface PromoValidateRequest {
  code: string;
  cartTotal: number;
}

export interface PromoValidateResponse {
  valid: boolean;
  discount?: number;
  type?: "percentage" | "fixed";
  message: string;
}

// Review API Types
export interface ReviewResponse {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  productId: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
}

export interface ReviewCreateRequest {
  rating: number;
  comment: string;
}

// Commission API Types
export interface CommissionResponse {
  id: string;
  userId: string;
  title: string;
  description: string;
  budget: number;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  attachments: string[];
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionCreateRequest {
  title: string;
  description: string;
  budget: number;
  attachments?: string[];
}

// Transaction API Types
export interface TransactionResponse {
  id: string;
  userId: string;
  type: "TOPUP" | "PURCHASE" | "REFUND" | "BONUS" | "POINTS_EARNED" | "POINTS_REDEEMED";
  amount: number;
  bonus: number;
  points: number;
  paymentMethod?: string;
  paymentRef?: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  createdAt: string;
}

// Notification API Types
export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "update" | "promotion" | "system" | "order";
  isRead: boolean;
  createdAt: string;
}

// Announcement API Types
export interface AnnouncementResponse {
  id: string;
  title: string;
  content?: string;
  media: {
    type: "image" | "video";
    url: string;
  }[];
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  tier?: string;
}

// User API Types
export interface UserResponse {
  id: string;
  discordId: string;
  username: string;
  email: string;
  avatar?: string;
  balance: number;
  points: number;
  role: "user" | "admin" | "moderator";
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  recentOrders: OrderResponse[];
  topProducts: {
    productId: string;
    productName: string;
    totalSold: number;
  }[];
}

// Admin Stats Types
export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  pendingCommissions: number;
  todayRevenue: number;
  todayOrders: number;
  monthlyRevenue: number;
  monthlyOrders: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  category: string;
}

export interface AnalyticsData {
  visitors: {
    today: number;
    week: number;
    month: number;
  };
  sales: {
    today: number;
    week: number;
    month: number;
  };
  topCategories: {
    category: string;
    count: number;
    revenue: number;
  }[];
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Lucky Wheel Types
export interface LuckyWheelReward {
  id: string;
  type: 'POINTS' | 'BALANCE';
  amount: number;
  probability: number;
  label: string;
  color?: string;
  isActive: boolean;
}

export interface LuckyWheelSpinResult {
  reward: LuckyWheelReward;
  message: string;
}

export interface LuckyWheelHistory {
  id: string;
  userId: string;
  rewardId: string;
  reward: LuckyWheelReward;
  createdAt: string;
}

