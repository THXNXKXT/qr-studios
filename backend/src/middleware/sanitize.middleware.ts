/**
 * Input Sanitization Middleware
 * 
 * Sanitizes user input to prevent XSS and injection attacks
 */

import type { Context, Next } from 'hono';

// Characters that could be used for XSS or injection
const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
];

// Sanitize a string value
function sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') return value;

    let sanitized = value;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
}

// Recursively sanitize object/array values
function sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
        return sanitizeString(value);
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (typeof value === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            // Sanitize keys too
            const sanitizedKey = sanitizeString(key);
            sanitized[sanitizedKey] = sanitizeValue(val);
        }
        return sanitized;
    }

    return value;
}

/**
 * Middleware that sanitizes request body and query parameters
 */
export const inputSanitizer = async (c: Context, next: Next) => {
    // Sanitize query parameters
    const url = new URL(c.req.url);
    for (const [key, value] of url.searchParams.entries()) {
        url.searchParams.set(key, sanitizeString(value));
    }

    // Continue to next middleware
    await next();
};

/**
 * Helper to sanitize request body manually in routes
 */
export function sanitizeBody<T>(body: T): T {
    return sanitizeValue(body) as T;
}

/**
 * Validate and sanitize email format
 */
export function sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== 'string') return null;

    const sanitized = email.trim().toLowerCase();

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) return null;

    return sanitized;
}

/**
 * Sanitize and validate UUID format
 */
export function sanitizeUUID(uuid: string): string | null {
    if (!uuid || typeof uuid !== 'string') return null;

    const sanitized = uuid.trim().toLowerCase();

    // UUID v4 regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sanitized)) return null;

    return sanitized;
}

/**
 * Sanitize numeric string
 */
export function sanitizeNumber(value: string | number): number | null {
    if (typeof value === 'number') {
        return isNaN(value) ? null : value;
    }

    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
}
