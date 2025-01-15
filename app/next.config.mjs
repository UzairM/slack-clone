/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    // Disable static generation for pages that need dynamic data
    workerThreads: false,
    cpus: 1,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@matrix-org/olm': '@matrix-org/olm/olm_legacy',
      '@matrix-org/matrix-sdk-crypto-wasm': false,
    };
    return config;
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
    unoptimized: true,
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
