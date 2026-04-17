/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Development: localhost HTTP
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      // Production backend on Render
      { protocol: "https", hostname: "ram-ji-bakery23.onrender.com", pathname: "/**" },
      // Alternative production backend (your-backend-domains)
      { protocol: "https", hostname: "bakery-api.onrender.com", pathname: "/**" },
      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      // Unsplash
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Vercel deployment
      { protocol: "https", hostname: "**.vercel.app", pathname: "/**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  outputFileTracing: true,
};

module.exports = nextConfig;