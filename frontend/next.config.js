/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['worldofbooks.com', 'images.worldofbooks.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.worldofbooks.com',
      },
    ],
  },
};

module.exports = nextConfig;
