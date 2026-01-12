# System Architecture Deep Dive

This document provides a detailed technical overview of the Product Data Explorer architecture.

## 1. High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│                   (React/Next.js Application)                   │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Home      │  │  Categories  │  │  Product Grid &     │   │
│  │   Page      │→ │  Navigation  │→ │  Detail Pages       │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│                                               │                 │
│                                      (Session Tracking)         │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTP/REST
                            ↓
        ┌───────────────────────────────────────┐
        │      NestJS REST API Backend          │
        │  (Controllers → Services → Database)   │
        │                                       │
        │  Endpoints:                          │
        │  • GET /api/navigation               │
        │  • GET /api/categories/:id           │
        │  • GET /api/products?...             │
        │  • GET /api/product/:id              │
        │  • POST /api/scrape/refresh          │
        │                                       │
        │  + Global Error Middleware           │
        │  + Input Validation (DTOs)           │
        │  + Structured Logging                │
        └────────┬──────────────────┬──────────┘
                 │                  │
                 ↓                  ↓
        ┌────────────────┐  ┌────────────────┐
        │   Prisma ORM   │  │  Scraping      │
        │   (Database    │  │  Service       │
        │    Access)     │  │  (Crawlee)     │
        └────────┬───────┘  └────────┬───────┘
                 │                   │
                 ↓                   ↓
        ┌──────────────────────────────────────┐
        │   SQLite Database (dev.db)           │
        │                                      │
        │  Tables:                             │
        │  • navigation (top-level sections)   │
        │  • category (hierarchical)           │
        │  • product (listings)                │
        │  • product_detail (metadata)         │
        │  • review (customer reviews)         │
        │  • scrape_job (tracking)             │
        │  • view_history (sessions)           │
        └──────────────┬───────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ↓             ↓             ↓
   Stored Data   Job Queue    Session Data
   (Products,   (PENDING,    (View
    etc.)      RUNNING,     History)
               COMPLETED)
                  │
                  ↓
        ┌──────────────────────┐
        │ Background Worker    │
        │ (Separate Process)   │
        │                      │
        │ Polls for PENDING    │
        │ jobs in database     │
        │                      │
        │ Executes scraper     │
        │ (Crawlee + Playwright)
        │                      │
        │ Updates DB with data │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  World of Books      │
        │  (External Website)  │
        │                      │
        │  Scraped Data:       │
        │  • Navigation        │
        │  • Categories        │
        │  • Products          │
        │  • Details           │
        └──────────────────────┘
```

## 2. Data Flow: Request Lifecycle

### Scenario: User Loads Home Page

```
1. BROWSER REQUEST
   GET http://localhost:3000/
   
2. NEXT.JS FRONTEND
   useQuery(['navigation'], fetchNavigation)
   
3. HTTP REQUEST
   GET http://localhost:3001/api/navigation
   
4. NESTJS CONTROLLER
   @Get()
   async getNavigation() { ... }
   
5. SERVICE LAYER
   async getNavigation() {
     const data = await prisma.navigation.findMany();
     
     // Check if stale
     for (const nav of data) {
       if (isStale(nav.lastScrapedAt, 24h)) {
         enqueueNavigationScrape(nav.id);
       }
     }
     
     return data.map(item => ({
       ...item,
       staleness: calculateStaleness(item.lastScrapedAt)
     }));
   }
   
6. DATABASE QUERY
   SELECT * FROM navigation;
   
7. RETURN RESPONSE
   200 OK
   [
     {
       id: 1,
       title: "Books",
       staleness: "fresh",
       ...
     }
   ]
   
8. FRONTEND RENDER
   Display navigation cards
   React Query caches the response
   
9. BACKGROUND SCRAPING (if data was stale)
   Worker picks up enqueued job
   Executes scraper
   Updates database
   Frontend automatically refreshes (via React Query staleTime)
