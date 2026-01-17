/**
 * Request ID Middleware
 * 
 * Generates unique correlation IDs for request tracing.
 * - Uses client-provided X-Request-ID if present
 * - Otherwise generates a new UUID
 * - Stores in context and adds to response headers
 */

import type { Context, Next } from 'hono';
import { nanoid } from 'nanoid';

const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
    return `req_${nanoid(16)}`;
}

/**
 * Request ID middleware
 * Adds correlation ID to all requests for tracing
 */
export const requestIdMiddleware = async (c: Context, next: Next) => {
    // Use client-provided ID or generate new one
    const requestId = c.req.header(REQUEST_ID_HEADER) || generateRequestId();

    // Store in context for use in handlers and other middleware
    c.set('requestId', requestId);

    // Add start time for request duration tracking
    c.set('requestStartTime', Date.now());

    // Process the request
    await next();

    // Add request ID to response headers
    c.header(REQUEST_ID_HEADER, requestId);

    // Log request completion in development
    if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - (c.get('requestStartTime') || Date.now());
        console.log(`[Request] ${requestId} ${c.req.method} ${c.req.path} - ${duration}ms`);
    }
};

/**
 * Get request ID from context
 */
export function getRequestId(c: Context): string {
    return c.get('requestId') || 'unknown';
}

/**
 * Create a structured log entry with request context
 */
export function createLogContext(c: Context): {
    requestId: string;
    method: string;
    path: string;
    userId?: string;
} {
    const user = c.get('user') as any;
    return {
        requestId: getRequestId(c),
        method: c.req.method,
        path: c.req.path,
        userId: user?.id,
    };
}
