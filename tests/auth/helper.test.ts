import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";

// Mock global document and localStorage BEFORE imports
const mockStorage: Record<string, string> = {};
let cookieStore = "";

// @ts-ignore
global.window = {
  location: { href: "" }
} as any;

// @ts-ignore
global.document = {
  get cookie() {
    return cookieStore;
  },
  set cookie(val: string) {
    const [pair] = val.split(";");
    const [k, v] = pair.split("=");
    if (v === "" || val.includes("Expires=Thu, 01 Jan 1970")) {
      const name = k.trim();
      const cookies = cookieStore.split(";").filter(c => !c.trim().startsWith(name + "="));
      cookieStore = cookies.join("; ");
    } else {
      const cookieName = k.trim();
      const cookieValue = v.trim();
      // Simple cookie store implementation
      const cookies = cookieStore.split(";").filter(c => c.trim() && !c.trim().startsWith(cookieName + "="));
      cookies.push(`${cookieName}=${cookieValue}`);
      cookieStore = cookies.join("; ");
    }
  }
} as any;

// @ts-ignore
global.localStorage = {
  getItem: mock((key: string) => mockStorage[key] || null),
  setItem: mock((key: string, val: string) => { mockStorage[key] = val; }),
  removeItem: mock((key: string) => { delete mockStorage[key]; }),
} as any;

// Mock fetch
const originalFetch = global.fetch;
global.fetch = mock() as any;

import { 
  createBackendSession, 
  getBackendSession, 
  isAuthenticated, 
  getAuthToken, 
  clearBackendSession 
} from "../../src/lib/auth-helper";

describe("AuthHelper", () => {
  beforeEach(() => {
    // Clear mocks and stores
    for (const key in mockStorage) delete mockStorage[key];
    cookieStore = "";
    (global.fetch as any).mockClear();
    (global.localStorage.getItem as any).mockClear();
    (global.localStorage.setItem as any).mockClear();
    (global.localStorage.removeItem as any).mockClear();
  });

  afterEach(() => {
    // No cleanup needed for globals since they are set at top level
  });

  describe("createBackendSession", () => {
    test("should store token and return user data on success", async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: "jwt_token",
          user: { id: "123", username: "test" }
        }
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createBackendSession({ accessToken: "discord_token" });

      expect(result.token).toBe("jwt_token");
      expect(mockStorage["auth_token"]).toBe("jwt_token");
      expect(cookieStore).toContain("auth_token=jwt_token");
    });

    test("should throw error on failed request", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" })
      });

      expect(createBackendSession({ accessToken: "bad" })).rejects.toThrow();
    });
  });

  describe("getBackendSession", () => {
    test("should return null if no token exists", async () => {
      const result = await getBackendSession();
      expect(result).toBeNull();
    });

    test("should return user and sync storage if token exists in one", async () => {
      cookieStore = "auth_token=some_token";
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { id: "123" } }
        }),
      });

      const result = await getBackendSession();
      
      expect(result?.id).toBe("123");
      expect(mockStorage["auth_token"]).toBe("some_token");
    });

    test("should handle multiple cookies and extract correct auth_token", async () => {
      cookieStore = "other_cookie=val; auth_token=jwt_123; another=xyz";
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { id: "123" } }
        }),
      });

      await getBackendSession();
      expect(mockStorage["auth_token"]).toBe("jwt_123");
    });

    describe("Token Precedence & Sync", () => {
      test("should prefer cookie over localStorage and sync them", async () => {
        cookieStore = "auth_token=cookie_token";
        mockStorage["auth_token"] = "storage_token";

        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: { user: { id: "123" } } }),
        });

        const result = await getBackendSession();
        
        expect(mockStorage["auth_token"]).toBe("cookie_token"); // Sync storage to cookie
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/auth/session"),
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: "Bearer cookie_token" })
          })
        );
      });

      test("should use localStorage if cookie is missing and sync it", async () => {
        cookieStore = "";
        mockStorage["auth_token"] = "storage_only_token";

        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: { user: { id: "123" } } }),
        });

        await getBackendSession();
        
        expect(cookieStore).toContain("auth_token=storage_only_token");
      });
    });

    test("should NOT clear session on 500 Internal Server Error (resilience)", async () => {
      mockStorage["auth_token"] = "valid_token";
      
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await getBackendSession();
      
      expect(result).toBeNull();
      expect(mockStorage["auth_token"]).toBe("valid_token"); // Should still be there
    });

    test("should clear session on 401", async () => {
      mockStorage["auth_token"] = "expired_token";
      
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await getBackendSession();
      
      expect(result).toBeNull();
      expect(mockStorage["auth_token"]).toBeUndefined();
    });
  });

  describe("Utilities", () => {
    test("isAuthenticated should work correctly", () => {
      expect(isAuthenticated()).toBe(false);
      cookieStore = "auth_token=token";
      expect(isAuthenticated()).toBe(true);
    });

    test("clearBackendSession should remove tokens", () => {
      mockStorage["auth_token"] = "token";
      cookieStore = "auth_token=token";
      
      clearBackendSession();
      
      expect(mockStorage["auth_token"]).toBeUndefined();
      expect(cookieStore).not.toContain("auth_token=token");
    });
  });
});
