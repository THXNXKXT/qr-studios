/**
 * Redis/Cache Service
 * 
 * Provides caching and rate limiting storage for production use.
 * Uses Redis when REDIS_URL is configured, falls back to in-memory otherwise.
 */

import { env } from '../config/env';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

interface CacheEntry {
    value: string;
    expiresAt: number;
}

class CacheService {
    private memoryCache: Map<string, CacheEntry> = new Map();
    private redis: Redis | null = null;
    private isRedisEnabled: boolean = false;

    constructor() {
        this.initializeRedis();

        // Cleanup expired entries every minute (for in-memory fallback)
        const cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
        if (typeof cleanupInterval.unref === 'function') {
            cleanupInterval.unref();
        }
    }

    private async initializeRedis(): Promise<void> {
        if (env.REDIS_URL) {
            try {
                this.redis = new Redis(env.REDIS_URL, {
                    maxRetriesPerRequest: 3,
                    retryStrategy: (times) => Math.min(times * 100, 3000),
                    enableReadyCheck: true,
                    connectTimeout: 10000,
                    lazyConnect: true,
                });

                this.redis.on('connect', () => {
                    logger.info('Redis connected successfully');
                    this.isRedisEnabled = true;
                });

                this.redis.on('error', (err) => {
                    logger.error('Redis error', { message: err.message });
                    // Fall back to in-memory on connection error
                    this.isRedisEnabled = false;
                });

                this.redis.on('close', () => {
                    logger.warn('Redis connection closed, falling back to in-memory');
                    this.isRedisEnabled = false;
                });

                this.redis.on('reconnecting', () => {
                    logger.info('Redis reconnecting...');
                });

                // Try to connect
                await this.redis.connect();
                this.isRedisEnabled = true;

            } catch (error) {
                logger.error('Failed to initialize Redis', error as Error);
                logger.info('Using in-memory cache as fallback');
                this.isRedisEnabled = false;
            }
        } else {
            logger.info('No REDIS_URL configured. Using in-memory cache.');
        }
    }

