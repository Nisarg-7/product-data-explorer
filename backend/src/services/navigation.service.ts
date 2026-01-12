import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LoggerService } from '../common/logger.service';
import { CreateNavigationDto, NavigationDetailDto } from '../dto/navigation.dto';
import { ScrapeService } from './scrape.service';

@Injectable()
export class NavigationService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private scrapeService: ScrapeService,
  ) {}

  /**
   * Get all navigation headings
   * Triggers scrape if missing or stale (>24h)
   */
  async getNavigation(): Promise<NavigationDetailDto[]> {
    this.logger.log('Fetching navigation', 'NavigationService');

    const navigations = await this.prisma.navigation.findMany({
      include: {
        categories: {
          where: { parentId: null },
        },
      },
    });

    // Check staleness and enqueue scrapes if needed
    const ttlHours = parseInt(process.env.SCRAPE_TTL_NAVIGATION_HOURS || '24');
    const results: NavigationDetailDto[] = [];

    for (const nav of navigations) {
      const isStale = this.isStaleData(nav.lastScrapedAt, ttlHours);

      if (isStale) {
        this.logger.debug(
          `Navigation "${nav.title}" is stale, enqueuing scrape`,
          'NavigationService',
        );
        await this.scrapeService.enqueueNavigationScrape(nav.id);
      }

      results.push({
        id: nav.id,
        title: nav.title,
        slug: nav.slug,
        description: nav.description,
        lastScrapedAt: nav.lastScrapedAt,
        createdAt: nav.createdAt,
        categoryCount: nav.categories.length,
        staleness: isStale ? 'stale' : 'fresh',
      });
    }

    return results;
  }

  /**
   * Get single navigation with categories
   */
  async getNavigationById(id: number): Promise<NavigationDetailDto> {
    const nav = await this.prisma.navigation.findUnique({
      where: { id },
      include: {
        categories: {
          where: { parentId: null },
        },
      },
    });

    if (!nav) {
      throw new Error(`Navigation with id ${id} not found`);
    }

    const ttlHours = parseInt(process.env.SCRAPE_TTL_NAVIGATION_HOURS || '24');
    const isStale = this.isStaleData(nav.lastScrapedAt, ttlHours);

    return {
      id: nav.id,
      title: nav.title,
      slug: nav.slug,
      description: nav.description,
      lastScrapedAt: nav.lastScrapedAt,
      createdAt: nav.createdAt,
      categoryCount: nav.categories.length,
      staleness: isStale ? 'stale' : 'fresh',
    };
  }

  /**
   * Create navigation (typically called by scraper)
   */
  async createNavigation(
    data: CreateNavigationDto,
  ): Promise<NavigationDetailDto> {
    const nav = await this.prisma.navigation.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        lastScrapedAt: new Date(),
      },
      include: {
        categories: {
          where: { parentId: null },
        },
      },
    });

    return {
      id: nav.id,
      title: nav.title,
      slug: nav.slug,
      description: nav.description,
      lastScrapedAt: nav.lastScrapedAt,
      createdAt: nav.createdAt,
      categoryCount: nav.categories.length,
      staleness: 'fresh',
    };
  }

  /**
   * Update navigation lastScrapedAt
   */
  async updateLastScrappedAt(id: number): Promise<void> {
    await this.prisma.navigation.update({
      where: { id },
      data: { lastScrapedAt: new Date() },
    });
  }

  /**
   * Check if data is stale based on TTL
   */
  private isStaleData(lastScrapedAt: Date | null, ttlHours: number): boolean {
    if (!lastScrapedAt) return true;

    const now = new Date();
    const ageHours = (now.getTime() - lastScrapedAt.getTime()) / (1000 * 60 * 60);
    return ageHours > ttlHours;
  }
}
