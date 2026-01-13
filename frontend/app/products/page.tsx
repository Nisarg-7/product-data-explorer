export const dynamic = "force-dynamic";
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SkeletonLoader } from '@/components/SkeletonLoaders';
import { useViewTracking } from '@/hooks/useViewTracking';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryId = parseInt(searchParams.get('categoryId') || '0');
  const page = parseInt(searchParams.get('page') || '1');

  useViewTracking();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products' },
        ]}
      />

      <PageHeader title="Products" subtitle="Browse our product collection" />

      <Suspense fallback={<SkeletonLoader count={20} />}>
        <ProductGrid categoryId={categoryId} page={page} />
      </Suspense>
    </div>
  );
}

function ProductGrid({ categoryId, page }: { categoryId: number; page: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', categoryId, page],
    queryFn: () => apiClient.getProducts(categoryId, page, 20),
    enabled: !!categoryId,
  });

  if (isLoading) {
    return <SkeletonLoader count={20} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">
          Error loading products: {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">No products found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.items.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/products?categoryId=${categoryId}&page=${p}`}
              className={`px-3 py-2 rounded ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 hover:border-blue-400'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group rounded-lg border border-gray-200 p-4 transition hover:shadow-lg"
    >
      {product.imageUrl && (
        <div className="relative mb-4 h-48 overflow-hidden rounded bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition"
          />
        </div>
      )}

      <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-blue-600">
        {product.title}
      </h3>

      {product.author && (
        <p className="mt-1 text-sm text-gray-600">{product.author}</p>
      )}

      {product.price && (
        <p className="mt-2 text-lg font-bold text-gray-900">
          £{product.price.toFixed(2)}
        </p>
      )}

      {product.staleness === 'stale' && (
        <span className="mt-2 inline-block text-xs text-yellow-700">
          Data may be outdated
        </span>
      )}
    </Link>
  );
}
