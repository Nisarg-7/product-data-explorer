import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LoggerService } from '../common/logger.service';
import {
  CreateProductDto,
  ProductDetailResponseDto,
  PaginatedProductsDto,
  ProductGridDto,
} from '../dto/product.dto';
import { ScrapeService } from './scrape.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private scrapeService: ScrapeService,
  ) {}

  /**
   * Get paginated products for a category
   */
  async getProducts(
    categoryId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedProductsDto> {
    this.logger.log(
      `Fetching products for category ${categoryId}, page ${page}`,
      'ProductService',
    );

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { categoryId },
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { categoryId } }),
    ]);

    const ttlHours = parseInt(process.env.SCRAPE_TTL_PRODUCT_HOURS || '7');

    const items: ProductGridDto[] = products.map((p) => {
      const isStale = this.isStaleData(p.lastScrapedAt, ttlHours);
      return {
        id: p.id,
        sourceId: p.sourceId,
        sourceUrl: p.sourceUrl,
        title: p.title,
        author: p.author,
        price: p.price ? Number(p.price) : null,
        currency: p.currency,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        lastScrapedAt: p.lastScrapedAt,
        createdAt: p.createdAt,
        staleness: isStale ? 'stale' : 'fresh',
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get product detail with reviews and recommendations
   */
  async getProductDetail(
    productId: number,
  ): Promise<ProductDetailResponseDto> {
    this.logger.log(
      `Fetching product detail for product ${productId}`,
      'ProductService',
    );

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        detail: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    const ttlHours = parseInt(process.env.SCRAPE_TTL_PRODUCT_DETAIL_HOURS || '7');
    const isStale = this.isStaleData(product.lastScrapedAt, ttlHours);

    if (isStale && product.detail) {
      await this.scrapeService.enqueueProductDetailScrape(productId);
    }

    // Get recommendations (similar products in same category)
    const recommendations = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      product: {
        id: product.id,
        sourceId: product.sourceId,
        sourceUrl: product.sourceUrl,
        title: product.title,
        author: product.author,
        price: product.price ? Number(product.price) : null,
        currency: product.currency,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        lastScrapedAt: product.lastScrapedAt,
        createdAt: product.createdAt,
      },
      detail: {
        description: product.detail?.description || null,
        isbn: product.detail?.isbn || null,
        publisher: product.detail?.publisher || null,
        publicationDate: product.detail?.publicationDate || null,
        pages: product.detail?.pages || null,
        specs: product.detail?.specs || null,
        ratingsAvg: product.detail?.ratingsAvg
          ? Number(product.detail.ratingsAvg)
          : null,
        reviewsCount: product.detail?.reviewsCount || 0,
      },
      reviews: product.reviews.map((r: any) => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        text: r.text,
      })),
      recommendations: recommendations.map((p: any) => ({
        id: p.id,
        sourceId: p.sourceId,
        sourceUrl: p.sourceUrl,
        title: p.title,
        author: p.author,
        price: p.price ? Number(p.price) : null,
        currency: p.currency,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        lastScrapedAt: p.lastScrapedAt,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Get product by source ID (for deduplication)
   */
  async getProductBySourceId(sourceId: string) {
    return this.prisma.product.findUnique({
      where: { sourceId },
    });
  }

  /**
   * Create product (typically called by scraper)
   */
  async createProduct(
    data: CreateProductDto,
  ) {
    return this.prisma.product.create({
      data: {
        sourceId: data.sourceId,
        sourceUrl: data.sourceUrl,
        title: data.title,
        author: data.author,
        price: data.price ? parseFloat(data.price) : null,
        currency: data.currency || 'GBP',
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        lastScrapedAt: new Date(),
      },
    });
  }

  /**
   * Update product
   */
  async updateProduct(id: number, data: Partial<CreateProductDto>) {
    const updateData: any = {
      ...data,
      lastScrapedAt: new Date(),
    };

    // Convert price string to number if present
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Create or update product detail
   */
  async upsertProductDetail(
    productId: number,
    detail: {
      description?: string;
      isbn?: string;
      publisher?: string;
      publicationDate?: Date;
      pages?: number;
      specs?: any;
      ratingsAvg?: number;
      reviewsCount?: number;
    },
  ) {
    return this.prisma.productDetail.upsert({
      where: { productId },
      update: detail,
      create: { productId, ...detail },
    });
  }

  /**
   * Add review to product
   */
  async addReview(
    productId: number,
    review: {
      author?: string;
      rating: number;
      text?: string;
    },
  ) {
    return this.prisma.review.create({
      data: {
        productId,
        author: review.author,
        rating: review.rating,
        text: review.text,
      },
    });
  }

  /**
   * Update product lastScrapedAt
   */
  async updateLastScrapedAt(id: number): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { lastScrapedAt: new Date() },
    });
  }

  private isStaleData(lastScrapedAt: Date | null, ttlHours: number): boolean {
    if (!lastScrapedAt) return true;

    const now = new Date();
    const ageHours = (now.getTime() - lastScrapedAt.getTime()) / (1000 * 60 * 60);
    return ageHours > ttlHours;
  }
}
