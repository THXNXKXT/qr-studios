import { expect, test, describe, mock, beforeEach } from "bun:test";

// Mock global objects BEFORE imports
const mockStorage: Record<string, string> = {};

// Mock window and localStorage for test environment
Object.assign(globalThis, {
  window: { location: { href: "" } },
  localStorage: {
    getItem: mock((key: string) => mockStorage[key] || null),
    setItem: mock((key: string, val: string) => {
      mockStorage[key] = val;
    }),
    removeItem: mock((key: string) => { delete mockStorage[key]; }),
    clear: mock(() => { for (const key in mockStorage) delete mockStorage[key]; }),
    key: mock((i: number) => Object.keys(mockStorage)[i] || null),
    get length() { return Object.keys(mockStorage).length; }
  }
});

// Mock dependencies
mock.module("@/lib/auth-helper", () => ({
  getBackendSession: mock(),
  createBackendSession: mock(),
  getAuthToken: mock(() => mockStorage["auth_token"] || null),
  clearBackendSession: mock(() => { delete mockStorage["auth_token"]; }),
}));

mock.module("@/lib/api", () => ({
  checkoutApi: { verifyStripePayment: mock() },
  topupApi: { verifySession: mock() },
}));

// Mock Next.js and other environment specific things if needed
// For now let's try to import the store
import { useAuthStore } from "../../src/store/auth";
import { getBackendSession, createBackendSession } from "../../src/lib/auth-helper";

