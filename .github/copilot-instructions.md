# AI Copilot Instructions for Product Data Explorer

> **Last Updated:** January 2025  
> **Project:** Product Data Explorer - Full-stack product scraping and exploration platform

This document provides AI agents with essential knowledge for productive development in this codebase. Focus on understanding the architecture, conventions, and critical workflows before making changes.

## 🏗️ Architecture Overview

### Big Picture
The system is a **monorepo** with three distinct layers:

```
User Browser (Next.js) 
    ↓ HTTP (React Query)
NestJS Backend (REST API)
    ↓ Prisma ORM
PostgreSQL Database
    ↓ (async job queue)
Background Workers → Crawlee/Playwright Scraper
```

### Key Design Decisions

1. **Separation of Concerns**: Frontend (Next.js) and Backend (NestJS) are fully decoupled, deployed separately.
2. **Asynchronous Scraping**: Web scraping is non-blocking—jobs are enqueued immediately, data served from cache while background workers process.
3. **TTL-Based Caching**: All data has an age threshold (e.g., navigation: 24h, products: 7d). Stale data is served while scrape job runs in background.
4. **Ethical Scraping**: Delays, retries, rate limits, and robots.txt compliance prevent abuse.
5. **Session Tracking**: Client-side session ID (UUID) tracks view history for browsing path restoration.

### Database Relations
- **Navigation** → **Category** (one-to-many, hierarchical)
- **Category** → **Product** (one-to-many)
- **Product** → **ProductDetail** (one-to-one, extended metadata)
- **Product** → **Review** (one-to-many, customer reviews)
- **ScrapeJob** tracks all background operations (status, retries, errors)
- **ViewHistory** records browsing by session

See [Prisma schema](backend/prisma/schema.prisma) for full relations.

## 🧭 Directory Structure & Conventions

```
/backend                         # NestJS application
├── src/
│   ├── controllers/            # API endpoints (routes)
│   ├── services/               # Business logic (reusable)
│   ├── dto/                    # Request/response validation (class-validator)
│   ├── scrapers/               # Crawlee integration (data extraction)
│   ├── workers/                # Background job processors
│   ├── queue/                  # Job queue definitions (BullMQ-ready)
│   ├── common/                 # Utilities (Prisma, Logger, Filters)
│   └── main.ts                 # App bootstrap
├── prisma/
│   ├── schema.prisma           # Database schema (single source of truth)
│   └── seed.ts                 # Initial data population
└── .env                        # Database URL, scraping config

/frontend                        # Next.js application
├── app/                        # App Router pages (file-based routing)
│   ├── page.tsx                # Home page (navigation grid)
│   ├── categories/[navigationId]/ # Category drilldown
│   ├── products/               # Product grid & detail pages
│   ├── about/page.tsx          # Static info page
│   ├── layout.tsx              # Root layout (header, footer)
│   └── globals.css             # Tailwind styles
├── components/                 # Reusable React components
├── hooks/                      # Custom hooks (useViewTracking)
├── lib/                        # Utilities (api-client, session)
├── styles/                     # CSS & Tailwind config
└── .env.local                  # API_URL for backend connection

README.md                        # Project setup & architecture
.github/copilot-instructions.md # This file
```

## 🔌 API Contract & DTOs

**DTO Pattern**: All requests/responses use Data Transfer Objects for validation and type safety.

### Example: Navigation Endpoint
```typescript
// backend/src/dto/navigation.dto.ts
export interface NavigationDetailDto {
  id: number;
  title: string;
  lastScrapedAt: Date | null;
  staleness: 'fresh' | 'stale' | 'missing'; // Client-side freshness hint
}

// backend/src/controllers/navigation.controller.ts
@Get()
async getNavigation(): Promise<NavigationDetailDto[]> { ... }

// Response includes staleness flag so frontend can:
// 1. Display "stale" badge if data > 24h old
// 2. Trigger background scrape if needed
// 3. Decide caching strategy
```

### Standard Response Pattern
- **Success**: `{ id, title, ... }`
- **Errors**: NestJS global error handler returns `{ statusCode, message, error }`
- **Pagination**: `{ items: [], total, page, limit, totalPages }`

## 🔄 Data Flow: How Scraping Works

### Request → Response → Background Scrape

