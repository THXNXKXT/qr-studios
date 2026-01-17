import { expect, test, describe, mock, beforeEach } from "bun:test";
import { usersService } from "../../src/services/users.service";
import { NotFoundError, BadRequestError } from "../../src/utils/errors";

// 1. Create a robust chainable mock factory
const createChainableMock = () => {
  const chain: any = mock(() => chain);
  chain.set = mock(() => chain);
  chain.where = mock(() => chain);
  chain.limit = mock(() => chain);
  chain.offset = mock(() => chain);
  chain.orderBy = mock(() => chain);
  chain.from = mock(() => chain);
  chain.returning = mock(() => Promise.resolve([]));
  chain.onConflictDoUpdate = mock(() => chain);
  chain.values = mock(() => chain);
  chain.then = mock((resolve) => resolve([]));
  return chain;
};

const mockUpdate = createChainableMock();
const mockSelect = createChainableMock();
const mockInsert = createChainableMock();
const mockDelete = createChainableMock();

const mockDb = {
  query: {
    users: { findFirst: mock() },
    orders: { findMany: mock() },
    licenses: { findMany: mock() },
    notifications: { findMany: mock() },
    transactions: { findMany: mock() },
  },
  select: mock(() => mockSelect),
  update: mock(() => mockUpdate),
  insert: mock(() => mockInsert),
  delete: mock(() => mockDelete),
  transaction: mock(async (callback) => {
    const tx = {
      query: mockDb.query,
      select: mock(() => mockSelect),
      update: mock(() => mockUpdate),
      insert: mock(() => mockInsert),
      delete: mock(() => mockDelete),
    };
    return await callback(tx);
  }),
};

// 2. Mock the DB module
mock.module("../../src/db", () => ({
  db: mockDb,
  default: mockDb,
}));

import { db } from "../../src/db";

describe("UsersService", () => {
  beforeEach(() => {
    mock.restore();
    // Reset all specific query mocks
    (db.query.users.findFirst as any).mockReset();
    (db.query.orders.findMany as any).mockReset();
    (db.query.licenses.findMany as any).mockReset();
    (db.query.notifications.findMany as any).mockReset();
    
    // Reset chainable mocks
    (mockUpdate.returning as any).mockResolvedValue([]);
    (mockSelect.then as any).mockImplementation((resolve: any) => resolve([]));
    (mockInsert.returning as any).mockResolvedValue([]);
    (mockDelete.returning as any).mockResolvedValue({ count: 1 });
  });

  describe("getUserProfile", () => {
    test("should return user profile with total spent", async () => {
      const mockUser = { id: "u1", username: "test", balance: 100 };
      (db.query.users.findFirst as any).mockResolvedValue(mockUser);
      (mockSelect.then as any).mockImplementation((resolve: any) => resolve([{ total: 500 }]));

      const result = await usersService.getUserProfile("u1");

      expect(result.id).toBe("u1");
      expect(result.totalSpent).toBe(500);
      expect(db.query.users.findFirst).toHaveBeenCalled();
    });

    test("should throw NotFoundError if user doesn't exist", async () => {
      (db.query.users.findFirst as any).mockResolvedValue(null);
      expect(usersService.getUserProfile("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateUserProfile", () => {
    test("should update user avatar successfully", async () => {
      const updateData = { avatar: "https://new-avatar.png" };
      (mockUpdate.returning as any).mockResolvedValue([{ id: "u1", ...updateData }]);

      const result = await usersService.updateUserProfile("u1", updateData);

      expect(result.avatar).toBe("https://new-avatar.png");
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("updateUserBalance", () => {
    test("should add to balance correctly using atomic increment", async () => {
      (mockUpdate.returning as any).mockResolvedValue([{ balance: 150 }]);

      const result = await usersService.updateUserBalance("u1", 50, "add");

      expect(result!.balance).toBe(150);
      expect(db.update).toHaveBeenCalled();
    });

    test("should subtract from balance correctly using atomic decrement and check", async () => {
      (db.query.users.findFirst as any).mockResolvedValue({ balance: 40 });
      (mockUpdate.returning as any).mockResolvedValue([{ balance: 40 }]);

      const result = await usersService.updateUserBalance("u1", 60, "subtract");

      expect(result!.balance).toBe(40);
      expect(db.update).toHaveBeenCalled();
    });

    test("should throw BadRequestError if atomic decrement fails (insufficient balance)", async () => {
      (db.query.users.findFirst as any).mockResolvedValue({ id: "u1", balance: 30 });
      (mockUpdate.returning as any).mockResolvedValue([]);
      
      expect(usersService.updateUserBalance("u1", 50, "subtract"))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe("getUserDashboardStats", () => {
    test("should aggregate stats correctly from multiple models", async () => {
      let callCount = 0;
      (mockSelect.then as any).mockImplementation((resolve: any) => {
        callCount++;
        if (callCount === 1) return resolve([{ value: 5 }]); // orders count
        if (callCount === 2) return resolve([{ value: 2 }]); // licenses count
        if (callCount === 3) return resolve([{ value: 3 }]); // notifications count
        if (callCount === 4) return resolve([{ value: 1200 }]); // total spent
        return resolve([{ value: 0 }]);
      });

      const result = await usersService.getUserDashboardStats("u1");

      expect(result.stats).toEqual({
        orders: 5,
        licenses: 2,
        unreadNotifications: 3,
        totalSpent: 1200,
      });
    });
  });
});
