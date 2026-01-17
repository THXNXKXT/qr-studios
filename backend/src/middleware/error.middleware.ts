import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import * as Sentry from "@sentry/bun";
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { getRequestId } from './request-id.middleware';

export const errorHandler = async (err: Error, c: Context) => {
  const path = c.req.path;
  const method = c.req.method;
  const requestId = getRequestId(c);

  // Capture error in Sentry if not a simple validation error
  if (!(err instanceof AppError && err.statusCode < 500)) {
    Sentry.captureException(err, {
      extra: {
        path,
        method,
        requestId,
        query: c.req.query(),
      }
    });
  }

  console.error(`[ErrorHandler] [${requestId}] Error on ${method} ${path}:`, err);

  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: err.message,
      requestId,
    };

    if ('errors' in err && (err as any).errors) {
      response.errors = (err as any).errors;
      console.warn(`[ErrorHandler] [${requestId}] Validation Errors for ${path}:`, JSON.stringify(response.errors, null, 2));
    }

    return c.json(response, err.statusCode as ContentfulStatusCode);
  }

  // Handle Zod validation errors from zValidator
  if (err.name === 'ZodError' || (err as any).constructor?.name === 'ZodError') {
    const errors = (err as any).errors || (err as any).issues || [];
    console.warn(`[ErrorHandler] [${requestId}] Zod Validation Error for ${path}:`, JSON.stringify(errors, null, 2));

    return c.json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request data',
      requestId,
      errors: errors.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      })),
    }, 400);
  }

  return c.json({
    success: false,
    error: env.NODE_ENV === 'development'
      ? err.message
      : 'Internal Server Error',
    requestId,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  }, 500);
};

