/**
 * Comprehensive Test Suite for Refactored Utilities
 * 
 * Run with: bun test src/utils/__tests__/utils.test.ts
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import {
  // Base Service
  BaseService,
  validatePagination,
  sanitizeString,
  isValidUUID,
  buildSearchQuery,
  
  // Cache
  cache,
  cacheKeys,
  invalidateProductCache,
  invalidateUserCache,
  
  // Validation
  validateWithSchema,
  validatePartial,
  commonSchemas,
  ValidationError,
  sanitizers,
  
  // Security
  generateSecureToken,
  hashData,
  compareHashes,
  maskSensitive,
  sanitizeInput,
  rateLimiter,
  secureCompare,
  
  // Response Helpers
  success,
  error,
  paginated,
  notFound,
  unauthorized,
  validationError,
  
  // DB Optimization
  trackedQuery,
  getQueryStats,
  buildSearchCondition,
} from '../index';

import { z } from 'zod';
import type { Context } from 'hono';

// ============================================
// CACHE TESTS
// ============================================
describe('Cache', () => {
  beforeEach(() => {
    cache.clear();
  });

  test('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    const result = cache.get<string>('key1');
    expect(result).toBe('value1');
  });

  test('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  test('should respect TTL', async () => {
    cache.set('key', 'value', 100); // 100ms TTL
    const result = cache.get<string>('key');
    expect(result).toBe('value');
    
    await new Promise(r => setTimeout(r, 150));
    expect(cache.get('key')).toBeUndefined();
  });

  test('should delete values', () => {
    cache.set('key', 'value');
    expect(cache.delete('key')).toBe(true);
    expect(cache.get('key')).toBeUndefined();
  });

  test('should check existence with has()', () => {
    cache.set('key', 'value');
    expect(cache.has('key')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);
  });

  test('should get or set with factory function', async () => {
    let callCount = 0;
    const factory = async () => {
      callCount++;
      return 'computed-value';
    };

    const result1 = await cache.getOrSet('key', factory);
    expect(result1).toBe('computed-value');
    expect(callCount).toBe(1);

    // Second call should use cache
    const result2 = await cache.getOrSet('key', factory);
    expect(result2).toBe('computed-value');
    expect(callCount).toBe(1); // Factory not called again
  });

  test('should track statistics', () => {
    cache.get('miss'); // miss
    cache.set('key', 'value');
    cache.get('key'); // hit
    cache.get('key'); // hit

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(2 / 3);
  });

  test('cache keys should generate correct patterns', () => {
    expect(cacheKeys.user('123')).toBe('user:123');
    expect(cacheKeys.product('456')).toBe('product:456');
    expect(cacheKeys.featuredProducts()).toBe('products:featured');
  });

  test('invalidateProductCache should clear related keys', () => {
    cache.set(cacheKeys.product('123'), { name: 'Test' });
    cache.set(cacheKeys.featuredProducts(), []);
    
    invalidateProductCache('123');
    
    expect(cache.has(cacheKeys.product('123'))).toBe(false);
    expect(cache.has(cacheKeys.featuredProducts())).toBe(false);
  });
});

// ============================================
// VALIDATION TESTS
// ============================================
describe('Validation', () => {
  test('validateWithSchema should return valid data', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 30 };
    
    const result = validateWithSchema(schema, data);
    expect(result).toEqual(data);
  });

  test('validateWithSchema should throw on invalid data', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const data = { name: 'John', age: 'not-a-number' };
    
    expect(() => validateWithSchema(schema, data)).toThrow(ValidationError);
  });

  test('validatePartial should allow partial updates', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });
    
    // Should accept partial data
    const result = validatePartial(schema, { name: 'John' }) as { name: string };
    expect(result).toEqual({ name: 'John' });
  });

  test('commonSchemas.id should validate UUID', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    expect(() => validateWithSchema(commonSchemas.id, validUUID)).not.toThrow();
    
    expect(() => validateWithSchema(commonSchemas.id, 'not-a-uuid')).toThrow();
  });

  test('commonSchemas.email should validate emails', () => {
    expect(() => validateWithSchema(commonSchemas.email, 'test@example.com')).not.toThrow();
    expect(() => validateWithSchema(commonSchemas.email, 'invalid')).toThrow();
  });

  test('sanitizers.text should normalize whitespace', () => {
    expect(sanitizers.text('  hello   world  ')).toBe('hello world');
  });

  test('sanitizers.email should lowercase', () => {
    expect(sanitizers.email('Test@Example.COM')).toBe('test@example.com');
  });

  test('sanitizers.slug should create valid slugs', () => {
    expect(sanitizers.slug('Hello World!')).toBe('hello-world');
    expect(sanitizers.slug('Test--URL--123')).toBe('test-url-123');
  });
});

// ============================================
// SECURITY TESTS
// ============================================
describe('Security', () => {
  test('generateSecureToken should create unique tokens', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();
    
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
  });

  test('generateSecureToken should respect length parameter', () => {
    const token = generateSecureToken(16);
    expect(token.length).toBe(32); // 16 bytes = 32 hex chars
  });

  test('hashData should create deterministic hashes with same salt', () => {
    const result1 = hashData('password', 'samesalt');
    const result2 = hashData('password', 'samesalt');
    
    expect(result1.hash).toBe(result2.hash);
    expect(result1.salt).toBe('samesalt');
  });

  test('hashData should create different hashes with different salts', () => {
    const result1 = hashData('password');
    const result2 = hashData('password');
    
    expect(result1.hash).not.toBe(result2.hash);
    expect(result1.salt).not.toBe(result2.salt);
  });

  test('compareHashes should work correctly', () => {
    const { hash, salt } = hashData('password');
    const { hash: hash2 } = hashData('password', salt);
    
    expect(compareHashes(hash, hash2)).toBe(true);
    expect(compareHashes(hash, 'different')).toBe(false);
  });

  test('maskSensitive should mask data correctly', () => {
    expect(maskSensitive('1234567890', 2)).toBe('12******90');
    expect(maskSensitive('short', 4)).toBe('*****');
  });

  test('sanitizeInput should remove dangerous characters', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
    expect(sanitizeInput('test\x01\x02')).toBe('test');
  });

  test('rateLimiter should allow requests within limit', () => {
    rateLimiter.reset('test-key');
    
    expect(rateLimiter.isAllowed('test-key', 5, 60000)).toBe(true);
    expect(rateLimiter.isAllowed('test-key', 5, 60000)).toBe(true);
    expect(rateLimiter.getRemaining('test-key', 5)).toBe(3);
  });

  test('rateLimiter should block exceeding limit', () => {
    rateLimiter.reset('test-key-2');
    
    // Make 5 requests (max)
    for (let i = 0; i < 5; i++) {
      rateLimiter.isAllowed('test-key-2', 5, 60000);
    }
    
    // 6th request should be blocked
    expect(rateLimiter.isAllowed('test-key-2', 5, 60000)).toBe(false);
  });

  test('secureCompare should prevent timing attacks', () => {
    expect(secureCompare('abc', 'abc')).toBe(true);
    expect(secureCompare('abc', 'def')).toBe(false);
    expect(secureCompare('short', 'longer')).toBe(false);
  });
});

// ============================================
// BASE SERVICE UTILITIES TESTS
// ============================================
describe('Base Service Utilities', () => {
  test('validatePagination should set defaults', () => {
    const result = validatePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortOrder).toBe('desc');
  });

  test('validatePagination should clamp values', () => {
    const result = validatePagination({ page: 0, limit: 200 });
    expect(result.page).toBe(1); // min 1
    expect(result.limit).toBe(100); // max 100
  });

  test('sanitizeString should remove control characters', () => {
    expect(sanitizeString('hello\x00\x01world')).toBe('helloworld');
    expect(sanitizeString('  test  ')).toBe('test');
  });

  test('isValidUUID should validate UUID v4 format', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });
});

// ============================================
// RESPONSE HELPERS TESTS (Mock Context)
// ============================================
describe('Response Helpers', () => {
  const createMockContext = (): Context => {
    return {
      json: (data: unknown, status?: number) => {
        return new Response(JSON.stringify(data), {
          status: status || 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
      get: (key: string) => key === 'requestId' ? 'test-request-id' : undefined,
    } as unknown as Context;
  };

  test('success should return correct structure', () => {
    const c = createMockContext();
    const response = success(c, { id: 1 }, 'Success', 200);
    
    expect(response.status).toBe(200);
    // Body can be checked by parsing response
  });

  test('error should return error structure', () => {
    const c = createMockContext();
    const response = error(c, 'Something went wrong', 400);
    
    expect(response.status).toBe(400);
  });

  test('notFound should return 404', () => {
    const c = createMockContext();
    const response = notFound(c, 'User');
    
    expect(response.status).toBe(404);
  });

  test('unauthorized should return 401', () => {
    const c = createMockContext();
    const response = unauthorized(c);
    
    expect(response.status).toBe(401);
  });
});

// ============================================
// DB OPTIMIZATION TESTS
// ============================================
describe('DB Optimization', () => {
  test('trackedQuery should track query performance', async () => {
    const mockQuery = async () => {
      await new Promise(r => setTimeout(r, 10));
      return 'result';
    };

    const result = await trackedQuery(mockQuery, 'test.query');
    expect(result).toBe('result');

    const stats = getQueryStats();
    expect(stats.total).toBeGreaterThan(0);
  });

  test('trackedQuery should catch and log errors', async () => {
    const mockQuery = async () => {
      throw new Error('Query failed');
    };

    await expect(trackedQuery(mockQuery, 'failing.query')).rejects.toThrow('Query failed');
  });
});

console.log('✅ All utility tests defined. Run with: bun test src/utils/__tests__/utils.test.ts');
