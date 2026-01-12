import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProducts() {
  console.log('🌱 Seeding products...\n');

  // Get all categories by navigation
  const books = await prisma.navigation.findUnique({
    where: { slug: 'books' },
    include: { categories: true }
  });

  const categoriesNav = await prisma.navigation.findUnique({
    where: { slug: 'categories' },
    include: { categories: true }
  });

  const childrenBooksNav = await prisma.navigation.findUnique({
    where: { slug: 'childrens-books' },
    include: { categories: true }
  });

  if (!books || !categoriesNav || !childrenBooksNav) {
    console.log('❌ Missing navigations. Run seed.ts first.');
    return;
  }

  // Map categories for easy lookup
  const fictionCat = books.categories.find(c => c.slug === 'fiction');
  const nonFictionCat = books.categories.find(c => c.slug === 'non-fiction');
  
  const actionAdvCat = categoriesNav.categories.find(c => c.slug === 'action-adventure');
  const romanceCat = categoriesNav.categories.find(c => c.slug === 'romance');
  const mysteryThrillerCat = categoriesNav.categories.find(c => c.slug === 'mystery-thriller');
  const sciFiFantasyCat = categoriesNav.categories.find(c => c.slug === 'sci-fi-fantasy');
  const biographyCat = categoriesNav.categories.find(c => c.slug === 'biography');

  const pictureBksCat = childrenBooksNav.categories.find(c => c.slug === 'picture-books');
  const earlyReadersCat = childrenBooksNav.categories.find(c => c.slug === 'early-readers');
  const chapterBooksCat = childrenBooksNav.categories.find(c => c.slug === 'chapter-books');
  const middleGradeCat = childrenBooksNav.categories.find(c => c.slug === 'middle-grade');
  const youngAdultCat = childrenBooksNav.categories.find(c => c.slug === 'young-adult');

  // Comprehensive product catalog with real World of Books URLs and complete category coverage
  const productsCatalog = [
    // ========== FICTION (Books Navigation) ==========
    {
      sourceId: 'wob-001',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/the-great-gatsby-f-scott-fitzgerald/9780743273565',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      price: 8.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/7930235-M.jpg',
      categoryIds: [fictionCat?.id, actionAdvCat?.id],
      description: 'A masterpiece of American literature about love, wealth, and the American Dream. Set in the Jazz Age, this novel explores themes of love, ambition, and the corruption of the American Dream.',
      isbn: 'ISBN-9780743273565',
      publisher: 'Scribner',
      pages: 180,
      ratingsAvg: 4.5,
    },
    {
      sourceId: 'wob-002',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/to-kill-a-mockingbird-harper-lee/9780061120084',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      price: 9.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8241842-M.jpg',
      categoryIds: [fictionCat?.id, mysteryThrillerCat?.id],
      description: 'A gripping tale of racial injustice and childhood innocence in the American South. A Pulitzer Prize-winning classic about moral growth and the loss of innocence.',
      isbn: 'ISBN-9780061120084',
      publisher: 'Harper',
      pages: 324,
      ratingsAvg: 4.8,
    },
    {
      sourceId: 'wob-003',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/1984-george-orwell/9780451524935',
      title: '1984',
      author: 'George Orwell',
      price: 10.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/7878060-M.jpg',
      categoryIds: [fictionCat?.id, sciFiFantasyCat?.id],
      description: 'A dystopian novel exploring totalitarianism and control in a futuristic society. A chilling vision of a surveillance state and the suppression of individual freedom.',
      isbn: 'ISBN-9780451524935',
      publisher: 'Penguin',
      pages: 328,
      ratingsAvg: 4.2,
    },
    {
      sourceId: 'wob-009',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/pride-and-prejudice-jane-austen/9780141439518',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      price: 7.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8234156-M.jpg',
      categoryIds: [fictionCat?.id, romanceCat?.id],
      description: 'A timeless romance novel exploring social class and first impressions. Elizabeth Bennet navigates society, family, and her growing feelings for the proud Mr. Darcy.',
      isbn: 'ISBN-9780141439518',
      publisher: 'Penguin Classics',
      pages: 432,
      ratingsAvg: 4.7,
    },
    {
      sourceId: 'wob-010',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/the-hobbit-j-r-r-tolkien/9780547928227',
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      price: 11.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8237210-M.jpg',
      categoryIds: [sciFiFantasyCat?.id, actionAdvCat?.id],
      description: 'A fantasy adventure following Bilbo Baggins on an unexpected quest. An epic journey of self-discovery and bravery in Middle-earth.',
      isbn: 'ISBN-9780547928227',
      publisher: 'Houghton Mifflin',
      pages: 366,
      ratingsAvg: 4.7,
    },

    // ========== NON-FICTION (Books Navigation) ==========
    {
      sourceId: 'wob-004',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/sapiens-yuval-noah-harari/9780062316097',
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      price: 12.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8237493-M.jpg',
      categoryIds: [nonFictionCat?.id, biographyCat?.id],
      description: 'A sweeping history of humankind from the Stone Age to the modern era. Explores how Homo sapiens came to dominate the world.',
      isbn: 'ISBN-9780062316097',
      publisher: 'HarperCollins',
      pages: 480,
      ratingsAvg: 4.4,
    },
    {
      sourceId: 'wob-005',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/thinking-fast-and-slow-daniel-kahneman/9780374533557',
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      price: 11.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8233156-M.jpg',
      categoryIds: [nonFictionCat?.id],
      description: 'An exploration of human decision-making and cognitive biases. Understand the two systems of thought that drive our behavior.',
      isbn: 'ISBN-9780374533557',
      publisher: 'Farrar, Straus and Giroux',
      pages: 512,
      ratingsAvg: 4.3,
    },

    // ========== ADDITIONAL FICTION FOR CATEGORIES COVERAGE ==========
    {
      sourceId: 'wob-014',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/the-fault-in-our-stars-john-green/9780143039631',
      title: 'The Fault in Our Stars',
      author: 'John Green',
      price: 8.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8404199-M.jpg',
      categoryIds: [romanceCat?.id, youngAdultCat?.id],
      description: 'A poignant story of two teenagers who fall in love while battling illness. An emotional journey about life, love, and loss.',
      isbn: 'ISBN-9780143039631',
      publisher: 'Penguin Press',
      pages: 313,
      ratingsAvg: 4.6,
    },
    {
      sourceId: 'wob-015',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/the-girl-with-the-dragon-tattoo-stieg-larsson/9780307269935',
      title: 'The Girl with the Dragon Tattoo',
      author: 'Stieg Larsson',
      price: 10.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8234895-M.jpg',
      categoryIds: [mysteryThrillerCat?.id],
      description: 'A gripping mystery about a journalist and a hacker investigating a cold case. Dark, intense, and impossible to put down.',
      isbn: 'ISBN-9780307269935',
      publisher: 'Knopf',
      pages: 465,
      ratingsAvg: 4.4,
    },
    {
      sourceId: 'wob-016',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/the-martian-andy-weir/9780553418026',
      title: 'The Martian',
      author: 'Andy Weir',
      price: 9.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8402948-M.jpg',
      categoryIds: [sciFiFantasyCat?.id, actionAdvCat?.id],
      description: 'A thrilling sci-fi adventure about an astronaut stranded on Mars. A gripping story of survival, ingenuity, and humor.',
      isbn: 'ISBN-9780553418026',
      publisher: 'Crown',
      pages: 369,
      ratingsAvg: 4.8,
    },

    // ========== CHILDREN'S BOOKS ==========
    {
      sourceId: 'wob-006',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/the-very-hungry-caterpillar-eric-carle/9780399208515',
      title: 'The Very Hungry Caterpillar',
      author: 'Eric Carle',
      price: 6.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8087208-M.jpg',
      categoryIds: [pictureBksCat?.id],
      description: 'A beloved picture book about transformation and growth. Teaches counting, days of the week, and metamorphosis.',
      isbn: 'ISBN-9780399208515',
      publisher: 'World Publishing',
      pages: 32,
      ratingsAvg: 4.9,
    },
    {
      sourceId: 'wob-007',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/where-the-wild-things-are-maurice-sendak/9780064431729',
      title: 'Where the Wild Things Are',
      author: 'Maurice Sendak',
      price: 7.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8091673-M.jpg',
      categoryIds: [pictureBksCat?.id],
      description: 'A whimsical adventure of imagination and the comfort of home. A timeless exploration of childhood imagination.',
      isbn: 'ISBN-9780064431729',
      publisher: 'Harper & Row',
      pages: 40,
      ratingsAvg: 4.8,
    },
    {
      sourceId: 'wob-008',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/charlottes-web-e-b-white/9780061124952',
      title: 'Charlotte\'s Web',
      author: 'E.B. White',
      price: 8.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8240589-M.jpg',
      categoryIds: [chapterBooksCat?.id, middleGradeCat?.id],
      description: 'A heartwarming story of friendship between a girl, a pig, and a spider. A timeless classic about friendship, loss, and legacy.',
      isbn: 'ISBN-9780061124952',
      publisher: 'Harper & Row',
      pages: 184,
      ratingsAvg: 4.8,
    },
    {
      sourceId: 'wob-011',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/the-lion-the-witch-and-the-wardrobe-c-s-lewis/9780064405669',
      title: 'The Lion, the Witch and the Wardrobe',
      author: 'C.S. Lewis',
      price: 7.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8227910-M.jpg',
      categoryIds: [middleGradeCat?.id, sciFiFantasyCat?.id],
      description: 'Four children discover a magical world through an enchanted wardrobe. An epic adventure in the magical land of Narnia.',
      isbn: 'ISBN-9780064405669',
      publisher: 'Harper Trophy',
      pages: 206,
      ratingsAvg: 4.7,
    },
    {
      sourceId: 'wob-012',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/the-hunger-games-suzanne-collins/9780439023481',
      title: 'The Hunger Games',
      author: 'Suzanne Collins',
      price: 9.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8235671-M.jpg',
      categoryIds: [youngAdultCat?.id, actionAdvCat?.id, sciFiFantasyCat?.id],
      description: 'A dystopian adventure where teenagers fight for survival. A thrilling tale of rebellion, survival, and courage.',
      isbn: 'ISBN-9780439023481',
      publisher: 'Scholastic Press',
      pages: 384,
      ratingsAvg: 4.6,
    },
    {
      sourceId: 'wob-013',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/percy-jackson-the-lightning-thief-rick-riordan/9780375815683',
      title: 'Percy Jackson: The Lightning Thief',
      author: 'Rick Riordan',
      price: 8.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8238452-M.jpg',
      categoryIds: [middleGradeCat?.id, actionAdvCat?.id, sciFiFantasyCat?.id],
      description: 'A young boy discovers he is the son of a Greek god and goes on an epic adventure. Action-packed fantasy perfect for middle-grade readers.',
      isbn: 'ISBN-9780375815683',
      publisher: 'Hyperion',
      pages: 375,
      ratingsAvg: 4.5,
    },
    {
      sourceId: 'wob-017',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/harry-potter-philosophers-stone-j-k-rowling/9780747532699',
      title: 'Harry Potter and the Philosopher\'s Stone',
      author: 'J.K. Rowling',
      price: 9.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8237491-M.jpg',
      categoryIds: [middleGradeCat?.id, youngAdultCat?.id, sciFiFantasyCat?.id],
      description: 'A young wizard discovers his magical heritage and attends a magical school. The book that started a global phenomenon.',
      isbn: 'ISBN-9780747532699',
      publisher: 'Bloomsbury',
      pages: 309,
      ratingsAvg: 4.8,
    },
    {
      sourceId: 'wob-019',
      sourceUrl: 'https://www.worldofbooks.com/en-gb/books/curious-george-h-a-rey/9780547207599',
      title: 'Curious George',
      author: 'H.A. Rey',
      price: 6.99,
      currency: 'GBP',
      imageUrl: 'https://covers.openlibrary.org/b/id/8235012-M.jpg',
      categoryIds: [earlyReadersCat?.id, pictureBksCat?.id],
      description: 'A mischievous monkey gets into hilarious adventures. Perfect for early readers discovering the joy of books.',
      isbn: 'ISBN-9780547207599',
      publisher: 'Houghton Mifflin',
      pages: 56,
      ratingsAvg: 4.6,
    },
  ];

  // Create or update products
  console.log(`📚 Creating ${productsCatalog.length} products...`);

  for (const product of productsCatalog) {
    // Use the first category ID (we'll handle multiple categories differently if needed)
    const categoryId = product.categoryIds.find(id => id !== undefined);
    
    if (!categoryId) {
      console.log(`⚠️  Skipping ${product.title} - no valid category`);
      continue;
    }

    try {
      // Create/update product
      const createdProduct = await prisma.product.upsert({
        where: { sourceId: product.sourceId },
        update: {
          title: product.title,
          author: product.author,
          price: product.price,
          imageUrl: product.imageUrl,
          lastScrapedAt: new Date(),
        },
        create: {
          sourceId: product.sourceId,
          sourceUrl: product.sourceUrl,
          title: product.title,
          author: product.author,
          price: product.price,
          currency: product.currency,
          imageUrl: product.imageUrl,
          categoryId: categoryId,
          lastScrapedAt: new Date(),
        },
      });

      // Create/update product detail
      await prisma.productDetail.upsert({
        where: { productId: createdProduct.id },
        update: {
          description: product.description,
          isbn: product.isbn,
          publisher: product.publisher,
          pages: product.pages,
          ratingsAvg: product.ratingsAvg,
          reviewsCount: Math.floor(Math.random() * 50) + 1,
        },
        create: {
          productId: createdProduct.id,
          description: product.description,
          isbn: product.isbn,
          publisher: product.publisher,
          pages: product.pages,
          ratingsAvg: product.ratingsAvg,
          reviewsCount: Math.floor(Math.random() * 50) + 1,
        },
      });

      // Add sample reviews for top products
      if (createdProduct.id <= 5) {
        await prisma.review.deleteMany({ where: { productId: createdProduct.id } });
        
        const reviews = [
          {
            author: 'John D.',
            rating: 5,
            text: 'Absolutely loved this book! Highly recommend.',
          },
          {
            author: 'Sarah M.',
            rating: 4,
            text: 'Great story, kept me engaged throughout.',
          },
        ];

        for (const review of reviews) {
          await prisma.review.create({
            data: {
              productId: createdProduct.id,
              author: review.author,
              rating: review.rating,
              text: review.text,
            },
          });
        }
      }

      console.log(`✅ ${product.title}`);
    } catch (error) {
      console.log(`❌ Failed to create ${product.title}: ${error}`);
    }
  }

  console.log('\n✅ Products seeded successfully!');
  
  // Update category product counts
  console.log('\n📊 Updating category product counts...');
  const categories = await prisma.category.findMany();
  for (const category of categories) {
    const count = await prisma.product.count({
      where: { categoryId: category.id }
    });
    await prisma.category.update({
      where: { id: category.id },
      data: { productCount: count }
    });
  }
  console.log('✅ Category product counts updated!');
}

seedProducts()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
