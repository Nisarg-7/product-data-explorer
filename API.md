# Scraping API Documentation

This document describes the REST API endpoints for the Product Data Explorer backend.

## Base URL

```
http://localhost:3001/api
```

## Authentication

No authentication required for public endpoints. (Add authentication later if needed.)

## Navigation Endpoints

### GET /navigation

Get all top-level navigation headings. Triggers scrape if data is missing or stale (>24h).

**Response:**
```json
[
  {
    "id": 1,
    "title": "Books",
    "slug": "books",
    "description": "Browse our extensive collection",
    "categoryCount": 5,
    "lastScrapedAt": "2025-01-10T10:00:00Z",
    "staleness": "fresh"
  }
]
```

**Staleness Values:**
- `fresh`: Data is recent (< TTL)
- `stale`: Data is old but available (> TTL)
- `missing`: No data in database

---

### GET /navigation/:id

Get single navigation with metadata.

**Parameters:**
- `id` (integer): Navigation ID

**Response:**
```json
{
  "id": 1,
  "title": "Books",
  "slug": "books",
  "categoryCount": 5,
  "staleness": "fresh"
}
```

---

## Category Endpoints

### GET /categories/:navigationId

Get categories and subcategories for a navigation heading.

**Parameters:**
- `navigationId` (integer): Parent navigation ID

**Response:**
```json
[
  {
    "id": 1,
    "navigationId": 1,
    "parentId": null,
    "title": "Fiction",
    "slug": "fiction",
    "productCount": 150,
    "children": [
      {
        "id": 2,
        "parentId": 1,
        "title": "Mystery",
        "slug": "mystery",
        "productCount": 45
      }
    ],
    "staleness": "fresh"
  }
]
```

---

## Product Endpoints

### GET /products

Get paginated products for a category.

**Query Parameters:**
- `categoryId` (integer, required): Category ID
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "sourceId": "worldofbooks-12345",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "price": 8.99,
      "currency": "GBP",
      "imageUrl": "https://example.com/image.jpg",
      "staleness": "fresh"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

---

### GET /product/:id

Get full product detail with reviews and recommendations.

**Parameters:**
- `id` (integer): Product ID

**Response:**
```json
{
  "product": {
    "id": 1,
    "sourceId": "worldofbooks-12345",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "price": 8.99,
    "sourceUrl": "https://worldofbooks.com/..."
  },
  "detail": {
    "description": "Long form description...",
    "isbn": "978-0-7432-7356-5",
    "publisher": "Scribner",
    "publicationDate": "1925-04-10",
    "pages": 180,
    "ratingsAvg": 4.5,
    "reviewsCount": 1250
  },
  "reviews": [
    {
      "id": 1,
      "author": "John Doe",
      "rating": 5,
      "text": "Amazing book!"
    }
  ],
  "recommendations": [
    {
      "id": 2,
      "title": "Tender Is the Night",
      "price": 9.99
    }
  ]
}
```

---

## Scraping Endpoints

### POST /scrape/refresh

Manually trigger a scrape job for a product, category, or navigation.

**Request Body:**
```json
{
  "targetType": "PRODUCT_DETAIL",
  "productId": 123
}
```

**TargetType Values:**
- `NAVIGATION`: Scrape all navigation headings
- `CATEGORY`: Scrape categories for a navigation
- `PRODUCT_LIST`: Scrape products for a category
- `PRODUCT_DETAIL`: Scrape full details for a product

**Response:**
```json
{
  "id": "clp1h2k3j4l5m6n7o8p9q0r1",
  "targetUrl": "https://worldofbooks.com/en/...",
  "targetType": "PRODUCT_DETAIL",
  "status": "PENDING",
  "retryCount": 0,
  "createdAt": "2025-01-10T12:00:00Z"
}
```

---

### GET /scrape/job/:jobId

Get status of a scrape job.

**Parameters:**
- `jobId` (string): Job ID from `/scrape/refresh` response

**Response:**
```json
{
  "id": "clp1h2k3j4l5m6n7o8p9q0r1",
  "status": "RUNNING",
  "retryCount": 0,
  "startedAt": "2025-01-10T12:00:05Z",
  "finishedAt": null,
  "errorLog": null
}
```

**Status Values:**
- `PENDING`: Waiting to be processed
- `RUNNING`: Currently scraping
- `COMPLETED`: Success
- `FAILED`: Gave up after max retries
- `RETRY`: Retrying after temporary failure

---

## History Endpoints

### POST /history/track

Record a page view for session history.

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "path": "/products/123",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true
}
```

---

### GET /history/session/:sessionId

Get browsing history for a session.

**Parameters:**
- `sessionId` (string): Client-generated UUID

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "views": [
    {
      "id": 1,
      "path": "/",
      "timestamp": "2025-01-10T10:00:00Z"
    },
    {
      "id": 2,
      "path": "/products/123",
      "timestamp": "2025-01-10T10:05:00Z"
    }
  ],
  "totalViews": 2
}
```

---

## Error Responses

All errors return a consistent format:

```json
{
  "statusCode": 404,
  "message": "Product with id 999 not found",
  "error": "Not Found"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created (POST)
- `400`: Bad request (invalid input)
- `404`: Resource not found
- `500`: Server error

---

## Rate Limiting

- Scraping endpoints are rate-limited to prevent abuse
- Standard API endpoints have no strict limits but should be used reasonably
- Job queue processes max 2 concurrent scrapes (configurable via `SCRAPE_JOB_CONCURRENCY`)

---

## Testing with cURL

```bash
# Get all navigation
curl http://localhost:3001/api/navigation

# Get categories
curl http://localhost:3001/api/categories/1

# Get products
curl "http://localhost:3001/api/products?categoryId=1&page=1&limit=20"

# Get product detail
curl http://localhost:3001/api/product/1

# Trigger scrape
curl -X POST http://localhost:3001/api/scrape/refresh \
  -H "Content-Type: application/json" \
  -d '{"targetType": "NAVIGATION"}'

# Check job status
curl http://localhost:3001/api/scrape/job/job-id-here
```

---

## Interactive API Explorer

For easier testing, visit the Swagger UI:

```
http://localhost:3001/api/docs
```

All endpoints are documented with request/response examples and live testing.

---

**Last Updated:** January 2025
