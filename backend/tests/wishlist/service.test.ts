import { expect, test, describe, mock, beforeEach } from "bun:test";
import { wishlistService } from "../../src/services/wishlist.service";
import { NotFoundError, BadRequestError } from "../../src/utils/errors";

// 1. Mock Drizzle BEFORE ANY IMPORTS
const mockInsert = {
  values: mock(() => mockInsert),
  returning: mock(),
};

const mockDelete = {
  where: mock(() => mockDelete),
  returning: mock(),
};

mock.module("../../src/db", () => ({
  db: {
    query: {
      products: { findFirst: mock() },
      wishlists: { findMany: mock(), findFirst: mock() },
    },
    insert: mock(() => mockInsert),
    delete: mock(() => mockDelete),
  },
}));

import { db } from "../../src/db";

describe("WishlistService", () => {
  beforeEach(() => {
    mock.restore();
  });

  describe("addToWishlist", () => {
    test("should add product to wishlist successfully", async () => {
      (db.query.products.findFirst as any).mockResolvedValue({ id: "p1" });
      (mockInsert.returning as any).mockResolvedValue([{ id: "w1", productId: "p1" }]);
      (db.query.wishlists.findFirst as any).mockResolvedValue({ id: "w1", productId: "p1" });

      const result = await wishlistService.addToWishlist("u1", "p1");
      expect(result!.id).toBe("w1");
      expect(db.insert).toHaveBeenCalled();
    });

    test("should throw BadRequestError on unique constraint failure (race condition)", async () => {
      (db.query.products.findFirst as any).mockResolvedValue({ id: "p1" });
      const error: any = new Error("Unique constraint");
      error.code = '23505'; // PostgreSQL unique violation
      (mockInsert.returning as any).mockRejectedValue(error);

      expect(wishlistService.addToWishlist("u1", "p1")).rejects.toThrow(BadRequestError);
    });
  });

  describe("removeFromWishlist", () => {
    test("should remove item using where for atomicity", async () => {
      (mockDelete.returning as any).mockResolvedValue([{ id: "w1" }]);

      const result = await wishlistService.removeFromWishlist("u1", "p1");
      expect(result.success).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    test("should throw NotFoundError if nothing was deleted", async () => {
      (mockDelete.returning as any).mockResolvedValue([]);

      expect(wishlistService.removeFromWishlist("u1", "p1")).rejects.toThrow(NotFoundError);
    });
  });
});