describe("AuthStore", () => {
  beforeEach(() => {
    // Reset state before each test
    useAuthStore.getState().clearAuth();
    for (const key in mockStorage) delete mockStorage[key];

    // Reset mocks
    (getBackendSession as any).mockReset();
    (createBackendSession as any).mockReset();
  });

  test("should start with initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.isSynced).toBe(false);
  });

  describe("sync logic", () => {
    test("should handle unauthenticated state without token", async () => {
      const { sync } = useAuthStore.getState();

      await sync(null, "unauthenticated");

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isSynced).toBe(true);
      expect(state.loading).toBe(false);
    });

    test("should recover session from token when unauthenticated in NextAuth", async () => {
      mockStorage["auth_token"] = "valid_token";
      const mockUser = {
        id: "123",
        username: "test",
        balance: 0,
        points: 0,
        totalSpent: 0,
        role: "USER",
        discordId: "d123",
        avatar: "https://..."
      };
      (getBackendSession as any).mockResolvedValue(mockUser);

      const { sync } = useAuthStore.getState();
      await sync(null, "unauthenticated", true); // Use force=true

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser as any);
      expect(state.isSynced).toBe(true);
    });

    test("should create backend session when authenticated in NextAuth but no backend session", async () => {
      const mockNextAuthSession = {
        user: { name: "Discord User" },
        accessToken: "discord_token"
      };
      const mockBackendUser = {
        id: "123",
        username: "Discord User",
        balance: 0,
        points: 0,
        totalSpent: 0,
        role: "USER",
        discordId: "d123",
        avatar: "https://..."
      };

      (getBackendSession as any).mockResolvedValue(null);
      (createBackendSession as any).mockResolvedValue({
        user: mockBackendUser,
        token: "backend_token"
      });

      const { sync } = useAuthStore.getState();
      await sync(mockNextAuthSession, "authenticated", true); // Use force=true

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockBackendUser as any);
      expect(state.isSynced).toBe(true);
      expect(createBackendSession).toHaveBeenCalledWith({ accessToken: "discord_token" });
    });

    test("should update user state if backend data differs from local state", async () => {
      const oldUser = {
        id: "1",
        username: "old",
        balance: 0,
        points: 0,
        discordId: "d1",
        role: "USER",
        totalSpent: 0
      };
      const newUser = {
        id: "1",
        username: "new",
        balance: 100,
        points: 50,
        discordId: "d1",
        role: "USER",
        totalSpent: 0
      };

      useAuthStore.setState({ user: oldUser as any, isSynced: false });
      (getBackendSession as any).mockResolvedValue(newUser);

      await useAuthStore.getState().sync({ user: { name: "new" } }, 'authenticated');

      expect(useAuthStore.getState().user?.username).toBe("new");
      expect(useAuthStore.getState().user?.balance).toBe(100);
    });

    describe("Request Deduplication", () => {
      test("multiple simultaneous sync calls should only trigger one backend request", async () => {
        (getBackendSession as any).mockImplementation(() => new Promise(resolve => {
          setTimeout(() => resolve({ id: "1", username: "test" }), 50);
        }));

        // Fire multiple syncs
        const p1 = useAuthStore.getState().sync({ user: { name: "test" } }, 'authenticated');
        const p2 = useAuthStore.getState().sync({ user: { name: "test" } }, 'authenticated');
        const p3 = useAuthStore.getState().sync({ user: { name: "test" } }, 'authenticated', true); // Force one

        await Promise.all([p1, p2, p3]);

        // p1 and p2 should have been deduplicated if they were fired at the same time,
        // but p3 was forced. In our implementation, p3 waits for active promise then starts new one.
        expect(getBackendSession).toHaveBeenCalledTimes(2);
      });
    });

    describe("Payment & Topup Verification", () => {
      test("verifyPayment should update local state and trigger sync after delay", async () => {
        const { checkoutApi } = await import("@/lib/api");
        (checkoutApi.verifyStripePayment as any).mockResolvedValue({ data: { success: true } });
        (getBackendSession as any).mockResolvedValue({ id: "1", balance: 100 });

        // Mock timers
        const originalSetTimeout = global.setTimeout;
        let syncCalled = false;
        global.setTimeout = ((fn: any) => { fn(); syncCalled = true; }) as any;

        const result = await useAuthStore.getState().verifyPayment("session_123");

        expect(result.success).toBe(true);
        expect(useAuthStore.getState().verifiedSessions).toContain("session_123");
        expect(syncCalled).toBe(true);

        global.setTimeout = originalSetTimeout;
      });

      test("verifyTopup should handle bonus and update user balance", async () => {
        const { topupApi } = await import("@/lib/api");
        (topupApi.verifySession as any).mockResolvedValue({
          data: {
            success: true,
            data: { amount: 100, bonus: 20 }
          }
        });

        const originalSetTimeout = global.setTimeout;
        global.setTimeout = ((fn: any) => fn()) as any;

        const result = await useAuthStore.getState().verifyTopup("topup_123");

        expect(result.success).toBe(true);
        expect(result.amount).toBe(120);
        expect(useAuthStore.getState().verifiedTopupSessions).toContain("topup_123");

        global.setTimeout = originalSetTimeout;
      });

      test("verifyPayment should handle failure and set error state", async () => {
        const { checkoutApi } = await import("@/lib/api");
        (checkoutApi.verifyStripePayment as any).mockResolvedValue({ success: false, error: "Payment failed" });

        const result = await useAuthStore.getState().verifyPayment("bad_session");

        expect(result.success).toBe(false);
        expect(useAuthStore.getState().error).toBe("Payment failed");
        expect(useAuthStore.getState().isVerifyingPayment).toBe(false);
      });
    });

    describe("Error Handling & Resilience", () => {
      test("sync should handle backend failure gracefully if user was already present", async () => {
        const existingUser = {
          id: "1",
          username: "existing",
          balance: 50,
          points: 10,
          discordId: "d1",
          role: "USER",
          totalSpent: 0
        };
        // Reset state and set existing user
        useAuthStore.getState().clearAuth();
        useAuthStore.setState({ user: existingUser as any, isSynced: false });

        (getBackendSession as any).mockRejectedValue(new Error("Network error"));

        // Use force: true to ensure we bypass any global activeSyncPromise from other tests
        await useAuthStore.getState().sync({ user: { name: "existing" } }, 'authenticated', true);

        const state = useAuthStore.getState();
        expect(state.user).toEqual(existingUser as any); // Should keep old data
        expect(state.error).toBeNull(); // Error suppressed if user exists
        expect(state.isSynced).toBe(true);
      });

      test("sync should show error if backend failure occurs and no user is present", async () => {
        useAuthStore.getState().clearAuth();
        useAuthStore.setState({ user: null, isSynced: false });

        (getBackendSession as any).mockRejectedValue(new Error("Database down"));

        // Use force: true
        await useAuthStore.getState().sync({ user: { name: "someone" } }, 'authenticated', true);

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.error).toBe("Database down");
        expect(state.isSynced).toBe(true);
      });
    });

    describe("Profile Sync Logic", () => {
      test("should re-sync with backend if Discord name or avatar changes in NextAuth", async () => {
        const backendUser = {
          id: "1",
          username: "BackendName",
          avatar: "old_avatar",
          discordId: "d1",
          balance: 0,
          points: 0,
          totalSpent: 0,
          role: "USER"
        };
        useAuthStore.setState({ user: backendUser as any, isSynced: true });

        // NextAuth has a different name
        const nextAuthSession = { user: { name: "NewDiscordName", image: "new_avatar" }, accessToken: "at" };

        (getBackendSession as any).mockResolvedValue(backendUser);
        (createBackendSession as any).mockResolvedValue({
          user: {
            id: "1",
            username: "NewDiscordName",
            avatar: "new_avatar",
            discordId: "d1",
            balance: 0,
            points: 0,
            totalSpent: 0,
            role: "USER"
          },
          token: "backend_token"
        });

        await useAuthStore.getState().sync(nextAuthSession, 'authenticated', true);

        expect(createBackendSession).toHaveBeenCalled();
        expect(useAuthStore.getState().user?.username).toBe("NewDiscordName");
      });
    });
  });

  describe("actions", () => {
    test("setUser should update user and set synced", () => {
      const mockUser = { id: "123", username: "manual" };
      useAuthStore.getState().setUser(mockUser as any);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser as any);
      expect(state.isSynced).toBe(true);
    });

    test("clearAuth should reset state including verified sessions", () => {
      useAuthStore.setState({
        user: { id: "1" } as any,
        isSynced: true,
        verifiedSessions: ["s1"],
        verifiedTopupSessions: ["t1"]
      });
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isSynced).toBe(false);
      expect(state.verifiedSessions).toEqual([]);
      expect(state.verifiedTopupSessions).toEqual([]);
    });

    describe("Race Conditions & Security Gaps", () => {
      test("logout during active sync should result in null user", async () => {
        (getBackendSession as any).mockImplementation(() => new Promise(resolve => {
          setTimeout(() => resolve({ id: "1", username: "late_arrival" }), 50);
        }));

        const syncPromise = useAuthStore.getState().sync({ user: { name: "test" } }, 'authenticated');

        // Logout immediately while sync is in flight
        useAuthStore.getState().clearAuth();

        await syncPromise;

        // Even if sync finishes late, the state should be null because clearAuth happened
        // or because sync checks status/token inside its loop.
        // Let's see how our current implementation handles this.
        expect(useAuthStore.getState().user).toBeNull();
      });

      test("multiple rapid forced syncs should execute sequentially and not overlap", async () => {
        let callCount = 0;
        (getBackendSession as any).mockImplementation(() => {
          callCount++;
          return new Promise(resolve => setTimeout(() => resolve({ id: "1", username: `user_${callCount}` }), 30));
        });

        const p1 = useAuthStore.getState().sync({ user: { name: "u" } }, 'authenticated', true);
        const p2 = useAuthStore.getState().sync({ user: { name: "u" } }, 'authenticated', true);

        await Promise.all([p1, p2]);

        // With force=true, p2 should wait for p1, then start its own sync.
        expect(getBackendSession).toHaveBeenCalledTimes(2);
        expect(useAuthStore.getState().user?.username).toBe("user_2");
      });
    });
  });
});
