import type { Context } from 'hono';
import { statsService } from '../services/stats.service';
import { success } from '../utils/response';

export const statsController = {
  async getPublicStats(c: Context) {
    const stats = await statsService.getPublicStats();
    c.header('Cache-Control', 'public, max-age=600'); // Cache for 10 mins
    return success(c, stats);
  }
};
