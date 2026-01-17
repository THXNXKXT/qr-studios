import { db } from '../src/db';
import * as schema from '../db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const promos = [
    {
      code: 'WELCOME10',
      discount: 10,
      type: 'PERCENTAGE',
      minPurchase: 100,
      maxDiscount: 50,
      isActive: true,
    },
    {
      code: 'FIXED50',
      discount: 50,
      type: 'FIXED',
      minPurchase: 200,
      isActive: true,
    },
    {
      code: 'LIMIT5',
      discount: 20,
      type: 'PERCENTAGE',
      usageLimit: 5,
      isActive: true,
    }
  ];

  console.log('Upserting promo codes...');

  for (const promo of promos) {
    try {
      await db.insert(schema.promoCodes)
        .values(promo as any)
        .onConflictDoUpdate({
          target: schema.promoCodes.code,
          set: {
            discount: promo.discount,
            type: promo.type as any,
            minPurchase: promo.minPurchase,
            maxDiscount: promo.maxDiscount,
            usageLimit: promo.usageLimit,
            isActive: promo.isActive,
          },
        });
      console.log(`✅ Upserted promo: ${promo.code}`);
    } catch (error) {
      console.error(`❌ Failed to upsert promo ${promo.code}:`, error);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
