import { Logger } from '@nestjs/common';
import { PlaywrightCrawler, Dataset } from 'crawlee';

export class NavigationScraper {
  private logger = new Logger('NavigationScraper');

  async scrapeNavigation(targetUrl: string): Promise<any[]> {
    const logger = this.logger;

    this.logger.log(`Starting navigation scrape from ${targetUrl}`);

    const navigationItems: any[] = [];

    try {
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 5,
        maxRequestsPerMinute: 30,
        headless: true,
        useSessionPool: true,

        async handlePageFunction({ page, request }: any) {
          logger.debug(`Scraping ${request.url}`);

          // Extract navigation headings from homepage
          const headings = await page.$$eval(
            'nav a, header a, [role="navigation"] a',
            (elements: any) =>
              elements
                .map((el: any) => ({
                  title: el.textContent?.trim() || '',
                  url: el.getAttribute('href') || '',
                }))
                .filter((item: any) => item.title.length > 0),
          );

          navigationItems.push(...headings);

          await Dataset.pushData({
            type: 'navigation',
            items: headings,
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

      this.logger.log(`✓ Scraped ${navigationItems.length} navigation items`);
      return navigationItems;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Navigation scrape failed: ${errorMessage}`);
      throw error;
    }
  }
}

