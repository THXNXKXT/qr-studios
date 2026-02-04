import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type BackendUser,
  getBackendSession,
  createBackendSession,
  getAuthToken,
  clearBackendSession
} from '@/lib/auth-helper';
import { checkoutApi, topupApi } from '@/lib/api';
import { authLogger } from '@/lib/logger';

// API response types
interface TopupVerifyData { amount: number; bonus?: number; }
interface TopupVerifyResponse { success: boolean; data: TopupVerifyData; }
interface PaymentVerifyResponse { success: boolean; }
interface NextAuthSession { user?: { accessToken?: string }; accessToken?: string; }

// Global sync promise for deduplication
let activeSyncPromise: Promise<void> | null = null;
const handleError = (err: unknown, defaultMsg: string): string => err instanceof Error ? err.message : defaultMsg;
const delaySync = (sync: (s?: unknown, st?: string, f?: boolean) => Promise<void>) => setTimeout(() => sync(undefined, undefined, true), 2000);

interface AuthState {
  user: BackendUser | null;
  loading: boolean;
  isSynced: boolean;
  isSyncing: boolean;
  isVerifyingPayment: boolean;
  isVerifyingTopup: boolean;
  verifiedSessions: string[];
  verifiedTopupSessions: string[];
  error: string | null;
  sync: (session?: unknown, status?: string, force?: boolean) => Promise<void>;
  verifyPayment: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  verifyTopup: (sessionId: string) => Promise<{ success: boolean; amount?: number; error?: string }>;
  setVerifyingPayment: (v: boolean) => void;
  setVerifyingTopup: (v: boolean) => void;
  addVerifiedSession: (id: string) => void;
  addVerifiedTopupSession: (id: string) => void;
  setUser: (u: BackendUser | null) => void;
  setLoading: (v: boolean) => void;
  setSynced: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  setError: (e: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, loading: false, isSynced: false, isSyncing: false,
      isVerifyingPayment: false, isVerifyingTopup: false,
      verifiedSessions: [], verifiedTopupSessions: [], error: null,

      setVerifyingPayment: (v) => set({ isVerifyingPayment: v }),
      setVerifyingTopup: (v) => set({ isVerifyingTopup: v }),
      addVerifiedSession: (id) => set((s) => ({ verifiedSessions: [...s.verifiedSessions, id] })),
      addVerifiedTopupSession: (id) => set((s) => ({ verifiedTopupSessions: [...s.verifiedTopupSessions, id] })),

      verifyTopup: async (sessionId) => {
        const { verifiedTopupSessions, isVerifyingTopup } = get();
        if (verifiedTopupSessions.includes(sessionId)) return { success: true };
        if (isVerifyingTopup) return { success: false, error: 'Verification already in progress' };

        set({ isVerifyingTopup: true, error: null });
        try {
          const { data, error } = await topupApi.verifySession(sessionId);
          const res = data as TopupVerifyResponse | undefined;
          if (res?.success) {
            set((s) => ({ verifiedTopupSessions: [...s.verifiedTopupSessions, sessionId], isVerifyingTopup: false }));
            delaySync(get().sync);
            return { success: true, amount: res.data.amount + (res.data.bonus || 0) };
          }
          const msg = handleError(error, 'Top-up verification failed');
          set({ isVerifyingTopup: false, error: msg });
          return { success: false, error: msg };
        } catch (err) {
          const msg = handleError(err, 'Unknown error during top-up verification');
          set({ isVerifyingTopup: false, error: msg });
          return { success: false, error: msg };
        }
      },

      verifyPayment: async (sessionId) => {
        const { verifiedSessions, isVerifyingPayment } = get();
        if (verifiedSessions.includes(sessionId)) return { success: true };
        if (isVerifyingPayment) return { success: false, error: 'Verification already in progress' };

        set({ isVerifyingPayment: true, error: null });
        try {
          const { data, error } = await checkoutApi.verifyStripePayment(sessionId);
          const res = data as PaymentVerifyResponse | undefined;
          if (res?.success) {
            set((s) => ({ verifiedSessions: [...s.verifiedSessions, sessionId], isVerifyingPayment: false }));
            delaySync(get().sync);
            return { success: true };
          }
          const msg = String(error || 'Verification failed');
          set({ isVerifyingPayment: false, error: msg });
          return { success: false, error: msg };
        } catch (err) {
          const msg = String(err instanceof Error ? err.message : 'Unknown error during verification');
          set({ isVerifyingPayment: false, error: msg });
          return { success: false, error: msg };
        }
      },

      sync: async (session, status, force = false) => {
        if (status === 'loading' && !force) return;
        if (activeSyncPromise && !force) return activeSyncPromise;
        if (activeSyncPromise && force) { try { await activeSyncPromise; } catch {} }

        const { isSynced, loading } = get();
        const token = getAuthToken();
        if (isSynced && !force && (status === 'authenticated' || !!token)) {
          if (loading) set({ loading: false });
          return;
        }

        activeSyncPromise = (async () => {
          try {
            const nextAuth = session as NextAuthSession | undefined;
            if (status === 'unauthenticated' || !nextAuth?.user) {
              if (!token) {
                if (get().user) { clearBackendSession(); set({ user: null, loading: false, isSynced: true, isSyncing: false, error: null }); }
                else set({ isSynced: true, loading: false, isSyncing: false });
                return;
              }
              try {
                if (!get().user) set({ loading: true });
                set({ isSyncing: true });
                authLogger.debug('Recovering session from token...');
                const backendUser = await getBackendSession();
                if (backendUser) set({ user: backendUser, loading: false, isSynced: true, isSyncing: false, error: null });
                else { clearBackendSession(); set({ user: null, loading: false, isSynced: true, isSyncing: false, error: null }); }
              } catch (e) { authLogger.error('Session recovery error', e as Error); set({ isSynced: true, loading: false, isSyncing: false }); }
              return;
            }

            try {
              if (!get().user) set({ loading: true });
              set({ isSyncing: true });
              authLogger.debug('Syncing session with backend...');
              let backendUser = await getBackendSession();
              if (getAuthToken() === null && status !== 'authenticated') { authLogger.debug('Auth state changed during sync, aborting'); return; }
              if (!backendUser && session) {
                const accessToken = nextAuth?.accessToken || nextAuth?.user?.accessToken;
                if (!accessToken) { authLogger.error('No access token found in session'); return; }
                backendUser = (await createBackendSession({ accessToken })).user;
              }
              if (backendUser) { authLogger.debug('Sync complete, updating user'); set({ user: backendUser, loading: false, isSynced: true, isSyncing: false, error: null }); }
              else set({ isSynced: true, loading: false, isSyncing: false });
            } catch (err) {
              authLogger.error('Sync error', err as Error);
              set({ error: get().user ? null : handleError(err, 'Failed to sync session'), isSynced: true, loading: false, isSyncing: false });
            }
          } finally { activeSyncPromise = null; }
        })();
        return activeSyncPromise;
      },

      setUser: (user) => set({ user, loading: false, isSynced: true, isSyncing: false, error: null }),
      setLoading: (loading) => set({ loading }),
      setSynced: (isSynced) => set({ isSynced, loading: false, isSyncing: false }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setError: (error) => set({ error, loading: false, isSyncing: false }),
      clearAuth: () => set({ user: null, loading: false, isSynced: false, isSyncing: false, error: null, verifiedSessions: [], verifiedTopupSessions: [] })
    }),
    { name: 'qr-studio-auth', partialize: (state) => ({ user: state.user }) }
  )
);
