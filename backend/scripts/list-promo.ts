import { db } from '../src/db';

async function main() {
  try {
    const promoCodes = await db.query.promoCodes.findMany();
    console.log('Promo codes in database:');
    console.log(JSON.stringify(promoCodes, null, 2));
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    process.exit(1);
  }
}

main();
