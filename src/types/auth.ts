/**
 * Auth Types
 * Shared types for authentication system
 */

export interface BackendUser {
  id: string;
  discordId: string;
  username: string;
  email?: string;
  avatar?: string;
  balance: number;
  points: number;
  totalSpent: number;
  role: string;
  createdAt?: string;
}

export interface BackendSession {
  user: BackendUser;
  token: string;
}

// NextAuth session type extension
export interface NextAuthSession {
  user?: {
    accessToken?: string;
  };
  accessToken?: string;
}

// API Response types
export interface TopupVerifyData {
  amount: number;
  bonus?: number;
}

export interface TopupVerifyResponse {
  success: boolean;
  data: TopupVerifyData;
}

export interface PaymentVerifyResponse {
  success: boolean;
}

// Base auth state
export interface AuthBaseState {
  user: BackendUser | null;
  loading: boolean;
  isSynced: boolean;
  isSyncing: boolean;
  error: string | null;
}

// Payment verification state
export interface PaymentState {
  isVerifyingPayment: boolean;
  isVerifyingTopup: boolean;
  verifiedSessions: string[];
  verifiedTopupSessions: string[];
}

// Complete auth state
export interface AuthState extends AuthBaseState, PaymentState {
  // Actions
  sync: (session?: unknown, status?: string, force?: boolean) => Promise<void>;
  verifyPayment: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  verifyTopup: (sessionId: string) => Promise<{ success: boolean; amount?: number; error?: string }>;
  setVerifyingPayment: (isVerifying: boolean) => void;
  setVerifyingTopup: (isVerifying: boolean) => void;
  addVerifiedSession: (sessionId: string) => void;
  addVerifiedTopupSession: (sessionId: string) => void;
  setUser: (user: BackendUser | null) => void;
  setLoading: (loading: boolean) => void;
  setSynced: (synced: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}
