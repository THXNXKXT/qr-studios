import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const discordId = "295748109177323520";
  const amountToAdd = 100000;

  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.discordId, discordId)
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    const [updatedUser] = await db.update(schema.users)
      .set({
        balance: sql`${schema.users.balance} + ${amountToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(schema.users.discordId, discordId))
      .returning();

    console.log(`✅ Balance added to user: ${updatedUser.username}`);
    console.log(`New balance: ${updatedUser.balance}`);

    // Create a transaction record
    await db.insert(schema.transactions).values({
      userId: updatedUser.id,
      type: 'BONUS',
      amount: amountToAdd,
      status: 'COMPLETED',
      paymentMethod: 'ADMIN_MANUAL',
      paymentRef: 'ADMIN_MANUAL_BONUS',
    });

    console.log('✅ Transaction record created');
  } catch (error) {
    console.error('Error adding balance:', error);
    process.exit(1);
  }
}

main();
