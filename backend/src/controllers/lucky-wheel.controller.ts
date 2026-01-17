import type { Context } from 'hono';
import { luckyWheelService } from '../services/lucky-wheel.service';

export const luckyWheelController = {
  async getStatus(c: Context) {
    const status = await luckyWheelService.getStatus();
    return c.json({ success: true, data: { enabled: status } });
  },

  async getActiveRewards(c: Context) {
    const rewards = await luckyWheelService.getActiveRewards();
    return c.json({ success: true, data: rewards });
  },

  async spin(c: Context) {
    const user = c.get('user');
    const result = await luckyWheelService.spin(user.id);
    return c.json({ success: true, data: result });
  },

  async getUserHistory(c: Context) {
    const user = c.get('user');
    const history = await luckyWheelService.getUserHistory(user.id);
    return c.json({ success: true, data: history });
  },

  // Admin controllers
  async getAllRewards(c: Context) {
    const rewards = await luckyWheelService.getAllRewards();
    return c.json({ success: true, data: rewards });
  },

  async createReward(c: Context) {
    const body = await c.req.json();
    const reward = await luckyWheelService.createReward(body);
    return c.json({ success: true, data: reward });
  },

  async updateReward(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    const reward = await luckyWheelService.updateReward(id, body);
    return c.json({ success: true, data: reward });
  },

  async deleteReward(c: Context) {
    const id = c.req.param('id');
    await luckyWheelService.deleteReward(id);
    return c.json({ success: true, message: 'Reward deleted successfully' });
  }
};
