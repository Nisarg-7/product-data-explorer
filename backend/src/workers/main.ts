import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NavigationScraper } from '../scrapers/navigation.scraper';
import { CategoryScraper } from '../scrapers/category.scraper';
import { ProductScraper } from '../scrapers/product.scraper';

const logger = new Logger('ScrapeWorker');
const prisma = new PrismaClient();

const scrapers = {
  navigation: new NavigationScraper(),
  category: new CategoryScraper(),
  product: new ProductScraper(),
};

/**
 * Background worker for processing scrape jobs
 * Run with: npm run worker
 */
async function processJobs() {
  const concurrency = parseInt(process.env.SCRAPE_JOB_CONCURRENCY || '2');
  const delay = parseInt(process.env.SCRAPE_REQUEST_DELAY_MS || '2000');
  const maxRetries = parseInt(process.env.SCRAPE_MAX_RETRIES || '3');

  logger.log(
    `🚀 Scrape worker started (concurrency: ${concurrency}, delay: ${delay}ms)`,
  );

  while (true) {
    try {
      const jobs = await prisma.scrapeJob.findMany({
        where: {
          status: {
            in: ['PENDING', 'RETRY'],
          },
        },
        orderBy: { createdAt: 'asc' },
        take: concurrency,
      });

      if (jobs.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      logger.log(`Processing ${jobs.length} jobs...`);

      for (const job of jobs) {
        try {
          await processSingleJob(job, delay, maxRetries);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error(`Error processing job ${job.id}: ${errorMessage}`);
        }

        // Respect rate limits
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Worker error: ${errorMessage}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function processSingleJob(
  job: any,
  delay: number,
  maxRetries: number,
) {
  try {
    // Update status to RUNNING
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    logger.log(
      `[${job.targetType}] Processing job ${job.id}...`,
    );

    let result;

    switch (job.targetType) {
      case 'NAVIGATION':
        result = await scrapers.navigation.scrapeNavigation(job.targetUrl);
        break;
      case 'CATEGORY':
        result = await scrapers.category.scrapeCategories(job.targetUrl);
        break;
      case 'PRODUCT_LIST':
        result = await scrapers.product.scrapeProductList(job.targetUrl);
        // Store products in database
        for (const product of result) {
          await prisma.product.upsert({
            where: { sourceId: product.sourceId },
            update: {
              sourceUrl: product.url,
              title: product.title,
              author: product.author,
              price: product.price,
              imageUrl: product.imageUrl,
              lastScrapedAt: new Date(),
            },
            create: {
              sourceId: product.sourceId,
              sourceUrl: product.url,
              title: product.title,
              author: product.author,
              price: product.price,
              currency: 'GBP',
              imageUrl: product.imageUrl,
              categoryId: job.categoryId,
              lastScrapedAt: new Date(),
            },
          });
        }
        break;
      case 'PRODUCT_DETAIL':
        result = await scrapers.product.scrapeProductDetail(job.targetUrl);
        // Store product details in database
        await prisma.productDetail.upsert({
          where: { productId: job.productId },
          update: {
            description: result.description,
            isbn: result.isbn,
            publisher: result.publisher,
            pages: result.pages,
            ratingsAvg: result.rating,
            reviewsCount: result.reviewCount,
          },
          create: {
            productId: job.productId,
            description: result.description,
            isbn: result.isbn,
            publisher: result.publisher,
            pages: result.pages,
            ratingsAvg: result.rating,
            reviewsCount: result.reviewCount,
          },
        });
        // Update canonical URL if present
        if (result.canonicalUrl) {
          await prisma.product.update({
            where: { id: job.productId },
            data: { sourceUrl: result.canonicalUrl },
          });
        }
        break;
      default:
        throw new Error(`Unknown target type: ${job.targetType}`);
    }

    // Mark as completed
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
      },
    });

    logger.log(`✓ Job ${job.id} completed`);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error(`✗ Job ${job.id} failed: ${errorMessage}`);

    // Check retry count
    if (job.retryCount < maxRetries) {
      await prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'RETRY',
          retryCount: { increment: 1 },
          errorLog: errorMessage,
        },
      });

      logger.log(
        `Job ${job.id} will retry (${job.retryCount + 1}/${maxRetries})`,
      );
    } else {
      await prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorLog: errorMessage,
        },
      });

      logger.error(`Job ${job.id} failed after ${maxRetries} retries`);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.log('Shutting down worker...');
  await prisma.$disconnect();
  process.exit(0);
});

processJobs();
