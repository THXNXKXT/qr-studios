import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Response interfaces for type safety
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    timestamp?: string;
    requestId?: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
  code?: string;
  meta?: {
    timestamp?: string;
    requestId?: string;
  };
}

/**
 * Send success response with optional metadata
 */
export const success = <T>(
  c: Context,
  data: T,
  message?: string,
  status: ContentfulStatusCode = 200
): Response => {
  const requestId = c.get('requestId') as string | undefined;

  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
  };

  if (requestId) {
    response.meta = { requestId, timestamp: new Date().toISOString() };
  }

  return c.json(response, status);
};

/**
 * Send created response (201)
 */
export const created = <T>(c: Context, data: T, message?: string): Response => {
  return success(c, data, message || 'Created successfully', 201);
};

/**
 * Send no content response (204)
 */
export const noContent = (c: Context): Response => {
  return c.body(null, 204);
};

/**
 * Send error response with structured format
 */
export const error = (
  c: Context,
  message: string,
  status: ContentfulStatusCode = 400,
  errors?: Record<string, string[]>,
  code?: string
): Response => {
  const requestId = c.get('requestId') as string | undefined;

  const response: ErrorResponse = {
    success: false,
    error: message,
    errors,
    code,
  };

  if (requestId) {
    response.meta = { requestId, timestamp: new Date().toISOString() };
  }

  return c.json(response, status);
};

/**
 * Common error response helpers
 */
export const notFound = (c: Context, entity: string): Response => {
  return error(c, `${entity} not found`, 404, undefined, 'NOT_FOUND');
};

export const unauthorized = (c: Context, message = 'Unauthorized'): Response => {
  return error(c, message, 401, undefined, 'UNAUTHORIZED');
};

export const forbidden = (c: Context, message = 'Forbidden'): Response => {
  return error(c, message, 403, undefined, 'FORBIDDEN');
};

export const validationError = (
  c: Context,
  fields: Record<string, string[]>,
  message = 'Validation failed'
): Response => {
  return error(c, message, 400, fields, 'VALIDATION_ERROR');
};

export const conflict = (c: Context, message: string): Response => {
  return error(c, message, 409, undefined, 'CONFLICT');
};

export const tooManyRequests = (c: Context, retryAfter?: number): Response => {
  const headers = retryAfter ? { 'Retry-After': String(retryAfter) } : undefined;
  return c.json(
    error(c, 'Too many requests', 429, undefined, 'RATE_LIMITED'),
    429,
    headers
  );
};

/**
 * Send paginated response with metadata
 */
export const paginated = <T>(
  c: Context,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response => {
  const requestId = c.get('requestId') as string | undefined;

  return c.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    meta: requestId ? { requestId, timestamp: new Date().toISOString() } : undefined,
  });
};

/**
 * Type guards for response checking
 */
export function isSuccessResponse<T>(response: unknown): response is SuccessResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true &&
    'data' in response
  );
}

export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}
