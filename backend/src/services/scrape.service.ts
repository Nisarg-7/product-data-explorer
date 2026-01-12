import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LoggerService } from '../common/logger.service';
import { RefreshScrapeDto, ScrapeJobResponseDto } from '../dto/scrape.dto';
import NodeCache from 'node-cache';

@Injectable()
export class ScrapeService {
  private cache = new NodeCache({ stdTTL: 600 });

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * Enqueue navigation scrape
   */
  async enqueueNavigationScrape(navigationId: number): Promise<string> {
    const nav = await this.prisma.navigation.findUnique({
      where: { id: navigationId },
    });

    if (!nav) {
      throw new Error(`Navigation ${navigationId} not found`);
    }

    return this.createScrapeJob({
      targetUrl: `${process.env.SCRAPE_TARGET_URL}`,
      targetType: 'NAVIGATION',
      navigationId,
    });
  }

  /**
   * Enqueue category scrape
   */
  async enqueueCategoryScrape(
    categoryId: number,
    navigationId: number,
  ): Promise<string> {
    const cat = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!cat) {
      throw new Error(`Category ${categoryId} not found`);
    }

    return this.createScrapeJob({
      targetUrl: `${process.env.SCRAPE_TARGET_URL}`,
      targetType: 'CATEGORY',
      categoryId,
      navigationId,
    });
  }

  /**
   * Enqueue product detail scrape
   */
  async enqueueProductDetailScrape(productId: number): Promise<string> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return this.createScrapeJob({
      targetUrl: product.sourceUrl,
      targetType: 'PRODUCT_DETAIL',
      productId,
    });
  }

  /**
   * Enqueue product list scrape
   */
  async enqueueProductListScrape(categoryId: number): Promise<string> {
    const cat = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!cat) {
      throw new Error(`Category ${categoryId} not found`);
    }

    return this.createScrapeJob({
      targetUrl: `${process.env.SCRAPE_TARGET_URL}`,
      targetType: 'PRODUCT_LIST',
      categoryId,
    });
  }

  /**
   * Manually trigger scrape refresh
   */
  async triggerScrapeRefresh(
    data: RefreshScrapeDto,
  ): Promise<ScrapeJobResponseDto> {
    this.logger.log(
      `Manual scrape refresh triggered for ${data.targetType}`,
      'ScrapeService',
    );

    let jobId: string;

    switch (data.targetType) {
      case 'NAVIGATION':
        if (!data.navigationId) {
          throw new Error('navigationId required for NAVIGATION scrape');
        }
        jobId = await this.enqueueNavigationScrape(data.navigationId);
        break;
      case 'CATEGORY':
        if (!data.categoryId) {
          throw new Error('categoryId required for CATEGORY scrape');
        }
        jobId = await this.enqueueCategoryScrape(
          data.categoryId,
          data.navigationId || 0,
        );
        break;
      case 'PRODUCT_DETAIL':
        if (!data.productId) {
          throw new Error('productId required for PRODUCT_DETAIL scrape');
        }
        jobId = await this.enqueueProductDetailScrape(data.productId);
        break;
      case 'PRODUCT_LIST':
        if (!data.categoryId) {
          throw new Error('categoryId required for PRODUCT_LIST scrape');
        }
        jobId = await this.enqueueProductListScrape(data.categoryId);
        break;
      default:
        throw new Error(`Unknown target type: ${data.targetType}`);
    }

    const job = await this.prisma.scrapeJob.findUnique({
      where: { id: jobId },
    });

    return this.mapScrapeJobResponse(job);
  }

  /**
   * Get scrape job status
   */
  async getScrapeJobStatus(jobId: string): Promise<ScrapeJobResponseDto> {
    const job = await this.prisma.scrapeJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Scrape job ${jobId} not found`);
    }

    return this.mapScrapeJobResponse(job);
  }

  /**
   * Create scrape job in database
   */
  private async createScrapeJob(data: {
    targetUrl: string;
    targetType: 'NAVIGATION' | 'CATEGORY' | 'PRODUCT_DETAIL' | 'PRODUCT_LIST';
    navigationId?: number;
    categoryId?: number;
    productId?: number;
  }): Promise<string> {
    const job = await this.prisma.scrapeJob.create({
      data: {
        targetUrl: data.targetUrl,
        targetType: data.targetType,
        navigationId: data.navigationId,
        categoryId: data.categoryId,
        productId: data.productId,
        status: 'PENDING',
      },
    });

    this.logger.debug(
      `Created scrape job ${job.id} for ${data.targetType}`,
      'ScrapeService',
    );

    return job.id;
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRY',
    errorLog?: string,
  ): Promise<void> {
    await this.prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status,
        errorLog,
        startedAt: status === 'RUNNING' ? new Date() : undefined,
        finishedAt:
          status === 'COMPLETED' || status === 'FAILED'
            ? new Date()
            : undefined,
      },
    });
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(jobId: string): Promise<void> {
    await this.prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        retryCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get pending scrape jobs
   */
  async getPendingJobs(limit: number = 10) {
    return this.prisma.scrapeJob.findMany({
      where: {
        status: {
          in: ['PENDING', 'RETRY'],
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Check if data should be scraped (for caching)
   */
  isDataStale(lastScrapedAt: Date | null, ttlHours: number): boolean {
    if (!lastScrapedAt) return true;

    const now = new Date();
    const ageHours = (now.getTime() - lastScrapedAt.getTime()) / (1000 * 60 * 60);
    return ageHours > ttlHours;
  }

  private mapScrapeJobResponse(job: any): ScrapeJobResponseDto {
    return {
      id: job.id,
      targetUrl: job.targetUrl,
      targetType: job.targetType,
      status: job.status,
      retryCount: job.retryCount,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      errorLog: job.errorLog,
      createdAt: job.createdAt,
    };
  }
}
