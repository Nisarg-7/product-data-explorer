import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Product Data Explorer',
  description: 'Learn about our product exploration platform',
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-4xl font-bold">About Product Data Explorer</h1>

      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-bold">Our Mission</h2>
          <p className="text-gray-700">
            We provide a cutting-edge platform for exploring and discovering products
            from worldofbooks.com. Our goal is to make product discovery easy, fast,
            and enjoyable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">How It Works</h2>
          <p className="text-gray-700">
            Our platform uses advanced web scraping and data processing to gather
            product information in real-time. We:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Scrape product data ethically with delays and rate limits</li>
            <li>Store data in a robust PostgreSQL database</li>
            <li>Serve fast, cached responses via our REST API</li>
            <li>Track user browsing patterns for better recommendations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Technology Stack</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Frontend:</strong> Next.js, React, Tailwind CSS
            </li>
            <li>
              <strong>Backend:</strong> NestJS, PostgreSQL, Prisma ORM
            </li>
            <li>
              <strong>Scraping:</strong> Crawlee, Playwright
            </li>
            <li>
              <strong>Data Fetching:</strong> React Query
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Privacy & Ethics</h2>
          <p className="text-gray-700">
            We respect the website&apos;s robots.txt, use appropriate delays between
            requests, and cache data to avoid redundant scraping. All user data is
            kept private and never shared with third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Contact</h2>
          <p className="text-gray-700">
            Questions or feedback? Feel free to reach out at contact@example.com
          </p>
        </section>
      </div>
    </div>
  );
}
