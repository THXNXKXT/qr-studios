import { expect, test, describe, mock, beforeEach } from "bun:test";
import { licensesService } from "../../src/services/licenses.service";
// import { BadRequestError, UnauthorizedError } from "../../src/utils/errors";

// Chainable mock factory
const createChainableMock = () => {
    const chain: any = mock(() => chain);
    chain.set = mock(() => chain);
    chain.where = mock(() => chain);
    chain.returning = mock(() => Promise.resolve([]));
    chain.values = mock(() => chain);
    chain.then = mock((resolve) => resolve([]));
    return chain;
};

const mockSelect = createChainableMock();
const mockInsert = createChainableMock();
const mockUpdate = createChainableMock();
const mockDelete = createChainableMock();

const mockDb = {
    select: mock(() => mockSelect),
    query: {
        licenses: { findFirst: mock() },
        licenseIpHistory: { findFirst: mock() },
        ipBlacklist: { findFirst: mock(), findMany: mock() },
    },
    insert: mock(() => mockInsert),
    update: mock(() => mockUpdate),
    delete: mock(() => mockDelete),
};

mock.module("../../src/db", () => ({
    db: mockDb,
    default: mockDb,
    schema: {
        licenses: { id: 'licenses', ipAddress: 'ipAddress' },
        licenseIpHistory: {},
        ipBlacklist: { ipAddress: 'ipAddress' }
    }
}));

import { db } from "../../src/db";
import { eq } from "drizzle-orm";

describe("License System Integration", () => {
    const mockLicense = {
        id: "l1",
        key: "QR_TEST-KEY",
        status: "ACTIVE",
        ipAddress: null as string | null,
        expiresAt: null as Date | null,
        product: { name: "Test Product", version: "1.0.0" },
        user: { username: "testuser", discordId: "123" },
        maxIps: 1
    };

    beforeEach(() => {
        mock.restore();
        (db.query.licenses.findFirst as any).mockReset();
        (db.query.ipBlacklist.findFirst as any).mockReset();
        (mockUpdate.set as any).mockClear();
        (mockUpdate.where as any).mockClear();
        (mockDelete.returning as any).mockResolvedValue([]);
    });

    describe("License Verification Flow", () => {

        test("1. Verify (First Use) - Should Lock IP", async () => {
            // Setup: License exists, no IP locked (ipAddress: null)
            (db.query.licenses.findFirst as any).mockResolvedValue({
                ...mockLicense,
                ipAddress: null
            });
            // Not blacklisted
            (db.query.ipBlacklist.findFirst as any).mockResolvedValue(null);

            const result = await licensesService.verifyLicense("QR_TEST-KEY", "1.1.1.1", "test-res");

            expect(result.valid).toBe(true);
            expect((result as any).a).toBe("1.1.1.1"); // Check legacy response field

            // Should trigger update to lock IP
            expect(db.update).toHaveBeenCalled();
        });

        test("2. Verify (Same IP) - Should Succeed", async () => {
            // Setup: License locked to 1.1.1.1
            (db.query.licenses.findFirst as any).mockResolvedValue({
                ...mockLicense,
                ipAddress: "1.1.1.1"
            });
            (db.query.ipBlacklist.findFirst as any).mockResolvedValue(null);

            const result = await licensesService.verifyLicense("QR_TEST-KEY", "1.1.1.1", "test-res");

            expect(result.valid).toBe(true);
        });

        test("3. Verify (Different IP) - Should Fail", async () => {
            // Setup: License locked to 1.1.1.1
            (db.query.licenses.findFirst as any).mockResolvedValue({
                ...mockLicense,
                ipAddress: "1.1.1.1"
            });
            (db.query.ipBlacklist.findFirst as any).mockResolvedValue(null);

            const call = licensesService.verifyLicense("QR_TEST-KEY", "2.2.2.2", "test-res");

            expect(call).rejects.toThrow("IP address not whitelisted");
        });

        test("4. Verify (Blacklisted IP) - Should Fail Immediately", async () => {
            // Setup: License valid, IP locked to 1.1.1.1
            (db.query.licenses.findFirst as any).mockResolvedValue({
                ...mockLicense,
                ipAddress: "1.1.1.1"
            });
            // IP is blacklisted
            (db.query.ipBlacklist.findFirst as any).mockResolvedValue({ ipAddress: "1.1.1.1" });

            const call = licensesService.verifyLicense("QR_TEST-KEY", "1.1.1.1", "test-res");

            expect(call).rejects.toThrow("IP address is blacklisted");
        });
    });

    describe("Admin Management", () => {
        test("Reset IP - Should clear IP address", async () => {
            (db.query.licenses.findFirst as any).mockResolvedValue({ ...mockLicense, ipAddress: "1.1.1.1" });

            // Should call update with ipAddress: null
            // Admin resets IP (no specific userId check for admin if not passed)
            await licensesService.resetIPWhitelist("l1");

            expect(db.update).toHaveBeenCalled();
        });

        test("Blacklist Management", async () => {
            // Add to blacklist
            await licensesService.addToBlacklist("9.9.9.9", "Spam", "admin1");
            expect(db.insert).toHaveBeenCalled();

            // Check is blacklisted
            (db.query.ipBlacklist.findFirst as any).mockResolvedValue({ ipAddress: "9.9.9.9" });
            const isBlocked = await licensesService.isIpBlacklisted("9.9.9.9");
            expect(isBlocked).toBe(true);

            // Remove from blacklist
            // Mock delete returning value for this specific call
            (mockDelete.returning as any).mockResolvedValue([{ ipAddress: "9.9.9.9" }]);

            await licensesService.removeFromBlacklist("9.9.9.9");
            expect(db.delete).toHaveBeenCalled();
        });
    });
});
