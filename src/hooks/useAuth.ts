import { useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/auth';

export function useAuth() {
  const { data: session, status } = useSession();
  
  // Use selectors to prevent unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const isSynced = useAuthStore((state) => state.isSynced);
  const isSyncing = useAuthStore((state) => state.isSyncing);
  const isVerifyingPayment = useAuthStore((state) => state.isVerifyingPayment);
  const isVerifyingTopup = useAuthStore((state) => state.isVerifyingTopup);
  const verifiedSessions = useAuthStore((state) => state.verifiedSessions);
  const verifiedTopupSessions = useAuthStore((state) => state.verifiedTopupSessions);
  const error = useAuthStore((state) => state.error);
  
  const sync = useAuthStore((state) => state.sync);
  const verifyPaymentStore = useAuthStore((state) => state.verifyPayment);
  const verifyTopupStore = useAuthStore((state) => state.verifyTopup);
  const setVerifyingPayment = useAuthStore((state) => state.setVerifyingPayment);
  const setVerifyingTopup = useAuthStore((state) => state.setVerifyingTopup);
  const addVerifiedSession = useAuthStore((state) => state.addVerifiedSession);
  const addVerifiedTopupSession = useAuthStore((state) => state.addVerifiedTopupSession);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = useCallback(async () => {
    try {
      // 1. Sign out from NextAuth first
      await signOut({ redirect: false });
      // 2. Clear custom backend session and store
      clearAuth();
      // 3. Redirect manually
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback: clear and redirect anyway
      clearAuth();
      window.location.href = '/';
    }
  }, [clearAuth]);

  const refresh = useCallback(() => sync(session, status, true), [session, status, sync]);
  const verifyPayment = useCallback((sessionId: string) => verifyPaymentStore(sessionId), [verifyPaymentStore]);
  const verifyTopup = useCallback((sessionId: string) => verifyTopupStore(sessionId), [verifyTopupStore]);

  return {
    user,
    session,
    // Optimistic loading: only show as loading if we don't have a user yet.
    // This prevents flickering and infinite spinners if we have persisted data.
    loading: (loading || status === 'loading') && !user,
    isSynced,
    isSyncing,
    isVerifyingPayment,
    isVerifyingTopup,
    verifiedSessions,
    verifiedTopupSessions,
    verifyPayment,
    verifyTopup,
    setVerifyingPayment,
    setVerifyingTopup,
    addVerifiedSession,
    addVerifiedTopupSession,
    error,
    isAuthenticated: !!user,
    refresh,
    logout,
    clearAuth,
  };
}
