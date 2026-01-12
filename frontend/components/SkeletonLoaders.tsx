export function SkeletonLoader({
  count = 4,
  height = 'h-32',
}: {
  count?: number;
  height?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`${height} animate-pulse rounded-lg bg-gray-200`}
        />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="h-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 space-y-2">
        <div className="h-4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