```

### Scenario: User Clicks Product to View Details

```
1. BROWSER CLICK
   onClick={() => navigate(`/products/${productId}`)}
   
2. NEXT.JS ROUTE
   /products/[id]/page.tsx
   
3. TRACKING
   useViewTracking(productId)
   POST /api/history/track
   { sessionId, productId, viewedAt: now }
   
4. FETCH DATA
   useQuery(['product', productId], fetchProductDetail)
   GET /api/product/:id
   
5. CONTROLLER
   @Get(':id')
   async getProductDetail(@Param('id') id: number) {
     return this.productService.getProductDetail(id);
   }
   
6. SERVICE
   async getProductDetail(id: number) {
     // Fetch product + detail + reviews + recommendations
     const product = await prisma.product.findUnique(...);
     const detail = await prisma.productDetail.findUnique(...);
     const reviews = await prisma.review.findMany(...);
     const recommendations = await findSimilarProducts(product.categoryId);
     
     // Check if detail is stale
     if (isStale(detail.createdAt, 7d)) {
       enqueueProductDetailScrape(id);  // Non-blocking
     }
     
     return { product, detail, reviews, recommendations };
   }
   
7. RENDER
   Display product details
   Show "View on worldofbooks.com" button
   Button href = product.sourceUrl (full absolute URL)
```

## 3. Caching Strategy

### TTL-Based Caching with Background Refresh

```
TIME ──────────────────────────────→

NAVIGATION (24h TTL)
│
├─ 00:00 First Request
│        └─→ Scrape (if missing)
│           Update DB
│           last_scraped_at = 00:00
│
├─ 12:00 Another Request
│        └─→ Data is fresh (12h < 24h)
│           Return cached data
│           No background scrape
│
├─ 23:00 Another Request
│        └─→ Data is fresh (23h < 24h)
│           Return cached data
│           No background scrape
│
├─ 01:00 (Next Day) Another Request
│        └─→ Data is STALE (25h > 24h)
│           Return cached data (immediately)
│           Enqueue background scrape job
│
└─ 01:05 Background Worker Runs
         └─→ Executes scraper
            Updates DB
            last_scraped_at = 01:05
            Next request will be fresh
```

### Benefits of This Strategy

✅ **No Blocked Requests**: Always returns cached data (< 100ms)  
✅ **Data Freshness**: Background refresh keeps data reasonably current  
✅ **Reduced Load**: Scrapes only when data is stale  
✅ **Ethical**: Respects rate limits via background job queue  
✅ **Scalable**: Can handle 1000s of concurrent users  

## 4. Database Schema with Relationships

```
┌─────────────────────┐
│   NAVIGATION        │  Top-level headings
├─────────────────────┤
│ id (PK)             │
│ title (UNIQUE)      │
│ slug (UNIQUE)       │
│ description         │
│ lastScrapedAt       │
│ createdAt           │
│ updatedAt           │
└────────────┬────────┘
             │
        1:N  │  Hierarchical
             ↓
┌─────────────────────┐
│   CATEGORY          │  Categories under navigation
├─────────────────────┤
│ id (PK)             │
│ navigationId (FK) ──┼──→ NAVIGATION
│ parentId (FK) ──┐   │
│ title           │   │  Self-referencing for
│ slug            │   │  nested hierarchy
│ description     │   │
│ productCount    │   │
│ lastScrapedAt   │   │
└────┬────────────┼───┘
     │    1:N     │
     ↓           └─→ CATEGORY (self-join for children)
┌──────────────────────┐
│   PRODUCT            │  Individual product listings
├──────────────────────┤
│ id (PK)              │
│ sourceId (UNIQUE) ◄──┼──── Deduplication key
│ sourceUrl (UNIQUE)   │
│ title                │
│ author               │
│ price                │
│ currency             │
│ imageUrl             │
│ categoryId (FK) ─────┼──→ CATEGORY
│ lastScrapedAt        │
│ createdAt            │
│ updatedAt            │
└────────┬─────────────┘
         │
    1:1  │
         ↓
