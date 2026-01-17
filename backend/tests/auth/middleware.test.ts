import { expect, test, describe, mock, spyOn, beforeEach, afterEach } from "bun:test";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";
import { UnauthorizedError } from "../../src/utils/errors";

// 1. Mock Drizzle BEFORE ANY IMPORTS
mock.module("../../src/db", () => ({
  db: {
    query: {
      users: { findFirst: mock() },
    },
    insert: mock(() => ({
      values: mock(() => ({
        returning: mock().mockResolvedValue([{ id: "1" }]),
      })),
    })),
  },
}));

// 2. Now import dependencies
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from "../../src/middleware/auth.middleware";
import { authService } from "../../src/services/auth.service";
import { db } from "../../src/db";

describe("AuthMiddleware", () => {
  let mockContext: any;
  let mockNext: any;

  beforeEach(() => {
    mockContext = {
      req: {
        header: mock((name: string) => {
          if (name === 'Authorization') return 'Bearer valid_token';
          return null;
        }),
      },
      set: mock(),
      get: mock(),
    };
    mockNext = mock(() => Promise.resolve());
    
    spyOn(authService, "isTokenBlacklisted");
    spyOn(authService, "verifyToken");
    spyOn(authService, "blacklistToken");
    spyOn(authService, "revokeRefreshTokens");
    
    (db.query.users.findFirst as any).mockReset();
    (db.insert(null as any).values(null as any).returning as any).mockReset();
  });

  afterEach(() => {
    mock.restore();
  });

  describe("authMiddleware", () => {
    test("should pass and set user in context for valid token", async () => {
      const userPayload = { id: "user_123", role: "USER" };
      const token = jwt.sign(userPayload, env.JWT_SECRET);
      
      mockContext.req.header = mock(() => `Bearer ${token}`);
      (authService.isTokenBlacklisted as any).mockResolvedValue(false);
      (db.query.users.findFirst as any).mockResolvedValue({ ...userPayload, isBanned: false });

      await authMiddleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('user', expect.objectContaining({ id: "user_123" }));
      expect(mockNext).toHaveBeenCalled();
    });

    test("should throw UnauthorizedError if no token provided", async () => {
      mockContext.req.header = mock(() => null);

      expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
    });

    test("should throw UnauthorizedError if token is blacklisted", async () => {
      (authService.isTokenBlacklisted as any).mockResolvedValue(true);
      (db.insert(null as any).values(null as any).returning as any).mockResolvedValue([{ id: "1" }]);

      expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
    });

    test("should throw UnauthorizedError if user is banned", async () => {
      const userPayload = { id: "user_123", role: "USER" };
      const token = jwt.sign(userPayload, env.JWT_SECRET);
      
      mockContext.req.header = mock(() => `Bearer ${token}`);
      (authService.isTokenBlacklisted as any).mockResolvedValue(false);
      (db.query.users.findFirst as any).mockResolvedValue({ ...userPayload, isBanned: true });

      expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("adminMiddleware", () => {
    test("should pass for ADMIN role", async () => {
      mockContext.get = mock(() => ({ id: "admin_1", role: "ADMIN", discordId: "123" }));
      
      await adminMiddleware(mockContext, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test("should pass for MODERATOR role", async () => {
      mockContext.get = mock(() => ({ id: "mod_1", role: "MODERATOR", discordId: "456" }));
      
      await adminMiddleware(mockContext, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test("should pass if discordId is in whitelist", async () => {
      // Assuming env.ADMIN_DISCORD_IDS contains "whitelist_id"
      const originalWhitelist = env.ADMIN_DISCORD_IDS;
      (env as any).ADMIN_DISCORD_IDS = ["whitelist_id"];
      
      mockContext.get = mock(() => ({ id: "user_1", role: "USER", discordId: "whitelist_id" }));
      
      await adminMiddleware(mockContext, mockNext);
      expect(mockNext).toHaveBeenCalled();
      
      (env as any).ADMIN_DISCORD_IDS = originalWhitelist;
    });

    test("should throw UnauthorizedError for normal USER", async () => {
      mockContext.get = mock(() => ({ id: "user_1", role: "USER", discordId: "not_whitelisted" }));
      
      expect(adminMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("optionalAuthMiddleware", () => {
    test("should set user if valid token provided", async () => {
      const userPayload = { id: "user_123", role: "USER" };
      const token = jwt.sign(userPayload, env.JWT_SECRET);
      
      mockContext.req.header = mock(() => `Bearer ${token}`);
      (authService.isTokenBlacklisted as any).mockResolvedValue(false);
      (db.query.users.findFirst as any).mockResolvedValue({ ...userPayload, isBanned: false });

      await optionalAuthMiddleware(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    test("should continue as guest if no token provided", async () => {
      mockContext.req.header = mock(() => null);

      await optionalAuthMiddleware(mockContext, mockNext);

      expect(mockContext.set).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
