import { expect, test, describe, mock, spyOn, beforeEach, afterEach } from "bun:test";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";
import { UnauthorizedError } from "../../src/utils/errors";

// 1. Mock Drizzle BEFORE ANY IMPORTS
const createChainableMock = () => {
  const chain: any = mock(() => chain);
  chain.returning = mock(() => Promise.resolve([]));
  chain.values = mock(() => chain);
  return chain;
};

const mockInsert = createChainableMock();

const mockDb = {
  query: {
    users: { findFirst: mock() },
    blacklistedTokens: { findFirst: mock() },
  },
  insert: mock(() => mockInsert),
};

mock.module("../../src/db", () => ({
  db: mockDb,
  default: mockDb,
}));

// 2. Now import dependencies
import { authMiddleware, adminMiddleware } from "../../src/middleware/auth.middleware";
import { authService } from "../../src/services/auth.service";
import { db } from "../../src/db";

// 3. Spy on authService methods to prevent pollution
spyOn(authService, "isTokenBlacklisted");
spyOn(authService, "verifyToken");
spyOn(authService, "blacklistToken");
spyOn(authService, "revokeRefreshTokens");

describe("Security Tests (Anti-Hacking)", () => {
  let mockContext: any;
  let mockNext: any;

  beforeEach(() => {
    mockContext = {
      req: {
        header: mock(() => null),
      },
      set: mock(),
      get: mock(),
    };
    mockNext = mock(() => Promise.resolve());
    
    spyOn(authService, "isTokenBlacklisted");
    spyOn(jwt, "verify");
    
    (db.query.users.findFirst as any).mockReset();
    (mockInsert.returning as any).mockReset();
    (jwt.verify as any).mockReset();
  });

  afterEach(() => {
    mock.restore();
  });

  describe("Token Forgery & Manipulation", () => {
    test("should reject token signed with wrong secret", async () => {
      const forgedToken = "some.forged.token";
      mockContext.req.header = mock(() => `Bearer ${forgedToken}`);
      
      (jwt.verify as any).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid signature");
      });

      expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject expired tokens", async () => {
      const expiredToken = "some.expired.token";
      mockContext.req.header = mock(() => `Bearer ${expiredToken}`);
      
      (jwt.verify as any).mockImplementation(() => {
        throw new jwt.TokenExpiredError("jwt expired", new Date());
      });

      expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
    });

    test("should prevent algorithm switching attack (e.g. none algorithm)", async () => {
      const noneToken = "some.none.token";
      mockContext.req.header = mock(() => `Bearer ${noneToken}`);
      
      (jwt.verify as any).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid algorithm");
      });

      expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("Privilege Escalation", () => {
    test("should reject USER attempting to access ADMIN routes even if they put 'ADMIN' in forged token", async () => {
      const forgedPayload = { id: "user_1", role: "ADMIN" };
      const token = "some.token";
      
      mockContext.req.header = mock(() => `Bearer ${token}`);
      (jwt.verify as any).mockReturnValue(forgedPayload);
      (authService.isTokenBlacklisted as any).mockResolvedValue(false);
      
      // The crucial part: The middleware must fetch the REAL role from database
      (db.query.users.findFirst as any).mockResolvedValue({ 
        id: "user_1", 
        role: "USER", // Real role in DB is USER
        isBanned: false 
      });

      // 1. First pass through authMiddleware to set user from DB
      await authMiddleware(mockContext, mockNext);
      
      // Update context mock to return the user set by authMiddleware
      const setCall = (mockContext.set as any).mock.calls.find((call: any) => call[0] === 'user');
      const userInContext = setCall[1];
      mockContext.get = mock(() => userInContext);

      // 2. Then pass through adminMiddleware
      expect(adminMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
      expect(db.insert).toHaveBeenCalled(); // Should log unauthorized attempt
    });
  });

  describe("Banned & Blacklisted Users", () => {
    test("should immediately reject blacklisted tokens (session hijacking prevention)", async () => {
      const token = "blacklisted.token";
      mockContext.req.header = mock(() => `Bearer ${token}`);
      
      (authService.isTokenBlacklisted as any).mockResolvedValue(true);
      (db.insert as any).mockReturnValue({ values: () => ({ returning: () => Promise.resolve([{ id: "1" }]) }) });

      expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
      expect(db.insert).toHaveBeenCalled();
    });

    test("should reject banned users even with a valid token", async () => {
      const token = "valid.token";
      mockContext.req.header = mock(() => `Bearer ${token}`);
      (jwt.verify as any).mockReturnValue({ id: "user_1" });
      
      (authService.isTokenBlacklisted as any).mockResolvedValue(false);
      (db.query.users.findFirst as any).mockResolvedValue({ 
        id: "user_1", 
        role: "USER", 
        isBanned: true // User is banned
      });

      expect(authMiddleware(mockContext, mockNext)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("Injection & Malformed Inputs", () => {
    test("should handle malformed Authorization header", async () => {
      const maliciousHeaders = [
        "Bearer ' OR 1=1 --",
        "Bearer {\"$gt\": \"\"}",
        "Bearer <script>alert(1)</script>",
        "Basic invalid-format"
      ];

      for (const header of maliciousHeaders) {
        mockContext.req.header = mock(() => header);
        (jwt.verify as any).mockImplementation(() => {
          throw new Error("Invalid token format");
        });

        expect(authMiddleware(mockContext, mockNext)).rejects.toThrow();
      }
    });
  });
});
