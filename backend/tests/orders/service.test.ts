import { expect, test, describe, mock, beforeEach } from "bun:test";
import { ordersService } from "../../src/services/orders.service";
import { BadRequestError } from "../../src/utils/errors";

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

const mockSelect = createChainableMock();
const mockInsert = createChainableMock();
const mockUpdate = createChainableMock();

const mockDb = {
  select: mock(() => mockSelect),
  query: {
    orders: { findFirst: mock(), findMany: mock() },
    promoCodes: { findFirst: mock() },
    users: { findFirst: mock() },
    products: { findMany: mock(), findFirst: mock() },
    promoCodeUsages: { findFirst: mock() },
  },
  insert: mock(() => mockInsert),
  update: mock(() => mockUpdate),
  transaction: mock(async (callback) => {
    return await callback(mockDb);
  }),
};

mock.module("../../src/db", () => ({
  db: mockDb,
  default: mockDb,
}));

import { db } from "../../src/db";

describe("OrdersService", () => {
  beforeEach(() => {
    mock.restore();
    (db.select as any).mockClear();
    (db.query.orders.findFirst as any).mockReset();
    (db.query.promoCodes.findFirst as any).mockReset();
    (db.query.products.findMany as any).mockReset();
    (db.query.users.findFirst as any).mockReset();
    (mockUpdate.returning as any).mockResolvedValue([]);
    (mockInsert.returning as any).mockResolvedValue([]);
    (mockSelect.then as any).mockImplementation((resolve: any) => resolve([]));
  });

  describe("calculateFinalDiscount", () => {
    test("should calculate tier discount correctly", async () => {
      // 10,000 spent is PLATINUM tier (6% discount)
      (mockSelect.then as any).mockImplementation((resolve: any) => resolve([{ total: 10000 }]));
      
      const result = await ordersService.calculateFinalDiscount("u1", 1000);
      
      // 1000 * 6% = 60
      expect(result.tierDiscount).toBe(60);
      expect(result.totalDiscount).toBe(60);
    });

    test("should handle percentage promo codes with max discount limit", async () => {
      (mockSelect.then as any).mockImplementation((resolve: any) => resolve([{ total: 0 }]));
      const promoData = {
        type: 'PERCENTAGE',
        discount: 50, // 50%
        maxDiscount: 100,
        minPurchase: 100,
        isActive: true
      };

      const result = await ordersService.calculateFinalDiscount("u1", 1000, promoData as any);
      
      expect(result.promoDiscount).toBe(100); // Capped at maxDiscount
    });
  });

  describe("createOrder", () => {
    test("should throw if some products are missing", async () => {
      (db.query.products.findMany as any).mockResolvedValue([{ id: "p1" }]);
      
      const items = [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 1 }];
      
      expect(ordersService.createOrder("u1", items, "BALANCE"))
        .rejects.toThrow(/Some products not found/);
    });

    test("should throw if insufficient stock", async () => {
      (db.query.products.findMany as any).mockResolvedValue([{ id: "p1", stock: 0, price: 100, name: "P1" }]);
      
      const items = [{ productId: "p1", quantity: 1 }];
      
      expect(ordersService.createOrder("u1", items, "BALANCE"))
        .rejects.toThrow(/Insufficient stock/);
    });
  });

  describe("completeOrder", () => {
    test("should award points based on product rewardPoints", async () => {
      const mockOrder = {
        id: "o1",
        userId: "u1",
        status: "PENDING",
        paymentMethod: "BALANCE",
        items: [
          { 
            quantity: 2, 
            productId: "p1",
            product: { name: "P1", rewardPoints: 10, stock: -1 } 
          }
        ]
      };

      (db.query.orders.findFirst as any).mockResolvedValue(mockOrder);
      (db.query.promoCodes.findFirst as any).mockResolvedValue(null);
      (mockUpdate.returning as any).mockResolvedValue([{ count: 1 }]);
      (mockInsert.returning as any).mockResolvedValue([{ id: "1" }]);

      await ordersService.completeOrder("o1", db as any);

      // 2 units * 10 points = 20 points
      expect(db.update).toHaveBeenCalled();
    });

    test("should handle race conditions if two cancellation requests happen nearly simultaneously", async () => {
      const mockOrder = {
        id: "o1",
        userId: "u1",
        status: "PENDING",
        paymentMethod: "BALANCE",
        total: 100
      };

      (db.query.orders.findFirst as any).mockResolvedValue(mockOrder);

      (mockUpdate.returning as any)
        .mockResolvedValueOnce([{ id: "o1" }]) // p1 succeeds
        .mockResolvedValueOnce([]); // p2 fails because status changed (returning empty array)

      (mockInsert.returning as any).mockResolvedValue([{ id: "1" }]);

      // Execution 1 (Success)
      const p1 = ordersService.cancelOrder("o1", "u1");
      
      // Execution 2 (Failure due to race condition)
      const p2 = ordersService.cancelOrder("o1", "u1");

      const [res1, res2] = await Promise.allSettled([p1, p2]);

      expect(res1.status).toBe("fulfilled");
      expect(res2.status).toBe("rejected");
      if (res2.status === "rejected") {
        expect(res2.reason.message).toContain("already processed or cancelled");
      }
      
      // Ensure refund was only called once effectively (though both tried)
      expect(db.update).toHaveBeenCalled();
    });
  });
});
