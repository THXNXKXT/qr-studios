import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import stripe from '../config/stripe';
import { env } from '../config/env';
import { BadRequestError } from '../utils/errors';
import { emailService } from './email.service';

const TOPUP_PACKAGES = [
  { amount: 100, bonus: 0 },
  { amount: 500, bonus: 15 },
  { amount: 1000, bonus: 50 },
  { amount: 2000, bonus: 160 },
  { amount: 5000, bonus: 500 },
];

export const topupService = {
  getTopupPackages() {
    return TOPUP_PACKAGES.map((pkg) => ({
      amount: pkg.amount,
      bonus: pkg.bonus,
      total: pkg.amount + pkg.bonus,
      bonusPercent: pkg.bonus > 0 ? Math.round((pkg.bonus / pkg.amount) * 100) : 0,
    }));
  },

  async createStripeTopupSession(userId: string, amount: number) {
    console.log(`[TopupService] Creating session for user ${userId}, amount: ${amount}`);
    
    if (amount < 100) {
      console.warn(`[TopupService] Invalid amount: ${amount}`);
      throw new BadRequestError('Minimum topup amount is ฿100');
    }

    // Calculate bonus based on tiers (Adjusted rates, Max 10%)
    let bonus = 0;
    if (amount >= 5000) bonus = Math.floor(amount * 0.10); // 10% (was 8%)
    else if (amount >= 2000) bonus = Math.floor(amount * 0.08); // 8% (was 6%)
    else if (amount >= 1000) bonus = Math.floor(amount * 0.05); // 5% (was 4%)
    else if (amount >= 500) bonus = Math.floor(amount * 0.03); // 3% (was 2%)

    console.log(`[TopupService] Calculated bonus: ${bonus}`);

    try {
      const [transaction] = await db.insert(schema.transactions).values({
        userId,
        type: 'TOPUP',
        amount: amount,
        bonus: bonus,
        status: 'PENDING',
        paymentMethod: 'stripe',
      }).returning();

      if (!transaction) throw new Error('Failed to create transaction');

      console.log(`[TopupService] Created transaction: ${transaction.id}`);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'promptpay'],
        line_items: [
          {
            price_data: {
              currency: 'thb',
              product_data: {
                name: `Top-up ฿${amount.toLocaleString()}`,
                description: bonus > 0 
                  ? `Includes ฿${bonus.toLocaleString()} bonus (Total: ฿${(amount + bonus).toLocaleString()})` 
                  : undefined,
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${env.FRONTEND_URL}/dashboard/topup/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.FRONTEND_URL}/dashboard/topup/cancel`,
        metadata: {
          transactionId: transaction.id,
          userId,
          type: 'topup',
        },
      });

      console.log(`[TopupService] Created Stripe session: ${session.id}`);

      await db.update(schema.transactions)
        .set({ paymentRef: session.id })
        .where(eq(schema.transactions.id, transaction.id));

      return {
        transactionId: transaction.id,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('[TopupService] Error creating session:', error);
      throw error;
    }
  },

  async completeTopup(transactionId: string, paymentMethod?: string) {
    console.log(`[TopupService] Completing transaction: ${transactionId}${paymentMethod ? ` with method: ${paymentMethod}` : ''}`);
    
    return await db.transaction(async (tx) => {
      // 1. Double check transaction existence and status
      const transaction = await tx.query.transactions.findFirst({
        where: eq(schema.transactions.id, transactionId),
      });

      if (!transaction) {
        throw new BadRequestError('Transaction not found');
      }

      if (transaction.status !== 'PENDING') {
        console.log(`[TopupService] Transaction already processed: ${transactionId}, status: ${transaction.status}`);
        return transaction;
      }

      // 2. Atomic update with status check to prevent race conditions (double top-up)
      const updateResult = await tx.update(schema.transactions)
        .set({ 
          status: 'COMPLETED',
          paymentMethod: paymentMethod || transaction.paymentMethod
        })
        .where(
          and(
            eq(schema.transactions.id, transactionId),
            eq(schema.transactions.status, 'PENDING')
          )
        )
        .returning();

      // If no rows were updated, it means another request already completed it
      if (updateResult.length === 0) {
        console.log(`[TopupService] Race condition: Transaction ${transactionId} was already completed by another request`);
        return await tx.query.transactions.findFirst({ where: eq(schema.transactions.id, transactionId) });
      }

      const [updatedUser] = await tx.update(schema.users)
        .set({
          balance: sql`${schema.users.balance} + ${transaction.amount + transaction.bonus}`,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, transaction.userId))
        .returning();

      await tx.insert(schema.notifications).values({
        userId: transaction.userId,
        title: 'Top-up Successful',
        message: `Your account has been credited with ฿${transaction.amount + transaction.bonus}`,
        type: 'SYSTEM',
      });

      // Send email confirmation
      if (updatedUser?.email) {
        await emailService.sendTopupConfirmation(updatedUser.email, {
          amount: transaction.amount,
          bonus: transaction.bonus,
          newBalance: updatedUser.balance,
        }).catch(err => console.error('[EMAIL] Failed to send top-up confirmation:', err));
      }

      return await tx.query.transactions.findFirst({ where: eq(schema.transactions.id, transactionId) });
    });
  },

  async cancelTopup(transactionId: string, status: 'FAILED' | 'CANCELLED' = 'CANCELLED') {
    console.log(`[TopupService] Cancelling transaction: ${transactionId} with status: ${status}`);
    
    // Atomic status update to prevent race conditions with completion
    const result = await db.update(schema.transactions)
      .set({ status })
      .where(
        and(
          eq(schema.transactions.id, transactionId),
          eq(schema.transactions.status, 'PENDING')
        )
      )
      .returning();

    const updatedTransaction = await db.query.transactions.findFirst({
      where: eq(schema.transactions.id, transactionId),
    });

    if (!updatedTransaction) {
      console.error(`[TopupService] Transaction not found for cancellation: ${transactionId}`);
      return null;
    }

    if (result.length === 0 && updatedTransaction.status !== status) {
      console.log(`[TopupService] Transaction cannot be cancelled, current status is: ${updatedTransaction.status}`);
    }

    return updatedTransaction;
  },

  async verifyStripeSession(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (session.payment_status === 'paid' && session.metadata?.type === 'topup') {
      const transactionId = session.metadata.transactionId;
      if (!transactionId) {
        throw new BadRequestError('Transaction ID not found in session metadata');
      }

      let paymentMethod = 'stripe';
      if (session.payment_intent && typeof session.payment_intent !== 'string') {
        const pi = session.payment_intent as any;
        paymentMethod = pi.payment_method_types?.[0] || 'stripe';
      }

      return await topupService.completeTopup(transactionId, paymentMethod);
    }

    return null;
  },

  async getTopupHistory(userId: string) {
    const transactionsData = await db.query.transactions.findMany({
      where: and(
        eq(schema.transactions.userId, userId),
        eq(schema.transactions.type, 'TOPUP')
      ),
      columns: {
        id: true,
        type: true,
        amount: true,
        bonus: true,
        status: true,
        paymentMethod: true,
        paymentRef: true,
        createdAt: true,
      },
      orderBy: [desc(schema.transactions.createdAt)],
      limit: 50,
    });

    return transactionsData;
  },
};