```javascript
// User requests navigation
GET /api/navigation

// Backend checks database
const nav = await prisma.navigation.findMany();

// If lastScrapedAt > 24 hours ago:
if (isStale(nav.lastScrapedAt)) {
  // 1. Enqueue scrape job (non-blocking)
  await scrapeService.enqueueNavigationScrape(nav.id);
  
  // 2. Return cached data immediately
  return nav;
  
  // 3. Background worker processes job async
  // await scrapers.navigation.scrapeNavigation(url);
  // Update database with fresh data
}
```

### Why This Design?
- **Fast UX**: Users don't wait for scraping
- **Low Load**: Stale data is acceptable (products don't change every second)
- **Fault Tolerant**: Scrape failures don't break API
- **Idempotent**: Same request twice in 24h uses cached data

## 📋 Critical Workflows

### Adding a New Endpoint (Step-by-Step)

1. **Create DTO** ([example](backend/src/dto/product.dto.ts)):
   ```typescript
   // Define request/response shapes with class-validator decorators
   export class GetProductDto {
     @IsInt() categoryId: number;
     @IsInt() @Min(1) page: number = 1;
   }
   ```

2. **Create Service** ([example](backend/src/services/product.service.ts)):
   ```typescript
   // Business logic lives here, not in controller
   @Injectable()
   export class ProductService {
     async getProducts(categoryId, page) { ... }
   }
   ```

3. **Create Controller** ([example](backend/src/controllers/product.controller.ts)):
   ```typescript
   @Controller('api/products')
   export class ProductController {
     @Get()
     @ApiOperation({ summary: 'Get paginated products' })
     async getProducts(@Query() dto: GetProductDto) {
       return this.productService.getProducts(dto);
     }
   }
   ```

4. **Add to Module** (see `app.module.ts`):
   ```typescript
   import { ProductService } from './services/product.service';
   // Add to providers & controllers
   ```

5. **Test via API Docs**: Start backend, visit `http://localhost:3001/api/docs` (Swagger)

### Adding a New Scraper

1. **Create scraper file** ([example](backend/src/scrapers/product.scraper.ts)):
   ```typescript
   // Use Crawlee's PlaywrightCrawler pattern
   async scrapeProductList(url: string): Promise<Product[]> {
     const crawler = new PlaywrightCrawler(...);
     // Extract product data from DOM
     // Return structured data
   }
   ```

2. **Register in worker** (see `workers/main.ts`):
   ```typescript
   case 'PRODUCT_LIST':
     result = await scrapers.product.scrapeProductList(job.targetUrl);
     break;
   ```

3. **Enqueue from service**:
   ```typescript
   async enqueueProductListScrape(categoryId: number) {
     return this.createScrapeJob({
       targetUrl: '...',
       targetType: 'PRODUCT_LIST',
       categoryId
     });
   }
   ```

4. **Run worker**: `npm run worker` (separate terminal)

### Running Migrations After Schema Changes

```bash
# Backend directory
cd backend

# Create migration
npx prisma migrate dev --name add_new_field

# Apply migration
npx prisma db push

# Seed data (optional)
npx prisma db seed
```

## 🎨 Frontend Conventions

### Next.js App Router Structure
- **Pages**: `app/[route]/page.tsx` (file-based routing)
- **Layouts**: Wrap multiple pages with shared UI
- **Components**: Extracted to `/components` for reuse
- **Hooks**: Custom hooks in `/hooks` (useViewTracking, useSessionHistory)

### Data Fetching Pattern
```typescript
'use client'; // Client-side because we use React Query

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', categoryId], // Cache key (invalidated if categoryId changes)
    queryFn: () => apiClient.getProducts(categoryId),
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage />;
  
  return <ProductList items={data} />;
}
```

### Session Tracking
```typescript
// Every page that needs view tracking:
import { useViewTracking } from '@/hooks/useViewTracking';

export default function ProductPage() {
  useViewTracking(productId); // Automatically tracks path + product context
  
  // Component continues...
}
```

Session ID is auto-generated (UUID) and stored in `sessionStorage`.

## 🔐 Common Patterns

### Error Handling
**Backend** (NestJS):
```typescript
if (!product) {
  throw new Error(`Product with id ${id} not found`);
  // → Global error handler → 400/404 response
}
```

**Frontend** (React):
```typescript
if (error) {
  return <ErrorBoundary message={(error as Error).message} />;
}
```

### TTL Calculation
```typescript
// All services check staleness consistently:
private isStaleData(lastScrapedAt: Date | null, ttlHours: number): boolean {
  if (!lastScrapedAt) return true; // No data = always stale
  
  const now = new Date();
  const ageHours = (now.getTime() - lastScrapedAt.getTime()) / (1000 * 60 * 60);
  return ageHours > ttlHours;
}
```

### Deduplication
Products are uniquely keyed by `sourceId` (from worldofbooks.com). This prevents duplicates when scraping the same category multiple times.

## ⚙️ Environment & Configuration

### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/product_explorer
SCRAPE_TARGET_URL=https://www.worldofbooks.com/
SCRAPE_TTL_NAVIGATION_HOURS=24
SCRAPE_TTL_PRODUCT_HOURS=7
SCRAPE_REQUEST_DELAY_MS=2000        # Rate limiting
SCRAPE_MAX_RETRIES=3
API_PORT=3001
CORS_ORIGIN=http://localhost:3000   # Frontend URL
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🚀 Essential Commands

```bash
# Backend setup
cd backend
npm install
npx prisma migrate dev
npx prisma db seed    # Optional: populate sample data
npm run dev           # Start API on 3001

# Frontend setup
cd frontend
npm install
npm run dev           # Start Next.js on 3000

# Background worker (separate terminal)
cd backend
npm run worker        # Process scrape jobs

# Database inspection
npx prisma studio    # Visual DB browser
```

## 🧪 Testing Patterns

### Backend Unit Test Example
```typescript
// test/product.service.spec.ts
describe('ProductService', () => {
  it('should return products with staleness info', async () => {
    const products = await service.getProducts(1, 1, 20);
    expect(products.items).toHaveLength(20);
    expect(products.items[0]).toHaveProperty('staleness');
  });
});
```

### Testing Endpoints
Use Swagger at `http://localhost:3001/api/docs` or:
```bash
curl http://localhost:3001/api/navigation
curl "http://localhost:3001/api/products?categoryId=1&page=1"
```

## 📊 Database Indexes

Critical indexes for performance:
- `navigation.lastScrapedAt` (for TTL checks)
- `product.sourceId` (for deduplication)
- `scrapeJob.status` (for worker queries)
- `viewHistory.sessionId` (for session lookups)

These are defined in `schema.prisma` with `@@index()`.

## 🛑 Common Pitfalls

1. **Forgetting to await Prisma calls**: All DB operations are async.
2. **Breaking DTOs**: DTOs are the API contract—changes must be backward compatible.
3. **Blocking in controllers**: Long operations belong in services, not endpoints.
4. **Forgetting CORS**: Backend must allow frontend origin (see `.env`).
5. **Not tracking staleness**: Always return `staleness` flag with data.
6. **Hardcoded URLs**: Use environment variables (`process.env.API_URL`).

## 📚 Key File References

| File | Purpose |
|------|---------|
| [backend/prisma/schema.prisma](backend/prisma/schema.prisma) | Database schema (single source of truth) |
| [backend/src/main.ts](backend/src/main.ts) | NestJS bootstrap & Swagger setup |
| [backend/src/app.module.ts](backend/src/app.module.ts) | Dependency injection container |
| [backend/src/services/scrape.service.ts](backend/src/services/scrape.service.ts) | Job enqueuing logic |
| [backend/src/workers/main.ts](backend/src/workers/main.ts) | Background processor (run separately) |
| [frontend/lib/api-client.ts](frontend/lib/api-client.ts) | Frontend HTTP client |
| [frontend/hooks/useViewTracking.ts](frontend/hooks/useViewTracking.ts) | Session history hook |
| [README.md](README.md) | Architecture overview & local setup |

## ✅ Before Making Changes

1. **Understand the layer**: Controllers handle routes, Services handle logic, DTOs validate.
2. **Check staleness pattern**: Does your endpoint return `staleness` info?
3. **Consider deduplication**: Are you using `sourceId` for uniqueness?
4. **Test with Swagger**: Verify your API works before committing.
5. **Update migrations**: Schema changes require `prisma migrate dev`.
6. **Respect TTLs**: Don't scrape more frequently than defined TTLs.

## 🎯 Quick Start for AI Agents

**To implement a feature:**
1. Define DTOs first (contracts)
2. Write service logic (business rules)
3. Create controller endpoint (routes)
4. Add tests (verification)
5. Test via Swagger or frontend

**To fix bugs:**
1. Identify which layer failed (frontend, API, database, scraper)
2. Check error logs (backend logs show scrape failures)
3. Verify DTOs match API responses
4. Check environment variables
5. Test with minimal reproducer

---

**Last Built:** January 10, 2025  
**Questions?** Refer to README.md or check inline code comments.
