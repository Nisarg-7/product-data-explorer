'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useViewTracking } from '@/hooks/useViewTracking';

export default function CategoriesPage() {
  const params = useParams();
  const navigationId = parseInt(params.navigationId as string);

  useViewTracking();

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories', navigationId],
    queryFn: () => apiClient.getCategories(navigationId),
    enabled: !!navigationId,
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">
          Error loading categories: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Categories' },
        ]}
      />

      <PageHeader
        title="Browse Categories"
        subtitle="Select a category to explore products"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories?.map((cat: any) => (
          <Link
            key={cat.id}
            href={`/products?categoryId=${cat.id}`}
            className="group rounded-lg border border-gray-200 p-6 transition hover:border-blue-500 hover:shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
              {cat.title}
            </h3>
            {cat.description && (
              <p className="mt-2 text-sm text-gray-600">{cat.description}</p>
            )}
            <p className="mt-4 text-xs font-medium text-gray-500">
              {cat.productCount} products
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
