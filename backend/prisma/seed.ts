import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const logger = new Logger('DatabaseSeed');

async function seed() {
  try {
    // Seed navigation
    const books = await prisma.navigation.upsert({
      where: { slug: 'books' },
      update: {},
      create: {
        title: 'Books',
        slug: 'books',
        description: 'Browse our extensive collection of books',
      },
    });

    const categoriesNav = await prisma.navigation.upsert({
      where: { slug: 'categories' },
      update: {},
      create: {
        title: 'Categories',
        slug: 'categories',
        description: 'Browse by category',
      },
    });

    const childrenBooks = await prisma.navigation.upsert({
      where: { slug: 'childrens-books' },
      update: {},
      create: {
        title: "Children's Books",
        slug: 'childrens-books',
        description: "Books for children",
      },
    });

    // ========== BOOKS NAVIGATION CATEGORIES ==========
    const fiction = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: books.id, slug: 'fiction' } },
      update: {},
      create: {
        navigationId: books.id,
        title: 'Fiction',
        slug: 'fiction',
        description: 'Fiction novels and stories',
        productCount: 0,
      },
    });

    const nonFiction = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: books.id, slug: 'non-fiction' } },
      update: {},
      create: {
        navigationId: books.id,
        title: 'Non-Fiction',
        slug: 'non-fiction',
        description: 'Non-fiction books',
        productCount: 0,
      },
    });

    // ========== CATEGORIES NAVIGATION (Browse all categories) ==========
    const actionAdventure = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: categoriesNav.id, slug: 'action-adventure' } },
      update: {},
      create: {
        navigationId: categoriesNav.id,
        title: 'Action & Adventure',
        slug: 'action-adventure',
        description: 'Thrilling action-packed stories',
        productCount: 0,
      },
    });

    const romance = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: categoriesNav.id, slug: 'romance' } },
      update: {},
      create: {
        navigationId: categoriesNav.id,
        title: 'Romance',
        slug: 'romance',
        description: 'Love stories and romantic novels',
        productCount: 0,
      },
    });

    const mystery = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: categoriesNav.id, slug: 'mystery-thriller' } },
      update: {},
      create: {
        navigationId: categoriesNav.id,
        title: 'Mystery & Thriller',
        slug: 'mystery-thriller',
        description: 'Mystery and crime thrillers',
        productCount: 0,
      },
    });

    const sciFi = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: categoriesNav.id, slug: 'sci-fi-fantasy' } },
      update: {},
      create: {
        navigationId: categoriesNav.id,
        title: 'Sci-Fi & Fantasy',
        slug: 'sci-fi-fantasy',
        description: 'Science fiction and fantasy worlds',
        productCount: 0,
      },
    });

    const biography = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: categoriesNav.id, slug: 'biography' } },
      update: {},
      create: {
        navigationId: categoriesNav.id,
        title: 'Biography & Memoir',
        slug: 'biography',
        description: 'Real life stories and memoirs',
        productCount: 0,
      },
    });

    // ========== CHILDREN'S BOOKS NAVIGATION ==========
    const pictureBks = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: childrenBooks.id, slug: 'picture-books' } },
      update: {},
      create: {
        navigationId: childrenBooks.id,
        title: 'Picture Books',
        slug: 'picture-books',
        description: 'Illustrated books for young children',
        productCount: 0,
      },
    });

    const earlyReaders = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: childrenBooks.id, slug: 'early-readers' } },
      update: {},
      create: {
        navigationId: childrenBooks.id,
        title: 'Early Readers',
        slug: 'early-readers',
        description: 'Books for children learning to read',
        productCount: 0,
      },
    });

    const chapterBooks = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: childrenBooks.id, slug: 'chapter-books' } },
      update: {},
      create: {
        navigationId: childrenBooks.id,
        title: 'Chapter Books',
        slug: 'chapter-books',
        description: 'Longer stories for developing readers',
        productCount: 0,
      },
    });

    const middleGrade = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: childrenBooks.id, slug: 'middle-grade' } },
      update: {},
      create: {
        navigationId: childrenBooks.id,
        title: 'Middle Grade',
        slug: 'middle-grade',
        description: 'Books for ages 8-12',
        productCount: 0,
      },
    });

    const youngAdult = await prisma.category.upsert({
      where: { navigationId_slug: { navigationId: childrenBooks.id, slug: 'young-adult' } },
      update: {},
      create: {
        navigationId: childrenBooks.id,
        title: 'Young Adult',
        slug: 'young-adult',
        description: 'Books for teens',
        productCount: 0,
      },
    });

    logger.log('✅ Database seeded successfully');
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error(`❌ Seeding failed: ${error.message}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
