import { db } from '../db';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, BadRequestError } from '../utils/errors';
import type { PgTable } from 'drizzle-orm/pg-core';
import { eq, sql, desc, asc, count, and, or, like, inArray } from 'drizzle-orm';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseService<T extends PgTable, TEntity = unknown> {
  protected abstract table: T;
  protected abstract tableName: string;
  protected abstract logger: ReturnType<typeof logger.child>;

  /**
   * Build select columns based on allowed fields
   */
  protected buildSelectColumns(allowedColumns: (keyof TEntity)[]): Record<string, boolean> {
    const columns: Record<string, boolean> = {};
    allowedColumns.forEach(col => {
      columns[col as string] = true;
    });
    return columns;
  }

  /**
   * Find by ID with type-safe return
   */
  async findById(id: string, options?: {
    columns?: (keyof TEntity)[];
    with?: Record<string, unknown>;
  }): Promise<TEntity | null> {
    try {
      const table = this.table as unknown as Record<string, unknown>;
      const query: Record<string, unknown> = {
        where: eq(table.id as Parameters<typeof eq>[0], id),
      };

      if (options?.columns) {
        query.columns = this.buildSelectColumns(options.columns);
      }

      if (options?.with) {
        query.with = options.with;
      }

      const result = await (db.query[this.tableName as keyof typeof db.query] as unknown as {
        findFirst: (args: typeof query) => Promise<TEntity | null>;
      }).findFirst(query);

      return result;
    } catch (error) {
      this.logger.error(`Error finding ${this.tableName} by id`, { id, error });
      throw error;
    }
  }

  /**
   * Find by ID or throw NotFoundError
   */
  async findByIdOrThrow(id: string, options?: {
    columns?: (keyof TEntity)[];
    with?: Record<string, unknown>;
  }): Promise<TEntity> {
    const result = await this.findById(id, options);
    if (!result) {
      throw new NotFoundError(`${this.tableName} not found`);
    }
    return result;
  }

  /**
   * Paginated find all with type-safe result
   */
  async findAllPaginated(
    params: PaginationParams = {},
    options?: {
      where?: unknown;
      columns?: (keyof TEntity)[];
      with?: Record<string, unknown>;
    }
  ): Promise<PaginationResult<TEntity>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const offset = (page - 1) * limit;

    try {
      // Build count query
      const countQuery = db.select({ value: count() }).from(this.table as PgTable);
      if (options?.where) {
        countQuery.where(options.where as Parameters<typeof countQuery.where>[0]);
      }
      const countResult = await countQuery;
      const total = countResult[0]?.value ?? 0;

      // Build data query
      const dataQuery = db.select().from(this.table as PgTable);
      if (options?.where) {
        dataQuery.where(options.where as Parameters<typeof dataQuery.where>[0]);
      }

      // Apply sorting
      const sortColumn = (this.table as unknown as Record<string, unknown>)[sortBy];
      if (sortColumn) {
        dataQuery.orderBy(sortOrder === 'desc' ? desc(sql.raw(sortBy)) : asc(sql.raw(sortBy)));
      }

      // Apply pagination
      dataQuery.limit(limit).offset(offset);

      const data = await dataQuery as TEntity[];
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error finding ${this.tableName} paginated`, { params, error });
      throw error;
    }
  }

  /**
   * Soft delete (if deletedAt column exists)
   */
  async softDelete(id: string): Promise<TEntity> {
    const table = this.table as unknown as Record<string, unknown>;
    return await db.transaction(async (tx) => {
      const [result] = await tx
        .update(this.table as PgTable)
        .set({ deletedAt: new Date(), updatedAt: new Date() } as unknown as Record<string, unknown>)
        .where(eq(table.id as Parameters<typeof eq>[0], id))
        .returning() as TEntity[];

      if (!result) {
        throw new NotFoundError(`${this.tableName} not found`);
      }

      this.logger.info(`${this.tableName} soft deleted`, { id });
      return result;
    });
  }

  /**
   * Hard delete
   */
  async hardDelete(id: string): Promise<void> {
    const table = this.table as unknown as Record<string, unknown>;
    await db.transaction(async (tx) => {
      const result = await tx
        .delete(this.table as PgTable)
        .where(eq(table.id as Parameters<typeof eq>[0], id));

      if (result.rowCount === 0) {
        throw new NotFoundError(`${this.tableName} not found`);
      }

      this.logger.info(`${this.tableName} hard deleted`, { id });
    });
  }

  /**
   * Validate existence
   */
  async exists(id: string): Promise<boolean> {
    const table = this.table as unknown as Record<string, unknown>;
    const result = await db.select({ count: count() })
      .from(this.table as PgTable)
      .where(eq(table.id as Parameters<typeof eq>[0], id));

    return (result[0]?.count ?? 0) > 0;
  }

  /**
   * Count records
   */
  async count(where?: unknown): Promise<number> {
    const query = db.select({ value: count() }).from(this.table as PgTable);
    if (where) {
      query.where(where as Parameters<typeof query.where>[0]);
    }
    const result = await query;
    return result[0]?.value ?? 0;
  }
}

/**
 * Sanitize string input for safe DB operations
 */
export function sanitizeString(input: string): string {
  // Remove null bytes and control characters
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * Validate ID format (UUID v4)
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate and sanitize pagination params
 */
export function validatePagination(params: PaginationParams): Required<PaginationParams> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';
  const sortBy = params.sortBy || 'createdAt';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Safe search query builder
 */
export function buildSearchQuery(
  searchTerm: string,
  fields: string[],
  tablePrefix?: string
): ReturnType<typeof or> | undefined {
  if (!searchTerm?.trim()) return undefined;

  const sanitized = sanitizeString(searchTerm).replace(/[%_]/g, '\\$&');
  if (!sanitized) return undefined;

  const conditions = fields.map(field => {
    const column = tablePrefix ? sql.raw(`${tablePrefix}.${field}`) : sql.raw(field);
    return like(column, `%${sanitized}%`);
  });

  return or(...conditions);
}
