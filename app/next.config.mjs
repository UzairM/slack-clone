/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src', 'app', 'lib', 'components']
  }
};

export default nextConfig;
