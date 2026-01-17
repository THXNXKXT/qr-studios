import { db } from '../src/db';

async function main() {
  try {
    const products = await db.query.products.findMany({
      columns: {
        id: true,
        name: true,
        price: true,
        stock: true,
        category: true,
      }
    });
    
    console.log('Products in database:');
    console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }
}

main();
