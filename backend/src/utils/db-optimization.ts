import { db } from '../db';
import { sql, type SQL } from 'drizzle-orm';
import { logger } from './logger';

/**
 * Database query optimization utilities
 */

interface QueryMetrics {
  query: string;
  duration: number;
  slow: boolean;
}

const SLOW_QUERY_THRESHOLD = 500; // ms
const queryMetrics: QueryMetrics[] = [];
const MAX_METRICS = 100;

/**
 * Execute query with performance tracking
 */
export async function trackedQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    // Track metrics
    const metric: QueryMetrics = {
      query: queryName,
      duration,
      slow: duration > SLOW_QUERY_THRESHOLD,
    };

    queryMetrics.unshift(metric);
    if (queryMetrics.length > MAX_METRICS) {
      queryMetrics.pop();
    }

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn('Slow query detected', {
        query: queryName,
        duration: `${duration.toFixed(2)}ms`,
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error('Query failed', {
      query: queryName,
      duration: `${duration.toFixed(2)}ms`,
      error,
    });
    throw error;
  }
}

/**
 * Get query performance statistics
 */
export function getQueryStats(): {
  total: number;
  slow: number;
  avgDuration: number;
  slowestQueries: QueryMetrics[];
} {
  if (queryMetrics.length === 0) {
    return { total: 0, slow: 0, avgDuration: 0, slowestQueries: [] };
  }

  const total = queryMetrics.length;
  const slow = queryMetrics.filter(m => m.slow).length;
  const avgDuration = queryMetrics.reduce((sum, m) => sum + m.duration, 0) / total;
  const slowestQueries = [...queryMetrics]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  return { total, slow, avgDuration, slowestQueries };
}

/**
 * Build efficient search query with full-text search
 */
export function buildSearchCondition(
  fields: string[],
  searchTerm: string,
  tableAlias?: string
): SQL | undefined {
  if (!searchTerm?.trim()) return undefined;

  const sanitized = searchTerm
    .replace(/[%_\\]/g, '\\$&')
    .trim();

  if (!sanitized) return undefined;

  const conditions: SQL[] = fields.map(field => {
    const column = tableAlias
      ? sql.raw(`${tableAlias}.${field}`)
      : sql.raw(field);
    return sql`${column} ILIKE ${`%${sanitized}%`}`;
  });

  return sql`(${sql.join(conditions, sql` OR `)})`;
}

/**
 * Batch operations for better performance
 */
export async function batchInsert<T extends Record<string, unknown>>(
  table: string,
  records: T[],
  batchSize = 1000
): Promise<void> {
  if (records.length === 0) return;

  const batches: T[][] = [];
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }

  logger.info(`Batch inserting ${records.length} records in ${batches.length} batches`);

  for (const batch of batches) {
    await db.transaction(async (tx) => {
      // Use raw SQL for better performance on large batches
      const firstRecord = batch[0];
      if (batch.length > 0 && firstRecord) {
        const columns = Object.keys(firstRecord);
        const values = batch.map(record =>
          `(${columns.map(col => {
            const val = record[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return String(val);
          }).join(', ')})`
        ).join(', ');

        await tx.execute(sql`
          INSERT INTO ${sql.raw(table)} (${sql.raw(columns.join(', '))})
          VALUES ${sql.raw(values)}
        `);
      }
    });
  }
}

/**
 * Optimized count query
 */
export async function fastCount(
  table: string,
  whereClause?: SQL
): Promise<number> {
  const query = whereClause
    ? sql`SELECT COUNT(*) FROM ${sql.raw(table)} WHERE ${whereClause}`
    : sql`SELECT COUNT(*) FROM ${sql.raw(table)}`;

  const result = await db.execute(query);
  return Number((result.rows[0] as Record<string, unknown>).count);
}

/**
 * Check if index exists on column
 */
export async function checkIndexExists(
  table: string,
  column: string
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM pg_indexes
    WHERE tablename = ${table}
    AND indexdef LIKE ${`%(${column})%`}
  `);
  return result.rows.length > 0;
}

/**
 * Suggest missing indexes based on query patterns
 */
export async function analyzeQueryPatterns(): Promise<{
  table: string;
  column: string;
  reason: string;
}[]> {
  const suggestions: { table: string; column: string; reason: string }[] = [];

  // Check for common patterns that need indexes
  const patterns = [
    { table: 'orders', column: 'user_id', reason: 'Frequent user order lookups' },
    { table: 'orders', column: 'status', reason: 'Order status filtering' },
    { table: 'orders', column: 'created_at', reason: 'Date range queries' },
    { table: 'licenses', column: 'user_id', reason: 'User license lookups' },
    { table: 'licenses', column: 'product_id', reason: 'Product license counts' },
    { table: 'notifications', column: 'user_id', reason: 'User notification feed' },
    { table: 'transactions', column: 'user_id', reason: 'Transaction history' },
  ];

  for (const pattern of patterns) {
    const exists = await checkIndexExists(pattern.table, pattern.column);
    if (!exists) {
      suggestions.push(pattern);
    }
  }

  return suggestions;
}

/**
 * Connection pool monitoring
 */
export async function getPoolStatus(): Promise<{
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}> {
  const result = await db.execute(sql`
    SELECT
      count(*) as total_connections,
      count(*) FILTER (WHERE state = 'active') as active_connections,
      count(*) FILTER (WHERE state = 'idle') as idle_connections,
      count(*) FILTER (WHERE wait_event_type = 'Client') as waiting_clients
    FROM pg_stat_activity
    WHERE datname = current_database()
  `);

  const row = result.rows[0] as Record<string, number>;
  return {
    totalConnections: Number(row.total_connections),
    activeConnections: Number(row.active_connections),
    idleConnections: Number(row.idle_connections),
    waitingClients: Number(row.waiting_clients),
  };
}

/**
 * Query builder with common patterns
 */
export class OptimizedQueryBuilder<T extends Record<string, unknown>> {
  private conditions: SQL[] = [];
  private orderByClause?: SQL;
  private limitValue?: number;
  private offsetValue?: number;

  constructor(private table: string) {}

  where(condition: SQL): this {
    this.conditions.push(condition);
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'desc'): this {
    this.orderByClause = sql.raw(`${column} ${direction.toUpperCase()}`);
    return this;
  }

  limit(n: number): this {
    this.limitValue = Math.max(1, Math.min(n, 1000));
    return this;
  }

  offset(n: number): this {
    this.offsetValue = Math.max(0, n);
    return this;
  }

  async execute(): Promise<T[]> {
    let query = sql`SELECT * FROM ${sql.raw(this.table)}`;

    if (this.conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(this.conditions, sql` AND `)}`;
    }

    if (this.orderByClause) {
      query = sql`${query} ORDER BY ${this.orderByClause}`;
    }

    if (this.limitValue) {
      query = sql`${query} LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue) {
      query = sql`${query} OFFSET ${this.offsetValue}`;
    }

    const result = await db.execute(query);
    return result.rows as T[];
  }
}
