import { expect, test, describe, mock, beforeEach, spyOn } from "bun:test";

// 1. Mock Drizzle BEFORE ANY IMPORTS
const createDbMock = () => {
  const createChain = () => {
    const chain: any = {};
    chain.set = mock(() => chain);
    chain.where = mock(() => chain);
    chain.values = mock(() => chain);
    chain.onConflictDoUpdate = mock(() => chain);
    chain.returning = mock(() => Promise.resolve([]));
    chain.then = (resolve: any) => Promise.resolve([]).then(resolve);
    return chain;
  };

  const dbMock: any = {
    query: {
      transactions: { findFirst: mock(), findMany: mock() },
      users: { findFirst: mock() },
    },
    update: mock(() => createChain()),
    insert: mock(() => createChain()),
    transaction: mock(async (callback: any) => {
      const tx = {
        query: dbMock.query,
        update: mock(() => createChain()),
        insert: mock(() => createChain()),
      };
      return await callback(tx);
    }),
  };
  return dbMock;
};

const mockDb = createDbMock();

mock.module("../../src/db", () => ({
  db: mockDb,
  default: mockDb,
}));

// Mock stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: mock().mockResolvedValue({ id: "sess_1", url: "http://stripe.com" }),
      retrieve: mock(),
    },
  },
};

mock.module("../../src/config/stripe", () => ({
  stripe: mockStripe,
  default: mockStripe,
}));

// Mock email service
mock.module("../../src/services/email.service", () => ({
  emailService: {
    sendTopupConfirmation: mock().mockResolvedValue(true),
  },
}));

import { db } from "../../src/db";
import stripe from "../../src/config/stripe";
import * as schema from "../../src/db/schema";
import { topupService } from "../../src/services/topup.service";
import { BadRequestError } from "../../src/utils/errors";

describe("TopupService", () => {
  beforeEach(() => {
    mock.restore();
    (mockDb.query.transactions.findFirst as any).mockReset();
    (mockDb.query.transactions.findMany as any).mockReset();
    (mockDb.update as any).mockClear();
    (mockDb.insert as any).mockClear();
    (mockStripe.checkout.sessions.create as any).mockClear();
    (mockStripe.checkout.sessions.retrieve as any).mockClear();
  });

  describe("getTopupPackages", () => {
    test("should return formatted topup packages", () => {
      const packages = topupService.getTopupPackages();
      expect(packages.length).toBeGreaterThan(0);
      expect(packages[0]).toHaveProperty("total");
      expect(packages[0]).toHaveProperty("bonusPercent");
    });
  });

  describe("createStripeTopupSession", () => {
    test("should create a transaction and a stripe session", async () => {
      const mockInsertChain = {
        values: mock().mockReturnThis(),
        returning: mock().mockResolvedValue([{ id: "t1" }]),
        then: (resolve: any) => resolve([]),
      };
      (db.insert as any).mockReturnValue(mockInsertChain);
      
      const result = await topupService.createStripeTopupSession("u1", 500);
      
      expect(result.transactionId).toBe("t1");
      expect(result.sessionId).toBe("sess_1");
      expect(stripe.checkout.sessions.create).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    test("should throw BadRequestError if amount is less than 100", async () => {
      await expect(topupService.createStripeTopupSession("u1", 50)).rejects.toThrow(BadRequestError);
    });
  });

  describe("completeTopup", () => {
    test("should handle race conditions if two completion requests happen nearly simultaneously", async () => {
      const mockTransaction = {
        id: "t1",
        userId: "u1",
        amount: 100,
        bonus: 0,
        status: "PENDING",
        paymentMethod: "stripe"
      };

      const transUpdateChain = {
        set: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        returning: mock()
          .mockResolvedValueOnce([{ id: "t1" }]) // p1 success
          .mockResolvedValueOnce([]), // p2 fail
        then: (resolve: any) => resolve([]),
      };

      const userUpdateChain = {
        set: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        returning: mock().mockResolvedValue([{ id: "u1", email: "test@test.com", balance: 100 }]),
        then: (resolve: any) => resolve([]),
      };

      const txMock = {
        query: {
          transactions: {
            findFirst: mock()
              .mockResolvedValueOnce(mockTransaction) // p1 initial
              .mockResolvedValueOnce(mockTransaction) // p2 initial
              .mockResolvedValue({ ...mockTransaction, status: "COMPLETED" }), // final (p1 and p2)
          },
        },
        update: mock((table: any) => {
          if (table === schema.users) return userUpdateChain;
          return transUpdateChain;
        }),
        insert: mock(() => ({
          values: mock().mockReturnThis(),
          returning: mock().mockResolvedValue([{ id: "n1" }]),
          then: (resolve: any) => resolve([]),
        })),
      };

      (db.transaction as any).mockImplementation((callback: any) => callback(txMock));

      const p1 = topupService.completeTopup("t1");
      const p2 = topupService.completeTopup("t1");

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(res1!.status).toBe("COMPLETED");
      expect(res2!.status).toBe("COMPLETED");
      expect(txMock.update).toHaveBeenCalled();
    });
  });

  describe("cancelTopup", () => {
    test("should cancel a pending transaction", async () => {
      const mockUpdateChain = {
        set: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        returning: mock().mockResolvedValue([{ id: "t1" }]),
        then: (resolve: any) => resolve([]),
      };
      (db.update as any).mockReturnValue(mockUpdateChain);
      (mockDb.query.transactions.findFirst as any).mockResolvedValue({ id: "t1", status: "CANCELLED" });

      const result = await topupService.cancelTopup("t1");
      expect(result!.status).toBe("CANCELLED");
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("verifyStripeSession", () => {
    test("should complete topup if session is paid", async () => {
      const mockSession = {
        payment_status: 'paid',
        metadata: {
          type: 'topup',
          transactionId: 't1'
        },
        payment_intent: {
          payment_method_types: ['promptpay']
        }
      };
      (stripe.checkout.sessions.retrieve as any).mockResolvedValue(mockSession);
      
      const spy = spyOn(topupService, 'completeTopup');
      spy.mockResolvedValue({ id: 't1', status: 'COMPLETED' } as any);

      const result = await topupService.verifyStripeSession("sess_1");
      expect(result!.status).toBe("COMPLETED");
      expect(stripe.checkout.sessions.retrieve).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith("t1", "promptpay");
      
      spy.mockRestore();
    });
  });

  describe("getTopupHistory", () => {
    test("should return transaction history for user", async () => {
      const mockHistory = [{ id: "t1", amount: 100, createdAt: new Date(), status: "COMPLETED", type: "TOPUP" }];
      (mockDb.query.transactions.findMany as any).mockResolvedValue(mockHistory);

      const result = await topupService.getTopupHistory("u1");
      expect(result).toEqual(mockHistory as any);
      expect(mockDb.query.transactions.findMany).toHaveBeenCalled();
    });
  });
});
