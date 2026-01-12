'use client';

interface BreadcrumbProps {
  items: Array<{ label: string; href?: string }>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-6 flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <span className="text-gray-400">/</span>}
          {item.href ? (
            <a
              href={item.href}
              className="text-blue-600 hover:underline"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-700">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
