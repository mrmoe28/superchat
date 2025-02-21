/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'openai.com',
      'anthropic.com',
      'githubusercontent.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'placehold.co',
      'picsum.photos'
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME/' : '',
}

module.exports = nextConfig 