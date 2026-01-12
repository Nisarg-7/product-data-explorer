'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getOrCreateSessionId } from '@/lib/session';
import { apiClient } from '@/lib/api-client';

/**
 * Hook to track page views in session history
 */
export function useViewTracking(productId?: number) {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    if (sessionId && pathname) {
      apiClient.trackView(sessionId, pathname).catch((err) => {
        console.error('Failed to track view:', err);
      });
    }
  }, [pathname, productId]);
}

/**
 * Hook to fetch session history
 */
export function useSessionHistory() {
  const sessionId = getOrCreateSessionId();

  return {
    sessionId,
    async getHistory() {
      if (!sessionId) return null;
      try {
        return await apiClient.getSessionHistory(sessionId);
      } catch (err) {
        console.error('Failed to fetch history:', err);
        return null;
      }
    },
  };
}
