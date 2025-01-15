/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@matrix-org/matrix-sdk-crypto-wasm': false,
    };
    return config;
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '2mb',
    },
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
