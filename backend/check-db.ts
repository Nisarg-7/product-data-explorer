import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const navs = await prisma.navigation.findMany();
    const cats = await prisma.category.findMany();
    const prods = await prisma.product.findMany();
    const reviews = await prisma.review.findMany();
    
    console.log('\n📊 DATABASE STATUS:');
    console.log(`   Navigations: ${navs.length}`);
    console.log(`   Categories: ${cats.length}`);
    console.log(`   Products: ${prods.length}`);
    console.log(`   Reviews: ${reviews.length}`);
    
    if (navs.length > 0) {
      console.log('\n📍 Sample Navigation:', navs[0]);
    }
    if (cats.length > 0) {
      console.log('\n📁 Sample Category:', cats[0]);
    }
    if (prods.length > 0) {
      console.log('\n📚 Sample Product:', prods[0]);
    } else {
      console.log('\n⚠️  NO PRODUCTS IN DATABASE - Need to scrape from World of Books');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
