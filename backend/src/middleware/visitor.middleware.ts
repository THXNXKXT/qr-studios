import type { Context, Next } from 'hono';
import { statsService } from '../services/stats.service';

export const visitorTracker = async (c: Context, next: Next) => {
  // Track only for public API or page requests, avoid assets/internal calls
  const path = c.req.path;
  if (path.startsWith('/api') && !path.includes('/admin') && !path.includes('/health')) {
    // Basic tracking: in production you might want to use cookies/IP to avoid overcounting
    // For now, we increment on every main API call to simulate activity
    try {
      await statsService.incrementVisitors();
    } catch (error) {
      console.error('Failed to increment visitor count:', error);
    }
  }
  await next();
};