┌──────────────────────┐
│ PRODUCT_DETAIL       │  Extended metadata
├──────────────────────┤
│ id (PK)              │
│ productId (FK, UNIQUE)
│ description          │
│ isbn                 │
│ publisher            │
│ pages                │
│ ratingsAvg           │
│ reviewsCount         │
└──────────────────────┘

PRODUCT ──1:N──→ REVIEW
                 │
                 ├─ id
                 ├─ productId
                 ├─ rating (1-5)
                 ├─ text

PRODUCT ──1:N──→ SCRAPE_JOB
                 │
                 ├─ id
                 ├─ targetUrl
                 ├─ targetType
                 ├─ status (PENDING, RUNNING, COMPLETED, FAILED)
                 ├─ retryCount
                 ├─ errorLog

PRODUCT ──1:N──→ VIEW_HISTORY
                 │
                 ├─ id
                 ├─ sessionId (UUID)
                 ├─ viewedAt
```

## 5. Scraping Job Lifecycle

```
Enqueue Event (API or Timer)
         │
         ↓
┌─────────────────────┐
│  PENDING            │  Job created, waiting in queue
│  (status field)     │
└──────────┬──────────┘
           │ Worker polls every 5 seconds
           ↓
┌─────────────────────┐
│  RUNNING            │  Worker picked up job, executing scraper
│  startedAt = now    │
└──────────┬──────────┘
           │ Crawlee + Playwright scrapes website
           │ Extracts HTML, parses data
           │
        ┌──┴──┐
        │     │
      YES   NO
        │     │
        ↓     ↓
    Success Failure
        │     │
        │     ↓
        │  ┌────────────────────┐
        │  │  retryCount < max? │
        │  └────────┬───────────┘
        │        YES│ NO
        │        │  │
        │        │  ↓
        │        │ ┌─────────────────────┐
        │        │ │  FAILED             │
        │        │ │  finishedAt = now   │
        │        │ │  errorLog = message │
        │        │ └─────────────────────┘
        │        │
        │        ↓
        │     ┌────────────────────┐
        │     │  RETRY             │
        │     │  retryCount += 1   │
        │     │  (re-enters queue) │
        │     └────────────────────┘
        │
        ↓
┌─────────────────────┐
│  COMPLETED          │
│  finishedAt = now   │  Data stored in database
│  errorLog = null    │  lastScrapedAt = now
└─────────────────────┘
```

## 6. API Request/Response Flow

### Example: GET /api/products

```
REQUEST:
  GET /api/products?categoryId=1&page=1&limit=20

  ↓

VALIDATION (DTO Layer):
  @Query('categoryId', ParseIntPipe) categoryId: number
  @Query('page', ParseIntPipe) page: number = 1
  @Query('limit', ParseIntPipe) limit: number = 20

  ↓ (If invalid, return 400 Bad Request)

CONTROLLER:
  async getProducts(
    categoryId: number,
    page: number,
    limit: number
  ) {
    return this.productService.getProducts(
      categoryId, page, limit
    );
  }

  ↓

