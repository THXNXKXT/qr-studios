import type { Context, Next } from 'hono';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Structured error response
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string[]>;
    requestId?: string;
  };
  stack?: string;
}

/**
 * Map of error types to HTTP status codes
 */
const errorStatusMap: Record<string, number> = {
  ValidationError: 400,
  BadRequestError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  TooManyRequestsError: 429,
  AppError: 500,
};

/**
 * Enhanced error handler with structured logging and safe responses
 */
export async function enhancedErrorHandler(err: Error, c: Context): Promise<Response> {
  const requestId = c.get('requestId') as string | undefined;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Determine status code
  const statusCode = err instanceof AppError
    ? err.statusCode
    : errorStatusMap[err.constructor.name] || 500;

  // Log error with context
  const errorLog = {
    requestId,
    error: err.message,
    type: err.constructor.name,
    statusCode,
    path: c.req.path,
    method: c.req.method,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  };

  if (statusCode >= 500) {
    logger.error('Server error', errorLog);
  } else if (statusCode >= 400) {
    logger.warn('Client error', errorLog);
  }

  // Build safe error response
  const response: ErrorResponse = {
    success: false,
    error: {
      message: isDevelopment || statusCode < 500
        ? err.message
        : 'An unexpected error occurred',
      requestId,
    },
  };

  // Add validation fields if available
  if ('fields' in err && typeof err.fields === 'object') {
    response.error.fields = err.fields as Record<string, string[]>;
  }

  // Add error code for client-side handling
  if (err instanceof AppError && err.isOperational) {
    response.error.code = err.constructor.name.replace('Error', '').toUpperCase();
  }

  // Include stack trace only in development
  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  return c.json(response, statusCode as Parameters<typeof c.json>[1]);
}

/**
 * Async handler wrapper to catch errors automatically
 */
export function asyncHandler<T extends (c: Context, next?: Next) => Promise<Response | void>>(
  handler: T
): (c: Context, next?: Next) => Promise<Response | void> {
  return async (c: Context, next?: Next) => {
    try {
      return await handler(c, next);
    } catch (err) {
      return enhancedErrorHandler(err as Error, c);
    }
  };
}

/**
 * Request timing middleware
 */
export async function requestTiming(c: Context, next: Next): Promise<void> {
  const start = performance.now();

  await next();

  const duration = performance.now() - start;
  const slowThreshold = 1000; // 1 second

  if (duration > slowThreshold) {
    logger.warn('Slow request detected', {
      path: c.req.path,
      method: c.req.method,
      duration: `${duration.toFixed(2)}ms`,
      requestId: c.get('requestId'),
    });
  }

  // Add timing header in development
  if (process.env.NODE_ENV === 'development') {
    c.header('X-Response-Time', `${duration.toFixed(2)}ms`);
  }
}

/**
 * Request logging middleware with correlation ID
 */
export async function requestLogging(c: Context, next: Next): Promise<void> {
  const requestId = c.get('requestId') as string;
  const startTime = Date.now();

  logger.info('Request started', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
  });

  await next();

  const duration = Date.now() - startTime;

  logger.info('Request completed', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
  });
}
