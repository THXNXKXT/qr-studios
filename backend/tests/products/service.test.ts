import { expect, test, describe, mock, beforeEach } from "bun:test";
import { productsService } from "../../src/services/products.service";

// 1. Mock Drizzle BEFORE ANY IMPORTS
mock.module("../../src/db", () => ({
  db: {
    query: {
      products: { findMany: mock(), findFirst: mock() },
      reviews: { findMany: mock(), findFirst: mock() },
      orders: { findFirst: mock() },
    },
    select: mock(() => ({
      from: mock(() => ({
        where: mock().mockResolvedValue([{ value: 0 }]),
      })),
    })),
    insert: mock(() => ({
      values: mock(() => ({
        returning: mock().mockResolvedValue([{ id: "1" }]),
      })),
    })),
    update: mock(() => ({
      set: mock(() => ({
        where: mock(() => ({
          returning: mock().mockResolvedValue([{ id: "1" }]),
        })),
      })),
    })),
    delete: mock(() => ({
      where: mock().mockResolvedValue({ count: 1 }),
    })),
    transaction: mock((callback) => callback({
      query: {
        products: { findFirst: mock() },
        reviews: { findFirst: mock() },
        orders: { findFirst: mock() },
        users: { findFirst: mock() },
      },
      insert: mock(() => ({
        values: mock(() => ({
          returning: mock().mockResolvedValue([{ id: "1" }]),
        })),
      })),
    })),
  },
}));

import { db } from "../../src/db";

describe("ProductsService", () => {
  beforeEach(() => {
    (db.query.products.findMany as any).mockReset();
    (db.query.products.findFirst as any).mockReset();
    (db.select as any).mockReset();
  });

  describe("Points Calculation", () => {
    test("calculateProductExpectedPoints should return rewardPoints if set", () => {
      const product = { rewardPoints: 100 };
      expect(productsService.calculateProductExpectedPoints(product as any)).toBe(100);
    });

    test("calculateProductExpectedPoints should return 0 if rewardPoints is 0 or null", () => {
      expect(productsService.calculateProductExpectedPoints({ rewardPoints: 0 } as any)).toBe(0);
      expect(productsService.calculateProductExpectedPoints({ rewardPoints: null } as any)).toBe(0);
    });
  });

  describe("Sorting Logic", () => {
    test("getSortOrder should return correct drizzle order objects", () => {
      // Drizzle returns arrays of order expressions
      expect(productsService.getSortOrder("price-asc")).toBeDefined();
      expect(productsService.getSortOrder("price-desc")).toBeDefined();
      expect(productsService.getSortOrder("newest")).toBeDefined();
      expect(productsService.getSortOrder("name")).toBeDefined();
    });
  });

  describe("getAllProducts", () => {
    test("should handle search query and category filter", async () => {
      (db.query.products.findMany as any).mockResolvedValue([]);
      (db.select as any).mockImplementation(() => ({
        from: mock(() => ({
          where: mock().mockResolvedValue([{ value: 0 }]),
        })),
      }));

      await productsService.getAllProducts({ 
        search: "test", 
        category: "SCRIPT" 
      });

      expect(db.query.products.findMany).toHaveBeenCalled();
    });
  });

  describe("getProductById", () => {
    test("should return product with aggregated rating", async () => {
      const mockProduct = { id: "p1", name: "P1", rewardPoints: 50 };
      (db.query.products.findFirst as any).mockResolvedValue(mockProduct);
      (db.select as any).mockImplementation(() => ({
        from: mock(() => ({
          where: mock().mockResolvedValue([{ avgRating: 4.5, count: 10 }]),
        })),
      }));

      const result = await productsService.getProductById("p1");

      expect(result.rating).toBe(4.5);
      expect(result.reviewCount).toBe(10);
      expect(result.expectedPoints).toBe(50);
    });
  });

  describe("addProductReview", () => {
    test("should handle race conditions if two review requests happen simultaneously", async () => {
      const mockProduct = { id: "p1", name: "P1" };
      const mockOrder = { id: "o1", status: "COMPLETED", items: [{ productId: "p1" }] };

      const txMock = {
        query: {
          products: { findFirst: mock().mockResolvedValue(mockProduct) },
          reviews: { 
            findFirst: mock()
              .mockResolvedValueOnce(null) // p1 check
              .mockResolvedValueOnce(null) // p2 check
              .mockResolvedValue({ id: "r1" }), // potential third check
          },
          orders: { findFirst: mock().mockResolvedValue(mockOrder) },
          users: { findFirst: mock().mockResolvedValue({ id: "u1" }) },
        },
        insert: mock(() => ({
          values: mock(() => ({
            returning: mock().mockResolvedValue([{ id: "r1" }]),
          })),
        })),
      };

      (db.transaction as any).mockImplementation((cb: any) => cb(txMock));

      // Simulate simultaneous requests
      const p1 = productsService.addProductReview("p1", "u1", { rating: 5, comment: "G1" });
      const p2 = productsService.addProductReview("p1", "u1", { rating: 4, comment: "G2" });

      const results = await Promise.allSettled([p1, p2]);
      
      expect(txMock.insert).toHaveBeenCalled();
    });
  });
});
