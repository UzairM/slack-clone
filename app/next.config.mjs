/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  experimental: {
    typedRoutes: true,
    appDir: true,
  },
  distDir: '.next',
};

export default nextConfig;
