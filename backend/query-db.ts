import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { detail: true, reviews: true }
  });
  
  console.log('\n=== PRODUCTS ===');
  console.log(`Total products: ${products.length}`);
  
  products.forEach(p => {
    console.log(`\nProduct ID ${p.id}: ${p.title}`);
    console.log(`  - Has detail: ${p.detail ? 'YES' : 'NO'}`);
    console.log(`  - Reviews: ${p.reviews.length}`);
    if (p.detail) {
      console.log(`  - Description: ${p.detail.description ? 'YES' : 'NO'}`);
      console.log(`  - ISBN: ${p.detail.isbn || 'NONE'}`);
      console.log(`  - Publisher: ${p.detail.publisher || 'NONE'}`);
    }
  });

  const categories = await prisma.category.findMany();
  console.log('\n=== CATEGORIES ===');
  console.log(`Total categories: ${categories.length}`);
  categories.forEach(c => {
    console.log(`Category ${c.id}: ${c.title} (${c.productCount} products)`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
