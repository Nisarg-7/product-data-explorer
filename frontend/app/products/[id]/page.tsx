'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useViewTracking } from '@/hooks/useViewTracking';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);

  useViewTracking(productId);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => apiClient.getProductDetail(productId),
    enabled: !!productId,
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">
          Error loading product: {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-12">Product not found</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: product.product.title },
        ]}
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Image */}
        {product.product.imageUrl && (
          <div className="rounded-lg bg-gray-100 p-8">
            <img
              src={product.product.imageUrl}
              alt={product.product.title}
              className="h-full w-full object-cover rounded"
            />
          </div>
        )}

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {product.product.title}
            </h1>
            {product.product.author && (
              <p className="mt-2 text-xl text-gray-600">
                by {product.product.author}
              </p>
            )}
          </div>

          {product.product.price && (
            <div className="text-3xl font-bold text-gray-900">
              £{product.product.price.toFixed(2)}
            </div>
          )}

          {product.detail.ratingsAvg && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                ⭐ {product.detail.ratingsAvg}
              </span>
              <span className="text-gray-600">
                ({product.detail.reviewsCount} reviews)
              </span>
            </div>
          )}

          <a
            href={product.product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            View on worldofbooks.com
          </a>

          {product.detail.description && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Description</h2>
              <p className="mt-2 text-gray-700">{product.detail.description}</p>
            </div>
          )}

          {product.detail.isbn && (
            <div>
              <span className="font-semibold text-gray-900">ISBN:</span>
              <span className="ml-2 text-gray-700">{product.detail.isbn}</span>
            </div>
          )}

          {product.detail.publisher && (
            <div>
              <span className="font-semibold text-gray-900">Publisher:</span>
              <span className="ml-2 text-gray-700">{product.detail.publisher}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900">Recent Reviews</h2>
          <div className="mt-4 space-y-4">
            {product.reviews.map((review: any) => (
              <div
                key={review.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                {review.author && (
                  <p className="font-semibold text-gray-900">{review.author}</p>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-yellow-500">
                    {'⭐'.repeat(review.rating)}
                  </span>
                  <span className="text-sm text-gray-600">{review.rating}/5</span>
                </div>
                {review.text && (
                  <p className="mt-2 text-gray-700">{review.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {product.recommendations && product.recommendations.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900">You Might Also Like</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {product.recommendations.map((rec: any) => (
              <Link
                key={rec.id}
                href={`/products/${rec.id}`}
                className="group rounded-lg border border-gray-200 p-4 hover:shadow-lg transition"
              >
                {rec.imageUrl && (
                  <img
                    src={rec.imageUrl}
                    alt={rec.title}
                    className="h-40 w-full object-cover rounded"
                  />
                )}
                <h3 className="mt-2 line-clamp-2 font-semibold text-gray-900 group-hover:text-blue-600">
                  {rec.title}
                </h3>
                {rec.price && (
                  <p className="mt-2 font-bold text-gray-900">
                    £{rec.price.toFixed(2)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
