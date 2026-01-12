# Contributing to Product Data Explorer

Thank you for your interest in contributing! This guide explains how to set up your development environment and contribute effectively to this project.

## Project Overview for Contributors

This is a **full-stack product scraping and exploration platform** built with:
- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS, React Query)
- **Backend**: NestJS 10 (REST API, Prisma ORM, SQLite)
- **Scraping**: Crawlee + Playwright (ethical web scraping with rate limiting)

The project demonstrates modern full-stack architecture with separation of concerns, asynchronous background jobs, and TTL-based caching.

## Getting Started

### Prerequisites
- Node.js 18+ (check with `node --version`)
- npm 9+ or yarn
- Git
- SQLite3 (usually included with Node.js)

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd Full-Stack-Assignment
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your settings (defaults work for local development)
   
   # Frontend
   cd ../frontend
   cp .env.example .env.local
   # Edit .env.local (API_URL should be http://localhost:3001/api)
   ```

3. **Initialize Database**
   ```bash
   cd backend
   
   # Create database and schema
   npx prisma migrate dev
   
   # (Optional) Seed with sample data
   npx prisma db seed
   
   # View database visually
   npx prisma studio
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: Backend API
   cd backend
   npm run dev          # Runs on http://localhost:3001
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev          # Runs on http://localhost:3000
   
   # Terminal 3: Background Worker (optional, for scraping jobs)
   cd backend
   npm run worker       # Processes background scrape jobs
   ```

5. **Verify Everything Works**
   - Frontend: http://localhost:3000
   - Backend API Docs: http://localhost:3001/api/docs (Swagger)
   - Database Studio: Run `npx prisma studio` to browse database

### Running the Project

**Terminal 1: Backend API**
```bash
cd backend
npm run dev
# API runs on http://localhost:3001
# API docs available at http://localhost:3001/api/docs
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

**Terminal 3: Background Worker (optional, for scraping)**
```bash
cd backend
npm run worker
```

## Development Workflow

### Adding a New API Endpoint

**Example: Fetching products by category**

1. **Define the DTO** (`backend/src/dto/product.dto.ts`):
   ```typescript
   import { IsInt, Min, Max } from 'class-validator';
   
   export class GetProductsDto {
     @IsInt()
     categoryId: number;
     
     @IsInt()
     @Min(1)
     page: number = 1;
     
     @IsInt()
     @Min(1)
     @Max(100)
     limit: number = 20;
   }
   ```

2. **Create/Update Service** (`backend/src/services/product.service.ts`):
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { PrismaService } from '../common/prisma.service';
   
   @Injectable()
   export class ProductService {
     constructor(private prisma: PrismaService) {}
   
     async getProducts(categoryId: number, page: number, limit: number) {
       const products = await this.prisma.product.findMany({
         where: { categoryId },
         skip: (page - 1) * limit,
         take: limit,
       });
   
       // Check staleness and enqueue background scrape if needed
       const freshness = products.map(p => ({
         ...p,
         staleness: this.isStale(p.lastScrapedAt) ? 'stale' : 'fresh',
       }));
   
       return freshness;
     }
   
     private isStale(lastScraped: Date | null): boolean {
       if (!lastScraped) return true;
       const hours = (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60);
       return hours > 7 * 24; // 7 days for products
     }
   }
   ```

3. **Create Controller** (`backend/src/controllers/product.controller.ts`):
   ```typescript
   import { Controller, Get, Query } from '@nestjs/common';
   import { ApiOperation } from '@nestjs/swagger';
   import { GetProductsDto } from '../dto/product.dto';
   import { ProductService } from '../services/product.service';
   
   @Controller('api/products')
   export class ProductController {
     constructor(private readonly productService: ProductService) {}
   
     @Get()
     @ApiOperation({ summary: 'Get products by category' })
     async getProducts(@Query() query: GetProductsDto) {
       return this.productService.getProducts(
         query.categoryId,
         query.page,
         query.limit
       );
     }
   }
   ```

4. **Register in Module** (`backend/src/app.module.ts`):
   ```typescript
   import { ProductService } from './services/product.service';
   import { ProductController } from './controllers/product.controller';
   
   @Module({
     controllers: [ProductController],
     providers: [ProductService],
   })
   export class AppModule {}
   ```

5. **Test**: Start backend and visit http://localhost:3001/api/docs

### Adding a New Scraper

1. **Create Scraper** (`backend/src/scrapers/product-detail.scraper.ts`):
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { PlaywrightCrawler } from 'crawlee';
   
   @Injectable()
   export class ProductDetailScraper {
     async scrapeProductDetail(url: string) {
       const crawler = new PlaywrightCrawler({
         maxRequestsPerCrawl: 1,
         headless: true,
       });
   
       let result = null;
   
       crawler.addRequestHandler(async ({ page, pushData }) => {
         const title = await page.$eval('h1', el => el.textContent?.trim());
         const author = await page.$eval('.author', el => el.textContent?.trim());
         const description = await page.$eval('.description', el => el.textContent?.trim());
         
         await pushData({ title, author, description });
       });
   
       await crawler.run([url]);
       
       const dataset = await crawler.getDataset();
       const items = await dataset.getData();
       return items.length > 0 ? items[0] : null;
     }
   }
   ```

