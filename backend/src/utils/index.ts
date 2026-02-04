/**
 * Backend Utilities Index
 * 
 * Centralized exports for all utility modules
 */

// Base service and database utilities
export * from './base.service';
export * from './db-optimization';
export * from './cache';

// Validation and security
export * from './validation';
export * from './security';

// Response helpers
export * from './response';
export * from './errors';

// Logging
export { logger, dbLogger, authLogger, stripeLogger, r2Logger, emailLogger } from './logger';

// Common types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    fields?: Record<string, string[]>;
  };
  meta?: {
    timestamp?: string;
    requestId?: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResult<T> {
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
