/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8008',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'matrix.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'matrix-client.matrix.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.dicebear.com',
        pathname: '/**',
      },
    ],
    unoptimized: false,
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
