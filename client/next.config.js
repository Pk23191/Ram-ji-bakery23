/** @type {import('next').NextConfig} */
const defaultRemotePatterns = [
  {
    protocol: "https",
    hostname: "ram-ji-bakery23.onrender.com",
    pathname: "/uploads/**",
  },
  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "**.vercel.app" }
];

// If NEXT_PUBLIC_API_URL is provided at build time, include its hostname
let extraRemote = [];
try {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    const parsed = new URL(envUrl);
    if (parsed.hostname && parsed.hostname !== 'localhost') {
      extraRemote.push({ protocol: parsed.protocol.replace(':',''), hostname: parsed.hostname, pathname: '/**' });
    }
  }
} catch (e) {
  // ignore
}

const nextConfig = {
  images: {
    remotePatterns: [...defaultRemotePatterns, ...extraRemote],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

module.exports = nextConfig;