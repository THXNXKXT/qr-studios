import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
  try {
    const users = await db.query.users.findMany({
      limit: 5,
      orderBy: [desc(schema.users.createdAt)]
    });
    
    console.log('Last 5 users in database:');
    console.log(JSON.stringify(users, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 
      2
    ));
  } catch (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
}

main();
