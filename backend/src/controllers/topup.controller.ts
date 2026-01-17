import type { Context } from 'hono';
import { topupService } from '../services/topup.service';
import { success } from '../utils/response';
import { sessionIdParamSchema, createTopupSessionSchema } from '../schemas';

export const topupController = {
  async getPackages(c: Context) {
    const packages = topupService.getTopupPackages();
    return success(c, packages);
  },

  async createStripeSession(c: Context) {
    const user = c.get('user');
    const { amount } = createTopupSessionSchema.parse(await c.req.json());

    const session = await topupService.createStripeTopupSession(user.id, amount);
    return success(c, session, 'Topup session created');
  },

  async getHistory(c: Context) {
    const user = c.get('user');
    const history = await topupService.getTopupHistory(user.id);
    return success(c, history);
  },

  async verifySession(c: Context) {
    const { sessionId } = sessionIdParamSchema.parse(c.req.param());
    
    const result = await topupService.verifyStripeSession(sessionId);
    return success(c, result);
  },
};
