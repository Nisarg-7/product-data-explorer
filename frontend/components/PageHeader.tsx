'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}
