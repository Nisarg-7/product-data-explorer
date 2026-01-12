-- CreateTable
CREATE TABLE "navigation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "lastScrapedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "navigationId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "lastScrapedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "category_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES "navigation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "price" REAL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "imageUrl" TEXT,
    "categoryId" INTEGER NOT NULL,
    "lastScrapedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_detail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "description" TEXT,
    "isbn" TEXT,
    "publisher" TEXT,
    "publicationDate" DATETIME,
    "pages" INTEGER,
    "specs" TEXT,
    "ratingsAvg" REAL,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_detail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "author" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "text" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scrape_job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "navigationId" INTEGER,
    "categoryId" INTEGER,
    "productId" INTEGER,
    "targetUrl" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "errorLog" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scrape_job_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES "navigation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "scrape_job_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "scrape_job_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "view_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "productId" INTEGER,
    "pathJson" TEXT,
    "referer" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "view_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "navigation_title_key" ON "navigation"("title");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_slug_key" ON "navigation"("slug");

-- CreateIndex
CREATE INDEX "navigation_lastScrapedAt_idx" ON "navigation"("lastScrapedAt");

-- CreateIndex
CREATE INDEX "category_navigationId_idx" ON "category"("navigationId");

-- CreateIndex
CREATE INDEX "category_parentId_idx" ON "category"("parentId");

-- CreateIndex
CREATE INDEX "category_lastScrapedAt_idx" ON "category"("lastScrapedAt");

-- CreateIndex
CREATE UNIQUE INDEX "category_navigationId_slug_key" ON "category"("navigationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_sourceId_key" ON "product"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "product_sourceUrl_key" ON "product"("sourceUrl");

-- CreateIndex
CREATE INDEX "product_categoryId_idx" ON "product"("categoryId");

-- CreateIndex
CREATE INDEX "product_sourceId_idx" ON "product"("sourceId");

-- CreateIndex
CREATE INDEX "product_lastScrapedAt_idx" ON "product"("lastScrapedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_detail_productId_key" ON "product_detail"("productId");

-- CreateIndex
CREATE INDEX "review_productId_idx" ON "review"("productId");

-- CreateIndex
CREATE INDEX "review_createdAt_idx" ON "review"("createdAt");

-- CreateIndex
CREATE INDEX "scrape_job_status_idx" ON "scrape_job"("status");

-- CreateIndex
CREATE INDEX "scrape_job_targetType_idx" ON "scrape_job"("targetType");

-- CreateIndex
CREATE INDEX "scrape_job_createdAt_idx" ON "scrape_job"("createdAt");

-- CreateIndex
CREATE INDEX "scrape_job_navigationId_idx" ON "scrape_job"("navigationId");

-- CreateIndex
CREATE INDEX "scrape_job_categoryId_idx" ON "scrape_job"("categoryId");

-- CreateIndex
CREATE INDEX "scrape_job_productId_idx" ON "scrape_job"("productId");
