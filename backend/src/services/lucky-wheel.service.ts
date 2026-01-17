import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { BadRequestError, NotFoundError } from '../utils/errors';

export const luckyWheelService = {
  async getStatus() {
    const setting = await db.query.systemSettings.findFirst({
      where: eq(schema.systemSettings.key, 'LUCKY_WHEEL_ENABLED')
    });
    return setting ? setting.value === true : true; // Default to true if not set
  },

  async getActiveRewards() {
    // Check if lucky wheel is enabled in system settings
    const setting = await db.query.systemSettings.findFirst({
      where: eq(schema.systemSettings.key, 'LUCKY_WHEEL_ENABLED')
    });
    
    if (setting && setting.value === false) {
      return [];
    }

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
  },

  async spin(userId: string) {
    // Check if lucky wheel is enabled in system settings
    const setting = await db.query.systemSettings.findFirst({
      where: eq(schema.systemSettings.key, 'LUCKY_WHEEL_ENABLED')
    });
    
    if (setting && setting.value === false) {
      throw new BadRequestError('ระบบวงล้อเสี่ยงโชคปิดปรับปรุงชั่วคราว');
    }

    // 1. Get user and check points
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { points: true, balance: true },
    });

    if (!user) throw new NotFoundError('User not found');

    const SPIN_COST = 100; // Define spin cost (could be a setting later)
    if (user.points < SPIN_COST) {
      throw new BadRequestError('Insufficient points. You need ' + SPIN_COST + ' points to spin.');
    }

    // 2. Get active rewards
    const rewards = await db.query.luckyWheelRewards.findMany({
      where: eq(schema.luckyWheelRewards.isActive, true),
    });

    if (rewards.length === 0) {
      throw new BadRequestError('No active rewards available at the moment.');
    }

    // 3. Randomize reward based on probability
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

    // Fallback to first reward if something goes wrong with precision
    const selectedReward = selected || rewards[0];

    if (!selectedReward) {
      throw new BadRequestError('Failed to select a reward.');
    }

    // 4. Update user points/balance and record history in a transaction
    return await db.transaction(async (tx) => {
      // Atomic subtract points with check
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

      // Award reward
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

      // Record history
      const [history] = await tx.insert(schema.luckyWheelHistory).values({
        userId,
        rewardId: selectedReward.id,
        cost: SPIN_COST,
      }).returning();

      if (!history) throw new Error('Failed to record spin history');

      // Record transaction log
      await tx.insert(schema.transactions).values({
        userId,
        type: selectedReward.type === 'POINTS' ? 'POINTS_EARNED' : 'BONUS',
        amount: selectedReward.type === 'BALANCE' ? selectedReward.value : 0,
        points: selectedReward.type === 'POINTS' ? Math.floor(selectedReward.value) : 0,
        status: 'COMPLETED',
        paymentMethod: 'LUCKY_WHEEL',
        paymentRef: history.id,
      });

      // Get full history with reward details for response
      const finalHistory = await tx.query.luckyWheelHistory.findFirst({
        where: eq(schema.luckyWheelHistory.id, history.id),
        with: {
          reward: true,
        },
      });

      return finalHistory;
    });
  },

  async getUserHistory(userId: string) {
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
  },

  // Admin methods
  async getAllRewards() {
    return await db.query.luckyWheelRewards.findMany({
      orderBy: [desc(schema.luckyWheelRewards.createdAt)],
    });
  },

  async createReward(data: {
    name: string;
    type: 'POINTS' | 'BALANCE';
    value: number;
    probability: number;
    color?: string;
    image?: string;
  }) {
    const [reward] = await db.insert(schema.luckyWheelRewards).values(data as any).returning();
    return reward;
  },

  async updateReward(id: string, data: any) {
    const [reward] = await db.update(schema.luckyWheelRewards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.luckyWheelRewards.id, id))
      .returning();
    return reward;
  },

  async deleteReward(id: string) {
    const [reward] = await db.delete(schema.luckyWheelRewards).where(eq(schema.luckyWheelRewards.id, id)).returning();
    return reward;
  },
};