    /**
     * Get a value from cache
     */
    async get(key: string): Promise<string | null> {
        if (this.isRedisEnabled && this.redis) {
            try {
                return await this.redis.get(key);
            } catch (error) {
                logger.error('Redis get error, falling back to memory', error as Error);
                // Fall back to memory cache
            }
        }

        const entry = this.memoryCache.get(key);
        if (!entry) return null;

        if (entry.expiresAt < Date.now()) {
            this.memoryCache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Set a value in cache with expiration
     */
    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        if (this.isRedisEnabled && this.redis) {
            try {
                await this.redis.setex(key, ttlSeconds, value);
                return;
            } catch (error) {
                logger.error('Redis set error, falling back to memory', error as Error);
            }
        }

        this.memoryCache.set(key, {
            value,
            expiresAt: Date.now() + (ttlSeconds * 1000),
        });
    }

    /**
     * Delete a key from cache
     */
    async del(key: string): Promise<void> {
        if (this.isRedisEnabled && this.redis) {
            try {
                await this.redis.del(key);
                return;
            } catch (error) {
                logger.error('Redis del error', error as Error);
            }
        }

        this.memoryCache.delete(key);
    }

    /**
     * Increment a counter with expiration
     */
    async incr(key: string, ttlSeconds?: number): Promise<number> {
        if (this.isRedisEnabled && this.redis) {
            try {
                const result = await this.redis.incr(key);
                if (ttlSeconds) {
                    await this.redis.expire(key, ttlSeconds);
                }
                return result;
            } catch (error) {
                logger.error('Redis incr error, falling back to memory', error as Error);
            }
        }

        const entry = this.memoryCache.get(key);
        const now = Date.now();

        if (!entry || entry.expiresAt < now) {
            this.memoryCache.set(key, {
                value: '1',
                expiresAt: ttlSeconds ? now + (ttlSeconds * 1000) : now + (60 * 60 * 1000),
            });
            return 1;
        }

        const newValue = parseInt(entry.value, 10) + 1;
        entry.value = newValue.toString();
        return newValue;
    }

    /**
     * Get TTL of a key in seconds
     */
    async ttl(key: string): Promise<number> {
        if (this.isRedisEnabled && this.redis) {
            try {
                return await this.redis.ttl(key);
            } catch (error) {
                logger.error('Redis ttl error', error as Error);
            }
        }

        const entry = this.memoryCache.get(key);
        if (!entry) return -2;

        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -1;
    }

    /**
     * Check if a key exists
     */
    async exists(key: string): Promise<boolean> {
        if (this.isRedisEnabled && this.redis) {
            try {
                return (await this.redis.exists(key)) === 1;
            } catch (error) {
                logger.error('Redis exists error', error as Error);
            }
        }

        const entry = this.memoryCache.get(key);
        if (!entry) return false;
        return entry.expiresAt >= Date.now();
    }

    /**
     * Set multiple values at once
     */
    async mset(entries: Record<string, string>, ttlSeconds: number): Promise<void> {
        if (this.isRedisEnabled && this.redis) {
            try {
                const pipeline = this.redis.pipeline();
                for (const [key, value] of Object.entries(entries)) {
                    pipeline.setex(key, ttlSeconds, value);
                }
                await pipeline.exec();
                return;
            } catch (error) {
                logger.error('Redis mset error, falling back to memory', error as Error);
            }
        }

        const expiresAt = Date.now() + (ttlSeconds * 1000);
        for (const [key, value] of Object.entries(entries)) {
            this.memoryCache.set(key, { value, expiresAt });
        }
    }

    /**
     * Check if Redis is enabled and connected
     */
    isEnabled(): boolean {
        return this.isRedisEnabled;
    }

    /**
     * Get cache stats
     */
    getStats(): { isRedis: boolean; memorySize: number } {
        return {
            isRedis: this.isRedisEnabled,
            memorySize: this.memoryCache.size,
        };
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'error'; backend: string }> {
        if (this.isRedisEnabled && this.redis) {
            try {
                await this.redis.ping();
                return { status: 'ok', backend: 'redis' };
            } catch {
                return { status: 'degraded', backend: 'memory (redis unavailable)' };
            }
        }
        return { status: 'ok', backend: 'memory' };
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        if (this.redis) {
            logger.info('Closing Redis connection...');
            await this.redis.quit();
        }
        this.memoryCache.clear();
    }

    /**
     * Delete keys matching a pattern (e.g., "products:*")
     * Uses Redis SCAN for production, simple iteration for in-memory
     */
    async invalidatePattern(pattern: string): Promise<number> {
        let deleted = 0;

        if (this.isRedisEnabled && this.redis) {
            try {
                // Use SCAN to find keys matching pattern (safer than KEYS for production)
                let cursor = '0';
                do {
                    const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                    cursor = nextCursor;
                    if (keys.length > 0) {
                        await this.redis.del(...keys);
                        deleted += keys.length;
                    }
                } while (cursor !== '0');

                logger.info(`Invalidated ${deleted} keys matching pattern`, { pattern, deleted });
                return deleted;
            } catch (error) {
                logger.error('Redis invalidatePattern error', error as Error);
            }
        }

        // In-memory fallback: convert glob pattern to regex
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this.memoryCache.keys()) {
            if (regex.test(key)) {
                this.memoryCache.delete(key);
                deleted++;
            }
        }
        logger.info(`[Memory] Invalidated ${deleted} keys matching pattern`, { pattern, deleted });
        return deleted;
    }

    /**
     * Invalidate all cache entries for a specific entity
     */
    async invalidateEntity(entity: 'product' | 'user' | 'order', id: string): Promise<void> {
        await this.invalidatePattern(`${entity}:${id}*`);
        await this.invalidatePattern(`${entity}s:*`); // List caches
    }

    /**
     * Invalidate product-related caches
     */
    async invalidateProduct(productId: string): Promise<void> {
        await Promise.all([
            this.del(`product:${productId}`),
            this.invalidatePattern('products:list:*'),
            this.invalidatePattern('products:featured:*'),
        ]);
    }

    /**
     * Invalidate user-related caches
     */
    async invalidateUser(userId: string): Promise<void> {
        await Promise.all([
            this.del(`user:${userId}`),
            this.del(`user:${userId}:profile`),
            this.del(`user:${userId}:orders`),
        ]);
    }

    /**
     * Invalidate order-related caches
     */
    async invalidateOrder(orderId: string, userId?: string): Promise<void> {
        const tasks = [this.del(`order:${orderId}`)];
        if (userId) {
            tasks.push(this.del(`user:${userId}:orders`));
        }
        await Promise.all(tasks);
    }

    /**
     * Cleanup expired entries (for in-memory cache)
     */
    private cleanup(): void {
        if (this.isRedisEnabled) return;

        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.expiresAt < now) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0 && env.NODE_ENV === 'development') {
            logger.debug(`Cleaned ${cleaned} expired entries`);
        }
    }
}

// Singleton instance
export const cacheService = new CacheService();
