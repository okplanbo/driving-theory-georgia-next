/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Cloudflare Pages
  output: 'standalone',

  images: {
    // Use unoptimized for Cloudflare Workers (no native image optimization)
    unoptimized: true,
  },

  // Ensure Edge Runtime compatibility
  experimental: {
    // TODO: Enable when PWA support is added
    // pwa: true,
  },
};

module.exports = nextConfig;
