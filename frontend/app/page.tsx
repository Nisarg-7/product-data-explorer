export const dynamic = "force-dynamic";

import { Suspense } from 'react';
import { NavigationGrid } from '@/components/NavigationGrid';
import { PageHeader } from '@/components/PageHeader';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome to Product Data Explorer"
        subtitle="Browse our collection of products from worldofbooks.com"
      />

      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Browse by Category
        </h2>
        <Suspense fallback={<NavigationLoadingSkeleton />}>
          <NavigationGrid />
        </Suspense>
      </div>
    </div>
  );
}

function NavigationLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-lg bg-gray-200"
        />
      ))}
    </div>
  );
}
