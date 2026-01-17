import type { Context, Next } from 'hono';

export const requestSizeLimit = (limitInBytes: number = 10 * 1024 * 1024) => { // Default 10MB
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    
    if (contentLength && parseInt(contentLength, 10) > limitInBytes) {
      return c.json({
        success: false,
        error: 'Payload too large',
        message: `Request body exceeds the limit of ${limitInBytes / (1024 * 1024)}MB`
      }, 413);
    }
    
    await next();
  };
};