SERVICE:
  async getProducts(categoryId: number, page: number, limit: number) {
    // 1. Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category) throw new Error('Category not found');

    // 2. Fetch products (with pagination)
    const products = await prisma.product.findMany({
      where: { categoryId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // 3. Count total
    const total = await prisma.product.count({
      where: { categoryId }
    });

    // 4. Check freshness & enqueue background scrape
    const freshnessTTL = 7 * 24 * 60 * 60 * 1000; // 7 days
    for (const product of products) {
      const age = Date.now() - product.lastScrapedAt.getTime();
      if (age > freshnessTTL) {
        this.scrapeService.enqueueProductListScrape(categoryId);
        break; // Only enqueue once
      }
    }

    // 5. Map to DTO with staleness info
    return {
      items: products.map(p => ({
        ...p,
        staleness: this.calculateStaleness(p.lastScrapedAt)
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  ↓

RESPONSE (200 OK):
{
  "items": [
    {
      "id": 1,
      "sourceId": "wob-001",
      "sourceUrl": "https://www.worldofbooks.com/...",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "price": 8.99,
      "currency": "GBP",
      "imageUrl": "https://covers.openlibrary.org/...",
      "staleness": "fresh",
      "createdAt": "2024-01-12T07:33:50Z"
    }
  ],
  "total": 245,
  "page": 1,
  "limit": 20,
  "totalPages": 13
}
```

## 7. Frontend Data Fetching with React Query

```
Component Mounts
    │
    ↓
useQuery({
  queryKey: ['products', categoryId, page],
  queryFn: () => apiClient.getProducts(categoryId, page),
  staleTime: 5 * 60 * 1000,     // 5 minutes
  cacheTime: 10 * 60 * 1000,    // 10 minutes
})
    │
    ├─→ Check React Query Cache
    │   │
    │   ├─ If fresh (< 5min): Return cached
    │   │
    │   └─ If stale or missing: Fetch from API
    │
    ↓
isLoading = true
Render skeleton loader

    │
    ↓
Fetch from API (HTTP GET)

    │
    ↓
Response received (200 OK)
data = parsed JSON

    │
    ↓
isLoading = false
Render products with data

    │
    ↓
Cached until staleTime expires

    │
    ↓
User navigates away (unmount)
Data remains in cache (until cacheTime)

    │
    ↓
User navigates back to same page
React Query returns cached data immediately
(background refetch if stale)
```

## 8. Session Tracking Flow

```
Browser Loads App
    │
    ↓
useSessionId() hook
    │
    ├─ Check sessionStorage['sessionId']
    │   │
    │   ├─ If exists: Use existing ID
    │   │
    │   └─ If not: Generate new UUID
    │       └─ Store in sessionStorage
    │
    ↓
sessionId = "550e8400-e29b-41d4-a716-446655440000"

User Clicks Product
    │
    ↓
useViewTracking(productId)
    │
    ├─ HTTP POST /api/history/track
    │  Body: { sessionId, productId, viewedAt: now }
    │
    ↓
Backend creates ViewHistory record
    │
    ↓
Record stored in database
    │
    ↓
User navigates to another product
    │
    ├─ Same sessionId reused
    │ (sessionStorage persists across pages)
    │
    ↓
Another ViewHistory record created
    │
    ↓
Later: GET /api/history/session/:sessionId
    │
    ├─ Returns all views for that session
    │
    ↓
Frontend displays browsing path
```

## 9. Security & Validation Pipeline

```
HTTP Request
    │
    ↓
Helmet Middleware
├─ CSP headers
├─ XSS protection
├─ CORS checks
    │
    ↓
DTO Validation
├─ @IsInt() categoryId: number
├─ @Min(1) page: number
├─ @Max(100) limit: number
    │
    ├─ Valid: Continue to handler
    │
    └─ Invalid: Return 400 Bad Request
       {
         "statusCode": 400,
         "message": "Validation failed",
         "error": "Bad Request"
       }
    │
    ↓
Handler Execution
├─ Prisma ORM (no SQL injection)
├─ Input sanitization
    │
    ↓
Response Generated
├─ Serialize to JSON
├─ Type-check (TypeScript)
    │
    ↓
Error Handler (if exception)
├─ Catch error
├─ Log with context
├─ Return safe error response
    │
    ↓
HTTP Response (200 or error code)
```

---

**This architecture ensures**:
- ✅ Fast API responses (always < 200ms with caching)
- ✅ Non-blocking scraping (background workers)
- ✅ Type safety (TypeScript throughout)
- ✅ Data freshness (TTL-based refresh)
- ✅ Scalability (stateless APIs, database-backed jobs)
- ✅ Security (validation, ORM, CORS, CSP)
