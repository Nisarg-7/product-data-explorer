export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Product Data Explorer',
  description:
    'Explore products from worldofbooks.com with our full-stack data platform',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white">
        <Providers>
          <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
            <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">📚</span>
                  <span className="text-xl font-bold">Product Explorer</span>
                </a>
                <div className="hidden space-x-6 md:flex">
                  <a
                    href="/"
                    className="text-gray-700 hover:text-blue-600 transition"
                  >
                    Home
                  </a>
                  <a
                    href="/about"
                    className="text-gray-700 hover:text-blue-600 transition"
                  >
                    About
                  </a>
                </div>
              </div>
            </nav>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="border-t border-gray-200 bg-gray-50 py-8">
            <div className="mx-auto max-w-7xl px-4 text-center text-gray-600">
              <p>&copy; 2025 Product Data Explorer. All rights reserved.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