2. **Register in Worker** (`backend/src/workers/main.ts`):
   ```typescript
   case 'PRODUCT_DETAIL':
     const detail = await scrapers.productDetail.scrapeProductDetail(job.targetUrl);
     // Save to database
     break;
   ```

### Adding Frontend Components

**Example: Product Card**

```typescript
'use client';

import { Product } from '@/lib/types';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md">
      <h3 className="font-semibold">{product.title}</h3>
      <p className="text-sm text-gray-600">{product.author}</p>
      <div className="mt-2 font-bold">{product.currency} {product.price}</div>
      
      {product.staleness === 'stale' && (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2">
          Data may be outdated
        </span>
      )}
      
      <Link href={`/products/${product.id}`} className="mt-4 block text-center bg-blue-600 text-white py-2 rounded">
        View Details
      </Link>
    </div>
  );
}
```

## Database Migrations

After modifying `backend/prisma/schema.prisma`:

```bash
cd backend

# Create a new migration
npx prisma migrate dev --name "descriptive_migration_name"

# Apply migrations to production
npx prisma migrate deploy

# Reset database (dev only!)
npx prisma migrate reset
```

## Code Standards

### TypeScript
- Use strict mode (`strict: true`)
- Always type parameters and return values
- Avoid `any` type—use `unknown` instead
- Use interfaces for objects, not `type`

### Naming Conventions
- **Files**: kebab-case (e.g., `product.service.ts`)
- **Classes**: PascalCase (e.g., `ProductService`)
- **Functions**: camelCase (e.g., `getProducts()`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Comments
```typescript
// Good: Explain WHY
// We check staleness before returning to trigger background scrapes
if (isStale(data.lastScrapedAt, ttlHours)) {
  enqueueBackgroundScrape(id);
}

// Avoid: Restating what code shows
// Set x to 10
const x = 10;
```

## Testing

### Backend Tests
```bash
cd backend
npm run test                    # Run all tests
npm run test -- --watch        # Watch mode
npm run test:cov               # Coverage report
```

Example:
```typescript
describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProductService],
    }).compile();
    service = module.get(ProductService);
  });

  it('should return products', async () => {
    const products = await service.getProducts(1, 1, 20);
    expect(products).toBeDefined();
  });
});
```

## Debugging

### Backend
```bash
# With debug output
DEBUG=* npm run dev

# Inspect database
npx prisma studio

# View logs
tail -f logs/app.log
```

### Frontend
- React DevTools (from Chrome Web Store)
- Network tab (inspect API calls)
- React Query DevTools (cache inspection)

## Submitting Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make Changes**
   - Keep commits focused
   - Write clear commit messages
   - Add tests for new functionality

3. **Test Locally**
   ```bash
   npm run lint
   npm run test
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/my-new-feature
   ```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>
```

### Database Lock
```bash
rm backend/dev.db
npx prisma migrate dev
```

### Node Modules Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
npx tsc --noEmit
```

## Architecture Overview

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design, data flows, and technical diagrams.

## Key Files

| File | Purpose |
|------|---------|
| [backend/prisma/schema.prisma](backend/prisma/schema.prisma) | Database schema |
| [backend/src/main.ts](backend/src/main.ts) | NestJS bootstrap |
| [backend/src/app.module.ts](backend/src/app.module.ts) | Dependency injection |
| [frontend/lib/api-client.ts](frontend/lib/api-client.ts) | HTTP client |
| [frontend/hooks/useViewTracking.ts](frontend/hooks/useViewTracking.ts) | Session tracking |

## Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Crawlee Docs](https://crawlee.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)

---

**Thank you for contributing!** 🎉

- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run migrations: `npx prisma migrate dev`
- Check if port 3001 is in use

### API calls failing from frontend
- Check CORS_ORIGIN in backend .env
- Verify NEXT_PUBLIC_API_URL in frontend .env
- Check backend is running on 3001
- Look at browser console for errors

### Database locked
- Ensure no other processes access the DB
- Restart PostgreSQL: `brew services restart postgresql`

### Node modules issues
- Delete node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

## Getting Help

1. **Check codebase examples** - Look for similar patterns in existing code
2. **Read inline comments** - Developers leave helpful notes
3. **Check README.md** - Architecture and setup guide
4. **Review API.md** - Endpoint documentation
5. **Check .github/copilot-instructions.md** - AI agent guidelines

## Contributing Best Practices

1. ✅ Write tests for new features
2. ✅ Keep commits small and focused
3. ✅ Write clear commit messages
4. ✅ Update docs when changing APIs
5. ✅ Test locally before committing
6. ✅ Follow existing code style
7. ❌ Don't commit `.env` files
8. ❌ Don't hardcode URLs/secrets
9. ❌ Don't skip error handling
10. ❌ Don't leave console.log() in production code

---

**Need more help?** Check the inline code comments or reach out to the team.

Happy coding! 🚀
