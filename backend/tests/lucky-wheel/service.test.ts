import { expect, test, describe, mock, beforeEach } from "bun:test";
import { luckyWheelService } from "../../src/services/lucky-wheel.service";
import { BadRequestError } from "../../src/utils/errors";

// 1. Create robust shared chainable mocks
const createChainableMock = () => {
  const chain: any = mock(() => chain);
  chain.set = mock(() => chain);
  chain.where = mock(() => chain);
  chain.returning = mock(() => Promise.resolve([]));
  chain.values = mock(() => chain);
  chain.onConflictDoUpdate = mock(() => chain);
  chain.then = mock((resolve) => resolve([]));
  return chain;
};

const mockUpdate = createChainableMock();
const mockInsert = createChainableMock();
const mockSelect = createChainableMock();

const sharedUpdate = mock(() => mockUpdate);
const sharedInsert = mock(() => mockInsert);
const sharedSelect = mock(() => mockSelect);

const mockDb = {
  query: {
    systemSettings: { findFirst: mock() },
    luckyWheelRewards: { findMany: mock() },
    users: { findFirst: mock() },
    luckyWheelHistory: { findFirst: mock() },
  },
  insert: sharedInsert,
  update: sharedUpdate,
  select: sharedSelect,
  transaction: mock(async (callback) => {
    const tx = {
      query: mockDb.query,
      update: sharedUpdate,
      insert: sharedInsert,
      select: sharedSelect,
    };
    return await callback(tx);
  }),
};

mock.module("../../src/db", () => ({
  db: mockDb,
  default: mockDb,
}));

import { db } from "../../src/db";

describe("LuckyWheelService", () => {
  beforeEach(() => {
    mock.restore();
    (db.query.systemSettings.findFirst as any).mockReset();
    (db.query.users.findFirst as any).mockReset();
    (db.query.luckyWheelRewards.findMany as any).mockReset();
    (db.query.luckyWheelHistory.findFirst as any).mockReset();
    
    (sharedUpdate as any).mockClear();
    (sharedInsert as any).mockClear();
    (mockUpdate.returning as any).mockResolvedValue([]);
    (mockInsert.returning as any).mockResolvedValue([]);
  });

  describe("spin", () => {
    test("should handle race conditions if two spin requests happen simultaneously", async () => {
      const mockUser = { id: "u1", points: 100 };
      const mockRewards = [{ id: "r1", type: "POINTS", value: 50, probability: 1.0, isActive: true }];

      (db.query.systemSettings.findFirst as any).mockResolvedValue({ value: true });
      (db.query.users.findFirst as any).mockResolvedValue(mockUser);
      (db.query.luckyWheelRewards.findMany as any).mockResolvedValue(mockRewards);
      (db.query.luckyWheelHistory.findFirst as any).mockResolvedValue({ id: "h1", reward: mockRewards[0] });

      (mockUpdate.returning as any)
        .mockResolvedValueOnce([{ points: 50 }]) // p1 succeeds
        .mockResolvedValueOnce([]); // p2 fails (insufficient points after p1)

      (mockInsert.returning as any).mockResolvedValue([{ id: "h1" }]);

      const p1 = luckyWheelService.spin("u1");
      const p2 = luckyWheelService.spin("u1");

      const [res1, res2] = await Promise.allSettled([p1, p2]);

      expect(res1.status).toBe("fulfilled");
      expect(res2.status).toBe("rejected");
      if (res2.status === "rejected") {
        expect(res2.reason.message).toContain("Insufficient points");
      }

      // Deduction should only happen once effectively
      expect(sharedUpdate).toHaveBeenCalled();
    });
  });
});
