import { z } from 'zod';
import { logger } from './logger';

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string[]>,
    public code = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().uuid({ message: 'Invalid ID format' }),
  
  email: z.string().email({ message: 'Invalid email format' }).max(255),
  
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(50, { message: 'Username must be at most 50 characters' })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' }),
  
  slug: z.string()
    .min(1, { message: 'Slug is required' })
    .max(100, { message: 'Slug must be at most 100 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }),
  
  moneyAmount: z.number()
    .int({ message: 'Amount must be an integer' })
    .min(0, { message: 'Amount must be non-negative' })
    .max(999999999, { message: 'Amount exceeds maximum limit' }),
  
  percentage: z.number()
    .min(0, { message: 'Percentage must be non-negative' })
    .max(100, { message: 'Percentage cannot exceed 100' }),
  
  url: z.string().url({ message: 'Invalid URL format' }).max(2048),
  
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Invalid hex color format' }),
  
  searchTerm: z.string()
    .min(1, { message: 'Search term is required' })
    .max(100, { message: 'Search term too long' })
    .transform(s => s.trim()),
};

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Validate data against schema with detailed error handling
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const fields: Record<string, string[]> = {};

    result.error.issues.forEach((err: z.ZodIssue) => {
      const path = err.path.join('.');
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path].push(err.message);
    });

    logger.warn('Validation failed', { context, fields, data: sanitizeForLog(data) });

    throw new ValidationError(
      context ? `Validation failed: ${context}` : 'Validation failed',
      fields
    );
  }

  return result.data;
}

/**
 * Partial validation for updates
 */
export function validatePartial<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string
): T {
  const partialSchema = schema instanceof z.ZodObject
    ? schema.partial()
    : schema;
  return validateWithSchema(partialSchema as z.ZodType<T>, data, context);
}

/**
 * Sanitize data for safe logging (remove sensitive fields)
 */
function sanitizeForLog(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn'];
  const sanitized = { ...data as Record<string, unknown> };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxSizeMB?: number;
  }
): { valid: boolean; error?: string } {
  const { maxSize, allowedTypes, maxSizeMB } = options;
  
  const sizeLimit = maxSize || (maxSizeMB ? maxSizeMB * 1024 * 1024 : undefined);
  
  if (sizeLimit && file.size > sizeLimit) {
    return {
      valid: false,
      error: `File size exceeds limit of ${Math.round(sizeLimit / 1024 / 1024)}MB`
    };
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check for common executable extensions
  const dangerousExtensions = ['.exe', '.dll', '.bat', '.cmd', '.sh', '.php', '.jsp'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (dangerousExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Executable files are not allowed'
    };
  }
  
  return { valid: true };
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(
  identifier: string,
  action: string
): string {
  return `ratelimit:${action}:${identifier}`;
}

/**
 * Input sanitization helpers
 */
export const sanitizers = {
  /**
   * Trim and normalize whitespace
   */
  text: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  },
  
  /**
   * Normalize email
   */
  email: (input: string): string => {
    return input.toLowerCase().trim();
  },
  
  /**
   * Normalize slug
   */
  slug: (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
  
  /**
   * Remove dangerous characters from filename
   */
  filename: (input: string): string => {
    return input
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\.\./g, '_')
      .substring(0, 255);
  }
};
