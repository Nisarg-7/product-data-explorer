import { Logger } from '@nestjs/common';
import { PlaywrightCrawler, Dataset } from 'crawlee';

export class ProductScraper {
  private logger = new Logger('ProductScraper');

  async scrapeProductList(targetUrl: string): Promise<any[]> {
    const logger = this.logger;

    this.logger.log(`Starting product list scrape from ${targetUrl}`);

    const products: any[] = [];

    try {
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 50,
        maxRequestsPerMinute: 20,
        headless: true,

        async handlePageFunction({ page, request }: any) {
          logger.debug(`Scraping products from ${request.url}`);

          const productItems = await page.$$eval(
            '[data-product], .product, .book-item',
            (elements: any) =>
              elements
                .map((el: any) => ({
                  sourceId:
                    el.getAttribute('data-id') ||
                    el.getAttribute('data-product-id') ||
                    '',
                  title:
                    el.querySelector('.title, h3, .product-title')
                      ?.textContent?.trim() || '',
                  author:
                    el.querySelector('.author, .by-author')?.textContent
                      ?.trim() || '',
                  price: parseFloat(
                    el
                      .querySelector('.price, [data-price]')
                      ?.textContent?.match(/[\d.]+/)?.[0] || '0',
                  ),
                  currency: 'GBP',
                  imageUrl:
                    el.querySelector('img')?.getAttribute('src') || '',
                  url: el.querySelector('a')?.getAttribute('href') || '',
                }))
                .filter((item: any) => item.sourceId.length > 0),
          );

          // Make URLs absolute and correct format
          const baseUrl = new URL(request.url).origin;
          productItems.forEach((item: any) => {
            if (item.url && !item.url.startsWith('http')) {
              item.url = new URL(item.url, baseUrl).href;
            }
            // Transform /books/ URLs to /products/ format
            if (item.url && item.url.includes('/books/')) {
              // Extract parts: /en-gb/books/title-author/isbn
              const match = item.url.match(/\/books\/([^\/]+)\/(\d+)$/);
              if (match) {
                const titleAuthor = match[1];
                const isbn = match[2];
                // Transform to /products/title-book-author-isbn
                const parts = titleAuthor.split('-');
                if (parts.length >= 2) {
                  const author = parts.pop();
                  const title = parts.join('-');
                  item.url = `${baseUrl}/en-gb/products/${title}-book-${author}-${isbn}`;
                }
              }
            }
          });

          products.push(...productItems);

          await Dataset.pushData({
            type: 'products',
            items: productItems,
            scrapedAt: new Date(),
          });

          // Handle pagination
          const nextButton = await page.$('.pagination .next a');
          if (nextButton) {
            const nextUrl = await nextButton.getAttribute('href');
            if (nextUrl) {
              await crawler.addRequests([nextUrl]);
            }
          }
        },

        async failedRequestHandler({ request, error }: any) {
          logger.error(
            `Request ${request.url} failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        },
      });

      await crawler.run([targetUrl]);

      this.logger.log(`✓ Scraped ${products.length} products`);
      return products;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Product list scrape failed: ${errorMessage}`);
      throw error;
    }
  }

  async scrapeProductDetail(productUrl: string): Promise<any> {
    const logger = this.logger;

    this.logger.log(`Starting product detail scrape from ${productUrl}`);

    try {
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 1,
        headless: true,

        async handlePageFunction({ page }: any) {
          logger.debug(`Scraping detail from ${productUrl}`);

          const detail = await page.evaluate(() => {
            return {
              description:
                document.querySelector('.description, .product-description')
                  ?.textContent?.trim() || '',
              isbn:
                document.querySelector('[data-isbn], .isbn')?.textContent
                  ?.trim() || '',
              publisher:
                document.querySelector('[data-publisher], .publisher')
                  ?.textContent?.trim() || '',
              pages: parseInt(
                document
                  .querySelector('[data-pages], .pages')
                  ?.textContent?.match(/\d+/)?.[0] || '0',
              ),
              rating: parseFloat(
                document
                  .querySelector('[data-rating], .rating')
                  ?.textContent?.match(/[\d.]+/)?.[0] || '0',
              ),
              reviewCount: parseInt(
                document
                  .querySelector('[data-review-count], .review-count')
                  ?.textContent?.match(/\d+/)?.[0] || '0',
              ),
              canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
            };
          });

          await Dataset.pushData({
            type: 'product_detail',
            detail,
            scrapedAt: new Date(),
          });

          return detail;
        },

        async failedRequestHandler({ error }: any) {
          logger.error(
            `Product detail scrape failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        },
      });

      await crawler.run([productUrl]);
      return {};
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Product detail scrape failed: ${errorMessage}`);
      throw error;
    }
  }
}
