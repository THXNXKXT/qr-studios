import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  type BackendUser, 
  getBackendSession, 
  createBackendSession, 
  getAuthToken, 
  clearBackendSession 
} from "@/lib/auth-helper";
import { checkoutApi, topupApi } from "@/lib/api";

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
  sync: (session?: any, status?: string, force?: boolean) => Promise<void>;
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

// Global variable to track active sync promise for deduplication
let activeSyncPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false, // Start as false to avoid infinite spinners for guests
      isSynced: false,
      isSyncing: false,
      isVerifyingPayment: false,
      isVerifyingTopup: false,
      verifiedSessions: [],
      verifiedTopupSessions: [],
      error: null,

      setVerifyingPayment: (isVerifying) => set({ isVerifyingPayment: isVerifying }),
      setVerifyingTopup: (isVerifying) => set({ isVerifyingTopup: isVerifying }),
      addVerifiedSession: (sessionId) => set((state) => ({ 
        verifiedSessions: [...state.verifiedSessions, sessionId] 
      })),
      addVerifiedTopupSession: (sessionId) => set((state) => ({ 
        verifiedTopupSessions: [...state.verifiedTopupSessions, sessionId] 
      })),

      verifyTopup: async (sessionId: string) => {
        const state = get();
        if (state.verifiedTopupSessions.includes(sessionId)) {
          return { success: true };
        }
        if (state.isVerifyingTopup) {
          return { success: false, error: 'Verification already in progress' };
        }

        set({ isVerifyingTopup: true, error: null });
        try {
          const { data, error } = await topupApi.verifySession(sessionId);
          if (data && (data as any).success) {
            const amount = (data as any).data.amount + ((data as any).data.bonus || 0);
            set((state) => ({ 
              verifiedTopupSessions: [...state.verifiedTopupSessions, sessionId],
              isVerifyingTopup: false 
            }));
            
            // Sync balance with delay
            setTimeout(() => {
              get().sync(undefined, undefined, true);
            }, 2000);

            return { success: true, amount };
          } else {
            set({ isVerifyingTopup: false, error: error || 'Top-up verification failed' });
            return { success: false, error: error || 'Top-up verification failed' };
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error during top-up verification';
          set({ isVerifyingTopup: false, error: errMsg });
          return { success: false, error: errMsg };
        }
      },

      verifyPayment: async (sessionId: string) => {
        const state = get();
        if (state.verifiedSessions.includes(sessionId)) {
          return { success: true };
        }
        if (state.isVerifyingPayment) {
          // Wait for existing verification if any (though unlikely for same ID)
          return { success: false, error: 'Verification already in progress' };
        }

        set({ isVerifyingPayment: true, error: null });
        try {
          const { data, error } = await checkoutApi.verifyStripePayment(sessionId);
          if (data && (data as any).success) {
            set((state) => ({ 
              verifiedSessions: [...state.verifiedSessions, sessionId],
              isVerifyingPayment: false 
            }));
            
            // Important: After successful payment, we MUST force a sync to update balance
            // but we add a delay to ensure DB consistency
            setTimeout(() => {
              get().sync(undefined, undefined, true);
            }, 2000);

            return { success: true };
          } else {
            set({ isVerifyingPayment: false, error: error || 'Verification failed' });
            return { success: false, error: error || 'Verification failed' };
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error during verification';
          set({ isVerifyingPayment: false, error: errMsg });
          return { success: false, error: errMsg };
        }
      },

      sync: async (session, status, force = false) => {
        // 1. Skip while NextAuth is still initializing, unless we are forcing
        if (status === 'loading' && !force) return;

        // 2. Request Deduplication: If already syncing, return the active promise
        // This prevents spawning multiple parallel requests for the same thing
        if (activeSyncPromise && !force) {
          return activeSyncPromise;
        }

        // If forced but a sync is already running, wait for it to finish first
        // to avoid race conditions and then start a new one if needed
        if (activeSyncPromise && force) {
          try {
            await activeSyncPromise;
          } catch (e) {
            // Ignore errors from the previous sync, we're forcing a new one
          }
        }

        const state = get();
        
        // 3. STOP THE LOOP: If already synced and not forced, return immediately.
        const token = getAuthToken();
        // REMOVED state.isSynced check when force is true to ensure data is updated
        if (state.isSynced && !force && (status === 'authenticated' || !!token)) {
          if (state.loading) set({ loading: false });
          return;
        }

        // Create new sync promise
        activeSyncPromise = (async () => {
          try {
            // 4. Handle unauthenticated state from NextAuth
            if (status === 'unauthenticated' || !session?.user) {
              if (!token) {
                if (get().user) {
                  console.log('[AuthStore] No token and no session, clearing auth');
                  clearBackendSession();
                  set({ user: null, loading: false, isSynced: true, isSyncing: false, error: null });
                } else {
                  set({ isSynced: true, loading: false, isSyncing: false });
                }
              } else {
                try {
                  if (!get().user) set({ loading: true });
                  set({ isSyncing: true });
                  
                  console.log('[AuthStore] Recovering session from token...');
                  const backendUser = await getBackendSession();
                  if (backendUser) {
                    // Update user even if it looks the same if forced
                    set({ user: backendUser, loading: false, isSynced: true, isSyncing: false, error: null });
                  } else {
                    console.log('[AuthStore] Token invalid, clearing auth');
                    clearBackendSession();
                    set({ user: null, loading: false, isSynced: true, isSyncing: false, error: null });
                  }
                } catch (e) {
                  console.error('[AuthStore] Session recovery error:', e);
                  set({ isSynced: true, loading: false, isSyncing: false });
                }
              }
              return;
            }

            // 5. We have a NextAuth session, sync with backend
            try {
              if (!get().user) set({ loading: true });
              set({ isSyncing: true });
              
              console.log('[AuthStore] Syncing session with backend...');
              let backendUser = await getBackendSession();

              // Race Condition Check: If user logged out or token changed during fetch, abort
              if (getAuthToken() === null && status !== 'authenticated') {
                console.log('[AuthStore] Auth state changed during sync, aborting');
                return;
              }

              if (!backendUser && session) {
                console.log('[AuthStore] Creating new backend session...');
                const accessToken = (session as any).accessToken || (session?.user as any)?.accessToken;
                if (!accessToken) {
                  console.error('[AuthStore] No access token found in session');
                  return;
                }
                const backendSession = await createBackendSession({
                  accessToken
                });
                backendUser = backendSession.user;
              }

              if (backendUser) {
                console.log('[AuthStore] Sync complete, updating user');
                set({ user: backendUser, loading: false, isSynced: true, isSyncing: false, error: null });
              } else {
                set({ isSynced: true, loading: false, isSyncing: false });
              }
            } catch (err) {
              console.error('[AuthStore] Sync error:', err);
              const errorMessage = err instanceof Error ? err.message : 'Failed to sync session';
              set({ 
                error: get().user ? null : errorMessage, 
                isSynced: true, 
                loading: false, 
                isSyncing: false 
              });
            }
          } finally {
            activeSyncPromise = null;
          }
        })();

        return activeSyncPromise;
      },

      setUser: (user) => set({ user, loading: false, isSynced: true, isSyncing: false, error: null }),
      setLoading: (loading) => set({ loading }),
      setSynced: (isSynced) => set({ isSynced, loading: false, isSyncing: false }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setError: (error) => set({ error, loading: false, isSyncing: false }),
      clearAuth: () => set({ 
        user: null, 
        loading: false, 
        isSynced: false, 
        isSyncing: false, 
        error: null,
        verifiedSessions: [],
        verifiedTopupSessions: []
      }),
    }),
    {
      name: "qr-studio-auth",
      // Only persist user data. isSynced should reset on page reload 
      // to ensure at least one sync per session while preventing loops.
      partialize: (state) => ({ 
        user: state.user,
      }),
    }
  )
);
