const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = {
  /**
   * Get all navigation headings
   */
  async getNavigation() {
    const res = await fetch(`${API_BASE_URL}/navigation`);
    if (!res.ok) throw new Error('Failed to fetch navigation');
    return res.json();
  },

  /**
   * Get navigation by ID
   */
  async getNavigationById(id: number) {
    const res = await fetch(`${API_BASE_URL}/navigation/${id}`);
    if (!res.ok) throw new Error('Failed to fetch navigation');
    return res.json();
  },

  /**
   * Get categories for a navigation
   */
  async getCategories(navigationId: number) {
    const res = await fetch(
      `${API_BASE_URL}/categories/${navigationId}`,
    );
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  /**
   * Get products for a category
   */
  async getProducts(
    categoryId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    const res = await fetch(
      `${API_BASE_URL}/products?categoryId=${categoryId}&page=${page}&limit=${limit}`,
    );
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  /**
   * Get product detail
   */
  async getProductDetail(id: number) {
    const res = await fetch(`${API_BASE_URL}/product/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  /**
   * Track view history
   */
  async trackView(
    sessionId: string,
    path: string,
  ) {
    const res = await fetch(`${API_BASE_URL}/history/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        path,
        userAgent: navigator.userAgent,
      }),
    });
    if (!res.ok) throw new Error('Failed to track view');
    return res.json();
  },

  /**
   * Get session history
   */
  async getSessionHistory(sessionId: string) {
    const res = await fetch(`${API_BASE_URL}/history/session/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  /**
   * Trigger scrape refresh
   */
  async triggerScrapeRefresh(
    targetType: string,
    navigationId?: number,
    categoryId?: number,
    productId?: number,
  ) {
    const res = await fetch(`${API_BASE_URL}/scrape/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType,
        navigationId,
        categoryId,
        productId,
      }),
    });
    if (!res.ok) throw new Error('Failed to trigger scrape');
    return res.json();
  },

  /**
   * Get scrape job status
   */
  async getScrapeJobStatus(jobId: string) {
    const res = await fetch(`${API_BASE_URL}/scrape/job/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch job status');
    return res.json();
  },
};
