import { Logger } from '@nestjs/common';
import { PlaywrightCrawler, Dataset } from 'crawlee';

export class CategoryScraper {
  private logger = new Logger('CategoryScraper');

  async scrapeCategories(targetUrl: string): Promise<any[]> {
    const logger = this.logger;

    this.logger.log(`Starting category scrape from ${targetUrl}`);

    const categories: any[] = [];

    try {
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 20,
        maxRequestsPerMinute: 30,
        headless: true,

        async handlePageFunction({ page, request }: any) {
          logger.debug(`Scraping categories from ${request.url}`);

          const categoryItems = await page.$$eval(
            '[data-category], .category, .cat-item',
            (elements: any) =>
              elements
                .map((el: any) => ({
                  title:
                    el.querySelector('h3, .title, a')?.textContent?.trim() ||
                    '',
                  slug:
                    el.getAttribute('data-slug') ||
                    el.textContent
                      ?.trim()
                      .toLowerCase()
                      .replace(/\s+/g, '-') ||
                    '',
                  url: el.querySelector('a')?.getAttribute('href') || '',
                  productCount: parseInt(
                    el.getAttribute('data-count') || '0',
                  ),
                }))
                .filter((item: any) => item.title.length > 0),
          );

          categories.push(...categoryItems);

          await Dataset.pushData({
            type: 'categories',
            items: categoryItems,
            scrapedAt: new Date(),
          });
        },

        async failedRequestHandler({ request, error }: any) {
          logger.error(
            `Request ${request.url} failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        },
      });

      await crawler.run([targetUrl]);

      this.logger.log(`✓ Scraped ${categories.length} categories`);
      return categories;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Category scrape failed: ${errorMessage}`);
      throw error;
    }
  }
}

