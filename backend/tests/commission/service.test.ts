import { expect, test, describe, mock, beforeEach } from "bun:test";
import { commissionService } from "../../src/services/commission.service";
import { NotFoundError, BadRequestError, UnauthorizedError } from "../../src/utils/errors";

// 1. Create a robust chainable mock factory
const createChainableMock = () => {
  const chain: any = mock(() => chain);
  chain.set = mock(() => chain);
  chain.where = mock(() => chain);
  chain.returning = mock(() => Promise.resolve([]));
  chain.then = mock((resolve) => resolve([]));
  return chain;
};

const mockDelete = createChainableMock();

const mockDb = {
  query: {
    commissions: { findFirst: mock() },
  },
  delete: mock(() => mockDelete),
};

mock.module("../../src/db", () => ({
  db: mockDb,
  default: mockDb,
}));

import { db } from "../../src/db";

describe("CommissionService", () => {
  beforeEach(() => {
    mock.restore();
    (db.query.commissions.findFirst as any).mockReset();
    (mockDelete.returning as any).mockResolvedValue([]);
  });

  describe("deleteCommission", () => {
    test("should handle race conditions if two delete requests happen simultaneously", async () => {
      const mockCommission = {
        id: "c1",
        userId: "u1",
        status: "PENDING"
      };

      (mockDelete.returning as any)
        .mockResolvedValueOnce([{ id: "c1" }]) // p1 succeeds
        .mockResolvedValueOnce([]); // p2 fails
      (db.query.commissions.findFirst as any).mockResolvedValue(mockCommission);

      const p1 = commissionService.deleteCommission("c1", "u1");
      const p2 = commissionService.deleteCommission("c1", "u1");

      const [res1, res2] = await Promise.allSettled([p1, p2]);

      expect(res1.status).toBe("fulfilled");
      expect(res2.status).toBe("rejected");
      
      if (res2.status === "rejected") {
        expect(res2.reason).toBeInstanceOf(BadRequestError);
        expect(res2.reason.message).toContain("only delete pending commissions");
      }

      expect(db.delete).toHaveBeenCalledTimes(2);
    });

    test("should throw UnauthorizedError if user doesn't own the commission", async () => {
      (mockDelete.returning as any).mockResolvedValue([]);
      (db.query.commissions.findFirst as any).mockResolvedValue({ id: "c1", userId: "other_user" });

      expect(commissionService.deleteCommission("c1", "u1")).rejects.toThrow(UnauthorizedError);
    });
  });
});
