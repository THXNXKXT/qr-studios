import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';

// Mock the env module before importing cache service
mock.module('../src/config/env', () => ({
    env: {
        REDIS_URL: '', // No Redis for tests - use in-memory
        NODE_ENV: 'test',
    }
}));

// Import after mocking
const { cacheService } = await import('../../src/services/cache.service');

describe('CacheService', () => {
    beforeEach(async () => {
        // Clear cache before each test
        // Since we can't access private memoryCache, we test through public API
    });

    describe('get/set operations', () => {
        test('should set and get a value', async () => {
            await cacheService.set('test:key1', 'value1', 60);
            const result = await cacheService.get('test:key1');
            expect(result).toBe('value1');
        });

        test('should return null for non-existent key', async () => {
            const result = await cacheService.get('test:nonexistent');
            expect(result).toBeNull();
        });

        test('should expire values after TTL', async () => {
            await cacheService.set('test:expire', 'willexpire', 1); // 1 second TTL

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            const result = await cacheService.get('test:expire');
            expect(result).toBeNull();
        });
    });

    describe('delete operations', () => {
        test('should delete a key', async () => {
            await cacheService.set('test:delete', 'todelete', 60);
            await cacheService.del('test:delete');
            const result = await cacheService.get('test:delete');
            expect(result).toBeNull();
        });
    });

    describe('increment operations', () => {
        test('should increment a counter starting from 1', async () => {
            const uniqueKey = `test:incr:${Date.now()}`;
            const result = await cacheService.incr(uniqueKey, 60);
            expect(result).toBe(1);
        });

        test('should increment existing counter', async () => {
            const uniqueKey = `test:incr2:${Date.now()}`;
            await cacheService.incr(uniqueKey, 60);
            const result = await cacheService.incr(uniqueKey, 60);
            expect(result).toBe(2);
        });

        test('should reset counter after expiration', async () => {
            const uniqueKey = `test:incr3:${Date.now()}`;
            await cacheService.incr(uniqueKey, 1);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            const result = await cacheService.incr(uniqueKey, 60);
            expect(result).toBe(1);
        });
    });

    describe('TTL operations', () => {
        test('should return positive TTL for existing key', async () => {
            const uniqueKey = `test:ttl:${Date.now()}`;
            await cacheService.set(uniqueKey, 'testvalue', 60);
            const ttl = await cacheService.ttl(uniqueKey);
            expect(ttl).toBeGreaterThan(0);
            expect(ttl).toBeLessThanOrEqual(60);
        });

        test('should return -2 for non-existent key', async () => {
            const ttl = await cacheService.ttl('test:ttl:nonexistent');
            expect(ttl).toBe(-2);
        });
    });

    describe('exists operations', () => {
        test('should return true for existing key', async () => {
            const uniqueKey = `test:exists:${Date.now()}`;
            await cacheService.set(uniqueKey, 'testvalue', 60);
            const exists = await cacheService.exists(uniqueKey);
            expect(exists).toBe(true);
        });

        test('should return false for non-existent key', async () => {
            const exists = await cacheService.exists('test:exists:nonexistent');
            expect(exists).toBe(false);
        });
    });

    describe('mset operations', () => {
        test('should set multiple values at once', async () => {
            const prefix = `test:mset:${Date.now()}`;
            await cacheService.mset({
                [`${prefix}:a`]: 'value_a',
                [`${prefix}:b`]: 'value_b',
                [`${prefix}:c`]: 'value_c',
            }, 60);

            expect(await cacheService.get(`${prefix}:a`)).toBe('value_a');
            expect(await cacheService.get(`${prefix}:b`)).toBe('value_b');
            expect(await cacheService.get(`${prefix}:c`)).toBe('value_c');
        });
    });

    describe('utility methods', () => {
        test('isEnabled should return false when Redis is not configured', () => {
            expect(cacheService.isEnabled()).toBe(false);
        });

        test('getStats should return valid stats object', () => {
            const stats = cacheService.getStats();
            expect(stats).toHaveProperty('isRedis');
            expect(stats).toHaveProperty('memorySize');
            expect(typeof stats.isRedis).toBe('boolean');
            expect(typeof stats.memorySize).toBe('number');
        });

        test('healthCheck should return ok status', async () => {
            const health = await cacheService.healthCheck();
            expect(health.status).toBe('ok');
            expect(health.backend).toBe('memory');
        });
    });
});
