import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";
import { UnauthorizedError } from "../../src/utils/errors";

// 1. Create a robust chainable mock factory
const createChainableMock = () => {
  const chain: any = mock(() => chain);
  chain.set = mock(() => chain);
  chain.where = mock(() => chain);
  chain.returning = mock(() => Promise.resolve([]));
  chain.values = mock(() => chain);
  chain.onConflictDoUpdate = mock(() => chain);
  chain.onConflictDoNothing = mock(() => chain);
  chain.then = mock((resolve) => resolve([]));
  return chain;
};

const mockInsert = createChainableMock();
const mockUpdate = createChainableMock();
const mockDelete = createChainableMock();

const mockDb = {
  query: {
    users: { findFirst: mock() },
    refreshTokens: { findFirst: mock() },
    blacklistedTokens: { findFirst: mock() },
  },
  insert: mock(() => mockInsert),
  update: mock(() => mockUpdate),
  delete: mock(() => mockDelete),
  transaction: mock(async (callback) => {
    const tx = {
      query: mockDb.query,
      insert: mock(() => mockInsert),
      update: mock(() => mockUpdate),
      delete: mock(() => mockDelete),
    };
    return await callback(tx);
  }),
};

mock.module("../../src/db", () => ({
  db: mockDb,
  default: mockDb,
}));

// 2. Import the real service and the mocked db
import { db } from "../../src/db";
import { authService } from "../../src/services/auth.service";

// Mock fetch for Discord API
const originalFetch = global.fetch;

describe("AuthService", () => {
  beforeEach(() => {
    // Reset mocks
    mock.restore();
    
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: async () => ({})
    })) as any;

    (db.query.users.findFirst as any).mockReset();
    (db.query.refreshTokens.findFirst as any).mockReset();
    (db.query.blacklistedTokens.findFirst as any).mockReset();
    (mockInsert.returning as any).mockResolvedValue([{ id: "1" }]);
    (mockUpdate.returning as any).mockResolvedValue([{ id: "1" }]);
    (mockDelete.returning as any).mockResolvedValue([{ id: "1" }]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("syncUser", () => {
    test("should create a new user and return tokens when user doesn't exist", async () => {
      const mockDiscordData = {
        id: "12345",
        username: "testuser",
        email: "test@example.com",
        avatar: "avatar_hash",
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockDiscordData,
      });

      (db.query.users.findFirst as any).mockResolvedValue(null);
      (mockInsert.returning as any).mockResolvedValue([{
        id: "user_uuid",
        discordId: mockDiscordData.id,
        username: mockDiscordData.username,
        email: mockDiscordData.email,
        avatar: "https://cdn.discordapp.com/avatars/12345/avatar_hash.png",
        role: "USER",
        points: 0,
      }]);

      const result = await authService.syncUser("valid_discord_token");

      expect(result.user.username).toBe("testuser");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    test("should update existing user and return tokens", async () => {
      const mockDiscordData = {
        id: "12345",
        username: "updated_name",
        email: "test@example.com",
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockDiscordData,
      });

      (db.query.users.findFirst as any).mockResolvedValue({
        id: "existing_id",
        discordId: "12345",
        username: "old_name",
        role: "USER",
        points: 100,
      });

      (mockInsert.returning as any).mockResolvedValue([{
        id: "existing_id",
        discordId: "12345",
        username: "updated_name",
        role: "USER",
        points: 100,
      }]);

      const result = await authService.syncUser("valid_token");

      expect(result.user.username).toBe("updated_name");
    });

    test("should throw UnauthorizedError when Discord API fails", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
      });

      try {
        await authService.syncUser("invalid_token");
        expect(false).toBe(true); // Should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(UnauthorizedError);
      }
    });
  });

  describe("refreshToken", () => {
    test("should rotate tokens when valid refresh token is provided", async () => {
      const mockPayload = { id: "user_id", username: "test" };
      const token = jwt.sign(mockPayload, env.JWT_REFRESH_SECRET);
      
      const mockUser = {
        id: "user_id",
        discordId: "d123",
        username: "test",
        role: "USER",
        points: 0
      };

      (db.query.refreshTokens.findFirst as any).mockResolvedValue({
        token,
        userId: "user_id",
        expiresAt: new Date(Date.now() + 10000),
        user: mockUser
      });

      const result = await authService.refreshToken(token);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    test("should throw UnauthorizedError and delete token if refresh token is expired", async () => {
      const mockPayload = { id: "user_id", username: "test" };
      const token = jwt.sign(mockPayload, env.JWT_REFRESH_SECRET);
      
      (db.query.refreshTokens.findFirst as any).mockResolvedValue({
        token,
        userId: "user_id",
        expiresAt: new Date(Date.now() - 10000), // Expired
        user: { id: "user_id" }
      });

      try {
        await authService.refreshToken(token);
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e).toBeInstanceOf(UnauthorizedError);
        expect(e.message).toBe("Refresh token expired");
      }
    });

    test("should handle race conditions if two refresh requests happen nearly simultaneously", async () => {
      const mockPayload = { id: "user_id", username: "test" };
      const token = jwt.sign(mockPayload, env.JWT_REFRESH_SECRET);
      
      const mockUser = { id: "user_id", discordId: "d1", username: "test", role: "USER", points: 0 };

      // 1. First request finds the token
      (db.query.refreshTokens.findFirst as any).mockResolvedValueOnce({
        token,
        userId: "user_id",
        expiresAt: new Date(Date.now() + 10000),
        user: mockUser
      });

      // 2. Second request happens after first request deleted it but before it finished
      (db.query.refreshTokens.findFirst as any).mockResolvedValueOnce(null);

      // Request 1
      const result1 = await authService.refreshToken(token);
      expect(result1.accessToken).toBeDefined();

      // Request 2 (simulated reuse detection)
      try {
        await authService.refreshToken(token);
        expect(true).toBe(false);
      } catch (e: any) {
        expect(e).toBeInstanceOf(UnauthorizedError);
        expect(e.message).toContain("Security breach detected");
      }
    });
  });

  describe("token functions", () => {
    test("generateTokenPair should create access and refresh tokens", async () => {
      const user = {
        id: "uid",
        discordId: "did",
        username: "uname",
        role: "USER",
        points: 10
      };

      const result = await authService.generateTokenPair(user);
      
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      
      const decoded = jwt.verify(result.accessToken, env.JWT_SECRET) as any;
      expect(decoded.id).toBe(user.id);
    });

    test("verifyToken should return payload for valid token", () => {
      const payload = { id: "123", username: "test", role: "USER", points: 0, discordId: "d123" };
      const token = jwt.sign(payload, env.JWT_SECRET);
      
      const result = authService.verifyToken(token);
      expect(result.id).toBe("123");
    });

    test("verifyToken should throw for invalid token", () => {
      const token = jwt.sign({ id: "123" }, "wrong_secret");
      try {
        authService.verifyToken(token);
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(UnauthorizedError);
      }
    });
  });

  describe("Blacklist logic", () => {
    test("isTokenBlacklisted should return true for blacklisted tokens", async () => {
      (db.query.blacklistedTokens.findFirst as any).mockResolvedValue({ token: "blacklisted" });
      const result = await authService.isTokenBlacklisted("blacklisted");
      expect(result).toBe(true);
    });

    test("blacklistToken should store token with expiry", async () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const token = jwt.sign({ exp }, env.JWT_SECRET);
      
      await authService.blacklistToken(token);
      
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
