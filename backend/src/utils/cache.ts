import { logger } from './logger';

/**
 * In-memory cache with TTL and size limits
 * For production, replace with Redis
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  keys: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    keys: 0,
  };

  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(options: { maxSizeMB?: number; defaultTTLMs?: number } = {}) {
    this.maxSize = (options.maxSizeMB || 50) * 1024 * 1024; // Default 50MB
    this.defaultTTL = options.defaultTTLMs || 5 * 60 * 1000; // Default 5 minutes

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size -= entry.size;
      this.stats.keys--;
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const size = this.estimateSize(value);

    // Evict entries if needed
    while (this.stats.size + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const existing = this.cache.get(key);
    if (existing) {
      this.stats.size -= existing.size;
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      size,
    };

    this.cache.set(key, entry as CacheEntry<unknown>);
    this.stats.size += size;
    this.stats.keys = this.cache.size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.size -= entry.size;
      this.stats.keys--;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; maxSize: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.keys = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }

  /**
   * Get many keys matching pattern
   */
  keys(pattern?: RegExp): string[] {
    const keys = Array.from(this.cache.keys());
    if (pattern) {
      return keys.filter(k => pattern.test(k));
    }
    return keys;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldest: { key: string; time: number } | null = null;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.expiresAt < oldest.time) {
        oldest = { key, time: entry.expiresAt };
      }
    }

    if (oldest) {
      this.delete(oldest.key);
      this.stats.evictions++;
    }
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Estimate object size in bytes
   */
  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'boolean') return 4;
    if (typeof value === 'number') return 8;
    if (typeof value === 'string') return value.length * 2;
    if (value instanceof Date) return 16;
    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.estimateSize(item), 0);
    }
    if (typeof value === 'object') {
      return Object.entries(value).reduce(
        (sum, [k, v]) => sum + k.length * 2 + this.estimateSize(v),
        0
      );
    }
    return 0;
  }
}

// Export singleton instance
export const cache = new MemoryCache();

/**
 * Cache decorator for methods
 */
export function cached(ttlMs?: number) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const key = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      return cache.getOrSet(key, () => originalMethod.apply(this, args), ttlMs);
    };

    return descriptor;
  };
}

/**
 * Cache key generators for common patterns
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userOrders: (userId: string) => `user:${userId}:orders`,
  userLicenses: (userId: string) => `user:${userId}:licenses`,
  product: (productId: string) => `product:${productId}`,
  productsList: (params: string) => `products:list:${params}`,
  order: (orderId: string) => `order:${orderId}`,
  stats: (type: string) => `stats:${type}`,
  featuredProducts: () => 'products:featured',
  flashSaleProducts: () => 'products:flashsale',
  getSortOrder: (sort: string) => `order:${sort}`,
};

/**
 * Invalidate related cache keys
 */
export function invalidateUserCache(userId: string): void {
  cache.delete(cacheKeys.user(userId));
  cache.delete(cacheKeys.userOrders(userId));
  cache.delete(cacheKeys.userLicenses(userId));
}

export function invalidateProductCache(productId: string): void {
  cache.delete(cacheKeys.product(productId));
  cache.delete(cacheKeys.featuredProducts());
  cache.delete(cacheKeys.flashSaleProducts());
}

export function invalidateOrderCache(orderId: string, userId?: string): void {
  cache.delete(cacheKeys.order(orderId));
  if (userId) {
    cache.delete(cacheKeys.userOrders(userId));
  }
}
