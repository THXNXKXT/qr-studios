export type MemberTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'ELITE' | 'ROYAL' | 'LEGEND';

export interface TierInfo {
  name: string;
  minSpent: number;
  discount: number; // percentage
}

export const TIERS: Record<MemberTier, TierInfo> = {
  BRONZE: {
    name: 'Bronze',
    minSpent: 0,
    discount: 0,
  },
  SILVER: {
    name: 'Silver',
    minSpent: 1000,
    discount: 2,
  },
  GOLD: {
    name: 'Gold',
    minSpent: 3000,
    discount: 4,
  },
  PLATINUM: {
    name: 'Platinum',
    minSpent: 7000,
    discount: 6,
  },
  DIAMOND: {
    name: 'Diamond',
    minSpent: 15000,
    discount: 8,
  },
  ELITE: {
    name: 'Elite',
    minSpent: 30000,
    discount: 10,
  },
  ROYAL: {
    name: 'Royal',
    minSpent: 60000,
    discount: 12,
  },
  LEGEND: {
    name: 'Legend',
    minSpent: 100000,
    discount: 15,
  },
};

export function getUserTier(totalSpent: number): MemberTier {
  if (totalSpent >= TIERS.LEGEND.minSpent) return 'LEGEND';
  if (totalSpent >= TIERS.ROYAL.minSpent) return 'ROYAL';
  if (totalSpent >= TIERS.ELITE.minSpent) return 'ELITE';
  if (totalSpent >= TIERS.DIAMOND.minSpent) return 'DIAMOND';
  if (totalSpent >= TIERS.PLATINUM.minSpent) return 'PLATINUM';
  if (totalSpent >= TIERS.GOLD.minSpent) return 'GOLD';
  if (totalSpent >= TIERS.SILVER.minSpent) return 'SILVER';
  return 'BRONZE';
}

export function getTierInfo(totalSpent: number): TierInfo {
  return TIERS[getUserTier(totalSpent)];
}

export function calculateTierDiscount(total: number, totalSpent: number): number {
  const tier = getTierInfo(totalSpent);
  return Math.round((total * tier.discount) / 100);
}
