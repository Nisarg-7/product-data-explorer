import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LoggerService } from '../common/logger.service';
import { CreateCategoryDto, CategoryHierarchyDto } from '../dto/category.dto';
import { ScrapeService } from './scrape.service';

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private scrapeService: ScrapeService,
  ) {}

  /**
   * Get categories for a navigation
   */
  async getCategories(navigationId: number): Promise<CategoryHierarchyDto[]> {
    this.logger.log(
      `Fetching categories for navigation ${navigationId}`,
      'CategoryService',
    );

    const categories = await this.prisma.category.findMany({
      where: {
        navigationId,
        parentId: null,
      },
      include: {
        children: true,
      },
    });

    const ttlHours = parseInt(process.env.SCRAPE_TTL_CATEGORY_HOURS || '24');

    const results: CategoryHierarchyDto[] = [];
    for (const cat of categories) {
      const isStale = this.isStaleData(cat.lastScrapedAt, ttlHours);

      if (isStale) {
        await this.scrapeService.enqueueCategoryScrape(cat.id, navigationId);
      }

      results.push(this.mapToCategoryHierarchy(cat, isStale, cat.children));
    }

    return results;
  }

  /**
   * Get category by ID with hierarchy
   */
  async getCategoryById(id: number): Promise<CategoryHierarchyDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }

    const ttlHours = parseInt(process.env.SCRAPE_TTL_CATEGORY_HOURS || '24');
    const isStale = this.isStaleData(category.lastScrapedAt, ttlHours);

    return this.mapToCategoryHierarchy(
      category,
      isStale,
      category.children,
    );
  }

  /**
   * Create category (typically called by scraper)
   */
  async createCategory(
    data: CreateCategoryDto,
  ): Promise<CategoryHierarchyDto> {
    const cat = await this.prisma.category.create({
      data: {
        navigationId: data.navigationId,
        parentId: data.parentId,
        title: data.title,
        slug: data.slug,
        description: data.description,
        lastScrapedAt: new Date(),
      },
    });

    return this.mapToCategoryHierarchy(cat, false, []);
  }

  /**
   * Update product count for category
   */
  async updateProductCount(id: number, count: number): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: { productCount: count },
    });
  }

  /**
   * Update lastScrapedAt
   */
  async updateLastScrapedAt(id: number): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: { lastScrapedAt: new Date() },
    });
  }

  private mapToCategoryHierarchy(
    cat: any,
    isStale: boolean,
    children: any[],
  ): CategoryHierarchyDto {
    return {
      id: cat.id,
      navigationId: cat.navigationId,
      parentId: cat.parentId,
      title: cat.title,
      slug: cat.slug,
      description: cat.description,
      productCount: cat.productCount,
      lastScrapedAt: cat.lastScrapedAt,
      createdAt: cat.createdAt,
      children: children.map((c) =>
        this.mapToCategoryHierarchy(c, isStale, []),
      ),
      staleness: isStale ? 'stale' : 'fresh',
    };
  }

  private isStaleData(lastScrapedAt: Date | null, ttlHours: number): boolean {
    if (!lastScrapedAt) return true;

    const now = new Date();
    const ageHours = (now.getTime() - lastScrapedAt.getTime()) / (1000 * 60 * 60);
    return ageHours > ttlHours;
  }
}
