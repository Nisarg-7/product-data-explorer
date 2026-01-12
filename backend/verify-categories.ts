import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const navs = await prisma.navigation.findMany({
    include: { categories: true }
  });
  
  console.log('\n=== NAVIGATIONS & CATEGORIES ===\n');
  
  navs.forEach(nav => {
    console.log(`📚 ${nav.title} (ID: ${nav.id})`);
    nav.categories.forEach(cat => {
      console.log(`  - ${cat.title} (ID: ${cat.id}, slug: ${cat.slug})`);
    });
    console.log('');
  });
  
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  
  console.log(`\n=== PRODUCT ASSIGNMENTS ===\n`);
  products.forEach(p => {
    console.log(`${p.title} -> Category: ${p.category.title} (ID: ${p.categoryId})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
