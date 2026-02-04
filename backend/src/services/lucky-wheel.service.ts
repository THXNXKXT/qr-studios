import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { trackedQuery, logger as baseLogger } from '../utils';

const logger = baseLogger.child('[LuckyWheelService]');

class LuckyWheelService {
  private logger = logger;

  async getStatus() {
    const setting = await trackedQuery(async () => {
      return await db.query.systemSettings.findFirst({
        where: eq(schema.systemSettings.key, 'LUCKY_WHEEL_ENABLED')
      });
    }, 'luckyWheel.getStatus');
    return setting ? setting.value === true : true;
  }

  async getActiveRewards() {
    const setting = await trackedQuery(async () => {
      return await db.query.systemSettings.findFirst({
        where: eq(schema.systemSettings.key, 'LUCKY_WHEEL_ENABLED')
      });
    }, 'luckyWheel.getActiveRewards.checkEnabled');

    if (setting && setting.value === false) {
      return [];
    }

    return await trackedQuery(async () => {
      return await db.query.luckyWheelRewards.findMany({
        where: eq(schema.luckyWheelRewards.isActive, true),
        columns: {
          id: true,
          name: true,
          type: true,
          value: true,
          color: true,
          image: true,
        },
        orderBy: [schema.luckyWheelRewards.createdAt],
      });
    }, 'luckyWheel.getActiveRewards');
  }

  async spin(userId: string) {
    const setting = await trackedQuery(async () => {
      return await db.query.systemSettings.findFirst({
        where: eq(schema.systemSettings.key, 'LUCKY_WHEEL_ENABLED')
      });
    }, 'luckyWheel.spin.checkEnabled');

    if (setting && setting.value === false) {
      throw new BadRequestError('ระบบวงล้อเสี่ยงโชคปิดปรับปรุงชั่วคราว');
    }

    const user = await trackedQuery(async () => {
      return await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { points: true, balance: true },
      });
    }, 'luckyWheel.spin.getUser');

    if (!user) throw new NotFoundError('User not found');

    const SPIN_COST = 100;
    if (user.points < SPIN_COST) {
      throw new BadRequestError('Insufficient points. You need ' + SPIN_COST + ' points to spin.');
    }

    const rewards = await trackedQuery(async () => {
      return await db.query.luckyWheelRewards.findMany({
        where: eq(schema.luckyWheelRewards.isActive, true),
      });
    }, 'luckyWheel.spin.getRewards');

    if (rewards.length === 0) {
      throw new BadRequestError('No active rewards available at the moment.');
    }

    const totalProb = rewards.reduce((sum: number, r: any) => sum + r.probability, 0);
    let random = Math.random() * totalProb;

    let selected: typeof rewards[0] | undefined;

    for (const reward of rewards) {
      if (random < reward.probability) {
        selected = reward;
        break;
      }
      random -= reward.probability;
    }

    const selectedReward = selected || rewards[0];

    if (!selectedReward) {
      throw new BadRequestError('Failed to select a reward.');
    }

    return await db.transaction(async (tx) => {
      const updateResult = await tx.update(schema.users)
        .set({
          points: sql`${schema.users.points} - ${SPIN_COST}`,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(schema.users.id, userId),
            sql`${schema.users.points} >= ${SPIN_COST}`
          )
        )
        .returning();

      if (updateResult.length === 0) {
        throw new BadRequestError('Insufficient points. You need ' + SPIN_COST + ' points to spin.');
      }

      if (selectedReward.type === 'POINTS') {
        await tx.update(schema.users)
          .set({
            points: sql`${schema.users.points} + ${selectedReward.value}`,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, userId));
      } else if (selectedReward.type === 'BALANCE') {
        await tx.update(schema.users)
          .set({
            balance: sql`${schema.users.balance} + ${selectedReward.value}`,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, userId));
      }

      const [history] = await tx.insert(schema.luckyWheelHistory).values({
        userId,
        rewardId: selectedReward.id,
        cost: SPIN_COST,
      }).returning();

      if (!history) throw new Error('Failed to record spin history');

      await tx.insert(schema.transactions).values({
        userId,
        type: selectedReward.type === 'POINTS' ? 'POINTS_EARNED' : 'BONUS',
        amount: selectedReward.type === 'BALANCE' ? selectedReward.value : 0,
        points: selectedReward.type === 'POINTS' ? Math.floor(selectedReward.value) : 0,
        status: 'COMPLETED',
        paymentMethod: 'LUCKY_WHEEL',
        paymentRef: history.id,
      });

      const finalHistory = await tx.query.luckyWheelHistory.findFirst({
        where: eq(schema.luckyWheelHistory.id, history.id),
        with: {
          reward: true,
        },
      });

      return finalHistory;
    });
  }

  async getUserHistory(userId: string) {
    return await trackedQuery(async () => {
      return await db.query.luckyWheelHistory.findMany({
        where: eq(schema.luckyWheelHistory.userId, userId),
        with: {
          reward: {
            columns: {
              id: true,
              name: true,
              type: true,
              value: true,
              color: true,
              image: true,
            },
          },
        },
        orderBy: [desc(schema.luckyWheelHistory.createdAt)],
        limit: 20,
      });
    }, 'luckyWheel.getUserHistory');
  }

  async getAllRewards() {
    return await trackedQuery(async () => {
      return await db.query.luckyWheelRewards.findMany({
        orderBy: [desc(schema.luckyWheelRewards.createdAt)],
      });
    }, 'luckyWheel.getAllRewards');
  }

  async createReward(data: {
    name: string;
    type: 'POINTS' | 'BALANCE';
    value: number;
    probability: number;
    color?: string;
    image?: string;
  }) {
    const [reward] = await trackedQuery(async () => {
      return await db.insert(schema.luckyWheelRewards).values(data as any).returning();
    }, 'luckyWheel.createReward');
    return reward;
  }

  async updateReward(id: string, data: any) {
    const [reward] = await trackedQuery(async () => {
      return await db.update(schema.luckyWheelRewards)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.luckyWheelRewards.id, id))
        .returning();
    }, 'luckyWheel.updateReward');
    return reward;
  }

  async deleteReward(id: string) {
    const [reward] = await trackedQuery(async () => {
      return await db.delete(schema.luckyWheelRewards)
        .where(eq(schema.luckyWheelRewards.id, id))
        .returning();
    }, 'luckyWheel.deleteReward');
    return reward;
  }
}

export const luckyWheelService = new LuckyWheelService();
