import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Security utilities for the backend
 */

/**
 * Generate cryptographically secure random token
 */
export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(data + usedSalt)
    .digest('hex');
  return { hash, salt: usedSalt };
}

/**
 * Compare hashes securely (timing-safe)
 */
export function compareHashes(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Mask sensitive data for logging/display
 */
export function maskSensitive(data: string, visible = 4): string {
  if (data.length <= visible * 2) return '*'.repeat(data.length);
  return data.slice(0, visible) + '*'.repeat(data.length - visible * 2) + data.slice(-visible);
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode
    .normalize('NFC')
    .trim();
}

/**
 * Validate and sanitize SQL-like patterns
 */
export function sanitizeLikePattern(pattern: string): string {
  return pattern
    .replace(/[%_]/g, '\\$&')
    .replace(/[*?]/g, (match) => match === '*' ? '%' : '_');
}

/**
 * Rate limit tracking (in-memory, use Redis in production)
 */
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check if action is allowed
   */
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Get remaining attempts
   */
  getRemaining(key: string, maxAttempts: number): number {
    const record = this.attempts.get(key);
    if (!record) return maxAttempts;
    return Math.max(0, maxAttempts - record.count);
  }

  /**
   * Reset attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Content Security Policy helpers
 */
export const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
};

/**
 * Build CSP header string
 */
export function buildCSPHeader(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      const directive = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': buildCSPHeader(cspDirectives),
};

/**
 * Validate file path to prevent path traversal
 */
export function isValidFilePath(path: string): boolean {
  // Check for path traversal attempts
  const normalized = path.replace(/\\/g, '/');
  if (normalized.includes('..')) return false;
  if (normalized.startsWith('/')) return false;
  if (/[<>:"|?*]/.test(normalized)) return false;
  return true;
}

/**
 * Escape regex special characters
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Secure comparison for strings (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
