'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export function NavigationGrid() {
  const { data: navigations, isLoading, error } = useQuery({
    queryKey: ['navigation'],
    queryFn: () => apiClient.getNavigation(),
  });

  if (isLoading) {
    return <NavigationLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">
          Error loading navigation: {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!navigations || navigations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">No categories available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {navigations.map((nav: any) => (
        <Link
          key={nav.id}
          href={`/categories/${nav.id}`}
          className="group rounded-lg border border-gray-200 p-6 transition hover:border-blue-500 hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
            {nav.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600">{nav.description}</p>
          <p className="mt-4 text-xs font-medium text-gray-500">
            {nav.categoryCount} categories
          </p>
          {nav.staleness === 'stale' && (
            <span className="mt-2 inline-block rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
              Data may be outdated
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function NavigationLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-lg bg-gray-200"
        />
      ))}
    </div>
  );
}
