import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(price);
}

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(Number(num))) return "0";
  return new Intl.NumberFormat("th-TH").format(Number(num));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function isProductOnFlashSale(product: {
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: Date | string;
}): boolean {
  if (!product.isFlashSale || !product.flashSalePrice || !product.flashSaleEnds) {
    return false;
  }

  const end = new Date(product.flashSaleEnds).getTime();
  const now = new Date().getTime();
  return end > now;
}

export function getProductPrice(product: {
  price: number;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: Date | string;
}): number {
  if (isProductOnFlashSale(product)) {
    return product.flashSalePrice!;
  }
  return product.price;
}

export type MemberTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "ELITE" | "ROYAL" | "LEGEND";

export interface TierInfo {
  name: string;
  minSpent: number;
  discount: number; // percentage
  color: string;
  bg: string;
  icon: string;
}

export const TIERS: Record<MemberTier, TierInfo> = {
  BRONZE: {
    name: "Bronze",
    minSpent: 0,
    discount: 0,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    icon: "🥉",
  },
  SILVER: {
    name: "Silver",
    minSpent: 1000,
    discount: 2,
    color: "text-slate-300",
    bg: "bg-slate-300/10",
    icon: "🥈",
  },
  GOLD: {
    name: "Gold",
    minSpent: 3000,
    discount: 4,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    icon: "🥇",
  },
  PLATINUM: {
    name: "Platinum",
    minSpent: 7000,
    discount: 6,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    icon: "✨",
  },
  DIAMOND: {
    name: "Diamond",
    minSpent: 15000,
    discount: 8,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    icon: "💎",
  },
  ELITE: {
    name: "Elite",
    minSpent: 30000,
    discount: 10,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    icon: "🔥",
  },
  ROYAL: {
    name: "Royal",
    minSpent: 60000,
    discount: 12,
    color: "text-red-400",
    bg: "bg-red-400/10",
    icon: "👑",
  },
  LEGEND: {
    name: "Legend",
    minSpent: 100000,
    discount: 15,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    icon: "🏆",
  },
};

export function getUserTier(totalSpent: number): MemberTier {
  if (totalSpent >= TIERS.LEGEND.minSpent) return "LEGEND";
  if (totalSpent >= TIERS.ROYAL.minSpent) return "ROYAL";
  if (totalSpent >= TIERS.ELITE.minSpent) return "ELITE";
  if (totalSpent >= TIERS.DIAMOND.minSpent) return "DIAMOND";
  if (totalSpent >= TIERS.PLATINUM.minSpent) return "PLATINUM";
  if (totalSpent >= TIERS.GOLD.minSpent) return "GOLD";
  if (totalSpent >= TIERS.SILVER.minSpent) return "SILVER";
  return "BRONZE";
}

export function getTierInfo(totalSpent: number): TierInfo {
  return TIERS[getUserTier(totalSpent)];
}

export function calculateTierDiscount(total: number, totalSpent: number): number {
  const tier = getTierInfo(totalSpent);
  return Math.round((total * tier.discount) / 100);
}
